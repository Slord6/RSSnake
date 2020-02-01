const server = require('./server');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = require('node-fetch');

const port = 80;

let availableColours = []
let allColours = [
    { fore: "white", back: "green"},
    { fore: "white", back: "navy"},
    { fore: "black", back: "lime"},
    { fore: "black", back: "aqua"},
    { fore: "white", back: "black"},
    { fore: "yellow", back: "black"},
]

function resetColours() {
    availableColours = new Array(...allColours);
}
function getNextColourPair() {
    if(availableColours.length == 0) {
        resetColours();
    }
    return availableColours.pop();
}
function assignColours(items) {
    resetColours();
    items.forEach(frags => {
        let colors = getNextColourPair();
        frags.forEach(frag => frag.colors = colors);
    });
}
function fragsToHtml(items) {
    assignColours(items);
    let frags = items.flat();
    return `<html>
        <head>
            <link rel="stylesheet" type="text/css" href="/style-rss.css">
        </head>
        ${fragsToTemplates(frags).join("\r\n")}
    </html>`;
}
function fragsToTemplates(frags) {
    frags = frags.sort((a, b) => {
        return new Date(b.pubDate) - new Date(a.pubDate);
    });
    let templates = [];
    frags.forEach(frag => {
        let backgroundStyling = `style="background-color:${frag.colors.back}; color: ${frag.colors.fore}"`;
        let template = `<div style="border: ${frag.colors.back} solid">
            <h2 ${backgroundStyling}>${frag.title}</h2>
            <h3>${frag.author || frag.host}</h3>
            <a href='https://${frag.link}'>Full</a>
            <p>${frag.description}</p>
            <p>Pub: ${frag.pubDate}</p>
        </div>`
        templates.push(template);
    });
    return templates;
}
function getChild(element, possibleNames) {
    let res = null;
    possibleNames.forEach(name => {
        if(res !== null) return;
        res = element.querySelector(name);
    });
    return res;
}
function extractCdata(text) {
    // return text;
    text = text.replace("<![CDATA[", "");
    return text.replace("]]>", "");
}
function elementToFrag(element, url) {
    let link = element.querySelector('link');
    link = (link.innerHTML == null || link.innerHTML == "") ? link.getAttribute("href") : url.hostname + link.innerHTML;
    let publishElement = getChild(element, ['pubDate', "published"]);
    let descriptionElement = getChild(element, ['description', 'media\\:description']);
    let author = getChild(element, ["author name"]);
        
    return {
        title : extractCdata(element.querySelector('title').innerHTML),
        host: url.hostname,
        link : link,
        description : extractCdata(descriptionElement.innerHTML),
        pubDate : publishElement.innerHTML,
        author: author ? author.innerHTML : ""
    };
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
                            let frags = [];
                            /* Parse the RSS Feed and display the content */
                            try {
                                let doc = new JSDOM(xmlTxt, { contentType: "application/xml" }).window.document;
                                let elements = doc.querySelectorAll('item');
                                if(elements.length == 0) elements = doc.querySelectorAll('entry');
                                elements.forEach((element) => {
                                    frags.push(elementToFrag(element, url));
                                })
                            } catch (e) {
                                console.error('Error in parsing the feed', e);
                            }
                            return frags;
                    }).catch(() => {
                        console.error('Error in fetching the RSS feed');
                        console.log(res);
                        res.status = 500;
                        res.end("Error in fetching RSS feed");
                    });
            })).then(items => {
                res.setHeader('Content-type', "text/html; charset=UTF-8");
                
                let fullPage = fragsToHtml(items);
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