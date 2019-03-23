const fs = require("fs");
const shell = require("shelljs");
const request = require("request");
const $ = require('jquery');

//const token = "JhkFTHJGFvtrT6tR^5uy6tFjTYR^YtgvjtYRgIJHf7i6iuYGvHCRUTIRIGHvc5F7i^utGBFdtrSRYETtfgilUOI&trtdRFCkytY6YGFVnbv==";
const token = "abc";
const serverIP = "http://51.77.192.7:8080";
const metaDataPath = "./metaData.json";

var md;
let serveoIP;




function updateDevice(md) {
  var mdClone = JSON.parse(JSON.stringify(md));
  delete mdClone.id;
  
  $.ajax({
    url: `${serverIP}/api/update/${md.id}?token=${token}`,
    type: 'PUT',
    contentType: "application/json",
    dataType:'json',
    data: 
    JSON.stringify({   
      "Auth-Code": "",
      "parameters": mdClone
    }),
  });
}


function changeMetaData() {
    //TODO
}


function getMD() {
  return require("../metaData.json");
}



function setupDevice(deviceData) {
    //metadata
    md = { 
        id: deviceData[0], 
        deviceName: deviceData[1],
        hostName: deviceData[2],
        site: deviceData[3],
        auth: 1,
        status: 1
    };

    metaDataString = JSON.stringify(md, null, 2);


    fs.writeFile(metaDataPath, metaDataString, (err) => {
        if (!err) {
            console.log('metaData File Created!');
        } else {
            console.log('Error creating metaData file');  
        }
    });

    updateDevice(md);
}


function authenticateID(id) {
    var req = {
        url: serverIP + "/api/device/authenticate/" + id + "?token=" + token,
        header: {}
    };

    return new Promise((resolve, reject) => {
        request.get(req, (err, res, body) => {
            console.log(body);
            if(err) {
                resolve(false);
            } else {
                body = JSON.parse(body);
                
                if(body.length == 0) {
                    resolve(false);
                } else if (body[0].auth == 1) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        })
    }
)}





function onTurnOn() {

}



// function connectServeo() {
//     var child = shell.exec('ssh -R 80:localhost:8080 serveo.net', {async:true});
    

//     return new Promise((resolve, reject) => {
//         child.stdout.on('data', (data) => {
//             var urlStart = data.search("https://");
//             var urlEnd = data.search(".net") + 4;
//             serveoIP = data.slice(urlStart, urlEnd);
    

//             var f = require("../metaData.json");
//             f.ip = serveoIP;
//             updateDevice(f);

//             fstr = JSON.stringify(f, null, 2);


//             fs.writeFile(metaDataPath, fstr, (err) => {
//                 if (!err) {
//                     console.log('metaData File Updated!!');
//                 } else {
//                     console.log('Error updating metaData file');  
//                 }   
//             });
 

//             resolve(serveoIP);
//         })
//     });
//}


module.exports.setupDevice = setupDevice;
module.exports.authenticateID = authenticateID;
module.exports.getMD = getMD;