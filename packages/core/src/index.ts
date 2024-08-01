import path from 'node:path'
import type { Plugin } from 'vite'
import { globSync } from 'fast-glob'
import { cssFilter, htmlFilter } from './utils'

export default function Vmini(): Plugin[] {
  return [
    {
      name: 'vite-plugin-vue-mini',
      enforce: 'pre',
      generateBundle(_, outBundle) {
        for (const bundle of Object.values(outBundle)) {
          if (
            bundle.type === 'asset'
            && htmlFilter(bundle.fileName)
            && typeof bundle.source === 'string'
          )
            bundle.fileName = bundle.fileName.replace(/^src\//, '').replace(/\.html$/, '.wxml')
        }
      },
      config(config) {
        return {
          build: {
            rollupOptions: {
              ...config.build?.rollupOptions,
              input: config.build?.rollupOptions?.input
              || Object.fromEntries(
                globSync('src/**/*.*').map(file => [file, file]),
              ),
              output: {
                assetFileNames: (assetInfo) => {
                  const filePath = path.relative('src', assetInfo.name!)

                  if (cssFilter(assetInfo.name))
                    return filePath
                  else
                    return 'assets/[name][extname]'
                },
                // entryFileNames: (chunkInfo) => {
                //   const filePath = path.relative('src', chunkInfo.name)
                //   return filePath
                // },
                // chunkFileNames: (chunkInfo) => {
                //   const module = chunkInfo.name
                //   return `miniprogram_npm/${module}/index.js`
                // },
                format: 'cjs',
                exports: 'named',
              },
            },
          },
        }
      },
    },
  ]
}
