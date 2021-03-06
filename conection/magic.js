/*
    THIS FILE PROVIDE SECURELY CONNECTION, AND COMMUNICATION 
*/
import {contentType, Msg} from './database/MsgPks.js';
import { Location, PublicListData, HID } from './database/publicPks.js';


function makeID(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*() ';
    var charactersLength = characters.length;
    
    // self.crypto.getRandomValues(array);
    
    for ( var i = 0; i < length; i++ ) {
        //using math is not safe ❌❌❌❌❌❌❌
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
        //TODO: USE crypto provide by browser
    }
    return result;
}

/****************************** CONSTANT **************************************/
var db = new PouchDB('system');
db.info().then(function (info) {
    console.log(JSON.stringify(info)); //✔️
});

const WAIT_TIME = 5000;

/*
NOTE: SETTING SECTION, if create setting page, allow user to change those parameter,
        TODO we can pass HOST ID, host, from the URL 
        => allow user to create custom app using custom server
*/

// this kind of a public ID to create connection 
const HOST_ID = "qm28y8eqqxeqm2t9" 
const SYS_ID = "thisAppIsSoooooGreat" 

const hosts = [{host:'peerjs-server.herokuapp.com', secure:true, port:443},
               {host:'localhost', path:'/myapp', port:9000}]
const chosenHost = hosts[0];

export function clearDB(){
    db.remove(SYS_ID);
    db.destroy('system');
    db = new PouchDB('system');
}

export function putDB(){
    let data = JSON.stringify(PublicListDatabase)
    db.get(SYS_ID).then(function(doc) {
        doc.PASSPHRASE = PASSPHRASE;
        doc.BITS = BITS;
        doc.MyPLD = MyPLD;
        doc.PublicListDatabase = data;
        doc.holdingData = holdingData;
        return db.put(doc);
      }).catch(function (e) {
        if (e.name === 'conflict') {
            console.log('yeah, the DB get confliccccct as usual ');
        }else{
            //if new msg  
            var doc = {
                    "_id": SYS_ID,
                "PASSPHRASE": PASSPHRASE,
                // "PRIVATE_KEY": PRIVATE_KEY,
                // "PUBLIC_KEY": PUBLIC_KEY,
                "BITS": BITS,
                "MyPLD": MyPLD,
                "PublicListDatabase": data,
                "holdingData": holdingData,
            };
            db.put(doc);
        }
      });

    // var doc = {
    //     "_id": SYS_ID,
    //     "PASSPHRASE": PASSPHRASE,
    //     // "PRIVATE_KEY": PRIVATE_KEY,
    //     // "PUBLIC_KEY": PUBLIC_KEY,
    //     "BITS": BITS,
    //     "MyPLD": MyPLD,
    //     "PublicListDatabase": JSON.stringify(PublicListDatabase),
    //     "holdingData": holdingData,
    //   };
    //   db.put(doc);
}

function loadDB(callback){
    db.get(SYS_ID).then(function (doc) {
            console.log("load data", doc);
            PASSPHRASE = doc.PASSPHRASE;
            // PRIVATE_KEY = doc.PRIVATE_KEY;
            // PUBLIC_KEY = doc.PUBLIC_KEY;
            BITS = doc.BITS;
            MyPLD = doc.MyPLD;
            let json = JSON.parse(doc.PublicListDatabase)
            json.forEach(e => {
                PublicListDatabase.push(e);
            });
            // PublicListDatabase = doc.PublicListDatabase;
            holdingData = doc.holdingData;
            CreateKey();
            sigUpCallBack(MyPLD.HID.name, PUBLIC_KEY);


            let connID = getCorrectLocationID(MyPLD);
            
            /* connect to self in DB  */
            var selfConn = peer.connect(connID);

            /* connect success => a tab already open */
            selfConn.on('open', function(){
                peer.destroy();
                alert("Look like you already open the chat APP on the same browser\
                    and the DB is Shared and we have Tooooo litte time to fix this so \
                    ... please open in Privacy mode or other browser to create new Acc");
                window.close();
            });

            /* ok */
            peer.on('error', function(err) { 
                selfConn.close();
                //✔️
                let loc = new Location()
                loc.server = chosenHost;
                loc.id = peer._id;
                loc.online = true;

                
                MyPLD.locations = [];
                MyPLD.locations.push(loc);
                callback();
            });

        }).catch(function (err) {
            /* incase no DB preload */
            console.log(err);
            CreateKey();

            $('#exampleModal').modal(
                {backdrop: 'static', keyboard: false}
            );
        
            $('#exampleModal').on('click','#paramsSave', function (e) {
                MyPLD = SignUp($('#yourname').val());
                putDB();
                callback();
                $('#exampleModal').modal('hide')
            });


        })
}
/******************************** DATABASE ********************************************/

/* WARNING: SINCE THIS IS THE KEY TO GENERATE KEYs, the same passphrase will create the same pass */
let PASSPHRASE = makeID(20);
// 1024 is decrypt-able nowadays ❌❌❌❌❌❌❌
// please use 4096 in product !!!!
/* Alowe user to seting up to max bit ? TODO: reseach this */
let BITS = 1024
// const BITS = 4096
let PRIVATE_KEY = null
export let PUBLIC_KEY = null
let MyPLD;
// let Name = null
//Address Book 
export const PublicListDatabase = [];
//HOLD DATA LIST
let holdingData = [];


/* VARIABLE */
//DIRECT MSG LIST
const conns = [];
// ????
const peers = [];

let peer = null // Own peer object

function upgradePLDB(pld2){
    console.log("updating DB", pld2);

    // if(pld2.publicKey == PUBLIC_KEY){
    //     console.log("update self ? no way");
    //     return;
    // }        

    const pld1 = PublicListDatabase.find(element => element.publicKey == pld2.publicKey)
    if(typeof(pld1) != 'undefined'){
        console.log("updating with new elm", pld2);
        //update the new input with new addr
        pld1.HID = pld2.HID;
        pld1.locations = pld2.locations;
        putDB();
        return false;
    }
    else{
        console.log("push new elm into DB", pld2);
        PublicListDatabase.push(pld2);
        putDB();
        return true;
    }
}


//set this function to call every time receive new msg
var msgGetCallBackFnc = function(msg, isSender){};

var sigUpCallBack = function(name){};

export function setCallBack(_msgGetCallBackFnc,_sigUpCallBack){
    msgGetCallBackFnc = _msgGetCallBackFnc;
    sigUpCallBack = _sigUpCallBack;
}

function processMessenger(conn, data){
    const msg = new Msg();

    msg.create(data);

    //if send to me then:
    if(msg.targetPublicKey == PUBLIC_KEY)
    {

        msg.decrypt(PRIVATE_KEY); 

        if(msg.data.type == contentType.PUBLIC_LIST_REQUEST){
            console.log('sending PL', PublicListDatabase);
            
            let newMsg = new Msg()
            newMsg.data.type = contentType.PUBLIC_LIST;
            newMsg.data.content = PublicListDatabase;
            newMsg.data.from = PUBLIC_KEY;
            newMsg.data.to.push(msg.data.from);

            newMsg.targetPublicKey = msg.data.from;
            newMsg.encrypt(newMsg.targetPublicKey);

            conn.send(newMsg)
        }

        if(msg.data.type == contentType.PUBLIC_LIST){
            
            let newPublicListDatabase = msg.data.content; 
            let haveNewConnect = false;
            newPublicListDatabase.forEach(pld2 => {
                if(upgradePLDB(pld2)){
                    haveNewConnect = true;
                };
            });

            if(haveNewConnect)
                connectToOther();

            console.log('get PL', newPublicListDatabase);
        }

        /* if msg from user then  */
        if(msg.data.type == contentType.MSG){
            msgGetCallBackFnc(msg, false, msg.data.from);
            console.log('get msg', msg);
        }

    }
    else {
        holdingData.push(msg);
    }
}
function getCorrectLocationID(pld){
    let tag;
    pld.locations.forEach(loc => {
        console.log(loc.server.host, chosenHost.host);
        if(loc.server.host == chosenHost.host){
            tag = loc.id;
            // return loc.id; //ficl nots wk
        }
    });
    return tag;
}
export function Initialize(){
    
    /* chose one alive server */
    
    console.log("created key");
    
    /* get a random Addr to start LISTENING ✔️ */
    
    peer = new Peer(chosenHost);

    peer.on('open', function(id) {


        console.log('My peer ID is: ' + id);
        
        /* ping if there is any host ✔️ */
        var host_conn = peer.connect(HOST_ID, {
            reliable: true
        });

        console.log(host_conn);

        host_conn.on('open', function(){
            // ✔️
            console.log("host existed");
            
            const WaitHostRespond = setTimeout(function(){
                alert("Host ID exist, but no respond !, probably wrong mesh net ");
                processConnection(false);
            }, WAIT_TIME);

            host_conn.on('data', function (data) {
                console.log("receive from server: ", data);
                clearTimeout(WaitHostRespond);
                host_conn.close();
                processConnection(false);
            });
        });

        // TODO: recover last ID to reduce frequency change AddressBook  => need DB first

        /* DAMN: if conn not work -> peer get error instead*/
        peer.on('error', function(err) { 
            console.log(err.type)
            if(err.type == 'peer-unavailable'){
                /* server not exist -> set self as host */
                peer = new Peer(HOST_ID, chosenHost);
                peer.on('open', function(id) {
                    console.log('now Im the server: ' + id);
                    processConnection(true);
                });
            }
        });

    });
    
}

function connectToOther(){
    /* connect to other in PL */
    console.log(PublicListDatabase);
    PublicListDatabase.forEach(pld => {
        if(pld.publicKey != PUBLIC_KEY){
            
            
            // const location = new Location();
            const location = pld.locations[0];
            
            
            // for(let element of pld.locations){
                //     console.log(element);
                //     if(element.server == chosenHost.host){
                    //         location = element;
                    //         break;
                    //     }
                    // }; 
                    
                    let continueConn = true;
                    conns.forEach(conn => {
                        if(conn.peer == location.id){
                            console.log(conn.peer, location.id);
                            continueConn = false;
                        }
                    });
                    
            if(continueConn){
                console.log("connecting to pld", pld);
                
                //TODO: check if need subPeer to send to other host
                //TODO: POP this connection
                peers.push(new Peer(chosenHost));
                //keep the peers ... to pe*
                let subPeer = peers.slice(-1)[0] 
                
                let TrustProcess = 1;
                let randomMsg = makeID(30);
                
                subPeer.on('open',function(id){

                    // ✔️ alway work
                    console.log('get new client id', id);

                    //✔️
                    console.log("connecting to ", location.id);

                    let conn = subPeer.connect(location.id);

                    // ✔️
                    conn.on('open', function() {
                        console.log('gate open');

                    // Receive messages
                    conn.on('data', function(data) {

                        if(TrustProcess == 1){
                            console.log('Received PK', data);

                            if(pld.publicKey == ""){
                                pld.publicKey = data;
                            }else{
                                if(data != pld.publicKey){
                                    console.log("public key changed ! or wrong format", data);
                                    //TODO: what now ?, roll the PL to find the correct PK => no, if host addr then just ignore this change
                                }
                            }
                            let newMsg = new Msg();
                            newMsg.data.type = contentType.MSG;
                            newMsg.data.content = randomMsg;
                            newMsg.data.from = PUBLIC_KEY;
                            newMsg.data.to.push(pld.publicKey);
                            newMsg.targetPublicKey = pld.publicKey;
                            
                            newMsg.encrypt(newMsg.targetPublicKey);
                            console.log('sending', newMsg);
                            //✔️
                            conn.send(newMsg);
                            TrustProcess = 2;
                            return;
                        }

                        if(TrustProcess == 2){
                            const msg = new Msg();
                            
                            msg.create(data);

                            // ✔️
                            console.log('get raw ',msg);

                            msg.decrypt(PRIVATE_KEY); 

                            if(msg.data.content == randomMsg){
                                TrustProcess = 3;
                                
                                let newMsg = new Msg()
                                newMsg.data.type = contentType.PUBLIC_LIST; //not check for this pl
                                newMsg.data.content = MyPLD;
                                newMsg.data.from = PUBLIC_KEY;
                                newMsg.data.to.push(pld.publicKey);
                                newMsg.targetPublicKey = pld.publicKey;

                                // console.log("connection established ");
                                // console.log("PUBLIC_KEY",PUBLIC_KEY);
                                // console.log("pld.publicKey",pld.publicKey);
                                // console.log("MyPLD",MyPLD);
                                console.log("connection established ");
                                // console.log("connection established ", newMsg);
                                newMsg.encrypt(newMsg.targetPublicKey);
                                
                                conn.send(newMsg);     
                                
                                /* store the connected */
                                conns.push(conn);
                                location.online = true;

                                // requestAddressBook();
                            }else{
                                console.log("what the ... server go wrong ");
                                conn.close();
                            }
                            return;
                        }   

                        if(TrustProcess == 3){
                            /* process the msg */
                            processMessenger(conn, data);
                            return;
                        }
                        });
                    });

                    conn.on('close', function () {
                        console.log("Connection closed");
                        //remove from conn, mark PL as offline 
                        for(let i =0; i < conns.length; i++){
                            if(conns[i].connectionId == conn.connectionId){
                                conns.splice(i,1);
                            }
                        }
                    });


                });
                
                subPeer.on('error', function(err) { 
                    //connection to server dead
                    console.log(err);
                    location.online = false;
                });
            }
        }
    });
}

function processConnection(host){

    /* login when connected */
    loadDB(()=>
    
    /* TODO: convert to promise */
    {
    // PublicListDatabase.push(MyPLD);
    upgradePLDB(MyPLD);

    //temporary add host ID, but not get PK of host yet
    if(!host){
        // PublicListDatabase.push();
        upgradePLDB(hostID())
    }
    
    /* define EVERY TIME receive msg, act as a host ✔️ */
    peer.on('connection', function(conn) {
        /* 
         //Authenticate                      HOST                                  vs                     PEER
            0: get connection                                                  <=========          0: connect to s.o
            1: Send self HostK key                                             =========>          1: wait for public key from client (no encrypt)  //init
            2: decrypt (HostK) "a random msg"                                  <=========          2: encrypt  "a random msg" (hostK)           
               encrypt " a random msg " (PeerK)                                =========>             wait for "a random msg" and decrypt
            3: wait for pld                                                    <=========             send pld
               
            4: trust, msg mode                                                                     3: msg mode
            
            // if fail any => disconnect 
        */
        let TrustProcess = 1;
        let publicListData;

        /* on connection open*/ 
        conn.on('open', function() {
            if(TrustProcess == 1){
                console.log('send PUBLIC_KEY');
                setTimeout(conn.send(PUBLIC_KEY),100);
                TrustProcess = 2;
            }
            /* EVERY TIME Receive messages */
            conn.on('data', function(data) {

                /* wait PubK from client*/
                if(TrustProcess == 2){
                    /* decrypt the msg */
                    const msg = new Msg();

                    // console.log('receive',data);

                    msg.create(data);
                    
                    console.log('get authenticate ',msg);

                    msg.decrypt(PRIVATE_KEY); 

                    console.log('decrypt ',msg);


                    msg.targetPublicKey = msg.data.from;
                    msg.data.to = [];
                    msg.data.to.push(msg.data.from);

                    msg.data.from = PUBLIC_KEY;
                    
                    
                    msg.encrypt(msg.targetPublicKey); 
                    
                    console.log('sending ',msg);
                    conn.send(msg);
                    TrustProcess = 3;
                    /*if success add pair to PublicListData*/
                    return;
                }

                if(TrustProcess == 3){
                    // if this is other .. add into list ? or give the list ????
                    const msg = new Msg();
                
                    msg.create(data);
                    
                    msg.decrypt(PRIVATE_KEY); 
                    
                    //if msg wrong format => err NEED to raise here
                    publicListData = new PublicListData();

                    publicListData.create(msg.data.content);

                    // this is for the loop over conn to send direct msg, since need dedicate address for sending 
                    //      => but it give the wrong addr to other
                    // publicListData.locations.forEach(location => {
                    //     if(location.server.host == chosenHost.host){
                    //         location.id = conn.peer;
                    //     }
                    // });

                    upgradePLDB(publicListData);
                    
                    console.log('authenticate success', msg);
                    console.log("added friend to DB", PublicListDatabase);
                    TrustProcess = 4;
                    
                    /* check if this addr is for sending  */
                    let Reconnect = true;
                    // publicListData.locations.forEach(location => {
                    //     if(location.server.host == chosenHost.host){
                    //         if(location.id == conn.peer)
                    //         {
                    //             //TODO: THIS NEVER WORK
                    //             Reconnect = false;
                    //             /* add conn to conns list  */
                    //             // conns.push(conn);
                    //             console.log("connected to",conn.peer)
                                
                    //         };
                    //     }
                    // });
                    
                    // if(Reconnect){
                    console.log("now I will connect back ");
                    // return;
                    // }

                    
                    /*  check send all DATA from HoldMsg */
                    for(let i = 0; i < holdingData.length; i++){
                        if(holdingData[i].targetPublicKey == publicListData.publicKey){
                            conn.send(holdingData[i]);
                            holdingData.splice(i,1);
                        }
                    }
                    // send a text msg
                    // 
                    // requestAddressBook();
                    
                    connectToOther();
                    // SendMsg(publicListData.publicKey,"Hello, this messenger is totally encrypted, and sending directly from me to you ")
                    return;
                }
                
                /* process the msg */
                if(TrustProcess == 4){
                    processMessenger(conn, data);
                    return;
                }
            });

        });

        /* on close TODO: mark PLD as offline*/ 
        conn.on('close', function() {
            if(TrustProcess == 4){
                console.log(conn.peer, "offline")
                for(let i =0; i < conns.length; i++){
                    if(conns[i].connectionId == conn.connectionId){
                        conns.splice(i,1);
                    }
                }
            }
            else
                console.log('authenticate failed form', conn.peer);
        });


    });

    console.log("setup for host role complete");

    /****** is not host -> request PL from other ********/
    //return peer.id;
    //update connection into PL

    connectToOther();
    });
}

//ask everyone to give new addr
export function requestAddressBook(){

    let connID;
    PublicListDatabase.forEach(pld => {
        
        pld.locations.forEach(location => {
            if(location.server.host == chosenHost.host){
                connID = location.id;
            }
        });


        let newMsg = new Msg();
        newMsg.data.type = contentType.PUBLIC_LIST_REQUEST;
        newMsg.data.content = '';
        newMsg.data.from = PUBLIC_KEY;
        newMsg.data.to.push(pld.publicKey);
        newMsg.targetPublicKey = pld.publicKey;
        newMsg.encrypt(newMsg.targetPublicKey);

        conns.forEach(conn => {
            if(conn.peer == connID){
                conn.send(newMsg)
                console.log("Address request sended to", newMsg);
            }
        });
    });
}

export function SendMsg(TargetPublicKey,msg,direct = true){
    if(typeof (TargetPublicKey) == 'undefined') {
        return
    }

    /* TODO: loop through Keys and send msg */
    let newMsg = new Msg();
    newMsg.data.type = contentType.MSG;
    newMsg.data.content = msg;
    newMsg.data.from = PUBLIC_KEY;
    newMsg.data.to.push(TargetPublicKey);
    newMsg.targetPublicKey = TargetPublicKey;
    

    if(direct){
        /*  loop though the PLD */
        let connID;
        PublicListDatabase.forEach(pld => {
            if(pld.publicKey == TargetPublicKey) {
                console.log("found target");
                pld.locations.forEach(location => {
                    if(location.server.host == chosenHost.host){
                        connID = location.id;
                        console.log("found id", connID);
                    }
                });
            }
        });

        
        
        console.log(conns,connID);
        
        /*process sended message, add to MyContacts arr*/
        

        let fixUnexpectedErr = true;
        conns.forEach(conn => {
            if(conn.peer == connID){

                // if(MyContacts.some(c => {
                //     return c.PKs == TargetPublicKey
                // })) {
                //     pushMsg(newMsg, true)
                // } else {
                //     createNewChat(newMsg, true)
                // }
                msgGetCallBackFnc(newMsg, true, TargetPublicKey);

                newMsg.encrypt(newMsg.targetPublicKey);

                conn.send(newMsg);
                console.log(connID)
                console.log("msg sended", newMsg);
                fixUnexpectedErr = false;
                return true;
            }
        });
        if(fixUnexpectedErr){
            console.log(conns,connID);
            console.log("fail to send msg, probably no direct connect", newMsg);
        }
        

        
        
    }
    else {
        // TODO: Reconnect again 
        return false;
    }

    /* TODO: send to neighbors  */

}

function CreateKey() {
    //TODO: save into cache
    //NOTE: this took a lot of time
    PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    PUBLIC_KEY = cryptico.publicKeyString(PRIVATE_KEY);

    // window.crypto.subtle.generateKey(
    // {
    //     name: "RSA-OAEP",
    //     modulusLength: 4096,
    //     publicExponent: new Uint8Array([1, 0, 1]),
    //     hash: "SHA-256"
    // },
    // true,
    // ["encrypt", "decrypt"]
    // ).then((keyPair) => {

    // PRIVATE_KEY = keyPair.privateKey;
    // PUBLIC_KEY = keyPair.publicKey
    // });
}

function hostID() {
    let name = "Host"
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    // let name = "A"
    let image = "..."

    let pld = new PublicListData()

    let loc = new Location()
    loc.server = chosenHost;
    loc.id = HOST_ID;
    loc.online = true;
    

    let userHID = new HID()
    userHID.name = name
    userHID.image = image

    pld.HID = userHID
    pld.publicKey = ""    
    pld.locations.push(loc)

    return pld
}

function SignUp(_name) {
    
    let name = _name;//window.prompt("What is your name?")
    sigUpCallBack(name, PUBLIC_KEY);
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    // let name = "A"
    let image = "..."

    let pld = new PublicListData()

    let loc = new Location()
    loc.server = chosenHost;
    loc.id = peer._id;
    loc.online = true;
    
    

    let userHID = new HID()
    userHID.name = name
    userHID.image = image

    pld.HID = userHID
    pld.publicKey = PUBLIC_KEY
    pld.locations.push(loc)
    return pld

    // StorePListOnDB([pld])
}


setTimeout(function(){
    Initialize();
},1000);
