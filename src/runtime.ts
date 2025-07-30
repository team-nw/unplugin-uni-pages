import type { PageMetaOption } from './types/page'

export interface DefinePage extends Partial<PageMetaOption> {}

export const __macro__ = (pageMeta: DefinePage) => pageMeta
