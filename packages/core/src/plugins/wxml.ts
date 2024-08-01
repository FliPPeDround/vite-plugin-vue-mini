import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export function VminiWxml(files: string[]): Plugin {
  return {
    name: 'vite-plugin-vue-mini_wxml',
    enforce: 'post',
    buildStart() {
      files.forEach((file) => {
        const source = readFileSync(file, 'utf-8')
        const fileName = file.replace(/^src\//, '').replace(/\.html$/, '.wxml')
        this.emitFile({
          type: 'asset',
          name: fileName,
          fileName,
          source,
        })
      })
    },
  }
}
