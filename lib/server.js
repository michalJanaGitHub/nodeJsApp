/*
 * Server-related tasks
 *
 */

// $env:NODE_ENV="staging"; $env:NODE_DEBUG="server"; node index.js
// $env:NODE_ENV="staging"; $env:NODE_DEBUG="server"; nodemon index.js
// $env:NODE_ENV="production"; $env:NODE_DEBUG="server"; node index.js
// $env:NODE_ENV="production"; 


// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

// Instantiate the server module object
let server = {};

// Define the request router
server.router = {
  '': handlers.serveSimpleTemplate,
  'account/create': handlers.serveSimpleTemplate,
  'account/edit': handlers.serveSimpleTemplate,
  'account/deleted': handlers.serveSimpleTemplate,
  'session/create': handlers.serveSimpleTemplate,
  'session/deleted': handlers.serveSimpleTemplate,
  'checks/all': handlers.serveSimpleTemplate,
  'checks/create': handlers.serveSimpleTemplate,
  'checks/edit': handlers.serveSimpleTemplate,
  'ping': handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks,
  'favicon.ico': handlers.favicon,
  'public': handlers.public,
  'examples/error': handlers.exampleError,
  'application': handlers.application
};

// Process the response from the handler
server.processHandlerResponse =
  (res, method, trimmedPath, statusCode, payload, contentType) => {
    // Determine the type of response (fallback to JSON)
    contentType = typeof (contentType) == 'string' ? contentType : 'json';

    // Use the status code returned from the handler, or set the default status code to 200
    statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

    // Return the response parts that are content-type specific
    let payloadString = '';

    const contentTypeMap = {
      "ico": "image/x-icon",
      "favicon": "image/x-icon",
      "html": "text/html",
      "plain": "text/plain",
      "js": "text/javascript",
      "json": "application/json",
      "css": "text/css",
      "png": "image/png",
      "jpg": "image/jpeg",
      "wav": "audio/wav",
      "mp3": "audio/mpeg",
      "svg": "image/svg+xml",
      "pdf": "application/pdf",
      "doc": "application/msword"
    };
    res.setHeader('Content-Type', contentTypeMap[contentType]);

    if (contentType == 'json') {
      payload = typeof (payload) == 'object' ? payload : {};
      payloadString = JSON.stringify(payload);
    } else if (contentType == 'html') {
      payloadString = typeof (payload) == 'string' ? payload : '';
    } else {
      payloadString = typeof (payload) !== 'undefined' ? payload : '';
    }

    // Return the response-parts common to all content-types
    res.writeHead(statusCode);
    res.end(payloadString);

    // If the response is 200, print green, otherwise print red
    if (statusCode == 200) {
      debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
    } else {
      debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
    }
  };

// All the server logic for both the http and https server
// Callback of http/s.createServer
server.unifiedServer = (req, res) => {
  // Parse the url
  let parsedUrl = url.parse(req.url, true);
  // Get the path
  let path = parsedUrl.pathname;
  let trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // Get the query string as an object
  let queryStringObject = parsedUrl.query;
  // Get the HTTP method
  let method = req.method.toLowerCase();
  //Get the headers as an object
  let headers = req.headers;

  // Get the payload,if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  let writeBuffer = (data) => {
    buffer += decoder.write(data);
    console.log(data);
  };
  
  req.on('data', writeBuffer);

  // When request end, process it
  let processRequest = () => {
    buffer += decoder.end();

    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    let pom = server.router[trimmedPath];
    let chosenHandler = typeof (pom) !== 'undefined' ? pom : handlers.notFound;

    // If the request is within the public directory use to the public handler instead
    chosenHandler =
      trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    // Construct the data object to send to the handler
    let data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    // Bulletproof the app so that it is is not taken down by errors
    if (!config.debugMode) {
      try {
        chosenHandler(data, (statusCode, payload, contentType) => {
          server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
        });
      } catch (e) {
        debug(e);
          server.processHandlerResponse(res, method, trimmedPath, 500, { 'Error': 'An unknown error has occurred' }, 'json');
      }
    // In debug mode let the app get down
    } else {
      chosenHandler(data, (statusCode, payload, contentType) => {
        server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
      });      
    }
  };
  req.on('end', processRequest);
};

// Instantiate the HTTPS server
server.httpsOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsOptions, server.unifiedServer);
// Instantiate the HTTP server
server.httpServer = http.createServer(server.unifiedServer);

// Init script
// Start the HTTP and HTTPS server
server.init = function () {
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is running on port ' + config.httpPort);
  });

  // server.httpsServer.listen(config.httpsPort, () => {
  //   console.log('\x1b[35m%s\x1b[0m', 'The HTTPS server is running on port ' + config.httpsPort);
  // });
};


// Export the module
module.exports = server;
