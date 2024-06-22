import { Event, GObject, GRoot, UIConfig } from "fairygui-cc";

export default class Gesture {
    private _host: GObject;

    touchDragSensitivity = UIConfig.touchDragSensitivity;

    get host() {
        return this._host;
    }

    constructor(host: GObject) {
        this._host = host;
    }

    public on(type: string, listener: Function, target?: any): void {
        this.host.node.on(type, listener, target);
    }

    public once(type: string, listener: Function, target?: any): void {
        this.host.node.once(type, listener, target);
    }

    public off(type: string, listener?: Function, target?: any): void {
        this.host.node.off(type, listener, target);
    }

    public emit(type: string, event: Event): void {
        this.host.node.emit(type, event);
    }

    public dispose() {
        this._host = null;
    }

    public getTouchIds(): number[] {        
        let touchIds: number[] = [];
        touchIds = GRoot.inst.inputProcessor.getAllTouches();
        if(!touchIds) {
            touchIds = [];
        }
        return touchIds;
    }
}