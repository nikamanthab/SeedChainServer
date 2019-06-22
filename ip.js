//Required modules
const ipfsAPI = require('ipfs-api');
const express = require('express');
const fs = require('fs');
const app = express();
const bodyparser = require("body-parser");
//Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {
    protocol: 'https'
})

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

//Reading file from computer
let testFile = fs.readFileSync("download.jpeg");
//Creating buffer for ipfs function to add file to the system
let testBuffer = new Buffer(testFile);

//Addfile router for adding file a local file to the IPFS network without any local node
app.get('/addfile', function (req, res) {

    ipfs.files.add(testBuffer, function (err, file) {
        if (err) {
            console.log(err);
        }
        res.send(file);
    })

})
//Getting the uploaded file via hash code.
app.get('/getfile/:hash', function (req, res) {

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

})

app.listen(4000, () => console.log('App listening on port 4000!'))