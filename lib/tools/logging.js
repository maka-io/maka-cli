const cli = require('cli-color');
const log = require('single-line-log2').stderr;
const cliCursor = require('cli-cursor');
const elegantSpinner = require('elegant-spinner');
const os = require('os');
const isWin = process.platform === 'win32';

const check = (isWin) ? 'OK' : '\u2714';
const cross = (isWin) ? 'X' : '\u2718';

module.exports = {
  logSuccess() {
    console.log(cli.greenBright.apply(this, arguments));
  },

  logWarn() {
    console.log(cli.yellowBright.apply(this, arguments));
  },

  logNotice() {
    console.log(cli.cyanBright.apply(this, arguments));
  },

  logError() {
    console.log(cli.red.bold.apply(this, arguments));
  },

  logHeader() {
    console.log(cli.blackBright.apply(this, arguments));
  },

  log() {
    console.log(cli.whiteBright.apply(this, arguments));
  },

  logUsage() {
    var header = cli.blackBright;

    var description = this.description();
    var usage = this.usage();
    var examples = this.examples();

    this.logNotice(`\n${description}\n`);
    this.log(header('Usage: ') + usage);

    if (examples && examples.length > 0) {
      this.log(header('\nExamples:'));
      examples.forEach((example) => {
        this.log(` > ${example}`);
      });
    }

    this.onUsage();
    this.logHeader(`\nFor more information, visit www.maka-cli.com`);
  },

  logWithSpinner(message) {
    const frame = elegantSpinner();
    cliCursor.hide();
    let timer = setInterval(function () {
      log(`${message} ${frame()}`);
    }, 90);

    return {
      success() {
        clearInterval(timer);
        log(`${message} ${check}`);
        cliCursor.show();
        console.log();
      },
      failure() {
        clearInterval(timer);
        log(`${message} ${cross}`);
        cliCursor.show();
        console.log();
      },
      stop() {
        clearInterval(timer);
        cliCursor.show();
        console.log();
      }
    };
  }
};
