//const remote = require('electron').remote;

const register = require("../antler_modules/register");

document.getElementById("registerForm").addEventListener("submit", (event) => {
    event.preventDefault();

    var form = document.getElementById("registerForm");
    var temp = form.elements;
    var formData = [];
    for(var i = 0; i < temp.length - 1; i++) {
        formData.push(temp[i].value);
    }
    delete temp;
    


    register.authenticateID(formData[0]).then(res => {
        console.log(res);
        if(res) {
            register.setupDevice(formData);
            require('electron').remote.getCurrentWindow().loadFile("src/index.html");

        } else {
            document.getElementById("errMsg").innerHTML = "ID is invalid";
            form.reset();
        }
    });

})
