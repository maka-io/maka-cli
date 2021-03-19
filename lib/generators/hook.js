const path = require('path');
const slash = require('slash');

Generator.create({
  name: 'hook',
  aliases: ['h', 'ho', 'hoo'],
  usage: 'maka {generate| g}:{hook | h} [path/]<name>',
  description: 'Generate a React hook.\nhttps://reactjs.org/docs/hooks-intro.html',
  examples: [
    'maka g:hook cool-hook'
  ]
}, function(args, opts = {}) {
  const hasReact = this.checkNpmPackage('react');
  if (!hasReact) {
    this.logError('[-] This project must be a React type project to use the hooks generator');
    throw new Command.UsageError;
  }

  const appDirectory = this.pathFromApp(opts);
  const projectPath = '/imports/ui/hooks';

  const pathToTemplate = this.pathFromApp({
    pathParts: [
      projectPath,
      opts.dir,
      this.fileCase(opts.resourceName),
      this.fileCase(opts.resourceName)
    ]
  });

  const config = CurrentConfig.get();

  if (typeof(config.template.css) === 'string') {
    config.template.css = (config.template.css === 'true') ? true : false;
    CurrentConfig.setTemplate('css', config.template.css);
  }

  if (config.engines.graphql === 'apollo' && !this.checkNpmPackage('@apollo/client')) {
    this.logWarn('[!] Npm package "@apollo/client" not installed, installing...');
    this.installNpmPackage('@apollo/client isomorphic-fetch', {cwd: appDirectory});
  }

  const context = {
    cssCaseName: this.cssCase(opts.resourceName),
    className: this.classCase(opts.resourceName),
    name: this.fullCamelCase(opts.resourceName),
    graphql: config.engines.graphql,
    theme: config.engines.theme,
    features: config.features,
    myPath: path.relative(this.pathFromProject({}), pathToTemplate),
    fileName: this.fileCase(opts.resourceName),
    isComponent: false
  };

  this.template({
    srcPath: 'hook/hook.jsx',
    destPath: `${pathToTemplate}.jsx`,
    context,
    framework: 'react'
  });

  if (config.template.css) {
    this.template({
      srcPath: 'template/template.css',
      destPath: pathToTemplate + '.css',
      context: Object.assign({}, context, { className: context.cssCaseName })
    });
    this.injectAtBeginningOfFile({
      filePath: `${pathToTemplate}.${config.engines.js}`,
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
