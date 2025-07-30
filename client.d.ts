// Make the macros globally available

import type { PageMetaOption } from '@team-nw/unplugin-uni-pages/types'

export interface DefinePage extends Partial<PageMetaOption> {}
export declare function definePage(props: DefinePage)

type _definePage = typeof definePage

declare global {
  const definePage: _definePage
}

export {}
