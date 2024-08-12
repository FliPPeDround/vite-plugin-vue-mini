import { build, createLogger } from 'vite'
import c from 'picocolors'

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
      watch: mode === 'development' ? {} : null,
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
