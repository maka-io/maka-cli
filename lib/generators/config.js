const path = require('path');

Generator.create({
  name: 'configuration',
  aliases: ['config', 'con', 'cfg'],
  usage: 'maka {generate, g}:{config} <name>',
  description: 'Generate configuration settings.',
  examples: [
    'maka g:config production'
  ]
}, function (args, opts) {
  const config = CurrentConfig.get();
  const appDirectory = this.pathFromApp({});

  if (opts.help)
    throw new Command.UsageError;

  const context = {
    app: config.appName,
    appFileCase: this.fileCase(config.appName),
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
  };

  var destinationKey = args[0];
  if(destinationKey === 'dev') {
    destinationKey = 'development';
  } else if (destinationKey === 'prod') {
    destinationKey = 'production';
  }

  const sshFile = this.pathFromProject({
    pathParts: ['config', destinationKey, 'ssh.json']
  });

  this.template({
    srcPath: 'config/ssh.json',
    destPath: sshFile,
    context
  });

  const pm2File = this.pathFromProject({
    pathParts: ['config', destinationKey, 'pm2.config.js']
  });

  this.template({
    srcPath: 'config/pm2.config.js',
    destPath: pm2File,
    context
  });

  const settingsFile = this.pathFromProject({
    pathParts: ['config', destinationKey, 'settings.json']
  });
  this.template({
    srcPath: 'config/settings.json',
    destPath: settingsFile,
    context
  });

  const processEnv = this.pathFromProject({
    pathParts: ['config', destinationKey, 'process.env']
  });

  this.template({
    srcPath: 'config/process.env',
    destPath: processEnv,
    context
  });

  const dockerFile = this.pathFromProject({
    pathParts: ['config', destinationKey, 'docker-compose.yaml']
  });

  this.template({
    srcPath: 'config/docker-compose.yaml',
    destPath: dockerFile,
    context
  });
});
