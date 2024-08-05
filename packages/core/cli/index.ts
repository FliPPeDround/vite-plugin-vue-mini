#!/usr/bin/env node

import process from 'node:process'
import cac from 'cac'
import c from 'picocolors'
import { version } from '../package.json'
import { buildCommand } from './commands/build'

const cli = cac('vmini')

cli
  .version(version)
  .help()

cli
  .command('dev')
  .action(() => buildCommand('development'))

cli
  .command('build')
  .action(() => buildCommand('production'))

cli.on('command:*', () => {
  // eslint-disable-next-line no-console
  console.log()
  console.error(
    c.inverse(c.red(' ERROR ')) + c.white(' Unknown command: %s'),
    cli.args.join(' '),
  )
  // eslint-disable-next-line no-console
  console.log()
  cli.outputHelp()
  process.exit(1)
})

cli.parse()
