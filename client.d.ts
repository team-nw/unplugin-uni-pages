// Make the macros globally available

declare global {
  const definePage: (typeof import('@team-nw/unplugin-uni-pages/runtime'))['__macro__']
}

export {}
