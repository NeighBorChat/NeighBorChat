export class HID {
    constructor() {
        this.Name;
        this.Image;
    }
}

export class Location {
    constructor() {
        this.server;
        this.id;
        this.online = false;
    }
}

// export class Locations {
//     constructor() {
//         this.locations = [];
//     }
// }

export class PublicListData {
    constructor() {
        this.HID = new HID();
        this.publicKey = "";
        this.locations = [];
    }
    create(obj) {
        obj && Object.assign(this, obj);
    }
}

// export class PublicList{
//     constructor() {
//         // this.PublicListData = [new PublicListData()];
//         this.PublicListData = [];
//     }
// }
