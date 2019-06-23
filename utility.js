const request=require('request');
const fs=require('fs');
const rimraf = require('rimraf');
var download = function (uri, filename, callback) {
    request(uri)
        .pipe(fs.createWriteStream(filename))
        .on('close', callback);
};



var folderdownimg = (req,res,urls) => {
    if (!((urls.length) === 1)) {
        return new Promise((res, rej) => {
            if (!fs.existsSync(`qr/item`)) {
                fs.mkdirSync(`qr/item`);
            }

            if (fs.existsSync(`qr/temp`)) {
                rimraf.sync(`./qr/temp`);
                fs.mkdirSync(`qr/temp`);
            } else {
                fs.mkdirSync(`qr/temp`);
            }


            let list = urls;

            for (var i = list[0] + 1; i <= list[0] + list[1]; i++) {
                download(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASSET${i}`, `qr/item/ASSET${i}.png`,()=>{});
                download(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASSET${i}`, `qr/temp/ASSET${i}.png`,()=>{});
            }
            res("done");
        });
    }
}

module.exports={
    download,folderdownimg
}