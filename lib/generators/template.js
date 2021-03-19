const path = require('path');

const aliases = ['t', 'te', 'tem', 'temp', 'templa', 'templat'];
Generator.create({
  name: 'template',
  aliases,
  usage: 'maka {generate, g}:{template, t} [path/]<name> [--component] [--layout] [--store]',
  description: 'Generate scaffolding for a template.',
  examples: [
    'maka g:template todos/todos-item'
  ]
}, function(args, opts) {

  let projectPath = '/imports/ui/pages';

  const appDirectory = this.pathFromApp(opts);
  if (opts.component) {
    projectPath = '/imports/ui/components';
  }

  if (opts.layout) {
    projectPath = '/imports/ui/layouts';
  }

  if (opts.store) {
    projectPath = '/imports/ui/stores';
  }

  if(opts.layout && opts.component) {
    this.logError("A template can not be a component and a layout at the same time.");
    throw new Command.UsageError();
  }

  const pathToTemplate = this.pathFromApp({
    pathParts: [
      projectPath,
      opts.dir,
      this.fileCase(opts.resourceName),
      this.fileCase(opts.resourceName)
    ]
  });

  var config = (opts.config) ? opts.config : CurrentConfig.get();

  if (typeof(config.template.html) === 'string') {
    config.template.html = (config.template.html === 'true') ? true : false;
    CurrentConfig.setTemplate('html', config.template.html);
  }

  if (typeof(config.template.test) === 'string') {
    config.template.test = (config.template.test === 'true') ? true : false;
    CurrentConfig.setTemplate('test', config.template.test);
  }

  if (typeof(config.template.css) === 'string') {
    config.template.css = (config.template.css === 'true') ? true : false;
    CurrentConfig.setTemplate('css', config.template.css);
  }

  if (typeof(config.template.js) === 'string') {
    config.template.js = (config.template.js === 'true') ? true : false;
    CurrentConfig.setTemplate('js', config.template.js);
  }

  if (!config.features) {
    config.features = {};
  }

  const gen = (opts._) ? opts._[0].split(':')[1] : false;
  let isRootGenerator = (opts._ && aliases.includes(gen));
  if (isRootGenerator && !this.checkNpmPackage('ramda')) {
    this.logWarn('[!] Updating npm packages ...');
    this.installNpmPackage('ramda', {cwd: appDirectory});
  }

  var context = {
    name: this.fullCamelCase(opts.resourceName),
    myPath: path.relative(this.pathFromProject({}), pathToTemplate),
    cssCaseName: this.cssCase(opts.resourceName),
    className: this.classCase(opts.resourceName),
    camelCaseName: this.camelCase(opts.resourceName),
    fileName: this.fileCase(opts.resourceName),
    graphql: config.engines.graphql,
    features: config.features,
    client: config.engines.client,
    api: config.engines.api,
    ssr: config.engines.ssr,
    isStore: opts.hasOwnProperty('store'),
    isComponent: opts.hasOwnProperty('component'),
    isLayout: opts.hasOwnProperty('layout'),
    test: config.engines.test,
    theme: config.engines.theme
  };

  if (opts.layout) {
    if (config.template.html === 'html') {
      this.template({
        srcPath: 'layout/layout.html',
        destPath: pathToTemplate + '.html',
        context
      });
    }

    if (config.template.css) {
      this.template({
        srcPath: 'layout/layout.css',
        destPath: pathToTemplate + '.css',
        context: Object.assign({}, context, { className: this.cssCase(opts.resourceName) })
      });
    }

    this.template({
      srcPath: 'layout/layout.js',
      destPath:pathToTemplate + '.js',
      context
    });
  } else {
    if (config.template.html) {
      this.template({
        srcPath: 'template/template.html',
        destPath: pathToTemplate + '.html',
        context
      });
    }

    if (config.template.css) {
      this.template({
        srcPath: 'template/template.css',
        destPath: pathToTemplate + '.css',
        context: Object.assign({}, context, { className: this.cssCase(opts.resourceName) })
      });
    }

    this.template({
      srcPath: 'template/template.js',
      destPath: pathToTemplate + '.js',
      context
    });

    if (config.engines.test !== 'none' && !opts.layout && !opts.store) {
      this.template({
        srcPath: 'template/template-tests.js',
        destPath: pathToTemplate + '.tests.js',
        context
      });
    }
  }
  // Import the HTML and CSS
  if (config.engines.client !== 'react' && config.engines.client !== 'reflux' && config.engines.client !== 'vanilla') {
    if (config.template.css) {
      this.injectAtBeginningOfFile({
        filePath: pathToTemplate + "." + config.engines.js,
        content: "import './" + context.fileName + "." + config.engines.html + "';\n" +
        "import './" + context.fileName + "." + config.engines.css + "';"
      });

    }

    if (config.template.css) {
      this.injectAtBeginningOfFile({
        filePath: pathToTemplate + "." + config.engines.js,
        content: `import './${context.fileName}.${config.engines.html}';`
      });
    }

  } else {
    if (config.template.css && !opts.store) {
      this.injectAtBeginningOfFile({
        filePath: pathToTemplate + "." + config.engines.js,
        content: `import './${context.fileName}.${config.engines.css}';`
      });
    }
  }

  // Import the template in the templates.js file
  const optsDir = (opts.dir) ? `/${opts.dir}/` : '/';
  const npmImportString = `${projectPath}${optsDir}${context.fileName}/${context.fileName}`;

  // Add the template to templates.js
  let templatePath;
  if (config.engines.ssr === 'true') {
    const libTemplates = this.pathFromApp({ pathParts: ['imports', 'startup', 'lib', 'templates.js'] })
    templatePath = this.rewriteDestinationPathForEngine({
      pathParts: [libTemplates]
    });
  } else {
    const clientTemplate = this.pathFromApp({ pathParts: ['imports', 'startup', 'client', 'templates.js'] });
    templatePath = this.rewriteDestinationPathForEngine({
      pathParts: [clientTemplate]
    });
  }

  if (config.engines.client === 'react' || config.engines.client === 'reflux') {
    if (config.engines.js === 'tsx') {
      this.injectAtBeginningOfFile({
        filePath: templatePath,
        content: `import { ${context.className} } from '${npmImportString}';\n`
      });
    } else {
      this.injectAtBeginningOfFile({
        filePath: templatePath,
        content: `import { ${context.className} } from '${npmImportString}.${config.engines.js}';\n`
      });
    }
    this.injectAtEndOfFile({
      filePath: templatePath,
      content: `export { ${context.className} };\n`
    });

  } else {
    this.injectAtEndOfFile({
      filePath: templatePath,
      content: `import '${npmImportString}.${config.engines.js}';\n`
    });
  }
});
