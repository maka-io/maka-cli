const path = require('path');

Generator.create({
  name: 'package',
  aliases: ['p','pack', 'pa', 'packa', 'packag'],
  usage: 'maka {generate, g}:{package, p} [path/]<name>',
  description: 'Generate scaffolding for a Meteor Package.\nhttps://docs.meteor.com/api/packagejs.html',
  examples: [
    'maka g:package todos:package'
  ]
}, function (args, opts) {

  const file = this.cssCase(opts.resourceName);

  const pathToTemplate = this.pathFromApp({
    pathParts: ['packages', opts.dir, file]
  });

  const pathFromApp = this.pathFromAppWithNoReWrite({
    pathParts: ['packages', opts.dir, file, 'package.js']
  });

  const config = (opts.config) ? opts.config : CurrentConfig.get();

  const context = {
    name: opts.resourceName,
    myPath: path.relative(this.pathFromProject({}), pathToTemplate),
    cssCaseName: this.cssCase(opts.resourceName),
    className: this.classCase(opts.resourceName),
    camelCaseName: this.camelCase(opts.resourceName),
    fileName: file,
    client: config.engines.client,
    graphql: config.engines.graphql,
    ssr: config.engines.ssr,
    isComponent: opts.hasOwnProperty('component'),
    isLayout: opts.hasOwnProperty('layout'),
    isStore: opts.hasOwnProperty('store'),
    features: config.features,
  };

  context.noRename = true;

  this.template({
    srcPath: 'package/package.js',
    destPath: pathFromApp,
    context
  });

  context.noRename = false;

  const clientPackageFile = pathToTemplate + '/client/' + file + '.js';
  this.template({
    srcPath: 'template/template.js',
    destPath: clientPackageFile,
    context
  });

  const folders = ['lib', 'server', 'tests/client', 'tests/server'];
  folders.forEach((folder) => {
    const packageFile = pathToTemplate + '/' + folder + '/' + file + '.js';
    this.template({
      srcPath: 'package/' + folder + '/package.js',
      destPath: packageFile,
      context
    });
  });
});
