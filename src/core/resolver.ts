import type {
  CallExpression,
  Node,
} from '@babel/types'
import type * as babelTypes from '@babel/types'
import type { PageMetaOption } from '../types/page'
import * as fs from 'node:fs'
import path from 'node:path'
import { slash } from '@antfu/utils'

import { isCallOf, parseSFC } from '@vue-macros/common'
import debug from 'debug'
import { exec } from './util'

const debugLog = debug('uni-pages:resolver')

const MACRO_DEFINE_PAGE = 'definePage'
export const MACRO_DEFINE_PAGE_QUERY = /[?&]definePage\b/

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
        return pageMeatOption
      }
      else if (definePageNodes.length > 1) {
        throw new SyntaxError(`duplicate definePage() call`)
      }
      const definePageNode = definePageNodes[0]!
      const [arg] = definePageNode.arguments as [babelTypes.Expression]
      if (!arg) {
        return pageMeatOption
      }
      const newOption: PageMetaOption | undefined = await exec<PageMetaOption>(contentPath, arg, imports)
      const resultOption = { ...newOption, ...pageMeatOption }
      debugLog('contentToOption result', resultOption)
      return resultOption
    }
    return pageMeatOption
  }

  async isUpdated() {
    const content = fs.readFileSync(this.abstractPath, 'utf-8')
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

  async getOption() {
    if (!this.option) {
      await this.isUpdated()
      return this.option
    }
    return this.option
  }
}
