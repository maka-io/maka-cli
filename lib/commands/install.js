const homeDir = require('os').homedir();
const os = require('os');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

Command.create({
  name: 'install',
  aliases: ['i'],
  validOpts: ['f', 'force', 'v', 'version', 'debug'],
  usage: 'maka install',
  description: 'Install a framework',
  expamples: [
    'maka install meteor',
    'maka install meteor --force',
    'maka install meteor -v 1.12.1',
    'maka install meteor --version 1.12.1'
  ]
}, function (args, opts) {

  let proceede = false
  if (opts.f || opts.force) {
    proceede = true;
  } else {
    proceede = this.confirm('[!!] This command should NOT be run as sudo or with administrative privleges.  Are you ready to proceed?');
  }

  if (!proceede) {
    this.logNotice('[!] Aborted');
    return;
  }

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  let versionFlag = null;
  if (typeof opts.v === 'string' || typeof opts.version === 'string') {
    versionFlag = opts.v || opts.version;
  }

  let meteorInstallScript = this.execSync(`curl -s https://install.meteor.com/`, {}, false);
  let grepResults = this.grep(meteorInstallScript, 'RELEASE=');
  if (grepResults.length === 0) {
    throw '[-] Network error, please try again.';
  }
  let meteorVersion = (versionFlag) ? versionFlag : grepResults[0].replace(/[^0-9.]/gi, '').replace(/\r?\n|\r/, '');

  let removeOldMeteorSpinner = null;
  let downloadSpinner = null;
  let extractSpinner = null;
  let meteorPath = path.join(homeDir, '.meteor');

  if (isWin) {
    meteorPath = path.join(homeDir, 'AppData', 'Local', '.meteor');
    const appDataLocalDir = path.join(homeDir, 'AppData', 'Local');
    const npmPath = path.join(homeDir, 'AppData', 'Roaming', 'npm');
    // Convert total memory to kb, mb and gb 
    var total_memory = os.totalmem();
    var total_mem_in_kb = total_memory/1024;
    var total_mem_in_mb = total_mem_in_kb/1024;
    total_mem_in_mb = Math.floor(total_mem_in_mb / 4);

    try {
      if (fs.existsSync(meteorPath)) {
        removeOldMeteorSpinner = this.logWithSpinner('[>] Removing previous install of meteor');
        this.execSync(`rmdir /Q /S "${meteorPath}"`, {});
        removeOldMeteorSpinner.success();
      }
      downloadSpinner = this.logWithSpinner(`[<] Downloading meteor version ${meteorVersion}`);
      this.execSync(`curl -s https://static-meteor.netdna-ssl.com/packages-bootstrap/${meteorVersion}/meteor-bootstrap-os.windows.x86_64.tar.gz --output "${path.join(appDataLocalDir, 'meteor.tar.gz')}"`, {});
      if (!fs.existsSync(path.join(appDataLocalDir, 'meteor.tar.gz'))) {
        downloadSpinner.failed();
        throw `[-] There was a problem downloading the meteor installation tarball`;
      }
      downloadSpinner.success();

      extractSpinner = this.logWithSpinner(`[>] Installing meteor version ${meteorVersion}`);
      this.execSync(`tar -xzf "${path.join(appDataLocalDir, 'meteor.tar.gz')}" -C "${appDataLocalDir}" 2> nul`, {});
    } catch(e) {
      if (opts.debug) {
        console.error(e);
      }
    }

    const configuringSpinner = this.logWithSpinner('[+] Configuring meteor');
    try {
      // const userPathVar = execSync(`FOR /F "tokens=1,3* skip=2" %G IN ('reg query HKCU\\Environment') DO @echo %G=%H %I`).toString();
      // let userPath = this.grep(userPathVar, 'Path')[0];
      // if (!userPath) {
      //   userPath = this.grep(userPathVar, 'PATH')[0];
      //   if (!userPath) {
      //     throw '[-] I cannot find your Path or PATH variable.';
      //   }
      // }
      // userPath = userPath.replace(/PATH=/, '').replace(`${meteorPath};`, '');
      // execSync(`setx PATH "${meteorPath};${userPath}" 2> nul`, { stdio: 'ignore' });
      execSync(`setx TOOL_NODE_FLAGS "--max-old-space-size=${total_mem_in_mb}" 2> nul`, { stdio: 'ignore' });
    } catch (e) {
      if (opts.debug) {
        console.error(e);
      }
    }

    try {
      fs.unlinkSync(path.join(appDataLocalDir, 'meteor.tar.gz'));
    } catch (e) {
      if (opts.debug) {
        console.error(e);
      }
    }

    // Helpful startups to get meteor running on windows
    const meteorBashPath = path.join(homeDir, 'AppData', 'Local', '.meteor', 'meteor');
    if (!fs.existsSync(meteorBashPath)) {
      const gitBashFix = fs.createWriteStream(meteorBashPath, { flags: 'w' });
      gitBashFix.write('#!/bin/sh\n');
      gitBashFix.write('cmd //c "$0.bat" "$@"');
      gitBashFix.on('finish', function() {
        gitBashFix.end();
      });
    }

    configuringSpinner.success();
    this.logSuccess(`[+] Meteor version ${meteorVersion} installed.\n`);
    this.logNotice('[+] For improved performance, consider whitelisting the following from windows defender.');
    this.logNotice('    Open an administrative PowerShell terminal, then run: ');
    this.logNotice(`      Add-MpPreference -ExclusionPath "${meteorPath}"`);
    this.logNotice(`      Add-MpPreference -ExclusionProcess node.exe`);
    this.logNotice(`      Add-MpPreference -ExclusionProcess 7z.exe`);
    this.logNotice('[+] Please close this command prompt or powershell window and open a new one to finalize install.');
    return;
  } else {
    if (fs.existsSync(meteorPath)) {
      removeOldMeteorSpinner = this.logWithSpinner('[>] Removing previous install of meteor');
      this.execSync(`rm -rf ${meteorPath}`, {});
      this.execSync(`rm -rf ${meteorPath}`, {});
      removeOldMeteorSpinner.success();
    }

    try {
      const platform = (isMac) ? 'os.osx.x86_64' : 'os.linux.x86_64';
      downloadSpinner = this.logWithSpinner(`[<] Downloading meteor version ${meteorVersion}`);
      this.execSync(`curl -s https://static-meteor.netdna-ssl.com/packages-bootstrap/${meteorVersion}/meteor-bootstrap-${platform}.tar.gz --output "${path.join(homeDir, 'meteor.tar.gz')}"`, {});
      downloadSpinner.success();

      extractSpinner = this.logWithSpinner('[>] Installing meteor');
      this.execSync(`tar -xzf "${path.join(homeDir, 'meteor.tar.gz')}" -C "${homeDir}" || true`, {});
      extractSpinner.success();

      fs.unlinkSync(path.join(homeDir, 'meteor.tar.gz'));

    } catch (e) {
      if (opts.debug) {
        console.error(e);
      }
    }

    const configuringSpinner = this.logWithSpinner('[+] Configuring meteor');
    try {
      this.execSync(`mkdir -p ${homeDir}/.local/bin`);
      this.execSync(`printf '%s\\n' '#!/bin/sh' 'exec "$HOME/.meteor/meteor" "$@"' > $HOME/.local/bin/meteor && chmod +x $HOME/.local/bin/meteor`, {});
      this.execSync(`printf 'export PATH=$PATH:$HOME/.local/bin' >> $HOME/.profile && source $HOME/.profile`);
      this.execSync(`printf 'test -f ~/.profile && . ~/.profile' >> ~/.bashrc`);
      this.execSync(`printf 'test -f ~/.profile && . ~/.profile' >> ~/.zshrc`);
    } catch (e) {
      if (opts.debug) {
        console.error(e);
      }
    }
    configuringSpinner.success();

    this.logSuccess(`[+] Meteor version ${meteorVersion} installed.\n`);
    return;
  }
});
