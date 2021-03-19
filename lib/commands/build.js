let path = require('path');
let fs = require('fs');

Command.create({
  name: 'build',
  usage: 'maka build [opts]',
  description: 'Build your application into the build folder.',
  examples: [
    'maka build',
  ]
}, function (args, opts) {
  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;

  let config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  let meteor = process.platform === "win32" ? 'meteor.bat' : 'meteor';

  let processArgs = [this.pathFromProject({ pathParts: ['build'] })].concat(process.argv.slice(3));

  return this.invokeMeteorCommand('build', processArgs);
});
