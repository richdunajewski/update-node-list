const util = require('util');
const fs = require('fs-extra');
const axios = require('axios');
const moment = require('moment');

const config = {
    url: 'https://mygmrs.network/nodes',
    path: '/var/lib/asterisk/rpt_extnodes_gmrs',
    interval: 10 * 60 * 1000
};

console.log('myGMRS Network Node List Updater');


// check the last modified time of the file in case someone else is updating it,
// no need to double the traffic
let recentlyUpdated = false;

const stat = util.promisify(fs.stat);
stat(config.path)
    .then(function (stats) {
        const modified = moment(stats.mtime);

        console.log('Current time:', moment.utc().format());
        console.log('Last updated:', stats.mtime);

        recentlyUpdated = moment.duration(moment().diff(modified)).as('milliseconds') < config.interval;
    })
    .catch(function (err) {
        if (err.code === 'ENOENT') {
            console.log('File does not exist yet (%s)', config.path);
        } else {
            console.error(err.message);
        }
    })
    .then(function () {
        if (!recentlyUpdated) {
            fetchNodeList();
        } else {
            console.log('File was already recently updated, skipping...');
        }
    });

function fetchNodeList() {
    console.log('Fetching node list (%s)...', config.url);

    axios.get(config.url)
        .then(function (response) {
            fs.writeFile(config.path, response.data)
                .then(function () {
                    console.log('Node list saved successfully');
                })
                .catch(function (err) {
                    console.error(err.message);
                });
        })
        .catch(function (err) {
            console.error(err.message);
        });
}
