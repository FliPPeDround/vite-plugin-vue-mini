/* eslint-disable no-console */
import { build } from 'vite'
import chokidar from 'chokidar'

export async function buildCommand(mode: string) {
  // const logger = createLogger()
  // const loggerInfo = logger.info
  // logger.info = (msg) => {
  //   const printInfo = `${c.green('➜')}  ${c.bold('Vue Mini')}: ${msg}`
  //   loggerInfo(printInfo, {
  //     clear: true,
  //     timestamp: true,
  //   })
  // }
  await build({
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          exports: 'named',
          strict: false,
        },
      },
    },
    // customLogger: logger,
  })
}

export function watchCommand(mode: string) {
  chokidar.watch('src/**/*.**', {
    ignored: ['vite.config.**.**.**'],
  })
    .on('add', async () => {
      console.log('add')
      await buildCommand(mode)
    })
    .on('change', async () => {
      console.log('change')
      await buildCommand(mode)
    })
    .on('ready', async () => {
      console.log('ready')
      await buildCommand(mode)
    })
}
