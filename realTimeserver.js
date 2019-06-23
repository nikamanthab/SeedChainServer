var express = require('express')
var router = express.Router();
var http = require('http');
var axios=require('axios');
var socketIO=require('socket.io');
var server = http.createServer(router);
var io = socketIO(server);
const bodyparser = require('body-parser');
var cors = require('cors')
router.use(cors({credentials: true, origin: 'http://localhost:3001'}));

router.use(bodyparser.json());

var master = {};

io.on('connection', function (socket) {
    console.log(socket.id+" has entered ");
    socket.on("idInject",(d)=>{
        if (d in master) {
            delete master[d];
            master[d] = socket;
        }else{
            master[d] = socket;
        }
    });
   

    socket.on('disconnect', function () {
        if (socket.id in master) {
            console.log("Ditching" + socket.id);
            delete master[socket.id];
        }
    });

});

router.post("/buyer", async (req, res) => {
    master[req.body.seller].emit("buyer", req.body.buyer);
    var resp=(await axios.get("http://localhost:3000/api/Seller/"+req.body.buyer)).data;
    if("error" in resp){
     res.json({isVerified:false});
    }else{
    res.json({isVerified:true});
    }
});

router.post("/product", async (req, res) => {
    master[req.body.seller].emit("product", req.body.product);
    let arr=(await axios.get("http://localhost:3000/api/Item")).data;
    let surr=arr.filter(x=>x.id==req.body.product)[0];
    if(surr.sellers[surr.sellers.length-1].match(/#(.+)/)[1]===req.body.seller && !(surr.assetMeta.isGrouped)){
        surr.isVerified=true;
        res.json(surr);
    }else{
        surr.isVerified=true;
        res.json(surr);
    };
});

module.exports = router;