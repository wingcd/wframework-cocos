import { GComponent } from "fairygui-cc";
import { EventCenter } from "../common/EventCenter";
import IContainer from "./interface/IContainer";
import IView from "./interface/IView";

export default class Container implements IContainer {
    static showDebug = false;

    children: IView[] = [];

    protected _destoried: boolean = false;
    private _isCreated: boolean = false;
    private _isShown: boolean = false;

    enableWating = true;

    get component(): GComponent {
        return null;
    }

    get destoried(): boolean {
        return this._destoried;
    }

    get isCreated() {
        return this._isCreated;
    }

    private beginCreate() {
        this._isCreated = false;
    }

    private endCreate() {
        this._isCreated = true;
    }

    private endShown() {
        this._isShown = true;
    }

    addView(view: IView) {
        if(Container.showDebug)
            console.error("check point addview", view.component.name);

        view.parent = this;
        this.children.push(view);
    }

    removeView(view: IView) {
        view.parent = null;
        this.children = this.children.filter(item => item !== view);
    }

    on(type: string, listener: Function, target?: any): void {
        this.component.node.on(type, listener, target);
    }

    once(type: string, listener: Function, target?: any): void {
        this.component.node.once(type, listener, target);
    }

    off(type: string, listener?: Function, target?: any): void {
        this.component.node.off(type, listener, target);
    }

    emit(type: string, ...data: any): void {
        this.component.node.emit(type, ...data);
    }

    onEventCenter(type: string, listener: Function): void {
        EventCenter.I.on(type, listener, this);
    }

    offEventCenter(type: string, listener?: Function): void {
        EventCenter.I.off(type, listener, this);
    }

    emitEventCenter(type: string, ...data: any): void {
        EventCenter.I.emit(type, ...data);
    }

    onceEventCenter(type: string, listener: Function): void {
        EventCenter.I.once(type, listener, this);
    }

    clearEventCenter(): void {
        EventCenter.I.clear(this);
    }
}