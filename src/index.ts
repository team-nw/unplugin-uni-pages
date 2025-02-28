import type { UnpluginFactory } from 'unplugin'
import type { Options, UserPagesConfig } from './types'

import { createUnplugin } from 'unplugin'
import { createContext } from './core/context'
import { definePageTransform } from './core/define-page'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const ctx = createContext(options)
  let init = false
  return {
    name: 'unplugin-starter',
    enforce: 'pre',
    async buildStart() {
      if (!init) {
        init = true
        await ctx.initCtx()
      }
    },
    transformInclude(id) {
      return id.endsWith('vue')
    },
    transform(code, id) {
      return definePageTransform({ code, id })
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export function defineUniPages(config: UserPagesConfig) {
  return config
}
