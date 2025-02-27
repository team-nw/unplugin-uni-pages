# unplugin-uni-pages

```shell
pnpm i -D @team-nw/unplugin-uni-pages
```

### vite 配置
```ts
import uni from '@dcloudio/vite-plugin-uni'
import Unplugin from '@team-nw/unplugin-uni-pages/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [Unplugin({
        configSource: {
            files: 'pages.json.ts',
        },
        subPackage: ['src/pages-sub/**/*.vue'],
    }), (uni as any).default()],
})
```


## 感谢
- [vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages)
- [define-page](https://github.com/uni-ku/define-page)
