import { basename, dirname, posix } from 'node:path'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { globSync } from 'fast-glob'
import copy from '@guanghechen/rollup-plugin-copy'
import { readJSONSync } from 'fs-extra'
import { cssFilter, jsOrtsFilter } from './utils'
import { wxSupportFileTypes } from './constants'

function fromEntriesPath(paths: string[]) {
  return Object.fromEntries(paths.map((file) => {
    const filePath = posix.relative('src', file)
    return [filePath, file]
  }))
}

function categorizeFiles(files: string[]) {
  return files.reduce((acc, file) => {
    if (cssFilter(file) || jsOrtsFilter(file))
      acc.complier.push(file)
    else
      acc.copy.push(file)

    return acc
  }, { complier: <string[]>[], copy: <string[]>[] })
}

export default function Vmini(): Plugin[] {
  const rootFiles = globSync('src/*.**')
  const {
    complier: rootFilesWithComplier,
    copy: rootFilesWithCopy,
  } = categorizeFiles(rootFiles)
  const assetsFiles = globSync(`src/**/*.{${wxSupportFileTypes.join(',')}}`)

  const appJSON = readJSONSync('src/app.json')
  const pages = appJSON.pages as string[]
  const components = Object.values(appJSON?.usingComponents) as string[]

  const inputList = [...pages, ...components].reduce((acc, page) => {
    const files = globSync(`src/${page}.**`)
    const {
      complier: enterFiles,
      copy: copyFiles,
    } = categorizeFiles(files)

    acc.copyList.push(...copyFiles)
    Object.assign(acc.enterList, fromEntriesPath(enterFiles))

    return acc
  }, {
    enterList: fromEntriesPath(rootFilesWithComplier),
    copyList: [...rootFilesWithCopy, ...assetsFiles],
  })

  return [
    {
      name: 'vite-plugin-vue-mini',
      enforce: 'post',
      config() {
        return {
          build: {
            // emptyOutDir: false,
            rollupOptions: {
              input: inputList.enterList,
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
              plugins: [
                copy({
                  // verbose: true,
                  targets: inputList.copyList.map((src) => {
                    const dest = dirname(src).replace(/^src/, 'dist')
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
