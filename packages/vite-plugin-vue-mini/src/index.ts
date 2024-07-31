import type { Plugin } from 'vite'
import { globSync } from 'fast-glob'

export default function Vmini(): Plugin[] {
  return [
    {
      name: 'vite-plugin-vue-mini',
      enforce: 'pre',
      config(config) {
        return {
          build: {
            target: 'node14',
            rollupOptions: {
              input: config.build?.rollupOptions?.input || Object.fromEntries(
                globSync('src/**/*.*').map(file => [file, file]),
              ),
            },
          },
        }
      },
    },
  ]
}
