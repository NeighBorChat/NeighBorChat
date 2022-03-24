// import {content} from './database/MsgPks.js';
import './database/MsgPks.js';
import './database/publicPks.js';
import { location, locations, PublicListData, HID } from './database/publicPks.js';

//already import external
// import 'https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js'
// import 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js' 

//PASSPHRASE cho C = "We are the friendly neighbor chat app." 

/*
    Run at startup
        1. check connection, update PL
*/
var peer = null; // Own peer object

function openConnect(){
    var lastPeerId = null;
    var peerId = null;
    var conn = null;

    //listen
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(null, {
        debug: 2
    });


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

openConnect();


function Initialize(){
}

function NewMsg(){
    
}

function SendMsg(){
    
}

//passive function
function GetMsg(){
    
}

let PASSPHRASE = "I am A." 
const BITS = 1024
let PRIVATE_KEY = null, PUBLIC_KEY = null
let openRequest = null


function CreateKey() {
    PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    PUBLIC_KEY = cryptico.publicKeyString(PRIVATE_KEY)
}

function SignUp() {
    // let name = window.prompt("What is your name?")
    // let image = window.prompt("What is your image address?")
    // PASSPHRASE = window.prompt("What is your password?")
    // let name = "K"
    let name = "C"
    let image = "..."
    PASSPHRASE = "I am A."

    CreateKey()

    let loc = new location()
    loc.server = "1"
    loc.id = CreatePeerID()
    let listLoc = new locations()
    listLoc.locations.push(loc)

    let pld = new PublicListData()

    let userHID = new HID()
    userHID.name = name
    userHID.image = image

    pld.HID = userHID
    pld.publicKey = PUBLIC_KEY
    pld.locations = listLoc

    console.log(pld)
    StorePListOnDB([pld])
}

function CreatePeerID() {
    var peer = new Peer();

    //peeriId is different each time we reload
    peer.on('open', function(id) {
        return id
    });
}

async function FetchPublicList() {
    return await fetch('https://api.jsonbin.io/b/623a7ce006182767437d8969/3')
            .then(res => res.json())
            .then(json => json)
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



InitializeIndexDB()
SignUp()
let pl = await FetchPublicList()
StorePListOnDB(pl)
// console.log(getPListOnDB())

