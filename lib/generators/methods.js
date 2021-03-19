const path = require('path');

Generator.create({
  name: 'method',
  aliases: ['m', 'meth', 'me', 'metho'],
  usage: 'maka {generate, g}:{method, m} name',
  description: 'Generate scaffolding for a Meteor Method.\nhttps://guide.meteor.com/methods.html',
  examples: [
    'maka g:method todos'
  ]
}, function (args, opts) {
  const config = CurrentConfig.get();

  const resourceFileName = this.fileCase(opts.resourceName);
  const context = {
    name: this.classCase(opts.resourceName),
    fileName: resourceFileName,
    camelCase: this.camelCase(opts.resourceName),
  };
  const appDirectory = this.pathFromApp({});

  if (!this.checkMeteorPackage('check') || !this.checkMeteorPackage('ddp-rate-limiter') || !this.checkMeteorPackage('mdg:validated-method')) {
    this.logWarn('[!] Meteor package "check" or "ddp-rate-limiter" or "mdg:validated-method" is not installed, installing...');
    this.installMeteorPackage('check ddp-rate-limiter mdg:validated-method', {cwd: appDirectory});
  }

  // todo: logic to either create a file or append a method

  this.template({
    srcPath: 'method/method.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', 'methods', opts.dir, `${resourceFileName}-rpc-method.${config.engines.js}`]
    }),
    context
  });

  const optsDir = (opts.dir) ? `/${opts.dir}/` : '/';

  const destPath = this.pathFromApp({
    pathParts: ['imports', 'startup', 'server', `index.${config.engines.js}`]
  });
  this.injectAtEndOfFile({
    filePath: destPath, 
    content: `import './methods${optsDir}${resourceFileName}-rpc-method.${config.engines.js}';`
  });

  // just in to be sure we get the import file working
  this.createFile({
    filePath: this.pathFromApp({
      pathParts: [`server/main.${config.engines.js}`]
    }),
    data: `import '/imports/startup/server';`,
    opts: { ignore: true }
  });
});
