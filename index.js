const server = require('./server');
const rss = require('./rss');
const fetch = require('node-fetch');
const fs = require('fs');

const port = 80;
const feedsFilePath = "./root/feeds.json";
const feedsUrl = `http://localhost:${port}/feeds.json`;

function resolveBody(req, cb) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        cb(body);
    });
}

server.addVirtualPath('/rss', (req, res) => {
    rss.handleFeedRequest(req, res, feedsUrl);
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

server.start(port, './root');