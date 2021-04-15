const fs = require('fs');
const homeDir = require('os').homedir();
const path = require('path');

Command.create({
  name: 'logs',
  aliases: ['l'],
  usage: 'maka logs --env prod',
  validOpts: ['env', 'help'],
  description: 'View the logs Pm2',
}, function (args, opts) {
  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;

  if (!opts.env) {
    this.logError('[-] Environment options required (--env prod)');
  }
  if (opts.help || !opts.env)
    throw new Command.UsageError;

  const cmd = 'pm2 logs';

  if (!opts.env) {
    this.logNotice('[+] Defaulting to production environment.');
  }
  const env = this.checkConfigExists(opts.env);

  const pathToConfig = path.join(env, 'ssh.json');
  const sshConfig = fs.readFileSync(pathToConfig);
  const sshOpts = JSON.parse(sshConfig);
  Object.assign(sshOpts, { tty: true });
  Object.assign(sshOpts, { env });

  this.ssh(sshOpts, cmd);

  try {

    return true;
  } catch (e) {
    this.logError(e);
    return false;
  }
});
