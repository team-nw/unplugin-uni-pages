// Make the macros globally available

import type { PageMetaOption } from '@team-nw/unplugin-uni-pages/types'

interface DefinePage extends Partial<PageMetaOption> {}
function definePage(props: DefinePage)

type _definePage = typeof definePage

declare global {
  const definePage: _definePage
}

export {}
