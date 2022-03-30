import {PublicListDatabase, setCallBack, requestAddressBook, SendMsg, PUBLIC_KEY} from "./conection/magic.js"

let msgGetCallBackFnc = function(msg, isSender){
    /*process received message, add to MyContacts arr*/
    if(MyContacts.some(c => {
        return c.PKs == msg.data.from
    })) {
        pushMsg(msg, isSender)

    } else {
        createNewChat(msg, isSender)

    }

};

let sigUpCallBack = (name) => {
    UiUserName.innerHTML = name.substring(0,10)
}

setCallBack(msgGetCallBackFnc,sigUpCallBack);

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
const UiUserName = document.querySelector('.user-name')

//event listener
UiContacts.addEventListener("click", e => {
    // console.log(e.target.closest(".list-group-item"))       
    let target = e.target.closest(".list-group-item") 


    let active = UiContacts.querySelector('.active')
    if(active != null) {
        active.classList.remove('active')
    }

    if(IsSearching) {
        UiContacts.dataset.active = target.dataset.pk

        if(MyContacts.some(c => {
            return c.PKs == target.dataset.pk
        })) {
            addMyContactsToUi()
        } else {
            SendMsg(target.dataset.pk, `hello, i am ${UiUserName.innerHTML} your new connection`, true)
        }
        loadMsg(target.dataset.pk)

        UiSearch.value = ''
        IsSearching = false
        return
    }
    
    UiContacts.dataset.active = target.dataset.pk
    loadMsg(target.dataset.pk)
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

UiBtnSearch.addEventListener("click", searchContacts)

UiSearch.addEventListener("keyup", e => {
    if (e.keyCode === 13) {
        searchContacts()
    }
})

function searchContacts() {
    if(UiSearch.value == '') {
        return
    }

    const value = UiSearch.value
    IsSearching = true

    const filteredList = PublicListDatabase.filter(db => {
        return db.HID.name != null && db.HID.name.toLowerCase().indexOf(value.toLowerCase()) != -1 
    })

    if(filteredList.length < 1)
        return

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
}

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

    console.log(msg);

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
    UiContacts.dataset.active = chat.PKs
    addMyContactsToUi()
    loadMsg(chat.PKs)
}

/*called if new chat is created*/
function addMyContactsToUi() {
    let output = ''
    MyContacts.forEach((c, i) => {
        let active = '' 
        if(c.PKs == UiContacts.dataset.active) {
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

        // if(typeof(chat) == undefined)
        //     SendMsg(pk, 'hello, i am your new connection', true)
        // IsSearching = false
        // UiSearch.value = ''
        // return
    }
    let chat = MyContacts.filter(c => c.PKs == pk)[0]

    let output = ''
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
