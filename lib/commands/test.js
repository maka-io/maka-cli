const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const syncSource = function (filePath) {
  fs.openSync(filePath, 'r');
  dotenv.config({ path: filePath });
};

Command.create({
  name: 'test',
  usage: 'maka test [--once] [--packages] [--driver | --driver-package] [--full-app] [--env] [--raw-logs] [--port] [--inspect]',
  description: 'Run the meteor test package, either Mocha or Jasmine.',
  examples: []
}, function (args, opts) {
  if (opts.help) {
    throw new Command.UsageError;
  }

  if (!this.findProjectDirectory()) {
    throw new Command.MustBeInProjectError;
  }

  let env = this.checkConfigExists('development');
  if (opts.env) {
    env = this.checkConfigExists(opts.env);
  }

  let driver = opts['driver-package'] || opts['driver'] || 'none';
  if (driver === 'none') {
    let config = JSON.parse(fs.readFileSync(path.join(this.findProjectDirectory(), '.maka', 'config.json'), 'utf8'));
    if (config.engines.test === 'jasmine') {
      driver = 'sanjo:jasmine';
    } else if (config.engines.test === 'mocha') {
      driver = 'meteortesting:mocha';
    }
  }

  if (driver === 'none') {
    throw '[-] This project does not have a test driver (mocha or jasmine)';
  }

  if (!opts['driver-package'] || !opts['driver']) {
    args = args.concat([
      '--driver-package',
      driver
    ]);
  }

  const settingsPath = path.join(env, 'settings.json');
  if (this.isFile(settingsPath)) {
    this.logNotice('[+] Meteor Settings: ' + settingsPath);
    args = args.concat([
      '--settings',
      settingsPath
    ]);
  } else {
    this.logError('[!] Cannot find Meteor Settings File: ' + settingsPath);
    return false;
  }


  const envPath = path.join(env, 'process.env');
  // source the env file into the process environment
  if (this.isFile(envPath)) {
    this.logNotice('[+] Node Env Config: ' + envPath);
    syncSource(envPath);
  } else {
    this.logError('[!] Cannot find Node Environment File: ' + envPath);
    return false;
  }
  const isArgvKey = (value) => value.includes('--');
  const processArgv =  process.argv.slice(2)
    .filter(value => value !== '--env')
    .filter(value => value !== 'test')
    .filter(value => value !== args[0]);

  processArgv.forEach((arg, idx) => {
    if (arg === '--env' || arg === '--driver') {
      processArgv.splice(idx, 2);
    }
    if (arg === '--packages') {
      processArgv.splice(idx, 1);
    }
  });

  const cmd = (opts.packages) ? 'test-packages' : 'test';
  return this.invokeMeteorCommand('test', args.concat(processArgv));
});
