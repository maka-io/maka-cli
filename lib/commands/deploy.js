let path = require('path');
let fs = require('fs');
let Future = require('fibers/future');

Command.create({
  name: 'deploy',
  usage: 'maka deploy [<server-kernel-type>] --env [--ssl] [--domains] [--name] [--mongo] [--force]',
  validOpts: ['env', 'ssl', 'domains', 'name', 'mongo', 'help', 'force', 'email'],
  description: 'Deploy your app to a server.',
  examples: [
    'maka deploy ubuntu --env prod',
    'maka deploy amazon --env prod --mongo',
    'maka deploy --env prod --mongo --ssl=letsencrypt --domains=www.maka-cli.com --email=admin@maka-cli.com'
  ]
}, function (args, opts) {
  let self = this;
  let meteor = process.platform === "win32" ? 'meteor.bat' : 'meteor';
  if (!this.findProjectDirectory())
    throw new Command.MustBeInProjectError;

  if (!opts.env) {
    this.logError('[-] Environment options required (--env prod)');
  }
  if (opts.help || !opts.env) {
    throw new Command.UsageError;
  }

  let config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  let NODE_VER = this.execSync(`${meteor} node --version`, {}, false).replace('v','').replace(/[^0-9.]/gi, '');
  let PKG_MGR = '';

  let validKernels = [
    'ubuntu',
  ];

  if (validKernels.includes(args[1])) {
    switch(args[1]) {
      case 'ubuntu':
        PKG_MGR = 'apt';
        break;
      case 'amazon':
        PKG_MGR = 'yum';
        break;
      default:
        PKG_MGR = 'apt';
    }
  } else {
    PKG_MGR = 'apt';
  }

  // If force was passed
  let useForce = opts.force;

  try {
    const env = this.checkConfigExists(opts.env);

    let configPath = this.checkConfigExists(opts.env);

    let SSH_CONFIG = JSON.parse(fs.readFileSync(path.join(configPath, 'ssh.json')));
    let SSH = { env: configPath, user: SSH_CONFIG.user, host: SSH_CONFIG.host, port: SSH_CONFIG.port, pem: SSH_CONFIG.pem };
    let SCP = {};
    Object.assign(SCP, SSH);

    try {
      let letsencryptData = fs.readFileSync(path.join(configPath, 'letsencrypt.json'));
      opts.ssl = 'letsencrypt';
      this.logNotice('[+] Using letsencrypt.json');
    } catch (e) {
      // nop
    }


    let sslKey = '';
    let sslCrt = '';
    if (opts.ssl && opts.ssl !== 'letsencrypt') {
      sslKey = config.appName + '.key';
      if (!fs.existsSync(path.join(configPath, '_keys', sslKey))) {
        sslKey = this.ask('[!] I could not find a valid SSL file, please provide the name of the SSL file in the _keys/ directory:');
      }

      if (!fs.existsSync(path.join(configPath, '_keys', sslKey))) {
        throw '[-] You do not have a valid SSL file: ' + path.join(configPath, '_keys', sslKey);
      }

      sslCrt = config.appName + '.crt';
      if (!fs.existsSync(path.join(configPath, '_keys', sslCrt))) {
        sslCrt = this.ask('[!] I could not find a valid CRT file, please provide the name of the CRT file in the _keys/ directory:');
      }
      if (!fs.existsSync(path.join(configPath, '_keys', sslCrt))) {
        throw '[-] You do not have a valid ssl crt.  Looking for: ' + path.join(configPath, '_keys', sslCrt);
      }
    }

    this.logNotice('[+] Checking remote host availability...');
    try {
      let resp = this.sshPing(SSH, 'uname -a');
      if (!resp) throw '[-] Could not connect to remote host. Please check your ssh.json config file.';
      if (resp) this.logSuccess('[+] Remote host connection successful');
    } catch (e) {
      this.logError(e);
      return;
    }

    this.logNotice('[+] Building deployment script ...');
    try {
      let future = new Future();

      const nginxFile = fs.createWriteStream(path.join(configPath, 'nginx.conf'), { flags: 'w' });
      nginxFile.on('open', function () {
        if (opts.ssl && opts.ssl !== 'letsencrypt') {
          nginxFile.write('server_tokens off;\n');
          nginxFile.write('map $http_upgrade $connection_upgrade {\n');
          nginxFile.write('\tdefault upgrade;\n');
          nginxFile.write('\t\'\'      close;\n');
          nginxFile.write('}\n');
          nginxFile.write('\n');
          nginxFile.write('server {\n');
          nginxFile.write('\tlisten 80 default_server;\n');
          nginxFile.write('\tlisten [::]:80 default_server ipv6only=on;\n');
          nginxFile.write(`\tserver_name ${config.appName};\n`);
          nginxFile.write('\troot /usr/share/nginx/html;\n');
          nginxFile.write('\tindex index.html index.htm;\n');
          nginxFile.write('\tlocation / {\n');
          nginxFile.write('\t\trewrite     ^ https://$server_name$request_uri? permanent;\n');
          nginxFile.write('\t}\n');
          nginxFile.write('}');
          nginxFile.write('\n');
          nginxFile.write('\n');
          nginxFile.write('server {\n');
          nginxFile.write('\tlisten 443 ssl;\n');
          nginxFile.write(`\tserver_name ${config.appName};\n`);
          nginxFile.write('\troot html;\n');
          nginxFile.write('\tindex index.html;\n');
          nginxFile.write('\tssl on;\n');
          nginxFile.write(`\tssl_certificate /etc/nginx/ssl/${config.appName}.crt;\n`);
          nginxFile.write(`\tssl_certificate_key /etc/nginx/ssl/${config.appName}.key;\n`);
          nginxFile.write(`\tssl_certificate ;\n`);
          nginxFile.write(`\tssl_certificate_key ;\n`);
          nginxFile.write('\tssl_session_cache shared:SSL:10m;\n');
          nginxFile.write('\tssl_session_timeout 5m;\n');
          nginxFile.write('\t\n');
          nginxFile.write('\tssl_prefer_server_ciphers on;\n');
          nginxFile.write('\tssl_protocols TLSv1 TLSv1.1 TLSv1.2;\n');
          nginxFile.write(`\tssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:ECDHE-RSA-RC4-SHA:ECDHE-ECDSA-RC4-SHA:RC4-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!3DES:!MD5:!PSK';\n`);
          nginxFile.write('\tadd_header Strict-Transport-Security "max-age=31536000;";\n');
          nginxFile.write('\t\n');
          nginxFile.write('\tif ($http_user_agent ~ "MSIE" ) {\n');
          nginxFile.write('\t\treturn 303 https://browser-update.org/update.html;\n');
          nginxFile.write('\t}\n');
          nginxFile.write('\tlocation = /favicon.ico {\n');
          nginxFile.write(`\t\talias /home/${SSH_CONFIG.user}/bundle/programs/web.browser/app;\n`);
          nginxFile.write('\t}\n');
          nginxFile.write('\t\n');
          nginxFile.write('\tlocation / {\n');
          nginxFile.write('\t\tproxy_pass http://0.0.0.0:3000;\n');
          nginxFile.write('\t\tproxy_http_version 1.1;\n');
          nginxFile.write('\t\tproxy_set_header Upgrade $http_upgrade;\n');
          nginxFile.write('\t\tproxy_set_header Connection "upgrade";\n');
          nginxFile.write('\t\tproxy_set_header X-Forwarded-For $remote_addr;\n');
          nginxFile.write('\t\tproxy_set_header Host $host;\n');
          nginxFile.write(`\t\tif ($uri != '\/') {\n`);
          nginxFile.write('\t\t\texpires 30d;\n');
          nginxFile.write('\t\t}\n');
          nginxFile.write('\t}\n');
          nginxFile.write('}');
        } else {
          nginxFile.write('server_tokens off;\n');
          nginxFile.write('map $http_upgrade $connection_upgrade {\n');
          nginxFile.write('\tdefault upgrade;\n');
          nginxFile.write('\t\'\'      close;\n');
          nginxFile.write('}\n');
          nginxFile.write('\n');
          nginxFile.write('server {\n');
          nginxFile.write('\tlisten 80 default_server;\n');
          nginxFile.write('\tlisten [::]:80 default_server ipv6only=on;\n');
          nginxFile.write('\tif ($http_user_agent ~ "MSIE" ) {\n');
          nginxFile.write('\t\treturn 303 https://browser-update.org/update.html;\n');
          nginxFile.write('\t}\n');
          nginxFile.write('\tlocation = /favicon.ico {\n');
          nginxFile.write(`\t\talias /home/${SSH_CONFIG.user}/bundle/programs/web.browser/app;\n`);
          nginxFile.write('\t}\n');
          nginxFile.write('\t\n');
          nginxFile.write('\tlocation / {\n');
          nginxFile.write('\t\tproxy_pass http://0.0.0.0:3000;\n');
          nginxFile.write('\t\tproxy_http_version 1.1;\n');
          nginxFile.write('\t\tproxy_set_header Upgrade $http_upgrade;\n');
          nginxFile.write('\t\tproxy_set_header Connection "upgrade";\n');
          nginxFile.write('\t\tproxy_set_header X-Forwarded-For $remote_addr;\n');
          nginxFile.write('\t\tproxy_set_header Host $host;\n');
          nginxFile.write(`\t\tif ($uri != '\/') {\n`);
          nginxFile.write('\t\t\texpires 30d;\n');
          nginxFile.write('\t\t}\n');
          nginxFile.write('\t}\n');
          nginxFile.write('}');
        }
});

nginxFile.on('finish', function() {
  nginxFile.end();
});

// df is deployFile
let df = fs.createWriteStream(path.join(configPath, 'deploy.sh'), { flags: 'w' });
df.on('open', function() {
  df.write('sudo apt-get update\n');
  df.write('# install git and nginx\n');
  df.write('sudo ' + PKG_MGR + ' install git nginx -y\n');
  if (opts.mongo === true) {
    df.write('# install and configure local mongo\n');
    df.write('wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -\n');
    df.write('echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list\n');
    df.write('sudo apt-get update\n');
    df.write('sudo apt-get install -y mongodb-org\n');
    df.write('sudo service mongod start\n');
    df.write('sudo systemctl enable mongod.service\n');
  }
  df.write('# setup node and npm with the proper node version using nvm\n');
  df.write('git clone https://gist.github.com/c427ccd6f4377b39299b9d402f5d51fe.git ~/maka-env/nvm-install\n');
  df.write('rm -rf ~/.bash_profile ~/.bashrc\n');
  df.write('touch ~/.bash_profile ~/.bashrc\n');
  df.write('echo "test -f ~/.bashrc && . ~/.bashrc" > ~/.bash_profile\n');
  df.write('chmod +x ~/maka-env/nvm-install/nvm-install.sh && ~/maka-env/nvm-install/nvm-install.sh\n');
  df.write('source ~/.bashrc\n');
  df.write('nvm install ' + NODE_VER + '\n');
  df.write('nvm alias default ' + NODE_VER + '\n');
  df.write('npm install -g pm2@latest\n');
  df.write('rm -rf ~/maka-env/nvm-install\n');
  df.write('# Prepare nginx\n');
  df.write('sudo mkdir /etc/systemd/system/nginx.service.d\n');
  df.write('printf "[Service]\\nExecStartPost=/bin/sleep 0.1\\n" > override.conf\n');
  df.write('sudo cp override.conf /etc/systemd/system/nginx.service.d/override.conf\n');
  df.write('sudo systemctl daemon-reload\n');
  df.write('sudo systemctl stop nginx\n');
  df.write('sudo nginx -s stop\n');
  df.write('# Nginx will be restarted just before completing the deployment.\n');
  df.write('sudo cp ~/nginx.conf /etc/nginx/sites-enabled/default\n');
  if (opts.ssl === true && opts.ssl !== 'letsencrypt') {
    df.write('sudo mkdir -p /etc/nginx/ssl/\n');
    df.write('sudo mv ~/' + sslKey + ' /etc/nginx/ssl/' + sslKey +'\n');
    df.write('sudo mv ~/' + sslCrt + ' /etc/nginx/ssl/' + sslCrt +'\n');
  }
  df.write('# Decompress the bundle\n');
  df.write('tar -xf app.tar.gz\n');
  df.write('cd bundle/programs/server\n');
  df.write('npm install\n');
  df.write('npm audit fix --force\n');
  df.write('cd ~\n');
  df.write('# Reset pm2 \n');
  df.write('pm2 delete all\n');
  df.write('# Bring up pm2 with environment\n');
  df.write('pm2 start ~/pm2.config.js\n');
  df.write('# Configure pm2 to start on boot\n');
  df.write('pm2 startup\n')
  df.write('sudo env PATH=$PATH:$(which npm) $(which pm2) startup systemd -u ' + SSH_CONFIG.user + ' --hp /home/' + SSH_CONFIG.user + '\n');
  //df.write('pm2 startup systemd -u ' + SSH_CONFIG.user + ' --hp /home/' + SSH_CONFIG.user + '\n');
  df.write('pm2 save\n');
  df.write('# remove tar bundle\n');
  df.write('rm -f ~/app.tar.gz\n');
});
df.on('finish', function() {
  df.end();
});

self.logSuccess('[+] Deployment script written to: ' + path.join(configPath, 'deploy.sh'));

if (!useForce) {
  let confirmScript = self.confirm('[?] Are you ready to deploy?');
  if (!confirmScript) {
    throw '[-] Aborted deployment!';
  }
}

let buildArgs = ['build', path.join(this.findProjectDirectory(), 'build'), '--architecture=os.linux.x86_64'];

// Make sure to set the server option if this is a mobile platform.  Basically, because browser
// and server are required for a mobile platform, if there are more than two items in
// the platforms file, we can assume it's a mobile build.
try { 
  let platforms = this.readFileLines(path.join(this.pathFromProject({}), 'app', '.meteor', 'platforms'));
  let isMobile = (platforms.length > 2) ? true : false;
  if (isMobile) {

    let server = (config.serverName) ? config.serverName : this.ask('[?] Mobile server IP or fully qualified domain name (FQDN): ');
    let port = (config.serverPort) ? config.serverPort : this.ask('[?] Mobile server port: ');
    if (server.length == 0 || port.length == 0) throw '[!] Server name or port number are not long enough!';

    let httpPort = (port == '443') ? 'https' : 'http';

    buildArgs.push('--server='+httpPort+'://'+server+':'+port);

    if (!config.serverName && !config.serverPort) {
      let confirm = this.ask('[?] Would you like to save the server config in your .maka/config.json file? [yn]');
      if (confirm) {
        CurrentConfig.withConfigFile(function() {
          this.CurrentConfig.set('serverName', server);
          this.CurrentConfig.set('serverPort', port);
        });
        this.logNotice('[+] Stored server config to ' + path.join('.maka', 'config.json'));
      }
    }
  }
} catch(e) {
  this.logError(e);
  return;
}

let bundle = path.join(this.pathFromProject({}), 'build', 'app.tar.gz');
try {
  if (useForce) throw 'ball';

  fs.statSync(bundle);
  let rebuildQ = this.confirm('[?] Found existing bundle, would you like to rebuild it?');
  if (rebuildQ) {
    let bundleSpinner = this.logWithSpinner('[%] Preparing bundle ...');
    this.spawnSync(meteor, ['npm', 'install', '--save'], this.findAppDirectory(), false);
    //this.logNotice('[*] maka ' + buildArgs.join(' '));
    this.spawnSync(meteor, buildArgs, this.findAppDirectory(), false);
    bundleSpinner.success();
    this.logSuccess('[+] Bundle created.');
  }
} catch (e) {
  let bundleSpinner = this.logWithSpinner('[%] Preparing bundle ...');
  this.spawnSync(meteor, ['npm', 'install', '--save'], this.findAppDirectory(), false);
  //this.logNotice('[*] maka ' + buildArgs.join(' '));
  this.spawnSync(meteor, buildArgs, this.findAppDirectory(), false);
  bundleSpinner.success();
  this.logSuccess('[+] Bundle created.');
}

this.logNotice('[^] Pushing up bundle ...');
let bundleSCP = {}
Object.assign(bundleSCP, { source: bundle, dest: '~/app.tar.gz' }, SCP);
this.scp(bundleSCP);

this.logNotice('[^] Pushing up deploy scripts ...');
let deploySh =  path.join(configPath, 'deploy.sh');
let deployShSCP = {};
Object.assign(deployShSCP, { source: deploySh, dest: '~/deploy.sh' }, SCP);
this.scp(deployShSCP);

let nginxConf = path.join(configPath, 'nginx.conf');
let nginxConfSCP = {};
Object.assign(nginxConfSCP, { source: nginxConf, dest: '~/nginx.conf' }, SCP);
this.scp(nginxConfSCP);

let pm2Conf = path.join(configPath, 'pm2.config.js');
let pm2ConfSCP = {};
Object.assign(pm2ConfSCP, { source: pm2Conf, dest: '~/pm2.config.js' }, SCP);
this.scp(pm2ConfSCP);

let settings = path.join(configPath, 'settings.json');
let settingsSCP = {};
Object.assign(settingsSCP, { source: settings, dest: '~/settings.json' }, SCP);
this.scp(settingsSCP);

if (opts.ssl === true && opts.ssl !== 'letsencrypt') {
  let sslKey = path.join(configPath, '_keys', sslKey);
  let sslKeySCP = {};
  Object.assign(sslKeySCP, { source: sslKey, dest: sslKey }, SCP);
  this.scp(sslKeySCP);

  let sslCrt = path.join(configPath, '_keys', sslCrt);
  let sslCrtSCP = {};
  Object.assign(sslCrtSCP, { source: sslCrt, dest: sslCrt }, SCP);
  this.scp(sslCrtSCP);
}

const deploySpinner = this.logWithSpinner('[>] Running deployment scripts on remote server ...');
let deployCmd = 'chmod +x ~/deploy.sh && ./deploy.sh';
let deployCmdSSH = { verbose: false };
Object.assign(deployCmdSSH, SSH);
this.ssh(deployCmdSSH, deployCmd);
deploySpinner.success();
this.logSuccess('[+] Deployment scripts complete');

this.logNotice('[>] Verifying deployment ...');
this.logNotice('** Nginx status is:');
let verNginx = 'sudo systemctl daemon-reload && sudo systemctl start nginx && sudo systemctl status nginx | grep Active';
let verNginxCmdSSH = {};
Object.assign(verNginxCmdSSH, SSH);
this.ssh(verNginxCmdSSH, verNginx);

this.logNotice('** PM2 Status is:');
let verPm2 = 'source ~/.bashrc && pm2 status';
let verPm2CmdSSH = {};
Object.assign(verPm2CmdSSH, SSH);
this.ssh(verPm2CmdSSH, verPm2);

this.logSuccess('[+] Deployed to: ' + SSH_CONFIG.host);

if (opts.ssl === 'letsencrypt') {
  let configDomains = opts.domains;
  let configEmail = opts.email;
  let shouldAskAgain = false;
  try {
    let letsencryptData = fs.readFileSync(path.join(configPath, 'letsencrypt.json'));
    let jsonConfig = JSON.parse(letsencryptData);
    configDomains = (opts.domains) ? opts.domains : jsonConfig.domainNames;
    configEmail = (opts.email) ? opts.email : jsonConfig.emailUpdate;
    if (!opts.email || !opts.domains) {
      this.logNotice('[+] Using saved letsencrypt config');
    }
  } catch (e) {
    // nop
  }
  this.logNotice('[>] Setting up letsencrypt');
  let sshCmdSSH = { verbose: false };
  Object.assign(sshCmdSSH, SSH);
  this.ssh(sshCmdSSH, 'sudo snap install core; sudo snap refresh core');
  this.ssh(sshCmdSSH, 'sudo snap install --classic certbot');
  this.ssh(sshCmdSSH, 'sudo ln -s /snap/bin/certbot /usr/bin/certbot');
  let domainNames = (configDomains) ? configDomains : this.ask('[?] Domains to register: ');
  let emailUpdate = (configEmail) ? configEmail : this.ask('[?] Email to use for auto-updates: ');
  delete sshCmdSSH.verbose;
  this.ssh(sshCmdSSH, 'sudo certbot --nginx --agree-tos --expand -n --domains ' + domainNames + ' --email ' + emailUpdate);
  const letsEncryptConfig = {
    domainNames,
    emailUpdate
  };
  let data = JSON.stringify(letsEncryptConfig, null, 2);
  fs.writeFileSync(path.join(configPath, 'letsencrypt.json'), data);
}

this.logSuccess('[+] Deployment complete');
future.wait();
} catch (e) {
  this.logError(e);
}
// remove deploy and any platforms
//let r = args.concat(_.without(process.argv.slice(2), 'deploy', args[0]));
//return this.invokeMeteorCommand('deploy', r);
} catch (e) {
  this.logError(e);
}
});
