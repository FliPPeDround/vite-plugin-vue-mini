import { defineConfig } from 'tsup'
import { peerDependencies } from './package.json'

export default defineConfig({
  target: 'node14',
  clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  entry: [
    'src/index.ts',
    'cli/index.ts',
  ],
  esbuildOptions(options) {
    if (options.format === 'esm')
      options.outExtension = { '.js': '.mjs' }
  },
  external: [
    ...Object.keys(peerDependencies),
  ],
})
