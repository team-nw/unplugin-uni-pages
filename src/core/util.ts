import { mkdir, writeFile as writeFile_ } from 'node:fs/promises'
import { dirname } from 'node:path'
import debug from 'debug'

export function enableLog() {
  debug.enable('uni-pages:resolver,uni-pages:definePage,uni-pages:context,uni-pages:resolveOptions,uni-pages:resolver')
}

export async function writeFile(filePath: string, content: string) {
  await mkdir(dirname(filePath), { recursive: true })
  return await writeFile_(filePath, content, 'utf-8')
}
