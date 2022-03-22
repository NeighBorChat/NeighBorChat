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


function CreateKey() {
    const PRIVATE_KEY = cryptico.generateRSAKey(PASSPHRASE, BITS);
    const PUBLIC_KEY = cryptico.publicKeyString(privateKey)
}


// let openRequest = null;

// function InitializeIndexDB() {
//     if (!('indexedDB' in window)) {
//         console.log('This browser doesn\'t support IndexedDB')
//         return
//     }
    
//     openRequest = indexedDB.open("store", 1);
// }

// function StoreKeysOnDB(arr) {

//     openRequest.onupgradeneeded = function() {
//         let db = openRequest.result;
//         if (!db.objectStoreNames.contains('Keys')) { // if there's no "books" store
//           db.createObjectStore('Keys', {keyPath: 'type'}); // create it
//         }
//     };

//     openRequest.onsuccess = function() {
//         let db = openRequest.result
//         const txn = db.transaction('Keys', 'readwrite')
//         const store = txn.objectStore('Keys')
//         store.put(arr[0])
//         store.put(arr[1])

//     }

    
// }


// InitializeIndexDB()
// StoreKeysOnDB([{type: "private key", value: JSON.stringify(prk)}, {type: "public key", value: JSON.stringify(puk)}])