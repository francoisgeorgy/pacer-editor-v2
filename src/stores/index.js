import {StateStore} from "./stateStore";
import {MidiStore} from "./midiStore";

export class RootStore {
    constructor() {
        // init order is important
        this.state = new StateStore(this);
        this.midi = new MidiStore(this);
    }
}

export const stores = new RootStore();
