let path = require('path');
let fs = require('fs');

Command.create({
  name: 'build',
  usage: 'maka build [opts]',
  description: 'Build your application into the build folder.',
  examples: [
    'maka build',
    'maka build --docker'
  ]
}, function (args, opts) {
  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;

  let config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  let meteor = process.platform === "win32" ? 'meteor.bat' : 'meteor';

  let processArgs = [this.pathFromProject({ pathParts: ['build'] })].concat(process.argv.slice(3));

  if (opts.docker) {
    let buildPath = this.pathFromProject({ });
    let nodeVer = this.execSync('meteor node --version', {}, false).replace(/\r?\n|\r/g, "");
    let appName = this.fileCase(config.appName);
    let tagString = '-t ' + this.fileCase(config.appName) + ':latest';
    if (opts.tag) {
      tagString = '-t ' + opts.tag;
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
    if (fs.existsSync(bundle)) {
      let rebuildQ = this.confirm('[?] Found existing bundle, would you like to rebuild it?');
      if (rebuildQ) {
        let bundleSpinner = this.logWithSpinner('[%] Preparing bundle ...');
        this.spawnSync(meteor, ['npm', 'install', '--save'], this.findAppDirectory(), false);
        //this.logNotice('[*] maka ' + buildArgs.join(' '));
        this.spawnSync(meteor, buildArgs, this.findAppDirectory(), false);
        bundleSpinner.success();
        this.logSuccess('[+] Bundle created.');
      }
    } else {
      let bundleSpinner = this.logWithSpinner('[%] Preparing bundle ...');
      this.spawnSync(meteor, ['npm', 'install', '--save'], this.findAppDirectory(), false);
      //this.logNotice('[*] maka ' + buildArgs.join(' '));
      this.spawnSync(meteor, buildArgs, this.findAppDirectory(), false);
      bundleSpinner.success();
      this.logSuccess('[+] Bundle created.');
    }


    const dockerSpinHandle = this.logWithSpinner('[%] Building docker image...');

    var dockerBuildString = 'docker build -q --build-arg NODE_VERSION=' + nodeVer + ' ' + tagString + ' ' + buildPath;
    const result = this.execSync(dockerBuildString);
    if (result) {
      dockerSpinHandle.success();
      this.logSuccess(`[+] Docker image build: ${appName}`);
    } else {
      dockerSpinHandle.failded();
    }
    return;
  }

  return this.invokeMeteorCommand('build', processArgs);
});
