/*
 * InterfaceLIFT Wallpaper Auto-Downloader
 * https://github.com/stevenbenner/interfacelift-downloader
 *
 * Copyright (c) 2015 Steven Benner (http://stevenbenner.com/).
 * Released under the MIT License.
 */

'use strict';

var PageScraper = require('./pagescraper');
var Downloader = require('./downloader');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var resPaths = require('./respaths.json');

module.exports = {

  process: function(args) {
    var defaultArgs = {
      'resolution': '1920x1080',
      'limit': 0,
      'sort': 'date',
      'help': false
    };

    var argv = minimist(
      args.slice(2), {
        default: defaultArgs
      });
    if (argv._.length === 0) {
      argv._.push(process.cwd());
    }
    argv.path = argv._[0];
    if (argv.help || Object.keys(argv).length > 6) {
      module.exports.help();
      process.exit(0);
    }
    if (!resPaths[argv.resolution]) {
      console.log('"' + argv.resolution + '" is not a known resolution.');
      process.exit(1);
    }

    argv.path = path.resolve(process.cwd(), argv.path);
    if (!fs.existsSync(argv.path)) {
      console.log('The path "' + argv.path + '" does not exist.');
      process.exit(1);
    }

    var limit = parseInt(argv.limit, 10);
    if (isNaN(limit)) {
      console.log('"' + argv.limit + '" is not a valid download limit.');
      process.exit(1);
    } else {
      argv.limit = limit;
    }

    if (argv.sort !== 'ratings' && argv.sort !== 'date') {
      console.log('"' + argv.sort + '" is not a valid sort parameter.');
      process.exit(1);
    }
    module.exports.run(argv.resolution, argv.path, argv.limit, argv.sort);
  },

  run: function(resolution, downloadPath, downloadLimit, downloadSort) {
    var startTime = new Date();
    var ps = new PageScraper(resolution, downloadLimit, downloadSort);
    var existingFiles = 0;

    // run the page scraper
    ps.on('next', function(pageNumber) {
      console.log('Scanning Page ' + pageNumber + '...');
    });
    ps.on('end', function(downloadLinks) {
      var index = downloadLinks.length;
      var elapesdSeconds = (new Date() - startTime) / 1000;
      var dl = new Downloader(downloadLinks, downloadPath, resolution);

      dl.on('start', function() {
        console.log('Starting Download...\n');
      });
      dl.on('exist', function() {
        existingFiles++;
        index--;
      });
      dl.on('save', function(fileName) {
        console.log('[' + index + '] Saved: ' + fileName);
        index--;
      });
      dl.on('fail', function(fileName) {
        console.log('[' + index + '] Failed: ' + fileName);
        index--;
      });
      dl.on('end', function() {
        var elapesdSeconds = (new Date() - startTime) / 1000;
        console.log('Download competed in ' + elapesdSeconds + ' seconds.');
        console.log('Already had ' + existingFiles + ' images.');
      });

      console.log('Scrape completed in ' + elapesdSeconds + ' seconds. Found ' + index + ' images.');
      dl.start();
    });

    console.log('InterfaceLIFT Wallpaper Auto-Downloader\n');
    if (downloadLimit === 0) {
      downloadLimit = '';
    } else {
      downloadLimit = ' ' + downloadLimit;
    }
    console.log([
      'Searching pages for' + downloadLimit + ' images...',
      '(The download will begin after the page scan finishes.)'
    ].join('\n'));
    ps.start();
  },

  help: function() {
    console.log([
      '\nInterfaceLIFT Downloader\n',
      'Usage:',
      '\tnode interfacelift-downloader [options] [path]',
      '\tPath is the location the images should be saved to. Default: current directory\n',
      '\tThe following options are supported:',
      '\t--resolution [resolution] \t\t Resolution is the dimensions of the images you want to search for. Default: 1920x1800',
      '\t--limit [download limit]  \t\t Download limit is the argument that controls how many images are downloaded. Default: 0, i.e. unlimited',
      '\t--sort [date/ratings]      \t\t Sort decides if the images are fetched in an order sorted by date or ratings. Default: date\n',
      'Examples:',
      '\tnode interfacelift-downloader --resolution 2880x1800 --sort ratings',
      '\tDownload all the pictures sorted by rating and with resolution 2880x1800 to the current directory\n',
      '\tnode interfacelift-downloader --limit 5 --sort rating /Users/Pictures',
      '\tDownload the 5 most highly rated pictures with resolution 1920x1080 to the directory /Users/Pictures\n',
    ].join('\n'));
  }

};