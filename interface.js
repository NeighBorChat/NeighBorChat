//from here draw the UI
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
const MyContact = [
    Contact, Contact, Contact
]