/* 
    TODO: this should be concern more
    PLD: data of PL
    PublicList: request the PL from other, this kind of stupid but hey ... this support up to ? people ??? 
    Msg: get the msg
*/

export const contentType = {
    PUBLIC_LIST_REQUEST: 1,
    PUBLIC_LIST: 2,
    MSG: 3
 };

export class data {
    constructor() {
        this.from = ""; //public list
        this.to = []; // public list, future expansion into group
        this.sendTime = Date.now();
        this.type = "";
        this.content;
    }
}

export class Msg {
    constructor() {
        this.targetPublicKey = ""; 
        this.data = new data(); //encripted data
    }
    constructor(obj) {
        obj && Object.assign(this, obj);
    }
    encrypt(key){
        /* encript the content */
    }
    decrypt(PrvKey){
        /* decript the content */
    }
}

 
// export class HoldMsg {
//     constructor() {
//         //new Msg()
//         this.msgs = []; 
//     }
// }

