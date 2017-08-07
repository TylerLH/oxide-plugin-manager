#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const addCookieJar = require('@3846masa/axios-cookiejar-support');

addCookieJar(axios);

program
  .option('-u, --username <username>', 'Oxide account username (required)')
  .option('-p, --password <password>', 'Oxide account password (required)')
  .option('-d, --dir [dir]', 'Path to plugins directory (default: ./serverfiles/oxide/plugins)')
  .option('-m, --manifest [path]', 'Manifest file location (default: ./opm-manifest.json)')
  .parse(process.argv)

const DEFAULT_PLUGIN_PATH = './serverfiles/oxide/plugins'
const DEFAULT_MANIFEST_PATH = './opm-manifest.json'
const TARGET_DIR = path.resolve(program.dir || DEFAULT_PLUGIN_PATH)
const MANIFEST_PATH = path.resolve(program.manifest || DEFAULT_MANIFEST_PATH)

const login = program.login || process.env.OXIDE_LOGIN
const password = program.password || process.env.OXIDE_PASSWORD

function authenticate() {
  return axios.post('http://oxidemod.org/login/login', {
    jar: true,
    data: {
      login,
      password
    }
  })
}

function getPluginPage(plugin) {
  axios.get(`http://oxidemod.org/plugins/${plugin.name}.${plugin.resourceId}`)
}

console.log(chalk.bold.white('Installing Oxide Plugins...'))

authenticate()
  .then(res => {
    console.log(res)
    console.log(chalk.bold.green('Plugins successfully installed!'))
  })
