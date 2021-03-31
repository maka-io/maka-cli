const path = require('path');

const aliases = ['comp', 'component'];

Generator.create({
  name: 'component',
  aliases,
  usage: 'maka {generate, g}:{comp} [path/]<name>',
  description: 'Generate scaffolding for a React Component.\nhttps://reactjs.org/docs/react-component.html',
  examples: [
    'maka g:comp todos/todos-item'
  ]
}, function(args, opts) {
  const projectPath = '/imports/ui/components';

  const pathToTemplate = this.pathFromApp({
    pathParts: [
      projectPath,
      opts.dir,
      this.fileCase(opts.resourceName),
      this.fileCase(opts.resourceName)
    ]
  });

  var config = (opts.config) ? opts.config : CurrentConfig.get();

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
    this.logWarn('[!] Npm package "@apollo/client" not installed, installing...');
    this.installNpmPackage('ramda', {cwd: appDirectory});
  }

  if (isRootGenerator && !this.checkNpmPackage('react')) {
    this.logError('[-] This project must be a React type project to use the hooks generator');
    return;
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
    test: config.engines.test,
    theme: config.engines.theme
  };

  if (config.template.css) {
    this.template({
      srcPath: 'component/component.css',
      destPath: pathToTemplate + '.css',
      context: Object.assign({}, context, { className: this.cssCase(opts.resourceName) }),
      framework: 'react'
    });
  }

  this.template({
    srcPath: 'component/component.js',
    destPath: pathToTemplate + '.js',
    context,
    framework: 'react'
  });

  if (config.engines.test !== 'none' && !opts.layout && !opts.store) {
    this.template({
      srcPath: 'component/component-tests.js',
      destPath: pathToTemplate + '.tests.js',
      context,
      framework: 'react'
    });
  }

  if (config.template.css) {
    this.injectAtBeginningOfFile({
      filePath: pathToTemplate + "." + config.engines.js,
      content: `import './${context.fileName}.${config.engines.css}';`
    });
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
