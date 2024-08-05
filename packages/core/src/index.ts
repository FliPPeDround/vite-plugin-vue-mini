import { posix } from 'node:path'
import type { Plugin } from 'vite'
import { globSync } from 'fast-glob'
import copy from '@guanghechen/rollup-plugin-copy'
import { cssFilter, jsOrtsFilter } from './utils'

export default function Vmini(): Plugin[] {
  const files = globSync('src/**/*.**')
  const copyFiles = files.filter(file => !cssFilter(file) && !jsOrtsFilter(file))
  const inputFiles = files.filter(file => cssFilter(file) || jsOrtsFilter(file))

  const inputList = Object.fromEntries(inputFiles.map((file) => {
    const filePath = posix.relative('src', file)
    return [filePath, file]
  }))

  return [
    copy({
      verbose: true,
      targets: copyFiles.map((file) => {
        return {
          src: file,
          dest: 'dist',
          rename(name, ext, _srcPath) {
            return ext === 'html' ? `${name}.wxml` : `${name}.${ext}`
          },
        }
      }),
      flatten: false,
      hook: 'writeBundle',
    }),
    {
      name: 'vite-plugin-vue-mini',
      enforce: 'post',
      config() {
        return {
          build: {
            rollupOptions: {
              input: inputList,
              output: {
                assetFileNames: () => {
                  return '[name].wxss'
                },
                entryFileNames: (chunkInfo) => {
                  return chunkInfo.name
                },
                chunkFileNames: (chunkInfo) => {
                  const module = chunkInfo.name
                  return `miniprogram_npm/${module}/index.js`
                },
              },
            },
          },
        }
      },
    },
  ]
}
