const path = require('path');
Generator.create({
  name: 'publish',
  aliases: ['p'],
  usage: 'maka {generate, g}:{publish, p} <name>',
  description: 'Generate scaffolding for a publish function.\nhttps://docs.meteor.com/api/pubsub.html',
  examples: [
    'maka g:publish todos'
  ]
}, function (args, opts) {
  const config = CurrentConfig.get();
  const context = {
    name: opts.resourceName,
    collection: this.classCase(opts.resourceName)
  };
  const destpath = this.rewriteDestinationPathForEngine({
    pathParts: this.pathFromApp({ pathParts: [`server/publish.${config.engines.js}`] })
  });
  const content = this.templateContent({
    srcPath: `publish/publish.${config.engines.js}`,
    context
  });
  this.injectAtEndOfFile({
    filePath: destpath,
    content: '\n' + content
  });
});
