const Table = require('cli-table');
const cli = require('cli-color');

Command.create({
  name: 'generate',
  aliases: ['g'],
  usage: 'maka {generate, g}:<generator> <name> [--dir] [--where]',
  description: 'Generate different scaffolds for your project.',
  examples: [
    'maka generate:scaffold todos',
    'maka g:scaffold todos',
    'maka g:template todos/todo_item',
    'maka g:package package:name',
    'maka g:route todos/edit',
    'maka g:api trucks',
    'maka g:dbc geoserver --type=pgsql'
  ],

  onUsage: function () {
    let header = cli.blackBright;
    let table = new Table({});

    this.logHeader('Generators:');

    let generators = Maka._generators.sort();

    generators.forEach((g) => {
      table.push([
        g.name,
        g.description()
      ])
    });
    console.log(table.toString());
  }
}, function (args, opts) {
  let self = this;
  let gName = args[0];

  // Invoke the specified generator
  let generator = Maka.findGenerator(gName);
  if (!generator)
    throw new Command.UsageError;
  generator.run(args.slice(1), opts);
});
