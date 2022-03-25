import {content, data, Msg} from './database/MsgPks.js';
import { location, locations, PublicListData, HID } from './database/publicPks.js';

//already import external
// import 'https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js'
// import 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js' 

//PASSPHRASE cho C = "We are the friendly neighbor chat app." 

/*
    Run at startup
        1. check connection, update PL
*/
var peer = null // Own peer object
const HOSTID = "abcabcabcabc" 
const hosts = [{host:'peerjs-server.herokuapp.com', secure:true, port:443}]

//default local password
let PASSPHRASE = "I am A." 


const BITS = 4096
let PRIVATE_KEY = null
let PUBLIC_KEY = null

//should be load from db
const PublicListDatabase = [];

function openConnect(){
    var lastPeerId = null;
    var peerId = null;
    var conn = null;

    //listen
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443});
    // peer = new Peer(null, {
    //     debug: 2
    // });


    peer.on('open', function(id) {
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }

        console.log('My peer ID is: ' + id);
        //update connection into PL
    });

    //if recive ms
    peer.on('connection', function(conn) { 
        conn.on('open', function() {
            // Receive messages
            conn.on('data', function(data) {
                console.log('Received', data);
            });
            
            // Send messages
            conn.send('Hello!');
        });
    });
    peer.on('disconnected', function () {
        // status.innerHTML = "Connection lost. Please reconnect";
        console.log('Connection lost. Please reconnect');

        // Workaround for peer.reconnect deleting previous id
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        // status.innerHTML = "Connection destroyed. Please refresh";
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
    });

    return peerId
}

function connectTo(ID){
    //try to connect to other
    var conn = peer.connect(ID);
    conn.on('open', function() {
        // Receive messages
        conn.on('data', function(data) {
          console.log('Received', data);
        });
      
        // Send messages
        conn.send('Hello!');
    });
}



async function Initialize(){

    /* TEMPORARY CREATE AN ACCOUNT */
    //Get key
    CreateKey();

    /* chose one alive server */




    /* get a random Adrr to start communicate */
    peer = new Peer(hosts[0]);

    let res = await peer.on('open', function(id) {

        console.log('My peer ID is: ' + id);
        
        /* ping if there is any host */
        var host_conn = peer.connect(ID);

        await peer.on('error', function(err) { 
            console.log(err.type)
            if(err.type == 'peer-unavailable'){
                /* server not exist -> set self as host */
                peer = new Peer(HOSTID, hosts[0]);
                await peer.on('open', function(id) {
                    console.log('now Im the server' + id);
                });
            }
        });

        /* add or MODIFY self into list */
        PublicListDatabase.push(SignUp());

        
        /* define EVERYTIME receive msg, act as a host*/
        peer.on('connection', function(conn) {
            /* 
             //Authenticate                      HOST                                  vs                     PEER
                1: Send self HostK key                                             =========>          1: wait for public key from client (no encrypt)  //init
                2: decrypt (HostK) "a random msg"                                  <=========          2: encrypt  "a random msg" (hostK)           
                   encrypt " a random msg " (PeerK)                                =========>             wait for "a random msg" and decrypt
                3: wait for pld                                                    <=========          3: send pld
                   add/edit PL, (send hold msg)                                    =========>
                4: trust, msg mode
                
             
                // if fail disconnect 
            */
            let process = 1;
            let PublicListData;

            /* on connection open*/ 
            conn.on('open', function() {

                /* EVERYTIME Receive messages */
                conn.on('data', function(data) {
                    if(process == 1){
                        conn.send(PUBLIC_KEY);
                        process = 2;
                    }
                    /* wait PubK from client*/
                    if(process == 2){
                        /* decript the msg */
                        const msg = new Msg(data);
                        
                        msg.decript(PRIVATE_KEY); 

                        msg.encript(msg.targetPublicKey); 

                        conn.send(msg);
                        process = 3;
                        /*if sucess add pair to PublicListData*/
                    }

                    if(process == 3){
                        // if this is other .. add into list ? or give the list ????
                        const msg = new Msg(data);

                        msg.decript(PRIVATE_KEY); 

                        const pld = new PublicListData(msg.data.content.data);
                        
                        PublicListDatabase.push(pld);

                        console.log('authenticate success', data);

                        /* send all data from HoldMsg */

                        process = 4;
                    }
                    
                    /* process the msg */
                    if(process == 4){
                        const msg = new Msg(data);
                    
                        //if send to me then:

                        // msg.decript(PRIVATE_KEY); 

                        //if not => push to HoldMsg
                    }



                    console.log('Received', data);

                });
            
                // Send messages
                // conn.send('Hello!');

            });

            conn.on('close', function() {

            });
        });

        
        /* connect to other in PL */
        PublicListData.forEach(element => {
            
        });

        /* is not host -> request PL from other */
        return peer.id;
        //update connection into PL
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

function SendMsg(){
    
}



let openRequest = null


function CreateKey() {
    //save into cache
    PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    PUBLIC_KEY = cryptico.publicKeyString(PRIVATE_KEY)
}

function SignUp() {
    let name = window.prompt("What is your name?")
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    // let name = "A"
    let image = "..."

    let pld = new PublicListData()
    let listLoc = new locations()

    let loc = new location()
    loc.server = hosts[0].host;
    loc.id = peer.id;
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

