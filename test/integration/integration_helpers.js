var fs = require('fs');
var chdir = require('chdir');
var spawn = require('child_process').spawn;
var rimraf = require('rimraf').sync;
var path = require('path');
var concat = require('concat-stream');
var mkdirp = require('mkdirp').sync;

module.exports = {
  compare: function(fixtureName, opts, callback) {
    var fixtureFolder = './test/integration/fixtures/' + fixtureName;
    if (!fs.existsSync((fixtureFolder))) {
      callback('Fixture ' + fixtureName + ' cannot be located at ' + fixtureFolder);
    }

    var outFolder = './test/integration/out/' + fixtureName;
    if (fs.existsSync(outFolder)) {
      rimraf(outFolder)
    }
    mkdirp(outFolder);
    //mkdirp(outFolder + '/.meteor');
    //fs.appendFileSync(outFolder + '/.meteor/packages', '');
    //fs.appendFileSync(outFolder + '/.meteor/release', '');

    var makaPath = path.resolve('.', 'bin/maka');
    chdir(outFolder, function() {
      var opts = ['init', '--confirm', '--self-test'].concat(opts);
      var maka = spawn(makaPath, opts);

      maka.stderr.pipe(process.stdout);
      maka.on('close', function() {

        var diff = spawn('diff', ['-u',
          '--ignore-all-space',
          '-x', '.gitkeep',
          '-x', '.id',
          '-x', 'versions',
          '-x', 'packages',
          '-x', 'favicon.ico',
          '-r',
          path.resolve('.', outFolder),
          path.resolve('.', fixtureFolder)]);

        var diffOutput = null;
        diff.stdout.pipe(concat(function(output) {
          diffOutput = output.toString();
        }));

        diff.on('close', function(exitCode) {
          if (exitCode == 0) {
            callback(null);
          }
          else {
            callback(diffOutput);
          }
        })
      })
    });
  }
};
