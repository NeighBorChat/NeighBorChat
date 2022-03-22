
export class content {
    constructor() {
        this.type = "";
        /* PublicList, Msg*/
        this.data = "";
    }
}

export class data {
    constructor() {
        this.from = "";
        this.to = [];
        this.content = new content();
    }
}

export class msg {
    constructor() {
        this.targetPublicKey = "";
        this.data = new data();
    }
}

 