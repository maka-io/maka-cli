const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const dotenv = require('dotenv');
const Future = require('fibers/future');

const syncSource = function (filePath) {
  fs.openSync(filePath, 'r');
  dotenv.config({ path: filePath });
};

Command.create({
  name: 'debug',
  usage: 'maka debug [--env] [--raw-logs] [--port] [--inspect]',
  description: 'Debug your app for a given environment.',
  examples: [
    'maka debug --env prod',
    'maka debug --env dev',
  ]
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  let env = this.checkConfigExists('development');
  if (opts.env) {
    env = this.checkConfigExists(opts.env);
  }

  const envPath = path.join(env, 'process.env');
  const settingsPath = path.join(env, 'settings.json');

  // source the env file into the process environment

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
    .filter(value => value !== 'debug')
    .filter(value => value !== args[0]);

  processArgv.forEach((arg, idx) => {
    if (arg === '--env') {
      processArgv.splice(idx, 2);
    }
    if (arg === '--packages') {
      processArgv.splice(idx, 1);
    }
  });

  this.logNotice('[+] Running in Debug');
  return this.invokeMeteorCommand('debug', args.concat(processArgv));
});
