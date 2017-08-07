#!/usr/bin/env node

const Promise = require('bluebird')
const fs = require('fs')
const path = require('path')
const program = require('commander')
const filter = require('lodash/filter')
const includes = require('lodash/includes')
const trim = require('lodash/trim')
const chalk = require('chalk')

const DEFAULT_PLUGIN_PATH = './serverfiles/oxide/plugins/'
const VALID_EXTENSIONS = ['.cs']

// Promisify fs and path
Promise.promisifyAll(fs)

program
  .option('-d, --dir [dir]', 'Path to plugins dir (default: ./serverfiles/oxide/plugins)')
  .option('-o, --output [dir]', 'Output directory for generated manifest (default: current directory)')
  .parse(process.argv)

const TARGET_DIR = path.resolve(program.dir || DEFAULT_PLUGIN_PATH)

function getFiles() {
  console.log(chalk.bold(`Scanning ${TARGET_DIR} for Oxide plugins...\n`))
  return fs.readdirAsync(TARGET_DIR)
}

// Filter the array of paths to only files with valid extensions
function filterByExtension(paths) {
  return new Promise((resolve, reject) => {
    const matches = filter(paths, f => includes(VALID_EXTENSIONS, path.extname(f)))
    resolve(matches)
  })
}

// Read each file and extract manifest data
function getFileMetadata(paths) {
  return paths.map((p, i) => {
    const pluginData = {
      name: '',
      author: '',
      version: '',
      resourceId: null
    }
    const content = fs.readFileSync(p, { encoding: 'utf8' })
    let header = /\[Info\((.+\))\]/.exec(content);
    if (header.length > 0) {
      header = header[0]
      let metadata = /"(.*?)+"/g.exec(header)
      metadata = metadata[0].split(',')
      metadata = metadata.map(prop => trim(prop.replace(/"/g,"")))
      const resourceId = /ResourceId\s*=\s*([0-9]+)/g.exec(header)[1]
      pluginData.name = metadata[0]
      pluginData.author = metadata[1]
      pluginData.version = metadata[2]
      pluginData.resourceId = parseInt(resourceId, 10)
      console.log(chalk.grey(`Found plugin ${pluginData.name}@${pluginData.version} by ${pluginData.author} (ResourceId = ${pluginData.resourceId})`))
    }
    return pluginData
  })
}

function writeFile(data) {
  return fs.writeFileSync('opm-manifest.json', JSON.stringify(data, null, '\t'))
}

function onSuccess() {
  console.log(chalk.bold.green(`\nManifest created successfully at ${TARGET_DIR}/opm-manifest.json`))
}

function onError(err) {
  console.log(chalk.bold.red(err))
}

getFiles()
  .then(filterByExtension)
  .then(getFileMetadata)
  .then(writeFile)
  .then(onSuccess)
  .catch(onError)
