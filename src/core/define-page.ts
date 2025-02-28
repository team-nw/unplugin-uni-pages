import type * as babelTypes from '@babel/types'
import type { CallExpression, Node } from '@babel/types'
import type { Thenable, TransformResult } from 'unplugin'
import type { PageMetaOption } from '../types/page'
import type { SFC } from './resolver'
import { createRequire } from 'node:module'
import path from 'node:path'
import vm from 'node:vm'
import babelGenerator from '@babel/generator'
import { MagicString } from '@vue/compiler-sfc'
import { isCallOf } from 'ast-kit'

import debug from 'debug'
import { generateTransform } from 'magic-string-ast'
import * as ts from 'typescript'
import { parseSFC } from './resolver'

const MACRO_DEFINE_PAGE = 'definePage'

const debugLog = debug('uni-pages:definePage')

export function definePageTransform({
  code,
  id,
}: {
  code: string
  id: string
}): Thenable<TransformResult> {
  if (!code.includes(MACRO_DEFINE_PAGE)) {
    // avoid having an invalid module that is just empty
    // https://github.com/posva/unplugin-vue-router/issues/338
    return undefined
  }

  // TODO: handle also non SFC

  const sfc = parseSFC(code, id)
  if (!sfc.scriptSetup)
    return

  const { scriptSetup, getSetupAst } = sfc
  const setupAst = getSetupAst()

  const definePageNodes = (setupAst?.body || ([] as Node[]))
    .map((node) => {
      if (node.type === 'ExpressionStatement')
        node = node.expression
      return isCallOf(node, MACRO_DEFINE_PAGE) ? node : null
    })
    .filter((node): node is CallExpression => !!node)

  if (!definePageNodes.length) {
    return null
  }
  else if (definePageNodes.length > 1) {
    throw new SyntaxError(`duplicate definePage() call`)
  }

  const definePageNode = definePageNodes[0]!
  const setupOffset = scriptSetup.loc.start.offset

  // console.log('!!!', definePageNode)

  const s = new MagicString(code)

  // s.removeNode(definePageNode, { offset: setupOffset })
  s.remove(
    setupOffset + definePageNode.start!,
    setupOffset + definePageNode.end!,
  )
  debugLog(`transform ${id}`)
  return generateTransform(s, id)
}

export async function isResolve(content: string): Promise<boolean> {
  return content.includes(MACRO_DEFINE_PAGE)
}

export async function parseOption(sfc: SFC, path: string): Promise<PageMetaOption | undefined> {
  const { getSetupAst } = sfc
  const setupAst = getSetupAst()
  const definePageNodes = (setupAst?.body ?? ([] as Node[]))
    .map((node) => {
      if (node.type === 'ExpressionStatement')
        node = node.expression
      return isCallOf(node, MACRO_DEFINE_PAGE) ? node : null
    })
    .filter((node): node is CallExpression => !!node)
  const imports = (setupAst?.body ?? ([] as Node[])).map((node: babelTypes.Node) => (node.type === 'ImportDeclaration') ? node : undefined).filter((node): node is babelTypes.ImportDeclaration => !!node)
  if (!definePageNodes.length) {
    return
  }
  else if (definePageNodes.length > 1) {
    throw new SyntaxError(`duplicate definePage() call`)
  }
  const definePageNode = definePageNodes[0]!
  const [arg] = definePageNode.arguments as [babelTypes.Expression]
  if (!arg) {
    return
  }
  return await exec<PageMetaOption>(path, arg, imports)
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
 * @param filename
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
    throw new Error(`[define-page] ${filename} ${error.message}`)
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
