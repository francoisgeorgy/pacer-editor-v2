import {StateStore} from "./stateStore";
import {MidiStore} from "./midiStore";

export class RootStore {
    // state: StateStore;
    // midi: MidiStore;
    constructor() {
        // init order is important
        this.state = new StateStore(this);
        this.midi = new MidiStore(this);
    }
}

export const stores = new RootStore();
