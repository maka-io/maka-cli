const path = require('path');

Generator.create({
  name: 'service',
  aliases: ['se', 'ser', 'svc', 'serv', 'servi', 'servic'],
  usage: 'maka {generate, g}:{service} <service-name> --type=logger',
  description: 'Generate service to run alongside your meteor application.',
  examples: [
    'maka g:s --type=logger'
  ]
}, function (args, opts) {
  const config = CurrentConfig.get();
  const appDirectory = this.pathFromApp({});

  const context = {
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
    type: opts.type,
    engine: config.engines.js,
  };

  let validService = ['logger'];

  if (validService.indexOf(context.type) < 0) {
    let type = (context.type) ? context.type : '(blank)';
    this.logError('[!] Invalid type ' + type + ', you must provide a valid type as an argument.  Usage:');
    this.logUsage();
    return;
  }

  // START LOGGER SERVICE CONFIGURATION

  if (opts.type === 'logger' && !this.checkNpmPackage('winston')) {
    this.logNotice('[+] Verifying npm package requirements ...');
    this.installNpmPackage('winston winston-transport setimmediate', {cwd: appDirectory});
  }

  if (opts.type === 'logger' || !this.checkMeteorPackage('mongo')) {
    this.logNotice('[+] Verifying meteor package requirements ...');
    this.installMeteorPackage('mongo', {cwd: appDirectory});
  }

  let loggerPath = this.pathFromApp({
    pathParts: ['imports', 'startup', 'lib', 'services', `logger.${config.engines.js}`]
  });

  this.template({
    srcPath: 'service/logger/logger.js',
    destPath: loggerPath,
    context
  });

  // Create the logs collection on the server.
  Maka.findGenerator('collection').invoke(['logs'], {_: ['g:s', 'logger'], where: 'both', appPathPrefix: 'lib', dir: ''});

  let loggerDestPath = this.rewriteDestinationPathForEngine({
    pathParts: [loggerPath]
  });

  this.injectAtBeginningOfFile({
    filePath: loggerDestPath, 
    content: `import { MongoTransport } from '${this.rewriteDestinationPathForEngine({ pathParts: ['/imports/startup/lib/services/logger-transports'] })}';`
  });

  let transportPaths = this.pathFromApp({
    pathParts: ['imports', 'startup', 'lib', 'services', `logger-transports.${config.engines.js}`]
  });
  this.template({
    srcPath: 'service/logger/transports.js',
    destPath: transportPaths,
    context
  });

  let transportsDestPath = this.rewriteDestinationPathForEngine({
    pathParts: [transportPaths]
  });
  this.injectAtBeginningOfFile({
    filePath: transportsDestPath,
    content: `import Logs from '${this.rewriteDestinationPathForEngine({ pathParts: ['/imports/startup/lib/collections/logs'] })}';`
  });

  // END LOGGER SERVICE CONFIGURATION
});
