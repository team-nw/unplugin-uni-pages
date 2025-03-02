import * as path from 'node:path'
import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'
import Unplugin from '../src/vite'

console.log(`${path.resolve(__dirname, '../src/index.ts')}`)
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@team-nw/unplugin-uni-pages': path.resolve(__dirname, '../src'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [Unplugin({
    enableLog: true,
    configSource: {
      files: 'pages.json.ts',
    },
    subPackage: ['src/pages-sub/**/*.vue'],
  }), (uni as any).default()],
})
