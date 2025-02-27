import type { PageMetaOption } from './types/page'

export interface DefinePage extends Partial<PageMetaOption> {}

export const definePage = (pageMeta: DefinePage) => pageMeta
