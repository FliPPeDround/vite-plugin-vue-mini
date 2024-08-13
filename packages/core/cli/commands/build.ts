import process from 'node:process'
import { build, createLogger } from 'vite'
import chokidar from 'chokidar'
import c from 'picocolors'
import path from 'pathe'

export async function buildCommand(mode: string) {
  const logger = createLogger()
  const loggerInfo = logger.info
  logger.info = (msg) => {
    const printInfo = `${c.green('➜')}  ${c.bold('Vue Mini')}: ${msg}`
    loggerInfo(printInfo, {
      clear: true,
      timestamp: true,
    })
  }
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
    customLogger: logger,
  })
}

export function watchCommand(mode: string) {
  const srcPath = path.resolve(process.cwd(), 'src')
  const watcher = chokidar.watch(srcPath)
  watcher.on('ready', async () => {
    await buildCommand(mode)
    watcher
      .on('add', async (_path) => {
        await buildCommand(mode)
      })
      .on('change', async (_path) => {
        await buildCommand(mode)
      })
  })
}
