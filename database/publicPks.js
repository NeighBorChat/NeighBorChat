class HID {
    constructor() {
        this.Name;
        this.Image;
    }
}

class location {
    constructor() {
        this.sever;
        this.ID;
    }
}

class locations {
    constructor() {
        this.locations = [];
    }
}

class PublicListData {
    constructor() {
        this.HID = new HID();
        this.publicKey = "";
        this.locations = new locations();
    }
}

class PublicList{
    constructor() {
        this.PublicListData = [new PublicListData()];
    }
}