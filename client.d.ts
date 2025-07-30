// Make the macros globally available

import type { PageMetaOption } from './src/types/page'

export interface DefinePage extends Partial<PageMetaOption> {}
export declare function definePage(props: DefinePage)

type _definePage = typeof definePage

declare global {
  const definePage: _definePage
}

export {}
