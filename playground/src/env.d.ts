/// <reference types="vite/client" />
/// <reference types="@team-nw/unplugin-uni-pages/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}
