const server = require('./server');
const querystring = require('querystring');
const rss = require('./rss');
const fetch = require('node-fetch');
const fs = require('fs');

const config = {
    port: 80
};
const feedsFilePath = "./root/feeds.json";
let feedsUrl;

function resolveSettings() {
    for (let i = 0; i < process.argv.length; i++) {
        if(i <= 1) continue; //ignore node call and index file location
    
        const arg = process.argv[i];
        const info = arg.split(":");
        config[info[0]] = info [1];
    }
    feedsUrl = `http://localhost:${config.port}/feeds.json`;
}

function resolveBody(req, cb) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        cb(body);
    });
}

resolveSettings();

server.addVirtualPath('/rss', (req, res) => {
    let feedsLoc = feedsUrl;
    try{
        let query = querystring.parse(req.url.split('?')[1]);
        console.log(query);
        if(query['feeds']) feedsLoc = query['feeds'];
    } catch {}
    rss.handleFeedRequest(req, res, feedsLoc);
});

server.addVirtualPath('/rss/addFeed', (req, res) => {
    fetch(feedsUrl).then((feedUrls) => {
        feedUrls.text().then((data) => {
            resolveBody(req, (newFeeds) => {
                newFeeds = JSON.parse(newFeeds);
                for (let i = 0; i < newFeeds.urls.length; i++) {
                    const feed = newFeeds.urls[i];
                    try {
                        let url = new URL(feed);
                    }
                    catch {
                        res.statusCode = 422;
                        res.end("Invalid url - " + feed);
                        return;
                    }
                }
                let urlData = JSON.parse(data);
                let merged =  { urls: urlData.urls.concat(newFeeds.urls) };
                fs.writeFileSync(feedsFilePath, JSON.stringify(merged, null, '\t'));
                res.status = 200;
                res.end();
            });
        });
    });
});

server.addVirtualPath('/rss/removeFeed', (req, res) => {
    fetch(feedsUrl).then((feedUrls) => {
        feedUrls.text().then((data) => {
            resolveBody(req, (removalFeeds) => {
                removalFeeds = JSON.parse(removalFeeds);
                let urlData = JSON.parse(data);

                for (let i = 0; i < removalFeeds.urls.length; i++) {
                    const removal = removalFeeds.urls[i];
                    let index = urlData.urls.indexOf(removal);
                    if(index > -1) {
                        urlData.urls.splice(index, 1);
                    }
                }

                fs.writeFileSync(feedsFilePath, JSON.stringify(urlData, null, '\t'));
                res.status = 200;
                res.end();
            });
        });
    });
});

server.start(config.port, './root');