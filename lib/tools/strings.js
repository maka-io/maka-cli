module.exports = {};

/**
 * Given a string line, get rid of comments and whitespace.
 */
module.exports.trimLine = function trimLine(line) {
  let match = line.match(/^([^#]*)#/);
  if (match)
    line = match[1];
  line = line.replace(/^\s+|\s+$/g, '');
  return line;
};

/**
 * Capitalizes a string.
 */
module.exports.capitalize = function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1, str.length);
};

/**
 * Given a string like fooBar, returns FooBar. Also
 * removes _ - and .
 */
module.exports.classCase = function classCase(str) {
  let self = this;
  // '_' or '-' or '.' or '/'
  let re = /_|-|:|\.|\//;

  if (!str)
    return '';

  return str.split(re).map((word) => {
    return self.capitalize(word);
  }).join('');
};

/*
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 * MIT License
 * https://github.com/sindresorhus/camelcase/blob/master/license
 */

function preserveCamelCase(str) {
    let isLastCharLower = false;

    for (let i = 0; i < str.length; i++) {
        let c = str.charAt(i);

        if (isLastCharLower && (/[a-zA-Z]/).test(c) && c.toUpperCase() === c) {
            str = str.substr(0, i) + '-' + str.substr(i);
            isLastCharLower = false;
            i++;
        } else {
            isLastCharLower = (c.toLowerCase() === c);
        }
    }

    return str;
}

/**
 * From package camelcase
 * Given "camel case" returns "camelCase"
 * Given "camel-case" returns "camelCase"
 * Given "camel_case" returns "camelCase"
 */

module.exports.fullCamelCase = function () {
    let str = [].map.call(arguments, function (str) {
        return str.trim();
    }).filter(function (str) {
        return str.length;
    }).join('-');

    if (!str.length) {
        return '';
    }

    if (str.length === 1) {
        return str.toLowerCase();
    }

    if (!(/[_.\- ]+/).test(str)) {
        if (str === str.toUpperCase()) {
            return str.toLowerCase();
        }

        if (str[0] !== str[0].toLowerCase()) {
            return str[0].toLowerCase() + str.slice(1);
        }

        return str;
    }

    str = preserveCamelCase(str);

    return str
    .replace(/^[_.\- ]+/, '')
    .toLowerCase()
    .replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
        return p1.toUpperCase();
    });
};

/**
 * Given FooBar, returns fooBar.
 */
module.exports.camelCase = function camelCase(str) {
  let output = this.classCase(str);
  output = output.charAt(0).toLowerCase() + output.slice(1, output.length);
  return output;
};

/**
 * Given FooBar or fooBar, returns foo_bar
 */
module.exports.fileCase = function fileCase(str) {
  if (!str)
    return '';

  str = this.classCase(str);

  // then replace capital letters and join the words
  // with a hyphen
  let re = /(?=[A-Z])/
  return str.split(re).map((word) => {
    return word.toLowerCase();
  }).join('-');
};

/**
 * Given FooBar, fooBar, or foo_bar returns foo-bar
 */
module.exports.cssCase = function cssCase(str) {
  return this.fileCase(str).replace(/_/g, '-');
};
