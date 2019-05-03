//Initiallising node modules
var express = require("express");                               //REST-API module.
var bodyParser = require("body-parser");                        //parses the body of put/post requests, to make sure the json is properly formatted before operation begins
const adminServices = require('./Functions');
const executeQuery = require("./Functions").executeQuery;       //function that executes a query and res.end()s the results
var con = require('./DBcnfg').con;                              //more about this in ./DBcnfg -- mostly used here to do custom query response handling
var fs = require('fs');                                         //file system module, for image manipulation
// var disk = require('diskusage');                                //module to keep track of the server disk (free and total capacity)

var masterSocket = require('./master-socket');           //more about this in ./master-socket
var parser = require('./parse');
var formidable = require('formidable');


/*
    Token initialization, we need to think of better methods of storing tokens.
*/
const API_ADMIN_TOKEN = "abc";
const API_USER_TOKEN = "abc";
const API_DEVICE_TOKEN = "abc";


var app = express();                                            //initializing the API listener and event handler object.

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

//Setting up server
 var server = app.listen(8080, function () {            //port listening on port 8080
    var port = server.address().port;
    console.log("App now running on port", port);
 });

app.get("/api/list/:table",(req,res)=>{                 
    /*
        Gets list of everything in a table.
        WHERE clause can be added in the query string parameter
        example: /api/list/ADS?id=4
    */
    if (req.query.token != API_ADMIN_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
    }else{
        var query = parser.get(req.params.table,req.query);
        executeQuery(res, query);
    }
});

app.get("/api/device/authenticate/:id",(req,res)=>{             
    /*
        authenticates that a device is in our database given its id.
        either returns an array of 1 element if found, or no elements if not.
    */
    if (req.query.token != API_DEVICE_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
    }else{
        var id = parseInt(req.params.id.toLowerCase(),36)/1423;
        var query = "SELECT * FROM DEVICE WHERE id = "+id;
        // console.log(query);
        executeQuery(res,query);
    }
});

app.get("/api/insert/device",(req,res)=>{                       
    /*
        adds a new unauthenticated device into the database.
    */
    if (req.query.token != API_ADMIN_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
    }else{
        var query = `INSERT INTO DEVICE(auth) VALUES (0)`;
        executeQuery(res,query);
    }
});

app.put("/api/update/:table/duration", (req,res)=>{
    /*
        JSON follows format at the end of the page
        given an array of ad IDs, and a duration as parameters,
        it updates the durations of the given ads (POC ONLY)
    */
    //TODO change the way this works, duration is a variable for the group an ad is displayed with, not the ad itself
    var images = req.body.parameters[req.params.table];
    var duration = req.body.parameters.duration;
    var query = `UPDATE ${req.params.table.toUpperCase()} SET Duration=${duration} WHERE id=${adminServices.decryptKey(images[0])}`; 
    for (var i = 1 ; i < images.length ; i++ ){
        query += ` OR id=${adminServices.decryptKey(images[i])}`; 
    }
    console.log(query);
    con.query(query);
    res.end("updated");
});

app.get("/api/rename/ad/:adid/:newName",(req,res)=>{
    /*
        Renames the ad in the database and the directory,
        call example: /api/rename/ad/4/alildeek.jpg
        => renames the ad who's id is 4 to 'alildeek.jpg'
    */
    var id = adminServices.decryptKey(req.params.adid)
    con.query(`SELECT dir,name FROM ADS WHERE id =${id}`,(err,rows,result)=>{
        var name = rows[0].name;
        fs.rename(__dirname + `/images/${name}`,__dirname + `/images/${req.params.newName}`,function (err){
            if(err) throw err;
        });
        con.query(`UPDATE ADS SET name="${req.params.newName}" WHERE id=${id}`);
        res.end("successfully renamed");  
    });
});

app.put("/api/update/device/:id",(req,res)=>{
    /*
        JSON follows format at the end of the page
        Updates the information of an existing device in the database,
        given an id 'x' and a json with parameters: deviceName-hostName-site,
        it changes the former 3 parameters of the device 'x'
    */
    if (req.query.token != API_DEVICE_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
    }else{
        console.log("I am here");
        var id = adminServices.decryptKey(req.params.id);
        var query = parser.update("DEVICE",req.body.parameters,{"id":id}); 
        executeQuery(res, query);
    }
});

app.post("/api/upload/ad",(req,res)=>{
    /*
        Receives ad in a multipart file upload form.
    */
    console.log("Anything");
    if (req.query.token != API_USER_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
        console.log("Didn't upload");
    }else{
        adminServices.handleForm(req,res);
    }
});


app.post("/api/deploy/ads",(req,res)=>{
    /*
        JSON follows format at the end of the page.
        Given a list of ad ids and device ids in the json parameters,
        it sends the given ads to the given devices through the web socket.
    */
    if (req.query.token != API_ADMIN_TOKEN){
        res.end("Unauthorized Access. Try again with a different token.");
    }else{
        console.log(JSON.stringify(req.body.parameters));
        //if (req.body.authentication == the correct one)
        masterSocket.sendAdsToIds(req.body.parameters);
        res.end("successful");
//        executeQuery(res,query);
    }
});

app.post("/api/deploy/graphs",(req,res)=>{
    masterSocket.sendGraphsToIds(req.body.parameters);
    res.end("Successful");
});

app.post("/api/deploy/psa",(req,res)=>{
    var form = new formidable.IncomingForm();
    console.log("alildeek is here");
    form.parse(req, (err,fields,files)=>{
        console.log("anything");
        var oldpath = files.psafile.path;
        var newpath = `${__dirname}/psas/${files.psafile.name}`;
        console.log(newpath);
        fs.rename(oldpath,newpath,(err)=>{console.log("PSA worked?");});
        var query = parser.insert("PSAS",{'name':files.psafile.name, 'dir':'/psas/'});
        // console.log(query);
        con.query(query, (err,result,rows)=>{
                var json = {
                    psaID: adminServices.encryptKey(result.insertId),
                    psaDuration: fields.duration,
                    devices: fields.devices,
                    text: fields.text,
                    writeMode: fields.writeMode
                };
                console.log(fields.devices);
                masterSocket.sendPsasToIds(json);
                res.end("Successful");
            })
        });
});

app.post("/api/deploy/groups", (req,res)=>{
    var devices = req.body.parameters.devices;
    var groups = req.body.parameters.groups;
    ads = []
    var i = 0;
    var done = false;
    groups.forEach(group => {
        con.query(`SELECT * FROM ADS a JOIN ADGROUPS g ON a.id = g.adid WHERE groupid = ${adminServices.decryptKey(group)}`, (err,rows,result)=>{
            console.log(JSON.stringify(rows));
            if (rows.length > 0){
                rows.forEach(row => {
                    ads.push(adminServices.encryptKey(row.id));
                });
            }
            // ads = ads.concat(rows);
            console.log(JSON.stringify(ads));
            if (i == groups.length) {
                done = true;
            }
        });
    });
    setTimeout(()=>{
        json = {devices: devices, images: ads, writeMode: req.body.parameters.writeMode};
        masterSocket.sendAdsToIds(json);
        console.log(JSON.stringify(json));
        res.end("Successful");
    }, 5000)
});

app.post("/api/delete/device", (req,res) => {
    /*
        JSON follows format at the end of the page
        Given a list of devices in the json parameters,
        it deletes them from the database.
    */
    var devices = req.body.parameters.devices;
    for (var i = 0 ; i  < devices.length ; i++) {
        adminServices.deleteDevice(res,devices[i]);
    }
});

app.post("/api/delete/graph",(req,res)=>{
    var graphs = req.body.parameters.graphs;
    for (var i = 0 ; i < graphs.length ; i++) {
        adminServices.deleteGraph(res,graphs[i]);
    }
    res.end("deleted");
})

app.post("/api/delete/ad", (req,res) => {
    /*
        JSON follows format at the end of the page
        Given a list of ads in the json parameters,
        it deletes them from the database and their directories.
    */
    var ads = req.body.parameters.ads;
    for (var i = 0 ; i  < ads.length ; i++) {
        adminServices.deleteAd(res, ads[i]);
    }
    res.end("delete");
});

app.get("/api/get/storage", (req,res)=>{
    /*
        A nice feature, that returns the free space and the total capacity of the server, useful to know when to expand or delete unused images
    */
    disk.check("/",(err,info)=>{
        var json = {};
        json['free'] = info.free * Math.pow(10,-9);
        json['total'] = info.total * Math.pow(10,-9);
        res.end(JSON.stringify(json));
    });
});


app.get("/download/ad/:adid", (req,res)=>{
    /*
        Given an ad ID, it downloads it (if on a browser)
    */
    var id = parseInt(req.params.adid.toLowerCase(),36)/1423;
    adminServices.selectAndSend(id,res);
});

app.get("/view/ad/:adid",(req,res)=>{
    /*
        Given an ad ID, it serves it, useful for showing ads on the server.
    */
    var id = adminServices.decryptKey(req.params.adid);
    adminServices.viewImage(res,id);
});

app.get("/view/graph/:graphid",(req,res)=>{
    var id = adminServices.decryptKey(req.params.graphid);
    adminServices.viewGraph(res,id);
})

app.get("/view/psa/:psaid",(req,res)=>{
    var id = adminServices.decryptKey(req.params.psaid);
    adminServices.viewPsa(res,id);
})

app.get("/api/create/:group/:user",(req,res)=>{
executeQuery(res,`INSERT INTO UserGroup(name,userid) VALUES('${req.params.group}',${req.params.user})`);
});

app.post("/api/add/group",(req,res)=>{
    var ads = req.body.parameters.ads;
    con.query(`INSERT INTO USERGROUP(name,userid) VALUES('${req.body.parameters.group}',${req.query.userid})`,(err,rows,result)=>{
        con.query(`SELECT groupid FROM USERGROUP WHERE name='${req.body.parameters.group}'`, (err,rows,result)=>{
            console.log(rows[0]);
            var id = rows[0].groupid;
            for (var i = 0 ; i < ads.length ; i++) {
                executeQuery(res,`INSERT INTO ADGROUPS VALUES(${id},${adminServices.decryptKey(ads[i])})`);
            }
        });
    })
});

app.get("/api/get/ads",(req,res)=>{
    /*
        get all the ads of in a group given the groupID
    */
    adminServices.executeQuery(res,`SELECT * FROM ADS a JOIN ADGROUPS g ON g.adid=a.id WHERE g.groupid='${adminServices.decryptKey(req.query.groupid)}'`);
});

app.get("/api/get/groups",(req,res)=>{
    /*
		get all groups belonging to a user.
    */
    adminServices.executeQuery(res,`SELECT groupid,name FROM USERGROUP WHERE userid=${req.query.userid}`);   
});

app.post("/api/upload/csv",(req,res)=>{
    adminServices.handleCSVForm(req,res);
});

app.post("/api/deploy/groups/:groupid",(req,res)=>{
    var devices = req.body.parameters.devices;
    con.query(`SELECT adid FROM ADGROUPS WHERE groupid=${req.params.groupid}`,(err,rows,result)=>{
        var ads = [];
        rows.forEach(ad => {
            ads.push(ad.adid);
        });
        sendToIds({devices:devices,images:ads});
        res.end("alildeek bil mexic");
    });
});

app.get("/view/default/ad",(req,res)=>{
    res.sendFile(__dirname+"/images/default.png");
})

/*

JSON FORMAT FOR PUT AND POST REQUESTS:

{
    "parameters":(your data here)
    "authentication": (your authentication code here)
}


*/
