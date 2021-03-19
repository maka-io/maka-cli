Generator.create({
  name: 'collection',
  aliases: ['col', 'c'],
  usage: 'maka {generate, g}:{collection, col} <name> [--where]',
  description: 'Generate scaffolding for a Meteor (Mongo) Collection.\nhttps://docs.meteor.com/api/collections.html',
  examples: [
    'maka g:collection todos'
  ]
}, function (args, opts) {
  const appDirectory = this.pathFromApp({});
  const config = CurrentConfig.get();

  const resourceFileName = this.fileCase(opts.resourceName);
  const context = {
    name: this.classCase(opts.resourceName),
    collectionName: this.classCase(opts.resourceName),
    where: opts.where
  };

  if (!this.checkMeteorPackage('mongo')) {
    this.logNotice('[+] Verifying meteor package requirements ...');
    this.installMeteorPackage('mongo', {cwd: appDirectory});
  }

  this.template({
    srcPath: 'collection/collection.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', opts.appPathPrefix, 'collections', opts.dir, `${resourceFileName}.${config.engines.js}`]
    }),
    context
  });

  const optsDir = (opts.dir) ? `/${opts.dir}/` : '/';
  const destPath = this.pathFromApp({
    pathParts: ['imports', 'startup', opts.appPathPrefix, `index.${config.engines.js}`]
  });
  this.injectAtEndOfFile({
    filePath: destPath, 
    content: `import './collections${optsDir}${resourceFileName}.${config.engines.js}';`
  });

  // just in to be sure we get the import file working
  this.createFile({
    filePath: this.pathFromApp({
      pathParts: [`lib/main.${config.engines.js}`]
    }),
    data: `import '/imports/startup/lib';`,
    opts: { ignore: true }
  });
});
