const server = require('./server');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = require('node-fetch');

const port = 80;

function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
  }
function sleep(n) {
    msleep(n*1000);
}

server.addVirtualPath('/rss', (req, res) => {
    fetch(`http://localhost:${port}/feeds.json`).then((feedUrls) => {
        feedUrls.text().then((data) => {
            let counter = 0;
            let urls = JSON.parse(data).urls;
            Promise.all(urls.map(u => {
                try {
                    var url = new URL(u);
                }
                catch (e) {
                    console.error('URL invalid', u);
                    return;
                }
                return fetch(url)
                    .then(rssRes => rssRes.text())
                    .then((xmlTxt) => {
                            let frag = "";
                            /* Parse the RSS Feed and display the content */
                            try {
                                let doc = new JSDOM(xmlTxt, { contentType: "application/xml" }).window.document;
                                let title = doc.querySelector("channel").querySelector("title").innerHTML;
                                let heading = `<a name=${title.split(" ").join("_")}><h1>${title}</h1></a>`;
                                frag += heading;
                                doc.querySelectorAll('item').forEach((item) => {
                                    let itemData = {
                                        title : item.querySelector('title').innerHTML,
                                        link : url.hostname + item.querySelector('link').innerHTML,
                                        description : item.querySelector('description').innerHTML,
                                        pubDate : item.querySelector('pubDate').innerHTML
                                    };
                                    let template = `<div>
                                        <h2>${itemData.title}</h2>
                                        <h3>${url.hostname}</h3>
                                        <a href='${itemData.link}'>Full</a>
                                        <p>${itemData.description}</p>
                                        <p>Pub: ${itemData.pubDate}</p>
                                    </div>`
                                    frag += template;
                                })
                            } catch (e) {
                                console.error('Error in parsing the feed', e);
                            }
                            return frag;
                    }).catch(() => {
                        console.error('Error in fetching the RSS feed');
                        console.log(res);
                        res.status = 500;
                        res.end("Error in fetching RSS feed");
                    });
            })).then(frags => {
                res.setHeader('Content-type', "text/html; charset=UTF-8");
                let fullPage = `<html>
                                    <head>
                                        <link rel="stylesheet" type="text/css" href="/style-rss.css">
                                    </head>
                                    ${frags.join("\r\n")}
                                </html>`;
                res.end(fullPage);
            });
        });
    }).catch((e) => {
        console.error('Error in fetching the URLs json', e);
        res.status = 500;
        res.end("Error in parsing feed");
    });
});
server.start(port, './root');