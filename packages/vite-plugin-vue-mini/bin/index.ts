#!/usr/bin/env node

import cac from 'cac'
import { version } from '../package.json'
import { buildCommand } from './commands/build'

const cli = cac('vmini')

cli
  .version(version)
  .help()

cli
  .command('dev')
  .action(() => buildCommand('watch'))

cli.parse()
