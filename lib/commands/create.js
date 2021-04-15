const path = require('path');
const fs = require('fs');

Command.create({
  name: 'create',
  aliases: ['cr'],
  usage: 'maka create <name>',
  description: 'Create a new maka meteor project.',
  examples: [
    'maka create my-app',
    'maka create my-blaze-app --client=blaze',
    'maka create my-reflux-app --client=reflux',
    'maka create material-app --theme=material',
    'maka create gql-service --graphql=apollo',
    'maka create ssr-app --ssr',
    'maka create testable-app --test=mocha'
  ]
}, function (args, opts) {
  if (args.length < 1)
    throw new Command.UsageError;
  let name = args[0];


  this.logNotice(`[+] Initiating Project`);
  if (this.createDirectory({ dirPath: name })) {
    // the app name is either the first argument to the
    // generator or inferred from the current directory.
    // if no appname is provided, we assume we're already
    // in the project directory.
    let appName = args[0] || path.basename(process.cwd());
    let projectDirectory = args[0] || process.cwd();
    let isSelfTest = opts.hasOwnProperty('self-test');

    let config = {
      appName: appName,
      engines: { // these are not boolean, only strings
        html: opts.html || 'html',
        js: opts.js || 'js',
        css: opts.css || 'css',
        api: opts.api || 'rest',
        client: opts.client || 'react',
        test: opts.test || 'none',
        graphql: opts.graphql || 'none',
        theme: opts.theme || 'none',
        ssr: (opts.ssr) ? 'true' : 'false'
      },
      template: { // these are boolean
        html: !opts.hasOwnProperty('skip-template-html') && !opts.hasOwnProperty('skip-html'),
        js: !opts.hasOwnProperty('skip-template-js') && !opts.hasOwnProperty('skip-js'),
        css: !opts.hasOwnProperty('skip-template-css') && !opts.hasOwnProperty('skip-css'),
        test: !opts.hasOwnProperty('skip-testing') && !opts.hasOwnProperty('skip-tests')
      },
      route: {
        template: !opts.hasOwnProperty('skip-route-template')
      },
      generator: {
        comments: !opts.hasOwnProperty('skip-generator-comments')
      }
    };

    if (config.engines.client === 'react' || config.engines.client === 'reflux') {
      if (config.engines.js === 'ts') {
        config.engines.js = 'tsx';
      }

      if (config.engines.js === 'js') {
        config.engines.js = 'jsx';
      }

      config.template.html = false;
    } else {
      if (config.engines.js === 'tsx') {
        config.engines.js = 'ts';
      }

      if (config.engines.js === 'jsx') {
        config.engines.js = 'js';
      }
    }

    if (config.engines.client === 'vanilla') {
      config.engines.js = 'js';
      config.engines.graphql = 'none';
      config.engines.theme = 'none';
      //config.engines.test = 'none';
      config.engines.ssr = 'false';
      config.route.template = 'none';
      config.template.html = false;
    }

    // SSR isn't supported on any client other than react.
    if (config.engines.ssr === 'true') {
      if (config.engines.client !== 'react' && config.engines.client !== 'reflux') {
        this.logError('[-] SSR is not supported on any other client than react or reflux');
        config.engines.ssr = 'false';
      }

      // also isn't supported when using apollo, yet...
      if (config.engines.api === 'graphql' || config.engines.graphql === 'apollo') {
        this.logError('[-] SSR with GraphQL is not supported... yet');
        config.engines.ssr = 'false';
      }
    }

    if (config.engines.ssr === 'true') {
      config.template.css = 'false';
    }

    let context = {
      app: appName,
      config: config,
      appPath: path.join(process.cwd(), projectDirectory, 'app'),
      bundlePath: path.join(process.cwd(), projectDirectory, 'build', 'app.tar.gz'),
    };


    let self = this;
    let ignore = [];
    // For ssr, we need to ignore a few templates.
    if (config.engines.ssr === 'true') {
      ignore = ['/app/imports/startup/client/templates.js.jsx', '/app/imports/startup/client/routes.js.jsx', '/app/imports/startup/client/templates.js.tsx', '/app/imports/startup/client/routes.js.tsx' ];
    } else {
      ignore = ['/app/imports/startup/lib/templates.js.jsx', '/app/imports/startup/lib/routes.js.jsx', '/app/imports/startup/lib/templates.js.tsx', '/app/imports/startup/lib/routes.js.tsx'];
    }

    if (config.engines.js !== 'blaze') {
      ignore.push('/app/imports/ui/test-helpers.js');
    }

    if (config.engines.js !== 'ts' && config.engines.js !== 'tsx') {
      ignore.push('app/meteor.d.ts');
      ignore.push('app/maka.d.ts');
      ignore.push('app/tsconfig.json');
    }

    if (config.engines.client === 'vanilla') {
      ignore.push('/app/imports/startup/client/template.js');
    }

    let keep = [];
    // Keep the service worker as js
    keep.push('/app/public/sw.js');
    ignore.push('/app/public/sw.js.jsx');
    ignore.push('/app/public/sw.js.tsx');
    ignore.push('/app/public/sw.js.ts');

    // These don't work in react
    ignore.push('/app/imports/ui/test-helpers.js.jsx');
    ignore.push('/app/imports/ui/test-helpers.js.tsx');


    return CurrentConfig.withValue(config, function () {
      // Define NPM and Meteor install list container:
      let npmInstallList = [];
      let npmDevInstallList = [];
      let meteorInstallList = [];
      let meteorRemoveList = [];

      // copy the project template directory to the project directory
      self.copyTemplateDirectory({
        srcPath: 'project',
        destPath: projectDirectory,
        context,
        ignore,
      })

      // this is strange, need to do a special handling for the .gitignore file
      fs.renameSync(projectDirectory + path.sep + 'gitignore', projectDirectory + path.sep + '.gitignore')


      CurrentConfig.saveInit(config, `${projectDirectory}/.maka/config.json`);

      // create an empty meteor project in the app folder
      self.createEmptyMeteorProject('app', {cwd: projectDirectory, ...opts});

      let appDirectory = path.join(projectDirectory, 'app');

      // copy the meteor app folder template to our new app
      self.copyTemplateDirectory({
        srcPath: 'app',
        destPath: appDirectory,
        context,
        ignore,
        keep
      });

      // invoke the right generators for some default files
      if (config.engines.client === 'vanilla') {
        Maka.findGenerator('template').invoke(['master-layout'], {cwd: projectDirectory, root: true, config, layout: true});
        Maka.findGenerator('template').invoke(['private-layout'], {cwd: projectDirectory, root: true, config, layout: true});
        Maka.findGenerator('route').invoke(['home', '/'], {cwd: projectDirectory, root: true, config});
        Maka.findGenerator('template').invoke(['home'], {cwd: projectDirectory, root: true, config});
        Maka.findGenerator('config').invoke(['development'], {cwd: projectDirectory, root: true, config});
      } else {
        Maka.findGenerator('template').invoke(['master-layout'], {cwd: projectDirectory, root: true, config, layout: true});
        Maka.findGenerator('template').invoke(['private-layout'], {cwd: projectDirectory, root: true, config, layout: true});
        Maka.findGenerator('route').invoke(['home', '/'], {cwd: projectDirectory, root: true, config});
        Maka.findGenerator('template').invoke(['home'], {cwd: projectDirectory, root: true, config});
        Maka.findGenerator('template').invoke(['not-found'], {cwd: projectDirectory, root: true, config});
        Maka.findGenerator('config').invoke(['development'], {cwd: projectDirectory, root: true, config});
      }


      if (!opts.hasOwnProperty('skip-flow-router') && context.config.engines.client === 'blaze') {
        // install the flow router package
        // kadira:flow-router
        // kadira:blaze-layout
        meteorInstallList.push('kadira:flow-router kadira:blaze-layout');
      }

      // Security procedures
      meteorRemoveList.push('autopublish insecure');
      //meteorInstallList.push('check ddp-rate-limiter');

      if (config.engines.client === 'react' || config.engines.client === 'reflux') {
        if (config.engines.test === 'jasmine') {
          // install the jasmine driver package and html/console reporter and coverage
          meteorInstallList.push('sanjo:jasmine maka:html-reporter velocity:console-reporter dburles:factory');
          npmDevInstallList.push('chai enzyme sinon enzyme-adapter-react-16 jquery meteor-node-stubs');
          if (config.engines.graphql === 'apollo') {
            npmDevInstallList.push('@apollo/react-testing');
          }
        } else if (config.engines.test === 'mocha') {
          meteorInstallList.push('jquery meteortesting:mocha meteortesting:mocha xolvio:cleaner hwillson:stub-collections practicalmeteor:chai dburles:factory velocity:meteor-stubs practicalmeteor:sinon');
          npmDevInstallList.push(' nightmare phantomjs-prebuilt enzyme sinon enzyme-adapter-react-16 chai jquery meteor-node-stubs');
          if (config.engines.graphql === 'apollo') {
            npmDevInstallList.push('@apollo/react-testing');
          }
        }
      } else {
        if (config.engines.test === 'jasmine') {
          // install the jasmine driver package and html/console reporter and coverage
          meteorInstallList.push('sanjo:jasmine maka:html-reporter velocity:console-reporter dburles:factory');
          npmDevInstallList.push('meteor-node-stubs');
        } else if (config.engines.test === 'mocha') {
          meteorInstallList.push('jquery meteortesting:mocha meteortesting:mocha xolvio:cleaner hwillson:stub-collections practicalmeteor:chai dburles:factory velocity:meteor-stubs practicalmeteor:sinon');
          npmDevInstallList.push('nightmare phantomjs-prebuilt chai meteor-node-stubs');
        }
      }

      if (config.engines.api !== 'none') {

        if (config.engines.api === 'rest') {
          meteorInstallList.push('maka:rest');
        }

        // if (config.engines.api === 'restivus') {
        //
        //   if (!_.has(opts, 'skip-restivus') || !_.has(opts, 'maka-rest')) {
        //     // install the RESTful api package, restivus
        //     meteorInstallList.push('accounts-password nimble:restivus');
        //   }
        // }

        if (config.engines.api === 'graphql') {
          config.engines.graphql = 'apollo';
        }
      }

      // if (!_.has(opts, 'skip-validated-methods')) {
      //   meteorInstallList.push('mdg:validated-method');
      // }

      if (config.template.css) {
        if (config.engines.css == 'less')
          meteorInstallList.push('less');
      }

      if (config.template.js) {
        if (config.engines.js == 'coffee')
          meteorInstallList.push('coffeescript');
      }

      if (config.template.html) {
        if (config.engines.html === 'jade')
          meteorInstallList.push('mquandalle:jade');
      }

      if (config.template.js) {
        if (config.engines.js !== 'ts' || config.engines.js !== 'tsx') {
          meteorRemoveList.push('typescript');
        }
      }

      npmInstallList.push('meteor-node-stubs ramda');

      if ('js' in opts && opts['js'].toLowerCase() === 'es6') {
        // install the Babel package for Meteor.
        meteorInstallList.push('grigio:babel');
      }

      if (config.engines.client !== 'vanilla') {
        npmInstallList.push('bcrypt');
      }
      npmInstallList.push('@babel/runtime@latest');

      // install react and react router if using...react.
      if (config.engines.client === 'react' || config.engines.client === 'reflux') {
        meteorInstallList.push('react-meteor-data');
        // Because Enzyme needs a stable version of react to keep up with, we're currently clamping React at version:
        // @16.4.0
        if (config.engines.test !== 'none') {
          npmInstallList.push('react react-dom react-test-renderer');
        } else {
          npmInstallList.push('react react-dom');
        }
        npmInstallList.push('react-router@3.2.5 react-addons-pure-render-mixin prop-types babel-plugin-transform-decorators-legacy');
      }

      if (config.engines.client === 'reflux') {
        npmInstallList.push('reflux');
      }

      if (config.engines.graphql === 'apollo') {
        // both
        npmInstallList.push('graphql graphql-load graphql-tools graphql-type-json@0.2.4 isomorphic-fetch');
        // apollo client modules
        npmInstallList.push('apollo-link-context apollo-link-http apollo-cache-inmemory @apollo/react-hooks apollo-link @apollo/client apollo-client apollo-live-client graphql-type-json@0.2.4');
        // apollo server modules
        npmInstallList.push('apollo-link-context apollo-server-express');
        meteorInstallList.push('apollo');
      }

      if (config.engines.theme === 'material') {
        npmInstallList.push('@material-ui/core @material-ui/icons');
      }

      if (config.engines.ssr === 'true') {
        npmInstallList.push('react-router-dom styled-components history@3.3.0');
        meteorInstallList.push('server-render');
      }

      // if (config.engines.ssr === 'true' || config.engines.client === 'react' || config.engines.client === 'reflux') {
      if (config.engines.test === 'jasmine' || config.engines.ssr === 'true' || config.engines.client === 'react' || config.engines.client === 'reflux') {
        if (config.engines.client !== 'blaze') {
          meteorRemoveList.push('blaze-html-templates');
          meteorInstallList.push('static-html');
        }
      }

      if (config.engines.ssr === 'true' && config.engines.theme === 'material') {
        npmInstallList.push('jss react-jss@8.6.1 jss-preset-default');
      }

      if (config.engines.ssr === 'true' && config.engines.graphql === 'apollo') {
        npmInstallList.push('isomorphic-fetch');
      }

      // Vanilla we don't need much from Meteor
      if (config.engines.client === 'vanilla') {
        meteorRemoveList.push('blaze-html-templates tracker');
        meteorInstallList.push('static-html jquery');
      }

      if (config.engines.client === 'blaze') {
        meteorInstallList.push('blaze-html-templates');
        meteorRemoveList.push('static-html');
      }

      if (meteorInstallList.length > 0) {
        self.installMeteorPackage(meteorInstallList.join(' '), {cwd: appDirectory, isSelfTest: isSelfTest});
      }
      if (meteorRemoveList.length > 0) {
        self.removeMeteorPackage(meteorRemoveList.join(' '), {cwd: appDirectory, isSelfTest: isSelfTest});
      }

      // invoke npm install
      self.initNpm({cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage(npmInstallList.join(' '), {cwd: appDirectory, isSelfTest: isSelfTest});
      self.installNpmPackage(npmDevInstallList.join(' '), {cwd: appDirectory, isSelfTest: isSelfTest, dev: true});

      self.logSuccess('Created ' + appName + '!');
      const isWin = process.platform === 'win32';
      if (isWin) {
        self.logNotice('[+] For improved performance, consider whitelisting the following from windows defender.');
        self.logNotice('    Open an administrative PowerShell terminal, then run: ');
        self.logNotice(`      Add-MpPreference -ExclusionPath "${path.join(process.cwd(), projectDirectory)}"`);
      }

      return true;
    });


  } else {
    return false;
  }
});
