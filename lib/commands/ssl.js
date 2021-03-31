let path = require('path');
let fs = require('fs');

let SSH_COMMAND_DESCRIPTION = 'Create and manage your SSL operations.';

Command.create({
  name: 'ssl',
  usage: 'maka ssl --env <env> [command]',
  validOpts: ['env', 'help'],
  description: 'Create and manage your SSL operations.',
  examples: [
    'maka ssl --env dev generate-csr',
    'maka ssl --env dev generate-ssc // Self-Signed Certificate',
    'maka ssl --env prod letsencrypt // Walkthrough the letsencrypt process'
  ]
}, function (args, opts) {
  let self = this;
  if (opts.help)
    throw new Command.UsageError;

  if (args.length < 1)
    throw new Command.UsageError;
  
  let config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });


  let env = this.checkConfigExists(opts.env);
  let keyDir = path.join(env, '_keys');
  try {
    fs.statSync(keyDir);
  } catch (e) {
    fs.mkdirSync(keyDir, { recursive: true });
  }

  if (args) {
    cmd = args[0];
  }
  try {
    if (cmd === 'generate-csr') {
      this.genCSR({ keyName: keyDir + config.appName + '.key', csrName: keyDir + config.appName + '.csr' });

    } else if (cmd === 'generate-ssc') {
      if (!fs.existsSync(keyDir + config.appName + '.key')) {
        throw '[-] The KEY (.key) is missing from: ' + keyDir;
      }

      if (!fs.existsSync(keyDir + config.appName + '.csr')) {
        throw '[-] The CSR file (.csr) is missing from: ' + keyDir;
      }

      this.genSSC({ keyName: keyDir + config.appName + '.key', crtName: keyDir + config.appName + '.crt' });

    } else if (cmd === 'letsencrypt') {
      let SSH_CONFIG = JSON.parse(fs.readFileSync(env + '/ssh.json'));
      let SSH = { env, user: SSH_CONFIG.user, host: SSH_CONFIG.host, port: SSH_CONFIG.port, pem: SSH_CONFIG.pem };

      this.ssh(SSH, 'sudo snap install core; sudo snap refresh core');
      this.ssh(SSH, 'sudo snap install --classic certbot');
      this.ssh(SSH, 'sudo ln -s /snap/bin/certbot /usr/bin/certbot');
      this.ssh(SSH, 'sudo certbot --nginx');
    } else {
      throw '[-] Please provide a command.';
    }
  } catch (e) {
    this.logError(e);
    throw new Command.UsageError;
  }
});
