const https = require('https');
const fs = require('fs');
const homeDir = require('os').homedir();
const path = require('path');

Command.create({
  name: 'reconfigure',
  aliases: ['reconfig', 'rcfg', 'recfg', 'rcfg'],
  validOpts: ['env', 'help'],
  usage: 'maka reconfigure | recfg | rcfg --env prod',
  description: 'Sends up the settings.json and pm2.config.js files and reloads the PM2 service.',
  examples: [
    'maka reconfig --env prod',
  ]
}, function (args, opts) {
  if (!opts.env) {
    this.logError('[-] Environment options required (--env prod)');
  }
  if (opts.help || !opts.env) {
    throw new Command.UsageError;
  }

  try {
    this.logNotice('[+] Beginning reconfiguration ...');
    const env = this.checkConfigExists(opts.env);
    let SSH_CONFIG = JSON.parse(fs.readFileSync(path.join(env, 'ssh.json')));
    let SSH = { env, user: SSH_CONFIG.user, host: SSH_CONFIG.host, port: SSH_CONFIG.port, pem: SSH_CONFIG.pem };
    let SCP = {};
    Object.assign(SCP, SSH);

    let pm2Conf = path.join(env, 'pm2.config.js');
    let pm2ConfSCP = {};
    Object.assign(pm2ConfSCP, { source: pm2Conf, dest: '~/pm2.config.js' }, SCP);
    this.scp(pm2ConfSCP);

    let settings = path.join(env, 'settings.json');
    let settingsSCP = {};
    Object.assign(settingsSCP, { source: settings, dest: '~/settings.json' }, SCP);
    this.scp(settingsSCP);

    let deployCmd = 'pm2 delete all && pm2 start pm2.config.js';
    let deployCmdSSH = { verbose: true };
    Object.assign(deployCmdSSH, SSH);
    this.ssh(deployCmdSSH, deployCmd);
    this.logSuccess('[+] Reconfigure complete');

    return true;
  } catch (e) {
    this.logError(e);
    return false;
  }
});
