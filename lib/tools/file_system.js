const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const os = require('os');
const isWin = process.platform === 'win32';

const treeSymbol = (isWin) ? ' ->' : ' \u2517';
/**
 * Relies on tools/logging.
 */
module.exports = {};

/**
 * Create a file at the given filePath and write the given data
 * to the file. Recursively creates the directory structure if
 * needed.
 */
module.exports.createFile = function ({ filePath, data, opts = {} }) {
  try {
    let pathParts = path.normalize(filePath).split(path.sep);
    let filename = pathParts.pop();
    let dirPath = pathParts.join(path.sep);

    // make sure the directory exists before we create the
    // file.
    this.createDirectory({
      dirPath,
      opts
    });

    // if the file exists let's confirm with the user if we
    // should override it
    if (this.isFile(filePath) && !opts.force) {
      if (opts.ignore === true)
        return false;
      if (!this.confirm(filePath + ' already exists. Do you want to overwrite it?'))
        return false;
    }

    if (!this.isDirectory(filePath)) {
      fs.writeFileSync(filePath, data || '');
      if (!opts.silent) {
        this.logHeader(`${treeSymbol} created file ${path.relative(process.cwd(), filePath)}`);
      }
      return true;
    }
  } catch (e) {
    this.logError('Error creating file ' + path.relative(process.cwd(), filePath) + '. ' + String(e));
    throw e;
  }
};

/**
 * Recursively creates a directory structure from the given
 * dirpath.
 */
module.exports.createDirectory = function ({ dirPath, opts = {} }) {
  try {
    if (this.isDirectory(dirPath)) {
      return true;
    } else if (this.isFile(dirPath)) {
      return false;
    }

    // try to build the directory structure recursively and
    // bail out if it fails anywhere up the stack.
    let pathParts = path.normalize(dirPath).split(path.sep);

    if (pathParts.length > 1) {
      if (!this.createDirectory({
        dirPath: pathParts.slice(0,-1).join(path.sep),
        opts
      })) {
        return false;
      }
    }

    // make the final directory
    fs.mkdirSync(dirPath, opts.mode);

    // double check we exist now
    if (!this.isDirectory(dirPath))
      return false;

    this.logSuccess(`Created ${path.relative(process.cwd(), dirPath)}`);
    return true;
  } catch (e) {
    this.logError("Error creating directory " + path.relative(process.cwd(), dirPath) + ". " + String(e));
    return false;
  }
};

/**
 * Given a startPath or process.cwd() search upwards calling the predicate
 * function for each directory. If the predication function returns true,
 * return the current path, otherwise keep searching up until we can't go
 * any further. Returns false if no directory is found.
 *
 */
module.exports.findDirectoryUp = function ({ predicate, startPath }) {
  let testDir = startPath || process.cwd();
  while (testDir) {
    if (predicate(testDir)) {
      break;
    }

    let newDir = path.dirname(testDir);
    if (newDir === testDir) {
      testDir = false;
    } else {
      testDir = newDir;
    }
  }

  return testDir;
};

/**
 * Given a starting filePath (process.pwd by default) returns the
 * absolute path to the root of the project directory, which contains
 * the .maka folder.
 */
module.exports.findProjectDirectory = function (filePath) {
  return this.findDirectoryUp({
    predicate: (curpath) => {
      return this.isDirectory(path.join(curpath, '.maka'));
    },
    startPath: filePath || process.cwd()
  });
};

/**
 * Given a starting filePath, returns the absolute path to
 * the app directory of the project. If there is no project
 * it returns false.
 */
module.exports.findAppDirectory = function (filePath) {
  let projectDirectory = this.findProjectDirectory(filePath);
  return projectDirectory ? path.join(projectDirectory, 'app') : false;
};

/**
 * Returns an object with the type and engine given a srcPath.
 * For example, given foo.bar.baz, returns { type: 'bar', engine: 'baz' }
 */
module.exports.engineAndTypeFromfilePath = function ({ filePath }) {
  let re = /\.([A-Za-z0-9.]+)$/g;
  let matches = filePath.match(re);
  matches = matches && matches[0].split('.', 3);

  if (!matches) return { type: undefined, engine: undefined };

  // matches can be an array of n length. I'll assume the last entry is the
  // engine, and the one before that the type. If there's only one entry I'll
  // assume the engine and type are the same. For example, template.js.js is
  // equivalent to template.js
  let engine = matches.pop();
  let type = matches.pop() || engine;

  if (engine)
    engine = engine.replace('.', '');

  if (type)
    type = type.replace('.', '');

  return {
    type: type,
    engine: engine
  };
};

/**
 * If we have a srcPath of foo/bar.js and an engine for js that maps to coffee,
 * then rewrite the path to foo/bar.js.coffee.
 *
 * The schema for templates looks like this:
 *
 * <template-name>.<type>[.<engine>]
 *
 * You should omit the engine in the template file name if it's the same as the
 * type. So instead of mytemplate.js.js you would just create mytemplate.js and
 * it's assumed that the engine is js.
 *
 * The path paramter to this function is automatically adjusted to look for the
 * template file for the configured engine. For example, if your js engine is
 * 'coffee' then a src path of '/path/to/template.js' will be translated to
 * '/path/to/template.js.coffee'.
 *
 */
module.exports.rewriteSourcePathForEngine = function ({ pathParts = [] }) {
  let config = CurrentConfig.get();
  let srcPath = pathParts.join(path.sep);

  let engineAndType = this.engineAndTypeFromfilePath({ filePath: srcPath });
  let fileType = engineAndType.type;

  if (!config || !config.engines || !config.engines[fileType]) {
    return srcPath;
  }

  let engine = config.engines[engineAndType.type];
  let findTypeRe = new RegExp('\\.' + fileType + '\\S*$');

  if (engine === fileType)
    return srcPath.replace(findTypeRe, '.' + fileType);
  else
    return srcPath.replace(findTypeRe, '.' + fileType + '.' + engine);
};

/**
 * Like the function above, but doesn't change the name of the extension.
 */
module.exports.writeSourcePath = function ({ pathParts = [] }) {
  return pathParts.join(path.sep);
};

/**
 * Given a path of ./foo.bar.baz of the schema ./foo.<type>.<engine>, rewrite
 * the destination path to only use the engine extension. For example,
 *
 * foo.css.less would be rewritten to be foo.less.
 */
module.exports.rewriteDestinationPathForEngine = function ({ pathParts = [] , framework = 'meteor' }) {
  let config = CurrentConfig.get();
  let destPath = pathParts.join(path.sep);
  let fileType = this.engineAndTypeFromfilePath({ filePath: destPath }).type;

  // get the engine from config for the given type
  let engine = config.engines[fileType];

  // replace everything after the file type with the new
  // engine extensions
  let replaceTypeWithEngineRe = new RegExp('\\.' + fileType + '\\S*$');

  if (!fileType || !engine)
    return destPath;
  else
    return destPath.replace(replaceTypeWithEngineRe, '.' + engine);
};

/**
 * Given a source file with a name that follows this schema:
 *
 * <template-name>.<type>[.engine]
 *
 * Iff there is an engine defined, make sure this template file is the right one
 * for the given engine. If there is no engine defined, assume the file is okay
 * and return true.
 */
module.exports.isTemplateForEngine = function ({ pathParts = [] , framework = 'meteor' }) {
  let config = CurrentConfig.get();

  if (!config) {
    throw new Error("No configuration so can't determine engines.");
  }

  let srcPath = pathParts.join(path.sep);
  let engineAndType = this.engineAndTypeFromfilePath({ filePath: srcPath });

  // if the file doesn't have an extension return true
  if (!engineAndType.type || !engineAndType.engine)
    return true;

  let configuredEngine = config.engines[engineAndType.type];

  // if we haven't explicitly declared an engine, assume it's okay
  if (!configuredEngine)
    return true;

  // ok we have a configured engine and a file engine so
  // let's see if they match.
  return configuredEngine === engineAndType.engine;
};

/**
 * Returns a path relative to lib/templates, with the source path
 * rewritten to use the appropriate engine. See the rewriteSourcePathForEngine
 * method above.
 */
module.exports.pathFromTemplates = function ({ pathParts = [], framework = 'meteor' }) {
  let srcPath = this.rewriteSourcePathForEngine({ pathParts });
  let filePath = path.join(`lib/templates`, srcPath);
  return path.join(MAKA_COMMAND_PATH, '..', filePath);
};

/**
 * Returns the absolute path to the given filePath relative to the project
 * directory (e.g. my-project/filePath). Returns false if no project
 * directory is found.
 */
module.exports.pathFromProject = function ({ pathParts = [] }) {
  let filePath = pathParts.join(path.sep);
  let projectDirectory = this.findProjectDirectory();
  return projectDirectory ? path.join(projectDirectory, filePath) : false;
};

/**
 * Returns the absolute path to the given filePath relative to the app
 * directory (e.g. my-project/app/filePath). If no app directory is
 * found the function returns false. Rewrites the source path to use
 * the appropriate engine. See the rewriteSourcePathForEngine method above.
 */
module.exports.pathFromApp = function ({ pathParts = [] }) {
  let srcPath = this.rewriteSourcePathForEngine({ pathParts });
  let appDirectory = this.findAppDirectory();
  return appDirectory ? path.join(appDirectory, srcPath) : false;
};

/**
 * Just like above, but doesn't rewrite the extension.
 */
module.exports.pathFromAppWithNoReWrite = function ({ pathParts = [] }) {
  let srcPath = this.writeSourcePath({ pathParts });
  let appDirectory = this.findAppDirectory();
  return appDirectory ? path.join(appDirectory, srcPath) : false;
};


/**
 * Returns true if the filePath is a file.
 */
module.exports.isFile = function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
};

/**
 * Returns true if the dirpath is a directory.
 */
module.exports.isDirectory = function (dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (e) {
    return false;
  }
};

/**
 * Given a file return an array of each line in the file.
 */
module.exports.readFileLines = function (filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  let lines = raw.split(/\r*\n\r*/);

  while (lines.length) {
    let line = lines[lines.length - 1];
    if (line.match(/\S/))
      break;
    lines.pop();
  }

  return lines;
};

/**
 * Returns a compiled template from srcPath using the ejs templating.
 * A data context can be passed as the last paramter. This function
 * let's us get a compiled template result without writing to a file. It
 * can be useful when you want to inject some template content into an
 * existing file, for example.
 */
module.exports.templateContent = function ({ srcPath, context, framework }) {
  let tmplpath = this.pathFromTemplates({ pathParts: [srcPath], framework });
  const ejsFileType = [
    'css',
    'scss',
    'less',
    'html',
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'yaml'
  ];
  if (!this.isFile(tmplpath)) {
    throw new Error("Couldn't find a source template in " + JSON.stringify(tmplpath));
  }

  const tmplPathParts = tmplpath.split('.');

  let contents = fs.readFileSync(tmplpath, 'utf8');

  if (!ejsFileType.includes(tmplPathParts[tmplPathParts.length -1])) {
    return contents.trim();
  }
  return ejs.render(contents, context || {}).trim();
};

/**
 * Compile and write an ejs template from the srcPath to the destPath. The
 * destPath is rewritten for the given engine. For example, if your js
 * engine is 'coffee' then '/path/to/dest.js' will be rewritten to
 * 'path/to/dest.coffee'
 */
module.exports.template = function ({ srcPath, destPath, context, framework }) {
  let renderedTemplate = this.templateContent({ srcPath, context, framework }) + '\n';
  if (!context.noRename) {
    destPath = this.rewriteDestinationPathForEngine({ pathParts: [destPath] });
  }
  let ret = this.createFile({
    filePath: destPath,
    data: renderedTemplate
  });
  return ret;
};

/**
 * Returns an array of all directory entries recursively.
 */
module.exports.directoryEntries = function (srcPath) {
  let self = this;
  let entries = [];

  fs.readdirSync(srcPath);

  fs.readdirSync(srcPath).forEach((entry) => {
    let fullEntryPath = path.join(srcPath, entry);
    entries.push(fullEntryPath);
    if (self.isDirectory(fullEntryPath))
      entries = entries.concat(self.directoryEntries(fullEntryPath));
  });

  return entries;
};

/**
 * Recursively copies a template directory (from the lib/templates directory) to
 * the dest path following these rules:
 *
 *  1.  All folders in the srcPath are copied to destPath, building the folder
 *      hierarchy as needed.
 *  2.  Files matching the current engines (e.g. html/jade, js/coffee,
 *      css/scss/less) are copied. Files not matching any current engines are
 *      ignored.
 *  3.  All files are compiled through ejs with the data context optionally
 *      provided as a last parameter.
 *  4.  ignore accepts an array of strings which will match files with relative
 *      paths to the app folder to ignore.
 */
module.exports.copyTemplateDirectory = function ({ srcPath, destPath, context, ignore, keep, framework }) {
  let self = this;
  let fullSourcePath = this.pathFromTemplates({ pathParts: [srcPath], framework });

  function withoutTemplatePath(fullpath) {
    return fullpath.replace(self.pathFromTemplates({ framework }), '');
  }

  function todestPath(src) {
    return src.replace(fullSourcePath, destPath);
  }

  // first create the destination directory
  if(!self.createDirectory({ dirPath: destPath, opts: context })) {
    this.logError("Unable to create destination directory " + JSON.stringify(destPath));
    return false;
  }

  fs.readdirSync(fullSourcePath).forEach((srcEntryName) => {
    let fullEntryPath = path.join(fullSourcePath, srcEntryName);
    let relsrcPath = withoutTemplatePath(fullEntryPath);
    let destPath = todestPath(fullEntryPath);

    if (ignore.includes(path.join(srcPath, srcEntryName))) {
      return false;
    }

    if (self.isDirectory(fullEntryPath)) {
      // recurse into the directory but we have to remove the
      // templates path prefix. So 'lib/templates/app/both' becomes 'app/both'
      self.copyTemplateDirectory({
        srcPath: relsrcPath,
        destPath,
        context,
        ignore,
        keep,
        framework
      });
    } else if (self.isFile(fullEntryPath) && self.isTemplateForEngine({ pathParts: [fullEntryPath] })) {
      // copy over the file
      self.template({
        srcPath: relsrcPath,
        destPath, 
        context, 
        framework
      });
    } else if (keep.indexOf(path.join(srcPath, srcEntryName)) >= 0 && self.isFile(fullEntryPath)) {
      context.noRename = true;
      self.template({
        srcPath: relsrcPath, destPath, context, framework
      });
      context.noRename = false;
    }
  });

  return true;
};

/**
 * Inject content at the top of a file. If the file 
 * doesn't exist yet, create it.
 */
module.exports.injectAtBeginningOfFile = function ({ filePath, content, opts = {} }) {
  let filContent;

  if(!this.isFile(filePath)) {
    return this.createFile({ 
      filePath,
      data:content
    });
  }
  fileContent = fs.readFileSync(filePath, 'utf8');
  fileContent = content + "\n" + fileContent;
  fs.writeFileSync(filePath, fileContent);
  if (!opts.silent) {
    this.logHeader(`${treeSymbol} updated file ${path.relative(process.cwd(), filePath)}`);
  }
  return true;
}


/**
 * Inject content at the end of the file. If the file
 * doesn't exist yet, create it.
 */
module.exports.injectAtEndOfFile = function ({ filePath, content, opts = {} }) {
  let fileContent;

  if (!this.isFile(filePath)) {
    return this.createFile({
      filePath,
      data: content
    });
  } else {
    fileContent = fs.readFileSync(filePath, 'utf8');
    fileContent = fileContent + '\n' + content;
    fs.writeFileSync(filePath, fileContent);
    if (!opts.silent) {
      this.logHeader(`${treeSymbol} updated file ${path.relative(process.cwd(), filePath)}`);
    }
    return true;
  }
};

/**
 * Inject content at the end of the section which begins with the 'begin'
 * parameter and ends with 'end' parameter. The begin and end parameters
 * should be regular expressions.
 */
module.exports.injectIntoFile = function ({ filePath, content, begin, end }) {
  if (!this.isFile(filePath)) {
    this.logError("No file found to inject content into at path " + JSON.stringify(filePath));
    return false;
  }

  let raw = fs.readFileSync(filePath, 'utf8');

  // matches a beginning, anything in the middle, and the end
  let anything = '[\\s\\S]*';
  let group = function (exp) {
    return '(' + exp + ')';
  };
  let re = new RegExp(
    group(anything) +
    group(begin) +
    group(anything) +
    group(end) +
    group(anything),
    'i'
  );

  // [0:before, 1:begin, 2:middle, 3:end, 4:after]
  let allParts = re.exec(raw);

  if (!allParts)
    throw new Error("injectIntoFile didn't find a match: " + re.source);

  let parts = allParts.slice(1);
  parts.splice(3, 0, content);
  fs.writeFileSync(filePath, parts.join(''));
  this.logHeader(`${treeSymbol} updated file ${path.relative(process.cwd(), filePath)}`);
  return true;
};

/**
 * Inject a string into a file after a line number.
 */
module.exports.injectAfterLineNumber = function ({ filePath, content, lineNumber }) {
  const data = fs.readFileSync(filePath).toString().split("\n");
  data.splice(lineNumber, 0, content);
  const text = data.join('\n');

  fs.writeFileSync(filePath, text);
  return true;
};

module.exports.checkConfigExists = function (env) {
  if (!env || typeof env !== 'string') {
    throw '[-] Environemnt argument provided, but its value is not recognized.';
  }
  let destinationKey = env;
  if(destinationKey.includes('dev') || destinationKey === 'd') {
    destinationKey = 'development';
  } else if (destinationKey.includes('test') || destinationKey === 't') {
    destinationKey = 'testing';
  } else if (destinationKey.includes('sta') || destinationKey === 's') {
    destinationKey = 'staging';
  } else if (destinationKey.includes('pro') || destinationKey === 'p') {
    destinationKey = 'production';
  }

  const configPath = this.pathFromProject({ pathParts: ['config', destinationKey] });

  let configEnv = fs.existsSync(configPath);

  if (!configEnv) throw `[-] No configuration: ${destinationKey}, consider running "maka g:config ${destinationKey}"`;

  return configPath;
};

module.exports.grep = function (string, pattern) {
    const regexPatternToSearch = new RegExp("^.*(" + pattern + ").*$", "mg");
    match = string.match(regexPatternToSearch);
    return match || [];
};
