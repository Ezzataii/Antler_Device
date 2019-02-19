const fs = require('fs');
var mkdirp = require('mkdirp');
const register = require("../antler_modules/register")

var AD_DirAbs = "./ads/";
var AD_DirRel = "../ads/"

var titleBarToggle = 1;
var elementAD = document.getElementById("AD");
var AD_Array = [];


var win = require('electron').remote.getCurrentWindow();

window.onload = () => {
    console.log("Loaded Index")
    register.connectServeo();

    //Check if Ad file exists, if not create it
    mkdirp(AD_DirAbs, function (err) {
        if (err) console.error(err)
        else console.log('Ads Folder Created')
    });


    win.setFullScreen(true);
    document.getElementById("titleBar").classList.add("hidden");
    document.body.style.cursor = "none";
}


//Hide Title Bar
document.body.addEventListener("click", function (e) {
    if(titleBarToggle == 1) {
        document.getElementById("titleBar").classList.remove("hidden");
        document.body.style.cursor = "pointer";
        win.setFullScreen(false);
    } else {
        document.getElementById("titleBar").classList.add("hidden");
        document.body.style.cursor = "none";
        win.setFullScreen(true);
    }

    titleBarToggle *= -1;
});




function getADs() {
    fs.readdir(AD_DirAbs, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
    
        AD_Array = [];
        files.forEach(function (file) {
            AD_Array.push(file);
        });
    });
}


var adCounter = 0;
getADs();

setInterval(() => {
    getADs();
    if (AD_Array.length > 0){
        elementAD.style.backgroundImage = "url('" + AD_DirRel + AD_Array[adCounter]  + "')";
    
        adCounter = (adCounter + 1) % AD_Array.length;
    }

}, 5000);





var http = require('http');
var formidable = require("formidable");

http.createServer(function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload.path;
        var newpath = AD_DirAbs + files.filetoupload.name;

        fs.readFile(oldpath, function (err, data) {
            if (err) throw err;
            console.log('File read!');

            // Write the file
            fs.writeFile(newpath, data, function (err) {
                if (err) throw err;
                res.write('File uploaded and moved!');
                res.end();
                console.log('File written!');
            });
        });

        // Delete the file
        fs.unlink(oldpath, function (err) {
            if (err) throw err;
            console.log('File deleted!');
        });
   });
}).listen(8080);