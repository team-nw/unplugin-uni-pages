import type * as babelTypes from '@babel/types'
import { mkdir, writeFile as writeFile_ } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path, { dirname } from 'node:path'
import vm from 'node:vm'
import babelGenerator from '@babel/generator'
import debug from 'debug'
import * as ts from 'typescript'

export function enableLog() {
  debug.enable('uni-pages:resolver,uni-pages:context,uni-pages:resolveOptions,uni-pages:resolver')
}

export async function writeFile(filePath: string, content: string) {
  await mkdir(dirname(filePath), { recursive: true })
  return await writeFile_(filePath, content, 'utf-8')
}

export async function exec<R = any>(file: string, exp: babelTypes.Expression, imports: babelTypes.ImportDeclaration[]): Promise<R | undefined> {
  let generate
  if (typeof babelGenerator === 'function') {
    generate = babelGenerator
  }
  else {
    generate = (babelGenerator as any).default
  }
  const code = generate(exp).code
  let script = ''
  const importScript = imports.map(imp => `${generate(imp).code}\n`).join('')
  script += importScript
  script += `export default ${code}`
  return await executeTypeScriptCode(script, file)
}

/**
 * 执行 TypeScript 代码字符串并返回其返回值
 * @param code - TypeScript 代码字符串
 * @returns 返回值
 */
async function executeTypeScriptCode(code: string, filename: string): Promise<any> {
  // 编译 TypeScript 代码为 JavaScript
  const jsCode = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext,
    },
  }).outputText

  const dir = path.dirname(filename)

  // 创建一个新的虚拟机上下文
  const vmContext = {
    require: createRequire(dir),
    module: {},
    exports: {},
    __filename: filename,
    __dirname: dir,
  }

  // 使用 vm 模块执行 JavaScript 代码
  const script = new vm.Script(jsCode)

  try {
    script.runInNewContext(vmContext)
  }
  catch (error: any) {
    throw new Error(`[@uni-ku/define-page] ${filename} ${error.message}`)
  }

  // 获取导出的值
  const result = (vmContext.exports as any).default || vmContext.exports

  // 如果是函数，执行函数并返回其返回值
  if (typeof result === 'function') {
    return Promise.resolve(result())
  }

  // 如果不是函数，返回结果
  return Promise.resolve(result)
}
