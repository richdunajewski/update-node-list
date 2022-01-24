const util = require('util');
const fs = require('fs-extra');
const axios = require('axios');
const moment = require('moment');

const config = {
    url: 'https://network.mygmrs.com/nodes',
    path: '/var/lib/asterisk/rpt_extnodes_gmrs',
    // path: './rpt_extnodes_gmrs',
    interval: 10 * 60 * 1000
};

console.log('myGMRS Network Node List Updater');


// check the last modified time of the file in case someone else is updating it,
// no need to double the traffic
let recentlyUpdated = false;

const stat = util.promisify(fs.stat);
stat(config.path)
    .then(stats => {
        const modified = moment(stats.mtime);

        console.log('Current time:', moment.utc().format());
        console.log('Last updated:', stats.mtime);
        console.log('File size:', stats.size);

        recentlyUpdated = moment.duration(moment().diff(modified)).as('milliseconds') < config.interval;

        if (stats.size === 0) {
            console.log('Empty file detected, forcing update');
            recentlyUpdated = false;
        }
    })
    .catch(err => {
        if (err.code === 'ENOENT') {
            console.log('File does not exist yet (%s)', config.path);
        } else {
            console.error(err.message);
        }
    })
    .then(() => {
        if (!recentlyUpdated) {
            fetchNodeList();
        } else {
            console.log('File was already recently updated, skipping...');
        }
    });

function fetchNodeList() {
    console.log('Fetching node list (%s)...', config.url);

    axios.get(config.url)
        .then(response => {
            fs.writeFile(config.path, response.data)
                .then(() => {
                    console.log('Node list saved successfully');
                })
                .catch(err => {
                    console.error(err.message);
                });
        })
        .catch(err => {
            console.error(err.message);
        });
}
