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
  external: [
    ...Object.keys(peerDependencies),
  ],
})
