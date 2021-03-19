var path = require('path');
var fs = require('fs');
var _ = require('underscore');

Command.create({
  name: 'ssl',
  usage: 'maka ssl',
}, function (args, opts) {
  this.logWarn('[!] This command, and all pro commands have moved to @maka/maka-cli.  To continue to use this feature, please remove this version of maka (npm remove -g maka-cli) and install the pro version (npm i -g @maka/maka-cli).');
});
