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
    create(obj) {
        obj && Object.assign(this, obj);
    }
    encrypt(key){
        /* encript the content */
        this.data = cryptico.encrypt(JSON.stringify(this.data), key).cipher;
        // let message =  this.data;
        // let enc = new TextEncoder();
        // let encoded = enc.encode(message);
        // ciphertext = await window.crypto.subtle.encrypt(
        //   {
        //     name: "RSA-OAEP"
        //   },
        //   key,
        //   encoded
        // );
    
        // let buffer = new Uint8Array(ciphertext, 0, 5);
        // this.data = buffer;
    }
    decrypt(PrvKey){
        /* decript the content */
        // console.log('raw',this.data);
        // console.log('decript with ', PrvKey);
        let result = cryptico.decrypt(this.data, PrvKey); 
        // console.log('decrypted',text);
        if(result.status == 'failure'){
            console.log("unable to decrypt msg");
            return false;
        }
        this.data = JSON.parse(result.plaintext); 
        // let decrypted = await window.crypto.subtle.decrypt(
        //     {
        //       name: "RSA-OAEP"
        //     },
        //     key,
        //     ciphertext
        //   );
      
        //   let dec = new TextDecoder();
        //   this.data = dec.decode(decrypted);
    }
}

 
// export class HoldMsg {
//     constructor() {
//         //new Msg()
//         this.msgs = []; 
//     }
// }

