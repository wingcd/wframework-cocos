import { view } from "cc";
import { Event, GRoot } from "fairygui-cc";
import { UIManager } from "../UIManager";
import Window from "../Window";
import { registSkin } from "../Decorators";

@registSkin("gm", "GMDocker", null, true)
export class GMDocker extends Window {
    private static _inst: GMDocker;
    static get inst() {
        return this._inst;
    }

    private _offsetX = 0;

    protected onInitial() {
        GMDocker._inst = this;
        this._special = true;

        this.contentAsFrame = true;
        this.topMost = true;
        this.topPriority = 100;
        this.canAutoDestory = false;
    }

    protected onCreate() {
        this._offsetX = (GRoot.inst.width - view.getVisibleSize().width) / 2;

        this.window.on(Event.DRAG_END, this.onDragEnd, this);
        this.component.draggable = true;
        this.component.onClick(() => {
            this.hide();
            UIManager.instance.showWindow("GMMananger");
        });

        this.window.setPosition(-this.window.width * 0.5 + this._offsetX, 400);
    }

    private onDragEnd(evt: Event) {
        let fw = GRoot.inst.width;
        let fh = GRoot.inst.height;
        let w = this.window.width;
        let h = this.window.height;
        let x = this.window.x < this._offsetX ? -w * 0.5 + this._offsetX : (this.window.x > fw - w - this._offsetX ? fw - w * 0.5 - this._offsetX : this.window.x);
        let y = this.window.y < 0 ? -h * 0.5 : (this.window.y > fh - h ? fh - h * 0.5 : this.window.y);

        this.window.setPosition(x, y);
    }
}