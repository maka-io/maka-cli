var cli = require('cli-color');
var readline = require('readline');
var Future = require('fibers/future');

module.exports = {
  ask: function (question, hidden = false) {
    var self = this;
    var future = new Future;

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: hidden
    });

    if (hidden) {
      rl.stdoutMuted = true;
    }

    rl.query = question;
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("\x1B[2K\x1B[200D"+rl.query+((rl.line.length%2==1)?". ":" ."));
      else
        rl.output.write(stringToWrite);
    };

    process.stdout.write(question);

    rl.once('line', function (data) {
      rl.close();
      future.return(data);
    });

    return future.wait();
  },

  confirm: function (msg) {
    var format = /[yn]/;
    var question = cli.magenta.bold(msg + ' [yn]: ');
    var answer = this.ask(question);

    while (!format.test(answer)) {
      answer = this.ask(question);
    }

    return /[yY]/.test(answer);
  },
}
