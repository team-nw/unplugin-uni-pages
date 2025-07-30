declare module 'virtual:uni-pages' {
  import type { PagesConfig } from '@team-nw/unplugin-uni-pages/types'

  const pages: PagesConfig
  export default pages
}
export {}
declare global {
  const definePage: (typeof import('@team-nw/unplugin-uni-pages/runtime'))['definePage']
}
