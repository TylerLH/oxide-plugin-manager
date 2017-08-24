#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const axios = require('axios');
const tough = require('tough-cookie');
const qs = require('qs');
const addCookieJar = require('@3846masa/axios-cookiejar-support');
const cheerio = require('cheerio');

addCookieJar(axios);

const cookieJar = new tough.CookieJar();

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

const manifest = require(MANIFEST_PATH);

const login = program.username || process.env.OXIDE_LOGIN
const password = program.password || process.env.OXIDE_PASSWORD

function authenticate() {
  console.log(chalk.gray('Authenticating with Oxide...'))
  return axios.post('http://oxidemod.org/login/login', qs.stringify({
    login,
    password
  }), {
    jar: cookieJar,
    withCredentials: true
  })
}

function onAuthenticated(response) {
  console.log(chalk.green('Successfully authenticated with Oxide website.'))
  return installPlugins();
}

function installPlugin(pluginData) {
  console.log(chalk.white(`- Installing ${pluginData.name} by ${pluginData.author}`))
  return new Promise((resolve, reject) => {
    getPluginPage(pluginData)
      .then(res => {
        const $ = cheerio.load(res.data);
        const link = $('.downloadButton a').attr('href')
        resolve(link);
      })
      .catch(e => reject(e));
  });
}

function getPluginPage(plugin) {
  return axios.get(`http://oxidemod.org/plugins/${plugin.resourceId}`, {
    jar: cookieJar,
    withCredentials: true
  })
}

function onPluginFailed(err) {
  console.log(err);
}

function installPlugins() {
  return Promise.all(manifest.map(p => installPlugin(p).catch(onPluginFailed)))
}

console.log(chalk.bold.white('Installing Oxide Plugins...'))

authenticate()
  .then(onAuthenticated)
  .then(() => {
    console.log(chalk.bold.green('Plugin installation complete!'))
  })
  .catch((err) => {
    console.error(err.stack || err);
  });
