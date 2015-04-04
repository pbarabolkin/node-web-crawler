var argv = require('optimist')
        .usage('Usage: $0 -url [str] -level [num]')
        .demand(['url', 'level'])
        .argv,
    request = require('request'),
    $ = require('cheerio'),
    async = require('async'),
    fs = require('fs');

var curLevel = 0;
var resultUrls = [];
var outputFilename = './tmp/result.json';

var getUrls = function (url, callback) {
    request.get(url, function (err, response, body) {
        if (err) {
            console.error(err);
            return callback(null, []);
        }

        var childUrls = $('a', body).map(function (i, el) {
            return $(el).attr('href');
        });

        return callback(null, childUrls);
    });
};

var getChildUrls = function (urls, callback) {
    async.map(urls, getUrls, function (err, results) {
        if (err) {
            console.error(err);
            return callback(err);
        }

        curLevel++;

        var mergedUrls = [];
        results.forEach(function (result) {
            for (var i = 0; i < result.length; i++) {
                mergedUrls.push(result[i]);
            }
        });

        console.log(mergedUrls.length + ' urls on the ' + curLevel + ' level');
        resultUrls = resultUrls.concat(mergedUrls);
        if (curLevel < argv.level)
            getChildUrls(mergedUrls, callback);
        else
            callback(null, resultUrls);
    });
};

var writeJson = function (urls, callback) {
    var uniqueUrls = urls.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
    });

    console.log('All urls: ' + urls.length);
    console.log('Unique urls: ' + uniqueUrls.length);

    fs.writeFile(outputFilename, JSON.stringify(uniqueUrls, null, 4), function (err) {
        if (err) {
            console.error(err);
            return callback(err);
        }
        else
            callback(null, outputFilename);
    });
};

async.waterfall([
    function (callback) {
        getChildUrls([argv.url], callback);
    },
    function (urls, callback) {
        writeJson(urls, callback);
    }
], function (err, result) {
    if (err)
        return console.error(err);

    console.log("JSON saved to " + result);
});