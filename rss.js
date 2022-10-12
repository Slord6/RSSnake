const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = require('node-fetch');

let availableColours = [];
let allColours = [
    { fore: "white", back: "green"},
    { fore: "white", back: "navy"},
    { fore: "white", back: "BlueViolet"},
    { fore: "black", back: "lime"},
    { fore: "white", back: "olive"},
    { fore: "black", back: "lime"},
    { fore: "black", back: "aqua"},
    { fore: "black", back: "pink"},
    { fore: "black", back: "violet"},
    { fore: "white", back: "black"},
    { fore: "white", back: "orange"},
    { fore: "white", back: "maroon"},
    { fore: "white", back: "purple"},
    { fore: "white", back: "brown"},
    { fore: "white", back: "grey"}
];

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
function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp": " ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
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
            <a href='${frag.link}'>Full</a>
            <div>${decodeEntities(frag.description)}</div>
            <p>Pub: ${frag.pubDate}</p>
            ${frag.embed}
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
    if(text === null) return "";
    text = text.replace("<![CDATA[", "");
    return text.replace("]]>", "");
}
function extractYoutubeEmbed(element) {
    let media = element.querySelector('media\\:content');
    if(media == null) return "";

    let url = media.getAttribute('url');
    url = url.split('/');
    let videoId = url[url.length - 1].split('?')[0];

    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" loading="lazy" allowfullscreen>
        </iframe>`
}
function elementToFrag(element, url) {
    let link = element.querySelector('link');
    link = (link.innerHTML == null || link.innerHTML == "") ? link.getAttribute("href") : link.innerHTML;
    if(!link.includes("http")) link = "https://" + link;
    let publishElement = getChild(element, ['pubDate', "published"]);
    let descriptionElement = getChild(element, ['content\\:encoded', 'description', 'media\\:description', 'summary']);
    let author = getChild(element, ["author name"]);
    let embed = url.host.includes("youtube.com") ? extractYoutubeEmbed(element) : "";
        
    return {
        title : extractCdata(element.querySelector('title').innerHTML),
        host: url.hostname,
        link : link,
        description : descriptionElement ? extractCdata(descriptionElement.innerHTML) : "",
        pubDate : publishElement.innerHTML,
        author: author ? author.innerHTML : "",
        embed: embed
    };
}


const handleFeedRequest = function(req, res, feedsLocation) {
    fetch(feedsLocation).then((feedUrls) => {
        feedUrls.text().then((data) => {
            let urls;
            try {
                urls = JSON.parse(data).urls;
            } catch(e) {
                console.error('Invalid feeds data', e);
                res.statusCode = 500;
                res.end("Feeds list JSON was incrorectly formatted at " + feedsLocation);
                return;
            }
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
                                console.error('Error in parsing the feed', e, url);
                            }
                            return frags;
                    }).catch((e) => {
                        console.error('Error in fetching the RSS feed', e, url);
                        console.log(url);
                        console.error(e);
                        res.statusCode = 500;
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
        res.statusCode = 500;
        res.end("Error in parsing feed");
    });
}

exports.handleFeedRequest = handleFeedRequest;