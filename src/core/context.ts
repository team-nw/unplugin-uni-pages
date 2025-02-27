import type { Options, PageOption, PagesConfig, SubPageOption } from '../types'
import type { SubPackageMetaOption } from '../types/page'
import type { HandlerContext } from './watcher'
import path from 'node:path'
import process from 'node:process'
import debug from 'debug'
import { loadConfig } from 'unconfig'
import { writeDeclaration } from './declaration'
import { resolveOptions } from './option'
import { PageMeta } from './resolver'
import { enableLog, writeFile } from './util'
import { Watcher } from './watcher'

const debugLog = debug('uni-pages:context')

export function createContext(options: Options | undefined) {
  if (options && options.enableLog) {
    enableLog()
    debugLog('enableLog SUCCESS')
  }

  const { root, subPackage, pages, dts, basePath, configSource } = resolveOptions(options)
  let readyStatus = false

  const pageMetas = new Map<string, PageMeta>()

  const subPackageMetas = new Map<string, Map<string, PageMeta>>()

  function setupPageWatcher(watcher: Watcher<PageOption | SubPageOption>) {
    debugLog(`🤖 Scanning files in ${watcher.root} ${watcher.filePatterns} ${typeof watcher.filePatterns}`)
    return new Promise<Watcher<PageOption | SubPageOption>>((resolve) => {
      watcher
        .on('add', async (ctx) => {
          debugLog('add', JSON.stringify(ctx))
          addPage(ctx)
        })
        .on('change', async (ctx) => {
          debugLog('change', JSON.stringify(ctx))
          updatePage(ctx)
        })
        .on('ready', () => {
          debugLog(`🤖 Scanned ${watcher.root} ready`)
          resolve(watcher)
        })
    })
    // TODO: handle folder removal: apparently chokidar only emits a raw event when deleting a folder instead of the
    // unlinkDir event
  }

  async function addPage(handlerContext: HandlerContext<PageOption | SubPageOption>) {
    const { filePath, t } = handlerContext
    const { root } = t as SubPageOption
    debugLog(`🤖 Add page root ${root} ${JSON.stringify(t)}`)
    if (root) {
      let rootMap = subPackageMetas.get(root)
      if (!rootMap) {
        rootMap = new Map()
        subPackageMetas.set(root, rootMap)
      }
      rootMap.set(filePath, new PageMeta(filePath, `${basePath}/${root}`))
    }
    else {
      pageMetas.set(filePath, new PageMeta(filePath, basePath as string))
    }
    if (readyStatus) {
      // 重新生成
    }
    debugLog(`🤖 Scanning page ${filePath} ${JSON.stringify(t)}`)
  }

  async function updatePage(handlerContext: HandlerContext<PageOption | SubPageOption>) {
    const { filePath, t } = handlerContext
    debugLog(`🤖 Update page ${filePath} ${t}`)
    const { root } = t as SubPageOption
    let pageMeta: PageMeta | undefined
    if (root) {
      pageMeta = subPackageMetas.get(root)?.get(filePath)
    }
    else {
      pageMeta = pageMetas.get(filePath)
    }
    if (pageMeta && await pageMeta.isUpdated()) {
      // 重新生成
    }
  }

  async function resolveOption(mapValues: Map<string, PageMeta>) {
    const promiseList: Promise<any>[] = []
    Array.from(mapValues.values()).forEach((pageMeta) => {
      promiseList.push(pageMeta.getOption())
    })
    const list = await Promise.all(promiseList)
    debugLog(`🤖 ResolvePageMetaOption ${JSON.stringify(list)}`)
    return list
  }

  async function loadUserConfig() {
    const { config } = await loadConfig<PagesConfig>({ cwd: process.cwd(), sources: configSource, defaults: {} })
    debugLog(`🤖 LoadUserConfig ${JSON.stringify(config)}`)
    return config
  }

  async function generateConfig() {
    const config = await loadUserConfig()
    debugLog(`🤖 GenerateConfig ${JSON.stringify(config)}`)
    const pagesConfig = await resolveOption(pageMetas)
    if (pagesConfig && pagesConfig.length > 0) {
      if (config.pages) {
        config.pages.push(...pagesConfig)
      }
      else {
        config.pages = pagesConfig
      }
    }
    const subPackageConfigs: SubPackageMetaOption[] = []
    // 遍历subPackageMetas await resolveOption
    for (const [root, item] of subPackageMetas.entries()) {
      const subPackage: SubPackageMetaOption = {
        root,
        pages: await resolveOption(item),
      }
      subPackageConfigs.push(subPackage)
      debugLog(`🤖 GenerateConfig ${JSON.stringify(Array.from(item.values()))}`)
    }
    config.subPackages = subPackageConfigs
    if (dts) {
      writeDeclaration(config, dts)
    }
    const pathConfigPath = path.resolve(root, basePath, 'pages.json')
    debugLog(`🤖 GenerateConfig Write ${pathConfigPath}`)
    await writeFile(pathConfigPath, JSON.stringify(config, null, 2))
    debugLog(`🤖 GenerateConfig Result ${JSON.stringify(config, null, 2)}`)
  }
  async function initCtx() {
    debugLog('enableLog SUCCESS111', readyStatus)
    debugLog(`🤖 InitCtx start ${JSON.stringify({ pages, subPackage })}`)

    const { sources } = await loadConfig<PagesConfig>({ cwd: process.cwd(), sources: configSource, defaults: {} })
    const watcher = new Watcher({ root, filePatterns: sources })
    watcher.on('change', async () => {
      debugLog(`🤖 UserConfig change`)
      generateConfig()
    })
    const pageConfig: any[] = []
    pageConfig.push(pages)
    subPackage.forEach((item) => {
      pageConfig.push(item)
    })
    const watcherPromises: any[] = []
    pageConfig.forEach((item) => {
      const watcher = new Watcher<SubPageOption>({ root, filePatterns: item.filePartten, exclude: item.exclude, t: item as SubPageOption })
      watcherPromises.push(setupPageWatcher(watcher))
    })
    await Promise.all(watcherPromises)
    readyStatus = true
    debugLog(`🤖 InitCtx End`)
    generateConfig()
  }

  return {
    initCtx,
  }
}
