import type { Options } from 'tsup'

export default <Options>{
  entry: [
    'src/*.ts',
    'src/types/index.ts',
  ],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  cjsInterop: true,
  splitting: true,
}
