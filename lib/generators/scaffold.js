var ScaffoldGenerator = Generator.create({
  name: 'scaffold',
  usage: 'maka {generate, g}:{scaffold, s} [path/]<name> [--where]',
  description: 'Generate scaffolding for a resource.',
  examples: [
    'maka g:scaffold todos'
  ]
}, function (args, opts) {
  Maka.findGenerator('route').invoke(args, opts);
  Maka.findGenerator('template').invoke(args, opts);
  Maka.findGenerator('api').invoke(args, opts);
});
