/*
 * Primary file for API
 *
 */


// To implement:
// process.on('unhandledRejection', (err) => { 
//   console.error(err)
//   process.exit(1)
// })

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');
var cli = require('./lib/cli');

// Declare the app
var app = {};

// // Init function
// app.init = function(callback){

//   // Start the server
//   server.init();

//   // // Start the workers
//   // workers.init();

//   // // Start the CLI, but make sure it starts last
//   // setTimeout(function(){
//   //   cli.init();
//   //   callback();
//   // },50);

// };

// // Self invoking only if required directly
// if(require.main === module){
//   app.init(function(){});
// }


// // Export the app
// module.exports = app;


const http = require('http');

http.createServer(function(request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<H1>Hello World!</H1>');
}).listen(process.env.PORT);
