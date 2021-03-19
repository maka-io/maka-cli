const util = require('util');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

let Generator = module.exports = function Generator (opts, handler) {
  Command.prototype.constructor.apply(this, arguments);
};

util.inherits(Generator, Command);

function inside(dir = '.' , func) {
  let cur = process.cwd();

  let ret = null;
  try {
    process.chdir(dir);
    ret = func();
  } finally {
    process.chdir(cur);
  }

  return ret;
}

Object.assign(Generator.prototype, {
  invoke: function invoke(args, opts) {
    let self = this;

    let newArgs = args.slice();
    opts.resourceName = newArgs[0];

    if (!opts.resourceName) {
      this.logError("Oops, you're going to need to specify a resource name like 'todos'.");
      this.logError("Here's some help for this command:");
      throw new Command.UsageError;
    }

    // temporarily change into the directory specified in opts.cwd
    inside(opts.cwd, function () {
      if (!self.findProjectDirectory())
        throw new Command.MustBeInProjectError;

      //fix bug in win32
      let parts = opts.resourceName.replace(/\\/g,'/').split('/');

      if(!opts.dir) {
        // pull the path part out of the <name> and put it in
        // the "dir" option.
        if (parts.length > 1) {
          opts.resourceName = parts.pop();
          newArgs[0] = opts.resourceName;
          opts.dir = parts.map((part) => {
            return self.fileCase(part);
          }).join(path.sep);
        } else {
          opts.dir = '';
        }
      }

      // make sure the 'where' opt is set to something,
      // 'both' by default
      opts.where = opts.where || 'both';

      const whereList = ['both', 'client', 'server'];
      if (!whereList.includes(opts.where)) {
        self.logError("--where must be 'both', 'client' or 'server'");
        throw new Command.UsageError;
      }

      // set the appPathPrefix depending on the 'where' options
      // --where=both => app/lib
      // --where=server => app/server
      // --where=client => app/client
      switch (opts.where) {
        case 'both':
          opts.appPathPrefix = 'lib';
          break;
        case 'server':
          opts.appPathPrefix = 'server';
          break;
        case 'client':
          opts.appPathPrefix = 'client';
          break;
        default:
          opts.appPathPrefix = '';
      }

      CurrentConfig.withConfigFile(function () {
        Command.prototype.invoke.call(self, newArgs, opts);
      });
    });
  }
});

Generator.create = function (opts, handler, parent) {
  if (!opts) {
    throw new Error('Generator.create requires some options!');
  }

  if (typeof handler !== 'function') {
    throw new Error('Generator.create requires a handler function!');
  }

  let g = new Generator(opts, handler);
  parent = parent || Maka;
  parent.addGenerator(g);
  return g;
};
