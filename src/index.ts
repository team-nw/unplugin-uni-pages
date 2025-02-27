import type { UnpluginFactory } from 'unplugin'
import type { Options, UserPagesConfig } from './types'

import { createUnplugin } from 'unplugin'
import { createContext } from './core/context'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const ctx = createContext(options)
  return {
    name: 'unplugin-starter',
    enforce: 'pre',
    async buildStart() {
      await ctx.initCtx()
    },
    transformInclude(id) {
      return id.endsWith('main.ts')
    },
    transform(code) {
      return code.replace('__UNPLUGIN__', `Hello Unplugin! ${options}`)
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export function defineUniPages(config: UserPagesConfig) {
  return config
}
