Command.create({
  name: 'help',
  aliases: ['h'],
  usage: 'maka help',
  description: 'Get some help.'
}, function (args, opts) {
  Maka.logUsage();
});
