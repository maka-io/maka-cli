Generator.create({
  name: 'api',
  aliases: ['api', 'a', 'ap'],
  usage: 'maka {generate, g}:{api} <concept>',
  description: 'Generate scaffolding for an api concept (i.e. Todos).',
  examples: [
    'maka g:api todos'
  ]
}, function (args, opts) {
  let appDirectory = this.pathFromApp({});

  let pathToApi = this.pathFromApp({
    pathParts: [
      'imports',
      'api',
      opts.dir,
      this.fileCase(opts.resourceName),
      this.fileCase(opts.resourceName)
    ]
  });

  let config = CurrentConfig.get();

  const resourceFileName = this.fileCase(opts.resourceName);
  const resourceName = this.camelCase(opts.resourceName);
  const optsDir = (opts.dir) ? `/${opts.dir}/` : '/';

  let context = {
    name: this.classCase(opts.resourceName),
    fileName: resourceFileName,
    camelCase: this.camelCase(opts.resourceName),
    optsDir,
    api: config.engines.api,
    graphql: config.engines.graphql,
    test: config.engines.test,
  };

  if (!this.checkMeteorPackage('check') || !this.checkMeteorPackage('ddp-rate-limiter') || !this.checkMeteorPackage('mdg:validated-method') || !this.checkMeteorPackage('mongo')) {
    this.logNotice('[+] Verifying meteor package requirements ...');
    this.installMeteorPackage('check ddp-rate-limiter mdg:validated-method mongo maka:rest', {cwd: appDirectory});
  }

  this.template({
    srcPath: 'api/collection.js',
    destPath: pathToApi + '-collection.' + config.engines.js,
    context
  });

  if (config.engines.api === 'rest' || config.engines.api === 'restivus') {
    this.template({
      srcPath: 'api/api.js',
      destPath: this.pathFromApp({
        pathParts: ['imports', 'api', opts.dir, resourceFileName, `rest-api.${config.engines.js}`]
      }),
      context
    });
  }

  this.template({
    srcPath: 'api/methods.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'api', opts.dir, resourceFileName, `rpc-methods.${config.engines.js}`],
    }),
    context
  });

  this.template({
    srcPath: 'api/fixtures.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'api', opts.dir, resourceFileName, `fixtures.${config.engines.js}`],
    }),
    context
  });

  if (config.engines.test) {
    this.template({
      srcPath: 'api/tests.js',
      destPath: this.pathFromApp({
        pathParts: ['imports','api', opts.dir, resourceFileName, `${resourceFileName}.tests.js`]
      }),
      context
    });
  }

  this.template({
    srcPath: 'api/publications.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'api', opts.dir, resourceFileName, `publications.${config.engines.js}`]
    }),
    context
  });

  if (config.engines.graphql === 'apollo') {
    const indexPath = this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', `index.${config.engines.js}`]
    });

    let destpath = this.rewriteDestinationPathForEngine({
      pathParts: [indexPath]
    });

    let typeDefPath = this.pathFromApp({
      pathParts: ['imports', 'api', opts.dir, resourceFileName, 'graphql', `typeDefs.${config.engines.js}`]
    });
    let appTypeDefPath = `/imports/api${optsDir}${resourceFileName}/graphql/typeDefs.${config.engines.js}`;
    this.template({
      srcPath: 'api/typeDefs.js',
      destPath: typeDefPath,
      context
    });

    if (config.engines.js === 'tsx') {
      appTypeDefPath = `/imports/api${optsDir}${resourceFileName}/graphql/typeDefs`;
    }

    this.injectAtBeginningOfFile({
      filePath: destpath,
      content: `import { typeDefs as ${resourceName}TypeDefs } from '${appTypeDefPath}';\n`
    });
    this.injectIntoFile({
      filePath: destpath, 
      content: `typeList.push(${resourceName}TypeDefs);\n`,
      begin: 'const', 
      end: 'if \\('
    });

    let resolversPath = this.pathFromApp({
      pathParts: ['imports', 'api', opts.dir, resourceFileName, 'graphql', `resolvers.${config.engines.js}`]
    });
    let appResolverPath = `/imports/api${optsDir}${resourceFileName}/graphql/resolvers.${config.engines.js}`;
    this.template({
      srcPath: 'api/resolvers.js',
      destPath: resolversPath,
      context
    });

    if (config.engines.js === 'tsx') {
      appResolverPath = `/imports/api${optsDir}${resourceFileName}/graphql/resolvers`;
    }

    this.injectAtBeginningOfFile({
      filePath: destpath, 
      content: `\nimport { resolvers as ${resourceName}Resolvers } from '${appResolverPath}';`
    });
    this.injectIntoFile({
      filePath: destpath,
      content: `resolverList.push(${resourceName}Resolvers);\n\n`,
      begin: 'const',
      end: 'if \\('
    });

  }

  this.template({
    srcPath: 'api/register-api.js',
    destPath: this.pathFromApp({
      pathParts: ['imports', 'startup', 'server', `register-${resourceFileName}-api.${config.engines.js}`]
    }),
    context
  });

  let destPath = this.pathFromApp({
    pathParts: ['imports', 'startup', 'server', `index.${config.engines.js}`]
  });
  this.injectAtEndOfFile({
    filePath: destPath, 
    content:`import './register-${resourceFileName}-api.${config.engines.js}';`
  });
});
