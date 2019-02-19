const fs = require("fs");
const shell = require("shelljs");
const request = require("request");

var metaDataPath = "./metaData.json";
var serverIP = "http://51.77.192.7:8080";
var md;
let serveoIP;



function updateDisplay(json) {
    var display = {
        url: serverIP + "/UPDATE/DISPLAY/" + json.id + "?deviceName='" + json.deviceName + "'&hostName='" + json.hostName + "'&site='" + json.site + "'&ip='" + json.ip + "'&auth=" + json.auth + "&status=" + json.status,
        header: {}
    }

    request.get(display, (err, res, body) => {});
}


function changeMetaData() {
    //TODO
}



function setupDevice(displayData) {
    //metadata
    md = { 
        id: displayData[0], 
        deviceName: displayData[1],
        hostName: displayData[2],
        site: displayData[3],
        ip: null,
        auth: true,
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

    updateDisplay(md);
}


function authenticateID(id) {
    var display = {
        url: serverIP + "/GET/DISPLAY?id=" + id,
        header: {}
    };

    return new Promise((resolve, reject) => {
        request.get(display, (err, res, body) => {
            if(err) {
                resolve(false);
            } else {
                body = JSON.parse(body);
                
                if(body.length == 0) {
                    resolve(false);
                } else if (body.auth == 1) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        })
    }
)}


function connectServeo() {
    var child = shell.exec('ssh -R 80:localhost:8080 serveo.net', {async:true});
    

    return new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
            var urlStart = data.search("https://");
            var urlEnd = data.search(".net") + 4;
            serveoIP = data.slice(urlStart, urlEnd);
    

            var f = require("../metaData.json");
            f.ip = serveoIP;
            updateDisplay(f);

            fstr = JSON.stringify(f, null, 2);


            fs.writeFile(metaDataPath, fstr, (err) => {
                if (!err) {
                    console.log('metaData File Updated!!');
                } else {
                    console.log('Error updating metaData file');  
                }   
            });
 

            resolve(serveoIP);
        })
    });
}


module.exports.setupDevice = setupDevice;
module.exports.authenticateID = authenticateID;
module.exports.connectServeo = connectServeo;
module.exports.serveoIP = serveoIP;