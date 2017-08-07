#!/usr/bin/env node

const opm = require('commander')
const pkg = require('./package.json')

opm
  .version(pkg.version)
  .command('install', 'Install plugins from OPM manifest.')
  .command('manifest', 'Generate manifest from existing directory.')
  .parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
