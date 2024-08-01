import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export function VminiJSON(files: string[]): Plugin {
  return {
    name: 'vite-plugin-vue-mini_json',
    enforce: 'post',
    buildStart() {
      files.forEach((file) => {
        const source = readFileSync(file, 'utf-8')
        this.emitFile({
          type: 'asset',
          name: path.relative('src', file),
          fileName: path.relative('src', file),
          source,
        })
      })
    },
  }
}
