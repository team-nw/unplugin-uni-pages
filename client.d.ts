declare module 'virtual:uni-pages' {
  import { PagesConfig as config } from '@team-nw/unplugin-uni-pages/types'

  export default config
}

declare global {
  const definePage: (typeof import('@team-nw/unplugin-uni-pages/runtime'))['definePage']
}
