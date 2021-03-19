const path = require('path');

Generator.create({
  name: 'dbc',
  aliases: ['dbc', 'd', 'db'],
  usage: 'maka {generate, g}:{dbc} <connection-name> --type= pgsql | mssql | sqlite',
  description: 'Generate scaffolding for a database connection.',
  examples: [
    'maka g:dbc geoserver --type=pgsql'
  ]
}, function (args, opts) {

  const config = CurrentConfig.get();
  const appDirectory = this.pathFromApp({});

  const resourceFileName = this.fileCase(opts.resourceName);
  const resourceName = this.camelCase(opts.resourceName);

  const context = {
    name: this.classCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    camelCase: this.camelCase(opts.resourceName),
    type: opts.type,
    engine: config.engines.js,
  };

  const validDbc = ['mssql', 'pgsql', 'sqlite'];

  if (validDbc.indexOf(context.type) < 0) {
    let type = (context.type) ? context.type : '(blank)';
    this.logError('[!] Invalid type ' + type + ', you must provide a valid type as an argument.  Usage:');
    this.logUsage();
    return;
  }

  if (opts.type === 'pgsql' && !this.checkNpmPackage('pg')) {
    this.logWarn('[!] Npm package "pg" not installed, installing...');
    this.installNpmPackage('pg', {cwd: appDirectory});
  }

  if (opts.type === 'mssql' && !this.checkNpmPackage('mssql')) {
    this.logWarn('[!] Npm package "mssql" not installed, installing...');
    this.installNpmPackage('mssql', {cwd: appDirectory});
  }

  if (opts.type === 'sqlite' && !this.checkNpmPackage('better-sqlite3')) {
    this.logWarn('[!] Npm package "better-sqlite3" not installed, installing...');
    this.installNpmPackage('better-sqlite3', {cwd: appDirectory});
  }

  this.template({
    srcPath: 'dbc/config.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', 'dbc', opts.dir, resourceFileName, `config.${config.engines.js}`]
    }),
    context
  });
  this.template({
    srcPath: 'dbc/conn.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', 'dbc', opts.dir, resourceFileName, `conn.${config.engines.js}`]
    }),
    context
  });

  this.template({
    srcPath: 'dbc/register-dbc.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', `register-${resourceFileName}-dbc.${config.engines.js}`]
    }),
    context
  });

  const destPath = this.pathFromApp({
    pathParts: ['imports', 'startup', 'server', `index.${config.engines.js}` ]
  });
  this.injectAtEndOfFile({
    filePath: destPath,
    content: `'import ./register-${resourceFileName}-dbc.${config.engines.js}';`
  });
});
