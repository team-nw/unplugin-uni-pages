import type { PageMetaOption } from './types/page'

export interface DefinePage extends Partial<PageMetaOption> {}

export const __definePage = (pageMeta: DefinePage) => pageMeta
