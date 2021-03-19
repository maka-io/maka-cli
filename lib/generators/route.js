const path = require('path');

const aliases = ['r', 'ro', 'rou', 'rout', 'route'];
Generator.create({
  name: 'route',
  aliases,
  usage: 'maka {generate, g}:{route, r} [path/]<name> [url] [--private]',
  description: 'Generate scaffolding for a Route.',
  examples: [
    'maka g:route todosIndex todos',
    'maka g:route todosEdit todos/:id/edit',
    'maka g:route usersShow users/:id/show --layout userView',
    'maka g:route lists/listIndex lists',
  ]
}, function (args, opts) {
  if (opts.help) {
    throw new Command.UsageError;
  }

  let config = (opts.config) ? opts.config : CurrentConfig.get();

  let isPrivate = false;

  if (opts.private === true) {
    isPrivate = true;
  }

  // Get the full name, not just the resource name
  let name = this.fileCase(opts.resourceName);

  // If no URL was specified, use /<name>
  let url = '/' + name;
  if (args.length > 1) {
    url = '/' + args.filter(function (ele) { return ele !== '/' }).join('/').toLowerCase();
  }

  // Change slashes to camelCase
  // For example if the path is todos/edit, the route name will be todosEdit
  name = name.replace(/\//, "-");
  name = this.classCase(name);
  opts.layout = this.classCase(opts.layout);

  let pathToTemplate = path.join(
    '/imports/ui/pages',
    opts.dir,
    this.fileCase(opts.resourceName),
    this.fileCase(opts.resourceName)
  );

  let context = {
    name: name,
    fileCase: this.fileCase(opts.resourceName),
    camelCaseName: this.camelCase(name),
    url: url,
    layout: opts.layout || "MasterLayout",
    templatePath: pathToTemplate,
    templateName: name,
    client: config.engines.client,
    newForm: false
  };

  if (isPrivate) {
    context.layout = 'PrivateLayout';
  }

  const gen = (opts._) ? opts._[0].split(':')[1] : false;
  let isRootGenerator = (opts._ && aliases.includes(gen));
  let configRoute = config.route || {};

  if (configRoute.template && isRootGenerator && !opts.only) {
    opts.layout = null;
    opts.route = true;
    Maka.findGenerator('template').invoke(args, opts);
  }

  let destPath, content;
  if (config.engines.client === 'blaze') {
    const routeFile = this.pathFromApp({ pathParts: ['imports', 'startup', 'client', 'routes.js'] });
    destPath = this.rewriteDestinationPathForEngine({
      pathParts: [routeFile]
    });

    content = this.templateContent({
      srcPath: 'route/route.js',
      context
    });
    this.injectAtEndOfFile({
      filePath: destPath, 
      content: '\n' + content
    });

  } else if (config.engines.client === 'react' || config.engines.client === 'reflux') {
    if (config.engines.ssr === 'true') {
      const libRoutes = this.pathFromApp({ pathParts: ['imports', 'startup', 'lib', `routes.${config.engines.js}`] });
      destPath = this.rewriteDestinationPathForEngine({
        pathParts: [libRoutes]
      });
    } else {
      const clientRoutes = this.pathFromApp({ pathParts: ['imports', 'startup', 'client', `routes.${config.engines.js}`] });
      destPath = this.rewriteDestinationPathForEngine({
        pathParts: [clientRoutes]
      });
    }


    let importComponent = this.readFileLines(destPath).map((item, idx) => {
      return (item.includes(`import * as Component from './templates.jsx';`)) ? idx + 1 : null;
    }).filter(n => n !== null);

    let publicRoutes = this.readFileLines(destPath).map((item, idx) => {
      return (item.includes(`const publicRoutes = (<>`)) ? idx + 1 : null;
    }).filter(n => n !== null);

    let privateRoutes = this.readFileLines(destPath).map((item, idx) => {
      return (item.includes(`const privateRoutes = (<>`)) ? idx + 1 : null;
    }).filter(n => n !== null);


    if (publicRoutes.length > 0 && privateRoutes.length > 0) {
      context.newForm = true;
    }

    // Write the template
    content = this.templateContent({
      srcPath: 'route/route.js',
      context
    });

    if (publicRoutes.length > 0 || privateRoutes.length > 0) {
      this.injectAfterLineNumber({
        filePath: destPath,
        content,
        lineNumber: importComponent[0]
      });

      if (isPrivate && privateRoutes.length > 0) {
        // Make sure it hasn't moved on us.
        privateRoutes = this.readFileLines(destPath).map((item, idx) => {
          return (item.includes(`const privateRoutes = (<>`)) ? idx + 1 : null;
        }).filter(n => n !== null);

        this.injectAfterLineNumber({
          filePath: destPath,
          content: `\t{${context.templateName}}`,
          lineNumber: privateRoutes[0]
        });
        // if it's private, still add to public
        publicRoutes = this.readFileLines(destPath).map((item, idx) => {
          return (item.includes(`const publicRoutes = (<>`)) ? idx + 1 : null;
        }).filter(n => n !== null);
        this.injectAfterLineNumber({
          filePath: destPath,
          content: `\t{${context.templateName}}`,
          lineNumber: publicRoutes[0]
        });

      } else if (publicRoutes.length > 0) {
        publicRoutes = this.readFileLines(destPath).map((item, idx) => {
          return (item.includes(`const publicRoutes = (<>`)) ? idx + 1 : null;
        }).filter(n => n !== null);
        this.injectAfterLineNumber({
          filePath: destPath,
          content: `\t{${context.templateName}}`,
          lineNumber: publicRoutes[0]
        });
      } else {
        this.logWarn(`[!] Could not find a suitable location to enable this route.  Please inspect ${destPath}`);
      }

    } else {

      let arrayOfBools = this.readFileLines(destPath).map((item) => {
        return (item.includes('\"*\"'));
      });
      let hasWildCard = arrayOfBools.indexOf(true) > -1;

      let end = (hasWildCard) ? '<Route' : '</Router>';

      this.injectIntoFile({
        filePath: destPath,
        content: '\n\t\t' + content + '\n\t\t', 
        begin: '<Router',
        end
      });
    }
  } else if (config.engines.client === 'vanilla' ) {
    const vanillaRoutes = this.pathFromApp({ pathParts: ['imports', 'startup', 'client', 'routes.js'] });
    destPath = this.rewriteDestinationPathForEngine({
      pathParts: [vanillaRoutes]
    });
    content = this.templateContent({
      srcPath: 'route/route.js',
      context
    });
    this.injectAtEndOfFile({
      filePath: destPath, 
      content: '\n' + content
    });
  }
});
