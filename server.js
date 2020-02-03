const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const virtualPaths = [];

const addVirtualPath = (path, handler) => {
    virtualPaths.push({path, handler});
}

const start = (port, rootPath) => {
    port = port || 80;
    rootPath = rootPath || '.';

    const server = http.createServer(function (req, res) {
        console.log(`${req.method} ${req.url}`);

        // parse URL
        const parsedUrl = url.parse(req.url);
        // extract URL path
        let pathname = `${rootPath}${parsedUrl.pathname}`;
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // maps file extention to MIME typere
        const map = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword'
        };

        let validVirtual = virtualPaths.filter((virtPath) => virtPath.path == parsedUrl.pathname);
        if(validVirtual.length > 0) {
            console.log("Handled by virtual path handler");
            validVirtual[0].handler(req, res);
            return;
        }

        const sendFourOFour = (res) => {
            res.statusCode = 404;
            res.end(`File not found!`);
        };

        const sendFile = (path, res) => {
            // read file from file system
            fs.readFile(path, function(err, data){
                if(err){
                    sendFourOFour(res);
                    return;
                } else {
                    // if the file is found, set Content-type and send data
                    res.setHeader('Content-type', map[ext] || 'text/html' );
                    res.end(data);
                }
            });
        };

        fs.exists(pathname, (exist) => {
            if(!exist) {
                fs.exists(pathname + ".html", (exist) => {
                    if(exist) {
                        sendFile(pathname + ".html", res);
                        return;
                    } else {
                        sendFourOFour(res);
                        return;
                    }
                });
            } else {
                // if is a directory search for index file matching the extention
                if (fs.statSync(pathname).isDirectory()) pathname += '/index' + (ext || ".html");
                fs.exists(pathname, (exist) => {
                    if(exist) {
                        sendFile(pathname, res);
                        return;
                    } else {
                        sendFourOFour(res);
                    }
                });
            }
                    
        });

    }).listen(parseInt(port));

    console.log(`Server listening on port ${port}`);
    return server;
}

exports.start = start;
exports.addVirtualPath = addVirtualPath;