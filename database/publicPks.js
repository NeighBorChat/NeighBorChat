export class HID {
    constructor(name, image) {
        this.Name;
        this.Image;
    }
}

export class location {
    constructor() {
        this.server;
        this.ID;
    }
}

export class locations {
    constructor() {
        this.locations = [];
    }
}

export class PublicListData {
    constructor() {
        this.HID = new HID();
        this.publicKey = "";
        this.locations = new locations();
    }
}

export class PublicList{
    constructor() {
        this.PublicListData = [new PublicListData()];
    }
}

