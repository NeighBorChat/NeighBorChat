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
// var db = new PouchDB('system');
// db.info().then(function (info) {
//     console.log(JSON.stringify(info));
// });

const WAIT_TIME = 5000;

/*
NOTE: SETTING SECTION, if create setting page, allow user to change those parameter,
        TODO we can pass HOST ID, host, from the URL 
        => allow user to create custom app using custom server
*/

// this kind of a public ID to create connection 
const HOST_ID = "qm28y8eqqxeqm2t9" 

const hosts = [{host:'peerjs-server.herokuapp.com', secure:true, port:443},
               {host:'localhost', path:'/myapp', port:9000}]
const chosenHost = hosts[0];



/******************************** DATABASE ********************************************/

/* WARNING: SINCE THIS IS THE KEY TO GENERATE KEYs, the same passphrase will create the same pass */
let PASSPHRASE = makeID(20);
// 1024 is decrypt-able nowadays ❌❌❌❌❌❌❌
// please use 4096 in product !!!!
/* Alowe user to seting up to max bit ? TODO: reseach this */
const BITS = 1024
// const BITS = 4096
var PRIVATE_KEY = null
var PUBLIC_KEY = null
let MyPLD;
let Name = null
//Address Book 
export const PublicListDatabase = [];
//HOLD DATA LIST
const holdingData = [];


/* VARIABLE */
//DIRECT MSG LIST
const conns = [];
var peer = null // Own peer object

function upgradePLDB(pld2){
    const pld1 = PublicListDatabase.find(element => element.publicKey == pld2.publicKey)
    if(typeof(pld1) != 'undefined'){
        //update the new input with new addr
        pld1.HID = pld2.HID;
        pld1.locations = pld2.locations;
        return false;
    }
    else{
        PublicListDatabase.push(pld2);
        return true;
    }
}

//set this function to call every time receive new msg
export var msgGetCallBackFnc = function(msg){
        /*process received message, add to MyContacts arr*/
        if(MyContacts.some(c => {
            return c.PKs == msg.data.from
        })) {
            pushMsg(msg, false)

        } else {
            createNewChat(msg, false)

        }
    
};

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
        //TODO: PROCESS HERE
        if(msg.data.type == contentType.MSG){
            if(MyContacts.some(c => {
                return c.PKs == msg.data.from
            })) {
                pushMsg(msg, false)
            } else {
                createNewChat(msg, false)
            }

            console.log('get msg', msg);
        }

    }
    else {
        holdingData.push(msg);
    }
}


function Initialize(){

    /* TEMPORARY CREATE AN ACCOUNT */
    // TODO: LOAD Key and data form DB
    
    //Get key
    CreateKey();

    /* chose one alive server */

    console.log("created key");

    /* get a random Addr to start LISTENING ✔️ */

    peer = new Peer(chosenHost);
    
    //✔️
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
                let subPeer = new Peer(chosenHost);
                
                let TrustProcess = 1;
                let randomMsg = makeID(30);
                
                subPeer.on('open',function(id){

                    // ✔️ alway work
                    console.log('get new client id', id);

                    //✔️
                    console.log("connecting to ", location.id);

                    const conn = subPeer.connect(location.id);

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
                        for(let j =0; j < conns.length; j++){
                            if(conns[i].peer == conn.peer){
                                conns.splice(i,1);
                            }
                        }
                    });


                });

                subPeer.on('error', function(err) { 
                    //connection dead
                    console.log(location.ID, "dead");
                    location.online = false;
                });
            }
        }
    });
}


function processConnection(host){

    /* add or MODIFY self into list */
    //TODO: ADD DB into sys
    MyPLD = SignUp();
    PublicListDatabase.push(MyPLD);

    //temporary add host ID, but not get PK of host yet
    if(!host){
        PublicListDatabase.push(hostID());
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
                    SendMsg(publicListData.publicKey,"Hello, this messenger is totally encrypted, and sending directly from me to you ")
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
                for(let j =0; j < conns.length; j++){
                    if(conns[i].peer == conn.peer){
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

    setTimeout(function(){
        connectToOther();
    },1000);
}


setTimeout(function(){
    Initialize();
},Math.random()*100);

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
    if(typeof TargetPublicKey == 'undefined') {
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
            if(pld.publicKey == TargetPublicKey)
                console.log("found target");
                pld.locations.forEach(location => {
                    if(location.server.host == chosenHost.host){
                        connID = location.id;
                        console.log("found id", connID);
                    }
                });
        });

        
        
        console.log(conns,connID);
        
        /*process sended message, add to MyContacts arr*/
        

        let fixUnexpectedErr = true;
        conns.forEach(conn => {
            if(conn.peer == connID){

                if(MyContacts.some(c => {
                    return c.PKs == TargetPublicKey
                })) {
                    pushMsg(newMsg, true)
                } else {
                    createNewChat(newMsg, true)
                }
                newMsg.encrypt(newMsg.targetPublicKey);

                conn.send(newMsg);
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



let openRequest = null


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

function SignUp() {
    let name = window.prompt("What is your name?")
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

// function CreatePeerID() {
//     var peer = new Peer();

//     //peeriId is different each time we reload
//     peer.on('open', function(id) {
//         return id
//     });
// }

/* ----------------------------------------------------------- */
/*
    SUPOSE TO BE interface.js
*/

class preMsg {
    constructor() {
        this.content = "";
        this.time;
        this.from; // Name
    }
}

class Chat {
    constructor() {
        this.Name;
        this.IMAGE;
        this.PKs; // to send msg to 
        this.Msgs = []; //preMsg, sorted by time deliver
    }
}


//store every msg
const MyContacts = []
let IsSearching = false

//elements selector
const UiContacts = document.querySelector('#contacts-list')
const UiMsgList = document.querySelector('#msg-list')
const UIChatTop = document.querySelector('.chat-top')
const UIChatInput = document.querySelector('.chat-bot input')
const UIChatSendBtn = document.querySelector('.chat-bot .btn-send')
const UiSearch = document.querySelector('.contacts-top .search-contact')
const UiBtnSearch = document.querySelector('.btn-search')
const UiModalInput = document.querySelector('#signInInput')
const UiModalBtn = document.querySelector('.sign-in-btn')

//event listener
UiContacts.addEventListener("click", e => {
    // console.log(e.target.closest(".list-group-item"))       
    let target = e.target.closest(".list-group-item") 
    loadMsg(target.dataset.pk)

    let active = UiContacts.querySelector('.active')
    if(active != null) {
        active.classList.remove('active')
    }
    target.classList.add('active')
})

UIChatSendBtn.addEventListener("click", () => {
    if(UIChatInput.length < 1) 
        return

    SendMsg(UIChatTop.dataset.pk, UIChatInput.value, true)
    UIChatInput.value = ''
})

UIChatInput.addEventListener("keyup", e => {
    if (e.keyCode === 13) {
        if(UIChatInput.length < 1) 
        return

        SendMsg(UIChatTop.dataset.pk, UIChatInput.value, true)
        UIChatInput.value = ''
    }
})

UiSearch.addEventListener("focus", () => {
    requestAddressBook()
})

UiBtnSearch.addEventListener("click", () => {
    if(UiSearch.value == '') {
        return
    }

    const value = UiSearch.value
    IsSearching = true

    const filteredList = PublicListDatabase.filter(db => {
        return db.HID.name.toLowerCase().indexOf(value.toLowerCase()) != -1
    })

    console.log('filtered list', filteredList)
    let output = ''
    filteredList.forEach(db => {
        output +=  `
        <div class="list-group-item py-1 text-dark" aria-current="true" data-pk="${db.publicKey}">
            <div class="d-flex w-100 align-items-center">
                <div class="mr-1 mr-md-4">
                    <img src="" alt="" style="width: 50px; height: 50px; border-radius: 50%;">  
                </div>
                <div>
                    <strong class="mb-1 mb-md-0 d-block">${db.HID.name}</strong>
                </div>
            </div>
        </div>`
    })

    UiContacts.innerHTML = output
})

/* if Chat exists in MyContacts, call this function to add new message for the right person*/
function pushMsg(msg, isSender = true) {
    let premsg = new preMsg()

    premsg.content = msg.data.content
    premsg.time = msg.data.sendTime
    premsg.from = msg.targetPublicKey

    let pkForChat = ''
    if(isSender) {
        pkForChat = msg.targetPublicKey
    } else {
        pkForChat = msg.data.from
    }

    MyContacts.forEach(c => {
        if(c.PKs == pkForChat) {
            c.Msgs.push(premsg)
        }
    })

    console.log('new premessage', premsg)
    console.log('MyContacts updated', MyContacts)

    if(pkForChat == UIChatTop.dataset.pk) {
        loadMsg(UIChatTop.dataset.pk)
    }
}


/* if Chat does not exists in MyContacts, call this function to create new chat*/
function createNewChat(msg, isSender) {
    let premsg = new preMsg()

    premsg.content = msg.data.content
    premsg.time = msg.data.sendTime

    const chat = new Chat()

    if(isSender) {
        console.log('msg.targetPublicKey',msg.targetPublicKey)
        chat.PKs = msg.targetPublicKey
        premsg.from = PUBLIC_KEY
    } else {
        console.log('msg.data.from',msg.data.from)
        chat.PKs = msg.data.from
        premsg.from = msg.data.from
    }

    chat.Msgs.push(premsg)

    PublicListDatabase.forEach(data => {
        if(data.publicKey == chat.PKs) {
            chat.Name = data.HID.name
            chat.IMAGE = data.HID.image
        }
    })

    console.log('New chat created', chat)
    MyContacts.push(chat)
    console.log('MyContacts updated', MyContacts)
    addMyContactsToUi()
}

/*called if new chat is created*/
function addMyContactsToUi() {
    let output = ''
    MyContacts.forEach((c, i) => {
        let active = '' 
        if(i == MyContacts.length - 1) {
            active = "active"
        }
        output += 
        `<div class="list-group-item py-1 text-dark ${active}" aria-current="true" data-pk="${c.PKs}">
            <div class="d-flex w-100 align-items-center">
            <div class="mr-1 mr-md-4">
                <img src="" alt="" style="width: 50px; height: 50px; border-radius: 50%;">  
            </div>
            <div>
                <strong class="mb-1 mb-md-0 d-block">${c.Name}</strong>
                <small>Lorem ipsum, dolor sit amet consectetur</small>
            </div>
            </div>
        </div>`
    }) 

    UiContacts.innerHTML = output
}

function loadMsg(pk) {
    if(IsSearching) {
        SendMsg(pk, 'hello, i am your new connection', true)
        IsSearching = false
        UiSearch.value = ''
        return
    }

    let output = ''
    let chat = MyContacts.filter(c => c.PKs == pk)[0]
    chat.Msgs.forEach(msg => {
        let name = ''
        if(chat.PKs != msg.from) {
            name = chat.Name
        } else {
            name = 'Me'
        }

        output += 
        `<div class="list-group-item border-0 py-1 text-dark" aria-current="true">
            <div class="d-flex w-100 justify-content-between">
                <div class="d-flex w-100">
                    <div class="mr-1 mr-md-4">
                        <img src="" alt="" style="width: 30px; height: 30px; border-radius: 50%;">  
                    </div>
                    <div class="msg-content">
                        <strong class="mb-0 d-block">${name}</strong>
                        <small>${msg.content}</small>
                    </div>
                </div>
                <div class="time text-right">
                    <small>${new Date(msg.time).toLocaleString('en-US')}</small>
                </div>
            </div>
        </div>`
    })

    UIChatTop.querySelector('p').innerHTML = chat.Name
    UIChatTop.dataset.pk = pk
    UiMsgList.innerHTML = output
}

function getInputModal() {
    $('#signInModal').modal('show')
    UiModalBtn.addEventListener('click', e => {
        if(UiModalInput.value != '') {
            console.log(UiModalInput.value)
            return UiModalInput.value
        }
    })
}
