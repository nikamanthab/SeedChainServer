const express = require('express');
const app = express();
const ipfsAPI = require('ipfs-api');
const bodyParser = require('body-parser');
const axios = require('axios');
const request = require('request');
var fs = require('fs');
var zipFolder = require('zip-folder');
var rimraf = require('rimraf');

const ipfs = ipfsAPI('ipfs.infura.io', '5001', {
    protocol: 'https'
})

app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));
app.use(bodyParser.json({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));

var download = function (uri, filename, callback) {
    request(uri)
        .pipe(fs.createWriteStream(filename))
        .on('close', callback);
};



var folderdownimg = (urls) => {
    if (!((urls.length) === 1)) {
        return new Promise((res, rej) => {
            if (!fs.existsSync(`qr/item`)) {
                fs.mkdirSync(`qr/item`);
            }

            if (fs.existsSync(`qr/temp`)) {
                rimraf.sync(`qr/temp`);
                fs.mkdirSync(`qr/temp`);
            } else {
                fs.mkdirSync(`qr/temp`);
            }


            let list = urls;
            for (var i = list[0] + 1; i <= list[0] + list[1]; i++) {
                download(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASSET${i}`, `qr/item/ASSET${i}.png`, function () {
                    console.log('done');
                });



                download(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASSET${i}`, `qr/temp/ASSET${i}.png`, function () {
                    console.log('done');
                });
            }
            res("done");
        });
    }
}
app.post('/generateQr', (req, res) => {

    folderdownimg(req.body.urls)
        .then(() => {
            let obj = req.body.urls;
            console.log(obj);
            if (!((obj.length) === 1)) {
                let grp = '';
                for (var i = obj[0] + 1; i <= obj[0] + obj[1]; i++) {
                    grp += i;
                }
                zipFolder(`qr/temp`, `qr/item/ASSET${grp}.zip`, function (err) {
                    if (err) {
                        console.log('oh no!', err);
                    } else {
                        res.send('EXCELLENT');
                    }
                });
            } else {
                zipFolder(`qr/user/${obj}`, `qr/user/${obj}.zip`, function (err) {
                    if (err) {
                        console.log('oh no!', err);
                    } else {
                        res.send('EXCELLENT');
                    }
                });

            }
        })
});

app.post('/generateUser', (req, res) => {
    let email = req.body.email;

    if (!fs.existsSync(`qr/user`)) {
        fs.mkdirSync(`qr/user`);
    }
    download(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${email}`, `qr/user/${email}.png`, function () {
        let testFile = fs.readFileSync(`qr/user/${email}.png`);
        let testBuffer = new Buffer(testFile);
        ipfs.files.add(testBuffer, function (err, file) {
            if (err) {
                console.log(err);
            }
            res.send(file[0].hash);
        })
    });
});

app.get('/getImage/:hash', function (req, res) {

    //This hash is returned hash of addFile router.
    console.log(req.params.hash);


    const validCID = req.params.hash;

    ipfs.files.get(validCID, function (err, files) {
        files.forEach((file) => {
            var img = new Buffer(file.content, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
        })
    })

});

app.listen(5000, '127.0.0.1', () => console.log('server running'));