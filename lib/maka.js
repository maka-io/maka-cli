/*****************************************************************************/
/* Private Modules */
/*****************************************************************************/
const path = require('path');
const fs = require('fs');
const Fiber = require('fibers');
const Future = require('fibers/future');
const Table = require('cli-table');
const cli = require('cli-color');
const spawn = require('child_process').spawn;
const https = require('https');
const homeDir = require('os').homedir();
const os = require('os');

/*****************************************************************************/
/* Global constiables */
/*****************************************************************************/
Command = require('./command.js');
Generator = require('./generator.js');
CurrentConfig = require('./config');

const requireAll = function (relpath) {
  const dirpath = path.join(__dirname, relpath);
  const files = fs.readdirSync(dirpath);
  files.forEach((file) => {
    require(path.join(dirpath, file));
  });
};

/*****************************************************************************/
/* Maka - The main command */
/*****************************************************************************/
Maka = new Command({
  name: 'maka',
  description: 'A command line scaffolding and DevOpts tool for Meteor applications.',
  usage: 'maka <command> [<args>] [<opts>]',
  examples: [
    'maka create MyApp',
    'maka create RefluxApp --client=reflux',
    'maka create GraphQLService --api=graphql',
    'maka create critical-app --test=jasmine',
    'maka generate:config production',
    'maka generate:api Trucks',
    'maka g:route about-us',
    'maka --env prod',
    'maka -e p',
    'maka shell',
    'maka mongo',
    'maka aws create-instance',
    'maka ssh --env prod',
    'maka logs --env prod',
    'maka deploy --env prod'
  ],

  onUsage: function () {
    const header = cli.blackBright;
    const table = new Table({});

    this.log('\nThe default command will run your meteor application.\n');
    this.log(header('Commands: '));

    const commands = this._commands.sort((a,b) => a.name - b.name);

    commands.forEach((g) => {
      table.push([
        g.name,
        g.description()
      ])
    });

    this.log(table.toString());
  }
}, function (args, opts) {

  const isWin = process.platform === 'win32';
  if (isWin) {
    const meteorPath = path.join(homeDir, 'AppData', 'Local', '.meteor');
    if (!fs.existsSync(meteorPath)) {
      throw new Command.NoMeteorFoundError;
    }
  }


  try {
    let command = 'run';
    if (args[0]) {
      command = args[0];
    } else {
      args[0] = command;
    }

    if (opts.e) {
      opts.env = opts.e;
      delete opts.e;
    }

    if (opts.f) {
      opts.force = opts.f;
      delete opts.f;
    }

    if (opts.h) {
      opts.help = opts.h;
      delete opts.h;
    }

    if (this.findSubCommand(command)) {
      return this.runSubCommand(command, args.slice(1), opts);
    } else {
      // if the command wasn't found, but it's a valid meteor command,
      // proxy it to meteor. If it's not a valid meteor command then
      // this method throws a UsageError which will show the help.
      return this.maybeProxyCommandToMeteor();
    }
  } catch (e) {
    if (opts.debug) {
      console.error(e);
    }
    if (e.message) {
      this.logError(e.message);
    } else if (Object.keys(e).length === 0) {
      throw new Command.UsageError;
    } else {
      this.logError(e);
    }
  }
});

/*****************************************************************************/
/* Auto Requires - automatically include all commands and generators */
/*****************************************************************************/
requireAll('commands');
requireAll('generators');

/*****************************************************************************/
/* Exports */
/*****************************************************************************/
module.exports = Maka;
