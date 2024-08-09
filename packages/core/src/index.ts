import { dirname, relative } from 'node:path'
import process from 'node:process'
import type { Plugin } from 'vite'
import copy from '@guanghechen/rollup-plugin-copy'
import { scanInputFiles } from './scanInputFiles'
import { cssFilter } from './utils'

export default function Vmini(): Plugin[] {
  const inputList = scanInputFiles()
  // console.log(inputList)
  return [
    {
      name: 'vite-plugin-vue-mini',
      enforce: 'post',
      transform(code, id) {
        if (cssFilter(id)) {
          return {
            code: `/* ${id} */ ${code}`,
            map: null,
          }
        }
      },
      config() {
        return {
          build: {
            emptyOutDir: false,
            rollupOptions: {
              input: inputList.enterList,
              output: {
                assetFileNames: () => {
                  return '[name].wxss'
                },
                entryFileNames: (chunkInfo) => {
                  const module = chunkInfo.name
                  return module
                },
                chunkFileNames: (chunkInfo) => {
                  const module = chunkInfo.name
                  return `miniprogram_npm/${module}/index.js`
                },
              },
              plugins: [
                copy({
                  verbose: true,
                  targets: inputList.copyList.map((src) => {
                    const relativePath = relative(process.cwd(), src)
                    const dest = dirname(relativePath).replace(/^src/, 'dist')
                    return {
                      src,
                      dest,
                      rename(name, ext, _srcPath) {
                        return ext === 'html' ? `${name}.wxml` : `${name}.${ext}`
                      },
                    }
                  }),
                  hook: 'writeBundle',
                }),
              ],
            },
          },
        }
      },
    },
  ]
}
