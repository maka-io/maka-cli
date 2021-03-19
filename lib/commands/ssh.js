var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var SSH_COMMAND_DESCRIPTION = 'Connect to your server.\n\n';

Command.create({
  name: 'ssh',
  usage: 'maka ssh',
  examples: [
  ]
}, function (args, opts) {
  this.logWarn('[!] This command, and all pro commands have moved to @maka/maka-cli.  To continue to use this feature, please remove this version of maka (npm remove -g maka-cli) and install the pro version (npm i -g @maka/maka-cli).');
});
