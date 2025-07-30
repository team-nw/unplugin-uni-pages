// Make the macros globally available
import type { PageMeta } from '@team-nw/unplugin-uni-pages/types'

declare global {
  const definePage: (pageMeta: PageMeta) => any
}

export {}
