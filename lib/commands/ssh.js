const path = require('path');
const fs = require('fs');

Command.create({
  name: 'ssh',
  usage: 'maka ssh --env <env> [command]',
  validOpts: ['env', 'help'],
  description: 'Connect to or run commands at to your server.',
  examples: [
    'maka ssh --env dev',
    'maka ssh --env staging',
    'maka ssh --env prod',
    'maka ssh --env prod "ls -la"',
    'maka ssh --env prod "pm2 status"',
    'maka ssh --env prod "pm2 logs"'
  ]
}, function (args, opts) {
  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;

  if (!opts.env) {
    this.logError('[-] Environment options required (--env prod)');
  }

  if (opts.help || !opts.env)
    throw new Command.UsageError;

  const env = this.checkConfigExists(opts.env);

  if (args) {
    cmd = args[0];
  }

  const pathToConfig = path.join(env, 'ssh.json');
  const sshConfig = fs.readFileSync(pathToConfig);
  const sshOpts = JSON.parse(sshConfig);
  Object.assign(sshOpts, { tty: true });
  Object.assign(sshOpts, { env });

  this.ssh(sshOpts, cmd);
});
