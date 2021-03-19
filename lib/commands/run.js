const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Future = require('fibers/future');

const syncSource = function (filePath) {
  fs.openSync(filePath, 'r');
  dotenv.config({ path: filePath });
};

Command.create({
  name: 'run',
  usage: 'maka run [--use-build] [--env] [--raw-logs] [--port] [--inspect]',
  description: 'Run your app for a given environment.'
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  const env = (opts.env) ? opts.env : 'development';
  const configPath = this.checkConfigExists(env);
  const envPath = path.join(configPath, 'process.env');
  let settingsPath = path.join(configPath, 'settings.json');

  // allow settings override
  if (opts.settings) {
    settingsPath = opts.settings;
  } else {
    settingsPath = path.join(configPath, 'settings.json');
  }

  // source the env file into the process environment
  if (this.isFile(envPath)) {
    this.logNotice('[+] Node Env Config: ' + envPath);
    syncSource(envPath);
  } else {
    this.logError('[!] Cannot find Node Environment File: ' + envPath);
    return false;
  }

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

  const splitPath = configPath.split(path.sep);
  const envKey = splitPath[splitPath.length - 1];
  if (envKey === 'production') {
    args.push('--production');
  }

  // remove run and any platforms
  const isArgvKey = (value) => value.includes('--');
  const processArgv = process.argv.slice(2)
    .filter(value => value !== 'run')
    .filter(value => value !== args[0]);

  processArgv.forEach((arg, idx) => {
    if (arg === '--env') {
      processArgv.splice(idx, 2);
    }

    if (arg === '-e') {
      processArgv.splice(idx, 2);
    }
  });

  return this.invokeMeteorCommand('run', args.concat(processArgv));
});
