const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const Future = require('fibers/future');
const path = require('path');
const fs = require('fs');
const del = require('delete');
const spawnargs = require('spawn-args');

module.exports = {};

/**
 * Creates an empty meteor project with the given name
 * at the given opts.cwd.
 */
module.exports.createEmptyMeteorProject = function createEmptyMeteorProject(name, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  let appPath = path.join(opts.cwd, name);
  let meteorPath = path.join(appPath, '.meteor');

  // only do this if a meteor project doesn't already exist at
  // the given location.
  if (this.isDirectory(meteorPath)) {
    this.logWarn('Meteor project already exists at ' + JSON.stringify(appPath));
    return false;
  }

  let minFlag = '--minimal';
  let spinHandle = this.logWithSpinner('Scaffolding project');
  try {
    let appDirectory = path.join(opts.cwd, name);
    this.execSync(`meteor create ${name} ${minFlag}`, {cwd: opts.cwd, silent: true});
    fs.readdirSync(appDirectory).forEach((entryPath) => {
      if (entryPath === '.git') return;
      if (entryPath === '.meteor') return;
      // depreciate fs and use del instead.
      //fs.unlinkSync(path.join(appDirectory, entryPath));
      del.sync(path.join(appDirectory, entryPath));
    });
  } finally {
    // stop the spinny thing
    spinHandle.success();
  }
  return true;
};

/**
 * Installs a meteor package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.installMeteorPackage = function installMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  let spinHandle = this.logWithSpinner('Installing meteor packages');

  try {
    this.execSync(`meteor add ${pkg} --allow-incompatible-update`, {cwd: appDirectory, silent: true});
  } finally {
    spinHandle.success();
  }
};


/**
 * Uninstalls a meteor package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.removeMeteorPackage = function removeMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  let spinHandle = this.logWithSpinner('Removing insecure meteor packages');

  try {
    this.execSync('meteor remove ' + pkg, {cwd: appDirectory, silent: true});
  } catch(e) {
    //nop
  } finally {
    spinHandle.success();
  }
};

/**
 * Installs a npm package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.initNpm = function initNpm(opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to init npm into.");
    return false;
  }

  let spinHandle = this.logWithSpinner('Setting up the npm modules');

  try {
    this.execSync('npm init -f ', {cwd: appDirectory, silent: true});
  } finally {
    spinHandle.success();
  }
};


/**
 * Installs a npm package in the app directory for the project. It doesn't
 * matter where the cwd directory is, as long as you're in an maka project
 * and there's an app folder. If the app folder isn't a meteor project the
 * meteor cli will throw an error.
 */
module.exports.installNpmPackage = function installNpmPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);
  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  let spinHandle = null;

  if (opts.dev) {
    spinHandle = this.logWithSpinner('Installing developer npm packages');
  } else {
    spinHandle = this.logWithSpinner('Installing npm packages');
  }

  try {
    if (opts.dev) {
      this.execSync('meteor npm i --save-dev -q ' + pkg, {cwd: appDirectory, silent: true});
    } else {
      this.execSync('meteor npm i --save -q ' + pkg, {cwd: appDirectory, silent: true});
    }
  } finally {
    spinHandle.success();
  }
};

/**
 * run npm install on a newly cloned or node_module-less project
 */
module.exports.setupNpm = function setupNpm(opts) {
  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  this.logWarn('[!] Cannot find your node_modules folder.  Reinstalling npm dependencies.');
  let spinHandle = this.logWithSpinner('Installing npm packages');

  try {
    this.execSync('meteor npm install', {cwd: appDirectory, silent: true});
  } finally {
    spinHandle.success();
  }
};


/**
 * Checks the presence of a npm package.
 */
module.exports.checkNpmPackage = function checkNpmPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  let packageJSON = JSON.parse(fs.readFileSync(path.join(appDirectory, 'package.json')));

  return (packageJSON.dependencies[pkg]) ? true : false;

};

/**
 * Checks the presence of a meteor package.
 */
module.exports.checkMeteorPackage = function checkMeteorPackage(pkg, opts) {
  opts = opts || {};
  opts.cwd = opts.cwd || '.';

  // If this is a self test, no need to actually install anything.
  if (opts.isSelfTest) {
    return;
  }

  let appDirectory = this.findAppDirectory(opts.cwd);

  if (!appDirectory) {
    this.logError("Couldn't find an app directory to install " + JSON.stringify(pkg) + " into.");
    return false;
  }

  let lines = require('fs').readFileSync(path.join(appDirectory, '.meteor', 'packages'), 'utf-8')
    .split('\n')
    .filter(Boolean);

  let packageExists = false;
  for (var i=0; i < lines.length; i++) {
    if (lines[i] === pkg) {
      packageExists = true;
    }
  }

  return packageExists;

};


/**
 * Returns true if a package has been installed.
 */
module.exports.hasMeteorPackage = function hasMeteorPackage(pkg, opts) {
  let self = this;
  let packageFilePath = this.appPathFor(path.join('.meteor', 'packages'), opts);

  // if this happens we didn't find a meteor
  // directory
  if (!packageFilePath)
    return false;

  let packageLines = this.getLines(packageFilePath);
  let packages = [];
  packageLines.forEach((line) => {
    line = self.trimLine(line);
    if (line !== '')
      packages.push(line);
  });

  return ~packages.indexOf(name);
};

/**
 * Proxy valid meteor commands to the meteor command line tool. The meteor
 * command will be run inside the app directory.
 */
module.exports.maybeProxyCommandToMeteor = function maybeProxyCommandToMeteor() {
  let validMeteorCommands = [
    'npm',
    'run',
    'update',
    'add',
    'remove',
    'list',
    'add-platform',
    'install-sdk',
    'remove-platform',
    'list-platforms',
    'configure-android',
    'build',
    'shell',
    'mongo',
    'reset',
    'logs',
    'authorized',
    'claim',
    'login',
    'logout',
    'whoami',
    'test-packages',
    'admin',
    'list-sites',
    'publish-release',
    'publish',
    'publish-for-arch',
    'search',
    'show',
    'node'
  ];

  let allArgs = process.argv.slice(2);
  let cmd = allArgs[0];
  let args = allArgs.slice(1);

  if (!validMeteorCommands.includes(cmd))
    throw new Command.UsageError();

  if (!this.findAppDirectory())
    throw new Command.UsageError();

  if (cmd === 'add-platform' && args[0] === 'ios') {
    this.invokeMeteorCommand(cmd, args);
    let pathForiOSCordova = path.join(this.findProjectDirectory(), 'app','.meteor','local','cordova-build','platforms','ios','cordova');
    if (pathForiOSCordova) {
      this.logNotice('[+] Patching ios-sim to latest.');
      let installArgs = [
        'npm',
        'install',
        'ios-sim@latest'
      ];
      exec('meteor ' + installArgs.join(' '), { 
        cwd: pathForiOSCordova
      });
      this.logNotice('[+] Don\'t forget these commands: \n sudo xcode-select -s /Applications/Xcode.app/Contents/Developer \n sudo gem install cocoapods \n sudo xcodebuild -license accept');
    }
    return;
  }

  return this.invokeMeteorCommand(cmd, args);
};

/**
 * Proxy valid mup commands to the meteor command line tool. The meteor
 * command will be run inside the app directory.
 */
module.exports.maybeProxyCommandToMup = function maybeProxyCommandToMup() {
  let validMupCommands = [
    'logs',
    'restart',
    'start',
    'stop',
    'ssh',
    'validate',
    'status',
    'docker',
    'meteor',
    'mongo',
    'proxy',
    'help'
  ];

  let allArgs = process.argv.slice(2);
  let cmd = allArgs[1];
  let args = allArgs.slice(2);
  let mupArgs = allArgs.slice(3);
  args = args && args[0] && args[0].split('--').join('');

  if (!validMupCommands.include(args))
    throw new Command.UsageError();

  if (!this.findAppDirectory())
    throw new Command.UsageError();

  return this.invokeMupCommand(cmd, args, mupArgs);
};

module.exports.invokeMupCommand = function invokeMupCommand(cmd, args, mupArgs) {
  let config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  let destinationKey = cmd;
  if (destinationKey === 'dev')
    destinationKey = 'development';

  if (destinationKey === 'staging')
    destinationKey = 'staging';

  if (destinationKey === 'prod')
    destinationKey = 'production';

  let destination = path.join('config', destinationKey);
  let cwd = path.join(this.pathFromProject({}), destination);

  this.spawnSync('mup', [args].concat(mupArgs), cwd);
};

/**
 * Invoke a meteor command with given array arguments. Does not
 * check whether the command is valid. Useful when we know we want
 * to run a command and we can skip the valid meteor commands
 * check.
 */
module.exports.invokeMeteorCommand = function invokeMeteorCommand(cmd, args) {

  const rawLogsIdx = args.indexOf('-r');
  args[rawLogsIdx] = '--raw-logs';
  const inspectIdx = args.indexOf('-i');
  args[inspectIdx] = '--inspect';
  const useBuildIdx = args.indexOf('-b');
  args[useBuildIdx] = '--use-build';
  const excludeIdx = args.indexOf('-x');
  args[excludeIdx] = '--exclude-archs="web.browser.legacy, web.cordova"';

  // check if npm has been run
  let appDirectory = this.findAppDirectory();
  let modulesExist = fs.existsSync(path.join(appDirectory, 'node_modules'));
  let validRunCmds = ['run'];
  let isValidCmd = validRunCmds.indexOf(cmd) >= 0;

  if (!modulesExist && isValidCmd) {
    let projectDirectory = process.cwd();
    this.setupNpm({cwd: path.join(projectDirectory, 'app')});
  }

  let meteor = process.platform === "win32" ? 'meteor.bat' : 'meteor';
  //this.logSuccess("> " + meteor + " " + [cmd].concat(args).join(' '));

  this.spawnSync(meteor, [cmd].concat(args), this.findAppDirectory());
};
