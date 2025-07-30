import type { UnpluginFactory } from 'unplugin'
import type { Options, UserPagesConfig } from './types'

import { createUnplugin } from 'unplugin'
import { createContext } from './core/context'
import { definePageTransform } from './core/define-page'

const virtualModelName = 'virtual:uni-pages'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const ctx = createContext(options)
  ctx.initCtx()
  return {
    name: 'unplugin-uni-pages',
    enforce: 'pre',
    transformInclude(id) {
      return id.endsWith('vue')
    },
    resolveId(id) {
      if (id === virtualModelName) {
        return virtualModelName
      }
      else {
        return undefined
      }
    },
    transform(code, id) {
      return definePageTransform({ code, id })
    },
    loadInclude(id) {
      if (id === virtualModelName) {
        return true
      }
      return undefined
    },
    load(id) {
      if (id === virtualModelName) {
        return ctx.virtualModule()
      }
      return undefined
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export function defineUniPages(config: UserPagesConfig) {
  return config
}

export function definePage() {
}
