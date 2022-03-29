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
const MyContacts = []

const UiContacts = document.querySelector('#contacts-list')

function addPLToUi() {
    const ouput = ` 
    <div class="list-group-item py-1 text-dark" aria-current="true">
        <div class="d-flex w-100 align-items-center">
        <div class="mr-1 mr-md-4">
            <img src="" alt="" style="width: 50px; height: 50px; border-radius: 50%;">  
        </div>
        <div>
            <strong class="mb-1 mb-md-0 d-block">Name</strong>
            <small>Lorem ipsum, dolor sit amet consectetur</small>
        </div>
        </div>
    </div>`
    
}