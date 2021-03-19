const fs = require('fs');
const path = require('path');
const tools = require('./tools');

/**
 * CurrentConfig is a dynamic constiable that works with one stack (not multiple
 * fibers). You can dynamically set the CurrentConfig value for a given position
 * in the stack by calling CurrentConfig.withValue and passing a value and a
 * callback function. You can get the current value by calling
 * CurrentConfig.get(). Calling CurrentConfig.withConfigFile(func) will read
 * the config file from the .maka/config.json path and deserialize the json
 * into an object.
 *
 */

function defaultValue (val, defaultVal) {
  return typeof val === 'undefined' ? defaultVal : val;
}

/**
 * Validate the config file.
 */
function withValidation (configValue) {
  // as we add more engines for each file type, add them to the supported
  // lists here. Each supported engine must have corresponding template files
  // in each of the template folders. See explanation above on engines.
  let supportedEngines = {
    html: ['html'],
    js: ['js', 'jsx', 'ts', 'tsx'],
    css: ['css', 'less'],
    api: ['rest', 'none'],
    test: ['jasmine', 'mocha', 'none'],
    client: ['blaze', 'react', 'reflux', 'vanilla'],
    graphql: ['apollo'],
    ssr: ['true', 'false'],
    theme: ['material', 'none']
  };

  let engines = configValue.engines = defaultValue(configValue.engines, {});

  if (engines.html && !supportedEngines.html.includes(engines.html))
    throw new Error("Unsported html engine: " + engines.html);

  if (engines.js && !supportedEngines.js.includes(engines.js))
    throw new Error("Unsported js engine: " + engines.js);

  if (engines.css && !supportedEngines.css.includes(engines.css))
    throw new Error("Unsported css engine: " + engines.css);

  if (engines.api && !supportedEngines.api.includes(engines.api))
    throw new Error("Unsupported api engine: " + engines.api);

  if (engines.client && !supportedEngines.client.includes(engines.client))
    throw new Error("Unsupported client engine: " + engines.client);

  if (engines.theme && !supportedEngines.theme.includes(engines.theme))
    throw new Error("Unsupported theme engine: " + engines.theme);

  // set default engines
  engines.html = defaultValue(engines.html, 'html');
  engines.js = defaultValue(engines.js, 'js');
  engines.css = defaultValue(engines.css, 'css');
  engines.client = defaultValue(engines.client, 'react');
  engines.api = defaultValue(engines.api, 'none');
  engines.theme = defaultValue(engines.theme, 'none');

  return configValue;
}

let current = null;
let CurrentConfig = {
  get: function() {
    return current;
  },
  saveInit: function(config, path) {
    let jsonBack = JSON.stringify(config, null, 2);
    fs.writeFileSync(path, jsonBack);
  },

  set: function(key, value) {
    let configFilePath = tools.pathFromProject({ pathParts: ['.maka', 'config.json'] });
    let json = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    json[key] = value;
    let jsonBack = JSON.stringify(json, null, 2);
    fs.writeFileSync(configFilePath, jsonBack);
  },
  setTemplate: function(key, value) {
    let configFilePath = tools.pathFromProject({ pathParts: ['.maka', 'config.json'] });
    let json = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    json['template'][key] = value;
    let jsonBack = JSON.stringify(json, null, 2);
    fs.writeFileSync(configFilePath, jsonBack);
  },

  setEngine: function(key, value) {
    let configFilePath = tools.pathFromProject({ pathParts: ['.maka', 'config.json'] });
    let json = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    json['engine'][key] = value;
    let jsonBack = JSON.stringify(json, null, 2);
    fs.writeFileSync(configFilePath, jsonBack);
  },

  withValue: function (value, func) {
    let saved = current;

    let ret = null;
    try {
      current = withValidation(value);
      ret = func();
    } finally {
      current = saved;
    }

    return ret;
  },

  withConfigFile: function (func) {
    let configFilePath = tools.pathFromProject({ pathParts: ['.maka', 'config.json'] });

    if (!configFilePath) {
      throw new Command.MustBeInProjectError;
    }

    if (!tools.isFile(configFilePath)) {
      throw new Error(path.join('.maka', 'config.json') + " doesn't exist");
    }

    let json = {};
    try {
      json = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    } catch(e) {
      if (e instanceof SyntaxError) {
        throw new Error("Error parsing " + path.join('.maka', 'config.json') + ": " + e.message)
      } else {
        throw e;
      }
    }

    return this.withValue(json, func);
  }
};

module.exports = CurrentConfig;
