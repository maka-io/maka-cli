const Future = require('fibers/future');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const fs = require('fs');

module.exports.execSync = (command, opts = {}, immediate = true) => {
  const future = new Future;

  const child = exec(command, opts, function(err, stdout, stderr) {
    if (err) {
      future.throw(err);
    } else if (immediate) {
      future.return(true);
    }
  });

  let dataStream = '';
  child.stdout.on('data', (data) => {
    if (opts.toFile) {
      fs.writeFileSync(opts.toFile, data.toString(), (err) => {
        if (err) {
          future.throw(err);
        }
        console.log("File saved to: " + opts.toFile);
      });
    } else {
      if (!immediate) {
        dataStream = data.toString();
      } else if(!opts.silent) {
        console.log(data.toString());
      }
    }
  });

  child.stdout.on('end', (data) => {
    if (!immediate) {
      future.return(dataStream);
    }
  });
  return future.wait();
};

module.exports.spawnSync = (command, args = [], cwd = process.cwd(), verbose = true) => {
  const future = new Future;

  const child = spawn(command, args, {
    cwd: cwd,
    env: process.env,
    stdio: (verbose) ? 'inherit' : 'ignore',
  });

  const sigCodes = ['SIGINT', 'SIGHUP', 'SIGTERM'];
  sigCodes.forEach((sig) => {
    process.once(sig, () => {
      process.kill(child.pid, sig);
      process.kill(process.pid, sig);
    });
  });

  child.on('exit', () => {
    future.return();
  });

  future.wait();
};
