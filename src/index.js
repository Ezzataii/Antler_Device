var fs = require("fs");
var mkdirp = require("mkdirp");
var register = require("../antler_modules/register");
var md = register.getMD();
var serverIP = "http://51.77.192.7:8080";

var socket = require("socket.io-client")("http://51.77.192.7:3000", {
  query: "id=" + md.id
});

var AD_DirAbs = "./ads/";
var AD_DirRel = "../ads/"

var titleBarToggle = 1;
var elementAD = document.getElementById("AD");
var AD_Array = [];
var adIndex = 0;
var adPlaying = false;


var win = require("electron").remote.getCurrentWindow();

window.onload = () => {
  console.log("Loaded Index")

  //Check if Ad file exists, if not create it
  mkdirp(AD_DirAbs, function (err) {
    if (err) throw err;
  });


  win.setFullScreen(true);
  document.getElementById("titleBar").classList.add("hidden");
  document.body.style.cursor = "none";



  socket.on("deployToClient", (msg) => {
    fs.writeFile(AD_DirAbs + "images.json", JSON.stringify(msg), (err) => {
      if (err) throw err;
      
      AD_Array = getADs();
      console.log(AD_Array);
    });
  });
}


//Hide Title Bar
document.body.addEventListener("click", function (e) {
  if (titleBarToggle == 1) {
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
  return JSON.parse(fs.readFileSync(AD_DirAbs + "images.json", 'utf8'));
}





var showImage = () => { 
  if(AD_Array.length > 0) {
    adIndex = adIndex % AD_Array.length;
    var adURL = "url(\'" + serverIP + "/view/ad/" + AD_Array[adIndex].id + "\')";
    elementAD.style.backgroundImage = adURL;
    console.log(AD_Array[adIndex]);

    adIndex = ++adIndex % AD_Array.length;
    setTimeout(showImage, AD_Array[adIndex].duration * 1000);
  } else {
    setTimeout(showImage, 1000);
  } 
}

AD_Array = getADs();
if(AD_Array.length > 0) {
  setTimeout(showImage, AD_Array[adIndex].duration * 1000);
} else {
  setTimeout(showImage, 1000);
}




  