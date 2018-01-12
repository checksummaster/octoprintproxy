var express = require('express');
var httpProxy = require('http-proxy');
var MjpegCamera = require('mjpeg-camera');

var livestream = 'http://192.168.0.162/live';
var octoprint = 'http://localhost:5000/';
var user = 'blablabla';
var password = 'blablabla';
var port = 34234;

var app = express();

var apiProxy = httpProxy.createProxyServer({
    ignorePath: true,
});

var camera = new MjpegCamera({
    url: livestream
});

function checkAuth(req, res, next) {
    var b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    var info = new Buffer(b64auth, 'base64').toString().split(':');
    if (!info[0] || !info[1] || info[0] !== user || info[1] !== password) {
        console.log("login" + info[0] + info[1]);
        res.set('WWW-Authenticate', 'Basic realm="nope"');
        res.status(401).send('access denied.');
    } else {
        next();
    }
}

app.all("/*", checkAuth,function (req, res,next) {
    //console.log(req.url);
    if (req.url.startsWith("/camera1")) {
        apiProxy.web(req, res, {
            target: livestream
        });
    } else if (req.url.startsWith("/jpg1")) {
        camera.getScreenshot(function(err, frame) {
            res.writeHead(200, {
                'Content-Type': 'image/jpg'
            });
            res.end(frame);
        });
    } else  {
        apiProxy.web(req, res, {
            target: octoprint + req.url
        });
    }
});

app.listen(port);