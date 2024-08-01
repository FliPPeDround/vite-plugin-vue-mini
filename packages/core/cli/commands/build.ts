import { build } from 'vite'

export async function buildCommand(mode: string) {
  await build({
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      watch: mode === 'development' ? {} : null,
      rollupOptions: {
        output: {
          format: 'cjs',
          exports: 'named',
        },
      },
    },
  })
}
