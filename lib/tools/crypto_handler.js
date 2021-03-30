const path = require('path');

module.exports.ssh = function ssh(opts, cmd = '') {
  let conn = opts.user + '@' + opts.host;
  let cwd = (opts.cwd) ? opts.cwd : process.cwd();
  let fullPath = path.join(opts.env, opts.pem);
  let verbose = opts.verbose;
  let tty = opts.tty || false;

  let args = [];

  if (tty) {
    args.push('-t');
  }

  args = args.concat([
    '-o',
    'ConnectTimeout=2',
    '-i',
    fullPath,
    '-p',
    opts.port,
    conn,
    cmd
  ]);

  this.spawnSync('ssh', args, cwd, verbose);
}

module.exports.sshPing = function sshPing(opts, cmd = '') {
  let conn = opts.user + '@' + opts.host;
  let cwd = (opts.cwd) ? opts.cwd : process.cwd();
  let fullPath = path.join(opts.env, opts.pem);
  let tty = opts.tty || false;

  let args = [];

  if (tty) {
    args.push('-t');
  }

  args = args.concat([
    '-t',
    '-o',
    'ConnectTimeout=2',
    '-i',
    fullPath,
    '-p',
    opts.port,
    conn,
    cmd
  ]);

  try {
    let command = 'ssh ' + args.join(' ');
    return this.execSync(command, { cwd: cwd }, true);
  } catch (e) {
    this.logError(e);
    return false;
  }
}

module.exports.scp = function scp(opts) {
  let conn = opts.user + '@' + opts.host + ':' + opts.dest;
  let cwd = (opts.cwd) ? opts.cwd : process.cwd();
  let fullPath = path.join(opts.env, opts.pem);

  let args = [
    '-i',
    fullPath,
    '-P',
    opts.port,
    opts.source,
    conn
  ];

  return this.spawnSync('scp', args, cwd);
}

module.exports.genCSR = function genCSR(opts) {
  let cwd = (opts.cwd) ? opts.cwd : process.cwd();
  let fullPath = path.join(opts.env, opts.pem);

  let args = [
    'req',
    '-new',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    opts.keyName,
    '-out',
    opts.csrName
  ];

  this.spawnSync('openssl', args, cwd);
}

module.exports.genSSC = function genSSC(opts) {
  let cwd = (opts.cwd) ? opts.cwd : process.cwd();
  let fullPath = path.join(opts.env, opts.pem);

  let args = [
    'req',
    '-x509',
    '-new',
    '-key',
    opts.keyName,
    '-out',
    opts.crtName
  ];

  this.spawnSync('openssl', args, cwd);
}
