import type { FSWatcher } from 'chokidar'
import process from 'node:process'
import { slash } from '@antfu/utils'
import { watch as fsWatch } from 'chokidar'
import { resolve } from 'pathe'

export interface HandlerContext<T> {
  // resolved path
  filePath: string
  t: T
}

export interface WatcherOption<T> {
  root: string
  extensions: string[] | string
  filePatterns: string[] | string
  exclude: string[] | string
  t: T
}

export class Watcher<T> {
  root: string
  extensions: string[] | string
  filePatterns: string[] | string
  exclude: string[] | string
  watcher: FSWatcher
  t: T

  constructor({
                    root = process.cwd(),
                    extensions = [],
                    filePatterns = [],
                    exclude = [],
                    t = {} as T,
                }: Partial<WatcherOption<T>> = {}) {
    this.root = root
    this.extensions = extensions
    if (!Array.isArray(filePatterns)) {
      filePatterns = [filePatterns]
    }

    const newPatterns: string[] = []
    for (const filePatternsItem of filePatterns) {
      newPatterns.push(`${slash(filePatternsItem)}`)
    }
    this.filePatterns = newPatterns
    this.exclude = exclude
    this.t = t

    this.watcher = fsWatch(this.filePatterns, {
      cwd: root,
    })
  }

  on(
    event: 'add' | 'change' | 'unlink' | 'unlinkDir' | 'ready' | 'all',
    handler: (context: HandlerContext<T>) => void,
  ) {
    this.watcher.on(event, async (filePath) => {
      // ensure consistent absolute path for Windows and Unix
      filePath = resolve(this.root, filePath)
      handler({
        filePath,
        t: this.t,
      })
    })
    return this
  }
}
