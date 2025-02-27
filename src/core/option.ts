import type { LoadConfigSource } from 'unconfig'
import type { Options, PageOption, PagesConfig, SubPageOption } from '../types'

import path from 'node:path'
import process from 'node:process'
import debug from 'debug'

export type ResolvedOptions = ReturnType<typeof resolveOptions>

export type ConfigSource = string | LoadConfigSource<PagesConfig>

const debugLog = debug('uni-pages:resolveOptions')

export function resolveOptions(options: Options | undefined) {
  const defaultOption: Required<Options> = {
    routeBlockLang: 'yaml',
    root: process.cwd(),
    basePath: 'src',
    pages: 'src/pages/**/*.vue',
    subPackage: [],
    configSource: 'pages.json.ts',
    dts: 'src/uni-pages.d.ts',
    enableLog: false,
  }
  const uniOptions = {
    ...defaultOption,
    ...options,
  }

  let pages: PageOption
  if (typeof uniOptions.pages === 'string') {
    pages = {
      filePartten: uniOptions.pages,
      exclude: [],
    }
  }
  else {
    pages = uniOptions.pages
  }
  const resolvedConfigSource = typeof uniOptions.configSource === 'string' ? [{ files: uniOptions.configSource } as LoadConfigSource<PagesConfig>] : uniOptions.configSource
  const subArray: SubPageOption[] = []

  for (const subItem of uniOptions.subPackage) {
    if (typeof subItem === 'string') {
      subArray.push({
        filePartten: subItem,
        exclude: [],
        root: path.relative(uniOptions.basePath, subItem.split('/*')[0] as string),
      })
    }
    else {
      if (!subItem.root) {
        subItem.root = subItem.filePartten.split('*')[0] as string
      }
      subArray.push(subItem)
    }
  }
  const resolvedOptions = {
    ...uniOptions,
    pages,
    configSource: resolvedConfigSource,
    subPackage: subArray,
  }
  debugLog(`🤖 OptionsResult\r\n ${JSON.stringify(resolvedOptions, null, 2)}`)
  return resolvedOptions
}
