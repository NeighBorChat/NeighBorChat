import {contentType, content, data, Msg} from './database/MsgPks.js';
import { Location, Locations, PublicListData, HID } from './database/publicPks.js';

//already import external
// import 'https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js'
// import 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js' 

//PASSPHRASE cho C = "We are the friendly neighbor chat app." 

/*
    Run at startup
        1. check connection, update PL
*/
var peer = null // Own peer object
const HOST_ID = "abcabcabcabc" 
const hosts = [{host:'peerjs-server.herokuapp.com', secure:true, port:443}]
const chosenHost = hosts[0];
let MyPLD ;

//default local password
let PASSPHRASE = "I am A." 


const BITS = 4096
let PRIVATE_KEY = null
let PUBLIC_KEY = null

const PublicListDatabase = [];
const holdingdata = [];
const conns = [];



function processMessenger(conn, data){
    const msg = new Msg(data);

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
            newMsg.data.to.push(msg.from);

            newMsg.targetPublicKey = msg.from;

            newMsg.encrypt(newMsg.targetPublicKey);

            conn.send(newMsg)
        }

        if(msg.data.type == contentType.PUBLIC_LIST){
            /* TODO: process (MERGE) the PL */

            PublicListDatabase = msg.data.content; //this can go totally wrong

            console.log('get PL', );
        }

        /* if msg from user then  */
        //TODO: PROCESS HERE
        if(msg.data.type == contentType.MSG){
            console.log('get msg', msg);
        }

    }
    else {
        holdingdata.push(msg);
    }
}

async function Initialize(){

    /* TEMPORARY CREATE AN ACCOUNT */
    //Get key
    CreateKey();

    /* chose one alive server */


    /* get a random Adrr to start communicate */
    peer = new Peer(chosenHost);
    
    let res = await peer.on('open', function(id) {

        console.log('My peer ID is: ' + id);
        
        /* ping if there is any host */
        let host_conn = peer.connect(ID);
        let host = false;

        await host_conn.on('error', function(err) { 
            console.log(err.type)
            if(err.type == 'peer-unavailable'){
                /* server not exist -> set self as host */
                peer = new Peer(HOST_ID, chosenHost);
                await peer.on('open', function(id) {
                    console.log('now Im the server' + id);
                    host = true;
                });
            }
        });

        /* add or MODIFY self into list */
        //TODO: ADD DB into sys
        MyPLD = SignUp();
        PublicListDatabase.push(MyPLD);

        //temporary add host ID, but not get PK of host yet
        if(!host){
            PublicListDatabase.push(hostID());
        }

        
        /* define EVERY TIME receive msg, act as a host*/
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
                    conn.send(PUBLIC_KEY);
                    TrustProcess = 2;
                }
                /* EVERY TIME Receive messages */
                conn.on('data', function(data) {

                    /* wait PubK from client*/
                    if(TrustProcess == 2){
                        /* decrypt the msg */
                        const msg = new Msg(data);
                        
                        console.log('get authenticate ',msg);

                        msg.decrypt(PRIVATE_KEY); 

                        console.log('decrypt ',msg);

                        msg.encrypt(msg.targetPublicKey); 
                        
                        conn.send(msg);
                        TrustProcess = 3;
                        /*if success add pair to PublicListData*/
                    }

                    if(TrustProcess == 3){
                        // if this is other .. add into list ? or give the list ????
                        const msg = new Msg(data);
                        
                        msg.decrypt(PRIVATE_KEY); 
                        
                        publicListData = new PublicListData(msg.data.content);
                        
                        //TODO: if new guy ? add to 
                        PublicListDatabase.push(publicListData);
                        
                        console.log('authenticate success', msg);

                        TrustProcess = 4;
                    }
                    
                    /* process the msg */
                    if(TrustProcess == 4){
                        processMessenger(conn, data);
                    
                        // msg.decript(PRIVATE_KEY); 
                        
                        //if not => push to HoldMsg
                    }

                    // console.log('Received', data);

                });
            
                // Send messages

                /* TODO: check send all data from HoldMsg */
                if(TrustProcess == 4){
                    for(let i = 0; i < holdingdata.length; i++){
                        if(holdingdata[i].targetPublicKey == publicListData.publicKey){
                            conn.send(holdingdata[i]);
                            holdingdata.splice(i,1);
                        }
                    }

                }

                // conn.send('Hello!');

            });

            conn.on('close', function() {
                if(TrustProcess == 4){
                    console.log(conn.id, "offline")
                }
                else
                    console.log('authenticate failed form', conn.id);
            });
        });


        /* is not host -> request PL from other */
        return peer.id;
        //update connection into PL
    });

    /* connect to other in PL */
    PublicListDatabase.forEach(pld => {
        if(pld.publicKey != PUBLIC_KEY){

            const location = new Location();

            for( let element of element.locations){
                if(element.server == chosenHost.host){
                    location = element;
                    break;
                }
            };

            const conn = peer.connect();

            conn.on('error', function(err) { 
                //connection dead
                location.online = false;
            });

            await conn.on('open', function() {

                let TrustProcess = 1;
                let randomMsg = "jdsaklfaskdfjalkd" //should be random each time connect 

                // Receive messages
                conn.on('data', function(data) {
                    console.log('Received', data);

                    if(TrustProcess == 1){
                        if(pld.publicKey = ''){
                            pld.publicKey = data;
                        }else{
                            if(data != pld.publicKey){
                                console.log("public key changed ! or wrong format", data);
                                //TODO: what now ?, roll the PL to find the correct PK

                            }
                        }
                        let newMsg = new Msg()
                        newMsg.data.type = contentType.MSG;
                        newMsg.data.content = randomMsg;
                        newMsg.data.from = PUBLIC_KEY;
                        newMsg.data.to.push(pld.publicKey);
                        newMsg.targetPublicKey = pld.publicKey;
                        
                        newMsg.encrypt(newMsg.targetPublicKey);

                        conn.send(newMsg);
                        TrustProcess = 2;
                    }

                    if(TrustProcess == 2){
                        const msg = new Msg(data);
                        msg.decrypt(PRIVATE_KEY); 

                        if(msg.data.content == randomMsg){
                            console.log("connection established ");
                            TrustProcess = 3;

                            let newMsg = new Msg()
                            newMsg.data.type = contentType.PUBLIC_LIST; //not check for this pl
                            newMsg.data.content = MyPLD;
                            newMsg.data.from = PUBLIC_KEY;
                            newMsg.data.to.push(pld.publicKey);
                            newMsg.targetPublicKey = pld.publicKey;
                            
                            newMsg.encrypt(newMsg.targetPublicKey);
                            
                            conn.send(newMsg);

                        }else{
                            console.log("what the ... server go wrong ");

                        }
                    }   

                    if(TrustProcess == 3){
                        /* process the msg */
                        processMessenger(conn, data);

                    }

                    /* store the connected  */
                    conns.push(conn);
                    location.online = true;
                });


            });
        }
    });

    /*
    //fetch from db
    let publicList = await FetchPublicList()
    console.log(publicList)

    //create public list data
    let pld = SignUp(res._id)
    console.log(pld)

    //if not exist, post
    if (publicList.some(data => data.publicKey == PUBLIC_KEY)) {
        publicList.forEach(data => {
            if(data.publicKey == PUBLIC_KEY) {
                data.locations.locations[0].id = res._id
            }
        })
    } else {
        publicList.push(pld)
    }

    PutPublicList(publicList)
    */
}

Initialize()


function NewMsg(){
    
}

function SendMsg(publickey){
    /* TODO: loop though the PLD */
}



let openRequest = null


function CreateKey() {
    //save into cache
    PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    PUBLIC_KEY = cryptico.publicKeyString(PRIVATE_KEY)
}

function hostID() {
    let name = "Host"
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    // let name = "A"
    let image = "..."

    let pld = new PublicListData()
    let listLoc = new Locations()

    let loc = new Location()
    loc.server = hosts[0].host;
    loc.id = HOST_ID;
    loc.online = true;
    listLoc.locations.push(loc)
    

    let userHID = new HID()
    userHID.name = name
    userHID.image = image

    pld.HID = userHID
    pld.publicKey = ""
    pld.locations = listLoc
    return pld
}

function SignUp() {
    let name = window.prompt("What is your name?")
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    // let name = "A"
    let image = "..."

    let pld = new PublicListData()
    let listLoc = new Locations()

    let loc = new Location()
    loc.server = hosts[0].host;
    loc.id = peer.id;
    loc.online = true;
    listLoc.locations.push(loc)
    

    let userHID = new HID()
    userHID.name = name
    userHID.image = image

    pld.HID = userHID
    pld.publicKey = PUBLIC_KEY
    pld.locations = listLoc
    return pld

    // StorePListOnDB([pld])
}

// function CreatePeerID() {
//     var peer = new Peer();

//     //peeriId is different each time we reload
//     peer.on('open', function(id) {
//         return id
//     });
// }

async function FetchPublicList() {
    return await fetch('https://api.jsonbin.io/b/623c3858a703bb6749338467', {
        headers: {
            "Secret-Key": "$2b$10$o.Hs.qsROg8p952fcfLrMudQL3LnXC2SknKWajjtnbeY2wazxGJea"
        }
    })
            .then(res => res.json())
            .then(json => json)
}

async function PutPublicList(obj) {
    console.log(JSON.stringify(obj))
    await fetch('https://api.jsonbin.io/b/623c3858a703bb6749338467', {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            "Secret-Key": "$2b$10$o.Hs.qsROg8p952fcfLrMudQL3LnXC2SknKWajjtnbeY2wazxGJea",
        },
        body: JSON.stringify(obj)
    })
    .then(res => res.json())
    .then(json => console.log(json))
}

function InitializeIndexDB() {
    indexedDB.deleteDatabase("store")

    if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB')
        return
    }
    
    openRequest = indexedDB.open("store", 1);

    openRequest.onupgradeneeded = function() {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('PublicList')) { // if there's no "pl" store
            console.log("is updated")
            db.createObjectStore('PublicList', {keyPath: 'publicKey'}); // create it
        }
    };
}

function StorePListOnDB(arr) {
    openRequest.onsuccess = function() {
        let db = openRequest.result
        const txn = db.transaction('PublicList', 'readwrite')
        const store = txn.objectStore('PublicList')
        arr.forEach(e => {
            store.add(e)
        });
        db.close()
    }
}

function getPListOnDB() {
    openRequest.onsuccess = function() {
        let db = openRequest.result
        const txn = db.transaction('PublicList', 'readonly')
        const store = txn.objectStore('PublicList')
        let a = store.getAll()
        a.onsuccess = function() {
            return a.result
        }
        db.close()
    }
}



// InitializeIndexDB()
// SignUp()
// let pl = await FetchPublicList()
// StorePListOnDB(pl)
// console.log(getPListOnDB())

