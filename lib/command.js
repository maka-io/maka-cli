/**
 * The main Command class.
 */

function Command (opts, handler) {
  if (!opts) {
    throw new Error("Command requires first param to be an object");
  }

  if (!opts.name) {
    throw new Error("Command requires a name");
  }

  if (typeof handler !== 'function') {
    throw new Error("Command requires a handler function");
  }

  this.options = Object.assign({}, opts);
  this.name = this.options.name;
  this._handler = handler.bind(this);
  this._commands = [];
  this._generators = [];
};

module.exports = Command;

Command.UsageError = function () {};
Command.MustBeInProjectError = function () {};
Command.NoMeteorAppFoundError = function () {};
Command.NoMeteorFoundError = function () {};

/**
 * Returns true if this command matches a name or an alias.
 */
Command.prototype.match = function match(nameOrAlias) {
  let names = [this.name].concat(this.options.aliases || []);
  return names.includes(nameOrAlias);
};

/**
 * Adds a sub command to this command.
 */
Command.prototype.addCommand = function addCommand(cmd) {
  if (!cmd instanceof Command) {
    throw new Error("addCommand requires a Command instance");
  }
  this._commands.push(cmd);
};

/**
 * Finds a sub command by name.
 */
Command.prototype.findCommand = function findCommand(name) {
  for (let i = 0, len = this._commands.length; i < len; i++) {
    let cmd = this._commands[i];
    if (cmd.match(name))
      return cmd;
  }
};

/**
 * Adds a generator to the generators list for
 * this command.
 */
Command.prototype.addGenerator = function addGenerator(gen) {
  if (!gen instanceof Generator) {
    throw new Error("addGenerator requires a Generator instance");
  }
  this._generators.push(gen);
};

/**
 * Finds a generator by name.
 */
Command.prototype.findGenerator = function findGenerator(name) {
  for (let i = 0, len = this._generators.length; i < len; i++) {
    let res = this._generators[i];
    if (res.match(name))
      return res;
  }
};

/**
 * Run this command. Process will exit when the command has
 * completed.
 */

Command.prototype.run = function run(args, opts) {
  let self = this;
  args = args || [];
  opts = opts || {};

  let result = self.invoke(args, opts);

  if (result === false)
    process.exit(1);
  else if (typeof result === 'number')
    process.exit(result);
  else
    process.exit(0);
};

/**
 * Invoke a command but only exit the process if an error is thrown.
 * Otherwise just returns the handler result to the caller.
 */
Command.prototype.invoke = function invoke(args, opts) {
  let self = this;
  args = args || [];
  opts = opts || {};

  try {
    const inputOpts = Object.keys(opts);
    inputOpts.splice('_', 1);
    if (self.options.validOpts && inputOpts.length > 0) {
      const { validOpts = [] } = self.options;
      inputOpts.forEach((iopt) => {
        if (!validOpts.includes(iopt)) {
          self.logError(`[-] Invalid options: ${iopt}`);
          throw new Command.UsageError;
        }
      });
    }

    return self._handler.call(self, args, opts);
  } catch (e) {
    if (e instanceof Command.UsageError) {
      this.logUsage();
    } else if (e instanceof Command.MustBeInProjectError) {
      this.logError('[-] You must be in an maka project to run this command.');
      this.logNotice('Type "maka help" for maka commands.');
      this.logNotice('You may create a new application by typing\n maka create MyApp\n\n');
      this.logNotice('For more information visit:\n https://www.maka-cli.com\n ' +
        'https://medium.com/@maka-io\n https://gitter.im/meteor/meteor (@maka-io) \n');
      //Maka.logUsage();
    } else if (e instanceof Command.NoMeteorFoundError) {
      this.logError(`[-] Meteor could not be found or it is not installed correctly.`);
      this.logNotice('Please run "maka install meteor"');
    } else {
      throw e;
    }

    process.exit(1);
  }
};

Command.prototype.findSubCommand = function findSubCommand(command) {
  let parts = command.split(':');
  command = parts[0];
  return this.findCommand(command);
};

/**
 * Runs a sub command. Throws a usage error if the
 * subcommand isn't found.
 */
Command.prototype.runSubCommand = function runSubCommand(command, args, opts) {
  let parts = command.split(':');
  command = parts[0];
  let firstArg = parts[1];

  if (firstArg)
    args.splice(0,0,firstArg);

  let cmd = '';
  if (cmd = this.findCommand(command)) {
    try {
      cmd.run(args, opts);
    } catch (e) {
      throw e;
    }
  } else {
    throw new Command.UsageError;
  }
};

/**
 * Returns the description for the command.
 */
Command.prototype.description = function description() {
  return this.options.description || 'No description provided.';
};

/**
 * Returns the usage for the command.
 */
Command.prototype.usage = function usage() {
  return this.options.usage || 'No usage provided.';
};

/**
 * Returns an array of examples for the command.
 */
Command.prototype.examples = function examples() {
  return this.options.examples || [];
};

/**
 * Call the onUsage function provided in the options.
 */
Command.prototype.onUsage = function onUsage() {
  let fn = this.options.onUsage;
  fn && fn.call(this);
};

/**
 * Poor man's mixins for constious functionality we want on
 * the Command prototype. Look at tools.js to see all of
 * the mixins, which are all stored in the tools
 * directory.
 */
Object.assign(Command.prototype, require('./tools'));

Command.create = function (opts, handler, parent) { // command create is what calls addCommand
  if (!opts) {
    throw new Error('Command.create requires some options!');
  }

  if (typeof handler !== 'function') {
    throw new Error('Command.create requires a handler function!');
  }

  let cmd = new Command(opts, handler);
  parent = parent || Maka;

  parent.addCommand(cmd);
  return cmd;
};
