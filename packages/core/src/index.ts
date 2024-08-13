import process from 'node:process'
import type { Plugin } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { dirname, join, relative } from 'pathe'
import { scanInputFiles } from './scanInputFiles'
import { cssFilter } from './utils'

export default function Vmini(): Plugin[] {
  const inputList = scanInputFiles()
  // console.log(inputList)
  return [
    viteStaticCopy({
      targets: inputList.copyList.map((src) => {
        const relativePath = relative(process.cwd(), src)
        const dest = join(
          dirname(relativePath).replace(/^src[/\\]?/, ''),
          '',
        )
        return {
          src,
          dest,
          rename(name, ext, _srcPath) {
            return ext === 'html' ? `${name}.wxml` : `${name}.${ext}`
          },
        }
      }),
    }) as unknown as Plugin,
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
            },
          },
        }
      },
    },
  ]
}
