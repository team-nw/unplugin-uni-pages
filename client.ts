// Make the macros globally available
declare global {
  const definePage: (typeof import('./src/runtime'))['definePage']
}

export {}
