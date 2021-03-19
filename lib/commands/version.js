Command.create({
  name: 'version',
  aliases: ['v'],
  usage: 'maka version',
  description: 'Return the version of Maka, Meteor, and the Node version of Meteor.',
  examples: [
    'maka v',
    'maka version'
  ]
}, function (args, opts) {
  if (args.length >= 1)
    throw new Command.UsageError;
  const name = args[0];
  const pjson = require('../../package.json');
  this.log(`Maka-CLI Open Source Package`);
  this.log(`Maka ${pjson.version}`);
  const meteorNodeVersion = this.execSync('meteor node -v', {}, false).replace(/\r?\n|\r/, '').replace('v', '');
  this.log(`Node ${meteorNodeVersion}`);
  const meteorVersion = this.execSync('meteor --version', {}, false);
  this.log(`${meteorVersion}`);
  this.log(`To get the mongo version in use by meteor:\n 1) Run the project, "maka run"\n 2) In a new terminal open the mongo shell, "maka mongo"`);

  return true;
});
