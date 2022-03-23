// import {content} from './database/MsgPks.js';
import './database/MsgPks.js';
import './database/publicPks.js';
// import 'https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js'
// import 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'

/*
    Run at startup
        1. check connection, update PL
*/

function Initialize(){

}

function NewMsg(){
    
}

function SendMsg(){
    
}

//passive function
function GetMsg(){
    
}

const PASSPHRASE = "We are the friendly neighbor chat app."; 
const BITS = 1024; 
const PRIVATE_KEY = null, PUBLIC_KEY = null
let openRequest = null;


function CreateKey() {
    const PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    const PUBLIC_KEY = cryptico.publicKeyString(privateKey)
}

function SignUp() {
    let name = window.prompt("What is your name?")
    let image = window.prompt("What is your image address?")
    let hid = new HID(name, image)
}


function CreatePeerID() {
    var peer = new Peer();

    //peeriId is different each time we reload
    peer.on('open', function(id) {
        console.log('My peer ID is: ' + id);
    });
}

async function FetchPublicList() {
    return await fetch('https://api.jsonbin.io/b/623a7ce006182767437d8969/1')
            .then(res => res.json())
            .then(json => json)
}


function InitializeIndexDB() {
    if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB')
        return
    }
    
    openRequest = indexedDB.open("store", 1);
}

function StorePListOnDB(arr) {
    openRequest.onupgradeneeded = function() {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('PublicList')) { // if there's no "pl" store
          db.createObjectStore('PublicList', {keyPath: 'publicKey'}); // create it
        }
    };

    openRequest.onsuccess = function() {
        let db = openRequest.result
        const txn = db.transaction('PublicList', 'readwrite')
        const store = txn.objectStore('PublicList')
        arr.forEach(e => {
            store.add(e)
        });
    }
}

function getPListOnDB() {
    openRequest.onsuccess = function() {
        let db = openRequest.result
        const txn = db.transaction('PublicList', 'readonly')
        const store = txn.objectStore('PublicList')
        let a = store.getAll()
        a.onsuccess = function() {
            console.log(a.result)
            return a.result
        }
    }
}

let pl = await FetchPublicList()
InitializeIndexDB()
StorePListOnDB(pl)
getPListOnDB()

