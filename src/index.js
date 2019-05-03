var fs = require("fs");
var mkdirp = require("mkdirp");
const geolocation = require('geolocation');

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

  if (!fs.existsSync("./ads/images.json")) {
    fs.writeFileSync("./ads/images.json","[]",(err)=>{});
  }


  win.setFullScreen(true);
  document.getElementById("titleBar").classList.add("hidden");
  document.body.style.cursor = "none";


 
  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);
    var json = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
      id: md.id
    }
    socket.emit("location", (json));
  });

  socket.on("deployToClient", (msg) => {
    console.log(msg);
    if(msg.writeMode == "a") {
      var imageFile = fs.readFileSync(AD_DirAbs + "images.json");
      var images = JSON.parse(imageFile);

      msg.imageArray.forEach(element => {
        images.push(element);
      });
      fs.writeFile(AD_DirAbs + "images.json", JSON.stringify(images), (err) => {
        if (err) throw err;
        AD_Array = getADs();
        console.log(AD_Array);
      });

    } else if(msg.writeMode == "o") {
      fs.writeFile(AD_DirAbs + "images.json", JSON.stringify(msg.imageArray), (err) => {
        if (err) throw err;
        AD_Array = getADs();
        console.log(AD_Array);
      });
    }
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
  if(AD_Array.length > 0 && AD_Array[adIndex % AD_Array.length].duration != null) {
    adIndex = adIndex % AD_Array.length;

    var adURL;
    if(AD_Array[adIndex].type == "ad") {
      adURL = `url(\'${serverIP}/view/ad/${AD_Array[adIndex].id}\')`;
      elementAD.style.backgroundImage = adURL;
      document.getElementById("emergencyText").innerHTML = "";
      document.getElementById("emergencyDiv").style.display = 'none';
    } else if (AD_Array[adIndex].type == "graph") {
      adURL = `url(\'${serverIP}/view/graph/${AD_Array[adIndex].id}\')`;
      elementAD.style.backgroundImage = adURL;
      document.getElementById("emergencyText").innerHTML = "";
      document.getElementById("emergencyDiv").style.display = 'none';
    } else if (AD_Array[adIndex].type == "psa") {
      adURL = `url(\'${serverIP}/view/psa/${AD_Array[adIndex].id}\')`;
      elementAD.style.backgroundImage = adURL;
      document.getElementById("emergencyDiv").style.display = 'block';
      document.getElementById("emergencyText").innerHTML = AD_Array[adIndex].text;
    }
    
    console.log(AD_Array[adIndex].duration, AD_Array.length, adIndex);

    adIndex = ++adIndex % AD_Array.length;
    setTimeout(showImage, AD_Array[adIndex].duration * 1000);
  } else if (AD_Array.length == 0){
      adURL = `url(\'${serverIP}/view/default/ad\')`;
      elementAD.style.backgroundImage = adURL;
      document.getElementById("emergencyText").innerHTML = "";
      document.getElementById("emergencyDiv").style.display = 'none';
      setTimeout(showImage, 1000);
  } else {
      setTimeout(showImage, 1000);
    }
}

AD_Array = getADs();
if(AD_Array.length > 0 && AD_Array[adIndex].duration != null) {
  setTimeout(showImage, AD_Array[adIndex].duration * 1000);
} else {
  setTimeout(showImage, 1000);
}




  