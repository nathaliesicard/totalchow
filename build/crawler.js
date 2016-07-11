var assert = require('better-assert');
var async = require('async');
var co = require('co');
var stream = require('stream');
var request = require('request');

var File = require('vinyl');



function getRoutes(cb) {
  co(function*() {
    var routes = ['/', '/blog', '/comprar', '/contacto', '/error', '/faq', '/informacion', '/isomaltulosa', '/nosotros', '/nutricion-mexico', '/privacidad', '/recomendaciones-nutricionales', '/terminos', '/google7f5b260696ed6ec5.html'];


    return routes;
  }).then(function(data) {
    cb(null, data);
  }, function(err) {
    console.error('Got error: ', err, err.stack);

    cb(err);
  })
}


function makeRequest(path, cb) {
  console.log('making request to ', 'http://localhost:' + 2500 + path)
  request.get({
    url: 'http://localhost:' + 2500 + path,
    encoding: null
  }, function(err, res) {
    if (err) {
      console.error('Got request error: ', err, ' on page: ', path);
      return cb(err);
    }

    if (path.endsWith('/'))
      path += 'index';

    if (res.headers['content-type'] == 'text/html; charset=utf-8') {
      path += '.html';
    }


    var file = new File({
      cwd: '/',
      base: '/',
      path: path,
      contents: res.body
    });

    cb(null, file);

  });

}


function streamPusher(stream, routes) {
  async.mapLimit(routes, 3, function(route, cb) {

    makeRequest(route, function(err, file) {
      if (err) {
        stream.emit('error', err);
        return cb(err);
      }

      stream.push(file);
      return cb();
    });


  }, function() {
    stream.emit('end');
  });

}



module.exports = function() {
  var s = new stream.Readable({ objectMode: true });
  s._read = function noop() {};


  getRoutes(function(err, routes) {
    if (err) {
      s.emit('error', err);
      return;
    }

    streamPusher(s, routes);
  });

  return s;
};




