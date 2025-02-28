import type {
  Program,
} from '@babel/types'
import type { SFCDescriptor, SFCParseResult, SFCScriptBlock as SFCScriptBlockMixed } from '@vue/compiler-sfc'
import type { PageMetaOption } from '../types/page'
import * as fs from 'node:fs'
import path from 'node:path'
import { slash } from '@antfu/utils'

import { parse } from '@vue/compiler-sfc'
import { babelParse } from 'ast-kit'
import debug from 'debug'
import { parseOption } from './define-page'

const debugLog = debug('uni-pages:resolver')

const MACRO_DEFINE_PAGE = 'definePage'
export const MACRO_DEFINE_PAGE_QUERY = /[?&]definePage\b/

export type SFCScriptBlock = Omit<
  SFCScriptBlockMixed,
    'scriptAst' | 'scriptSetupAst'
>

export type SFC = Omit<SFCDescriptor, 'script' | 'scriptSetup'> & {
  sfc: SFCParseResult
  script?: SFCScriptBlock | null
  scriptSetup?: SFCScriptBlock | null
  lang: string | undefined
  getScriptAst: () => Program | undefined
  getSetupAst: () => Program | undefined
  offset: number
} & Pick<SFCParseResult, 'errors'>

export function parseSFC(code: string, id: string): SFC {
  const sfc = parse(code, {
    filename: id,
  })
  const { descriptor, errors } = sfc

  const scriptLang = sfc.descriptor.script?.lang
  const scriptSetupLang = sfc.descriptor.scriptSetup?.lang

  if (
    sfc.descriptor.script
    && sfc.descriptor.scriptSetup
    && (scriptLang || 'js') !== (scriptSetupLang || 'js')
  ) {
    throw new Error(
      `[unplugin-vue-macros] <script> and <script setup> must have the same language type.`,
    )
  }

  const lang = scriptLang || scriptSetupLang

  return Object.assign({}, descriptor, {
    sfc,
    lang,
    errors,
    offset: descriptor.scriptSetup?.loc.start.offset ?? 0,
    getSetupAst() {
      if (!descriptor.scriptSetup)
        return
      return babelParse(descriptor.scriptSetup.content, lang, {
        plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
        cache: true,
      })
    },
    getScriptAst() {
      if (!descriptor.script)
        return
      return babelParse(descriptor.script.content, lang, {
        plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
        cache: true,
      })
    },
  } satisfies Partial<SFC>)
}

export class PageMeta {
  readonly abstractPath: string
  readonly basePath: string

  cacheRaw: string = ''
  option: PageMetaOption | undefined = undefined

  constructor(abstractPath: string, basePath: string) {
    this.abstractPath = abstractPath
    this.basePath = basePath
  }

  private async contentToOption(contentPath: string, content: string): Promise<PageMetaOption> {
    debugLog(`contentToOption start  ${contentPath}`)
    const pagePath = path.relative(this.basePath, contentPath)
    debugLog(`contentToOption start ${this.basePath}  ${contentPath}`)
    const pageMeatOption: PageMetaOption = {
      path: slash(pagePath.replace(path.extname(pagePath), '')),
    }
    if (content.includes(MACRO_DEFINE_PAGE)) {
      const sfc = parseSFC(content, contentPath)
      const newOption = await parseOption(sfc, contentPath)
      return { ...newOption, ...pageMeatOption }
    }
    return pageMeatOption
  }

  async isUpdated() {
    const content = fs.readFileSync(this.abstractPath, 'utf-8')
    try {
      const newOption = await this.contentToOption(this.abstractPath, content)
      const raw = JSON.stringify(newOption, null, 2)
      if (raw === this.cacheRaw) {
        return false
      }
      else {
        debugLog(`PageMeta hasUpdated ${this.abstractPath}`)
        this.cacheRaw = raw
        this.option = newOption
        return true
      }
    }
    catch (e) {
      // 编辑过程中出现错误语法  跳过按未更新
      debugLog(`PageMeta hasUpdated error ${this.abstractPath}`, e)
      return false
    }
  }

  async getOption() {
    if (!this.option) {
      await this.isUpdated()
      return this.option
    }
    return this.option
  }
}
