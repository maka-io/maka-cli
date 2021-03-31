const https = require('https');
const Future = require('fibers/future');

module.exports = {
  post: function(hostname, path, data, headers = {}) {
    let future = new Future;

    let postData = JSON.stringify(data);

    let headersObj = {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    };

    Object.assign(headersObj, headers);

    let options = {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: headersObj 
    };

    let req = https.request(options, (res) => {
      res.on('data', (data) => {
        future.return(JSON.parse(data.toString()));
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.write(postData);
    req.end();

    return future.wait();
  },

  get: function(url, headers) {
    let future = new Future;

    let headersObj = {
      'Content-Type': 'application/json'
    };

    Object.assign(headersObj, headers);

    let options = {
      headers: headersObj
    };

    let req = https.get(url, options, (res) => {
      res.on('data', (data) => {
        future.return(JSON.parse(data.toString()));
      })
    });

    req.on('error', (e) => {
      console.error(e);
    });
    return future.wait();
  }
}
