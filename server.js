const express = require('express');
const app = express();
const ipfsAPI = require('ipfs-api');
const bodyParser = require('body-parser');
const axios = require('axios');
const request = require('request');
var http = require('http');
var cors = require('cors')
var fs = require('fs');
var execFile = require('child_process').execFile;
var targz = require('targz');
const child_process = require("child_process");

var rimraf = require('rimraf');







const {download,folderdownimg}=require('./utility');
var socketIO=require('socket.io');

var server = http.createServer(app);
var io = socketIO(server);

app.use(cors({credentials: true, origin: 'http://192.168.137.97:3001'}));
var master = {};

const ipfs = ipfsAPI('ipfs.infura.io', '5001', {
    protocol: 'https'
})

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use(express.static(__dirname));

io.on('connection', function (socket) {
    socket.on("idInject",(d)=>{
        if (d in master) {
            delete master[d];
            master[d] = socket;
        }else{
            master[d] = socket;
        }
        console.log(d);
    });

    socket.on('disconnect', function () {
        if (socket.id in master) {
            console.log("Ditching" + socket.id);
            delete master[socket.id];
        }
    });

});


app.post('/generateQr', (req, res) => {

    folderdownimg(req,res,req.body.urls)
        .then(() => {
            let obj = req.body.urls;
            if (!((obj.length) === 1)) {
                let grp = '';
                for (var i = obj[0] + 1; i <= obj[0] + obj[1]; i++) {
                    grp += i;
                }
                res.json({files:fs.readdirSync(__dirname+"/qr/temp")});                
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


app.post("/buyer", async (req, res) => {
    console.log(req.body);
    if(master[req.body.seller]){
        master[req.body.seller].emit("buyer", req.body.buyer);
    }
    var resp=(await axios.get("http://localhost:3000/api/Seller/"+req.body.buyer)).data;
    if("error" in resp){
     res.json({isVerified:false});
    }else{
    res.json({isVerified:true});
    }
});

app.post("/product", async (req, res) => {
    console.log(req.body);
    if(master[req.body.seller]){
        master[req.body.seller].emit("product", req.body.product);
        let arr=(await axios.get("http://localhost:3000/api/Item")).data;
        console.log(arr);
        let surr=arr.filter(x=>x.itemId==req.body.product)[0]
        if(surr==undefined){
            var obj={};
            obj.isVerified=false;
            res.json(obj);
            return ;
        }
        if(surr.sellers[surr.sellers.length-1].match(/#(.+)/)[1]===req.body.seller && !(surr.assetMeta.isGrouped)){
            surr.isVerified=true;
            res.json(surr);
        }else{
            surr.isVerified=true;
            res.json(surr);
        };
    }else{
        res.send("Buyer offline");
    }
   
});



server.listen(5000, () => console.log('server running at 5000'));