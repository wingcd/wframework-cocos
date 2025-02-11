import { Vec2 } from "cc";
import { GObject, GComponent, GLoader, GButton, UIPackage, ScrollPane } from "fairygui-cc";
import { I18N } from "../../plugins/config/I18N";
import { UtilsHelper } from "../../utils/UtilsHelper";
import { UIManager } from "../UIManager";
import { StringUtils } from "../../utils/StringUtils";
import { CoroutineUtils } from "../../utils/CoroutineUtils";

// 解决fairygui层级不一致造成mask异常问题
var addChildAt = GComponent.prototype.addChildAt;
GComponent.prototype.addChildAt = function (child: GObject, index: number): GObject {
    let that = this as GObject;
    var cld = addChildAt.call(that, child, index);
    if (child && that.parent) {
        child.node.layer = that.parent.node.layer;
    }
    return cld;
};

// 让loader支持空白处点击穿透
GLoader.prototype["_hitTest"] = function (pt: Vec2, globalPt: Vec2): GObject {
    let that = this as GLoader;
    if (that.node.name.startsWith("[AUTO]") && that.component) {
        return that.component["_hitTest"](pt, globalPt);
    }

    if (!that.touchable) {
        return null;
    }

    if (pt.x >= 0 && pt.y >= 0 && pt.x < this._width && pt.y < this._height)
        return this;
    else
        return null;
}

/**
 * 设置延迟点击
 * @param gObj GObject
 * @param cd  延迟时间（秒）
 */
async function setClickCD (gObj: GObject, cd: number = 1) {
    if(gObj["_ck_interval_"]) {
        return;
    }
    gObj["_ck_interval_"] = true;
    await CoroutineUtils.oneframe();
    if(gObj.isDisposed) {
        return;
    }
    delete gObj["_ck_interval_"];

    gObj.touchable = false;
    await CoroutineUtils.wait(cd);
    gObj.touchable = true;
}

let btnClick1 = GButton.prototype["onClick_1"];
GButton.prototype["onClick_1"] = function () {
    let that = this as GButton;
    if(UIManager.onButtonClick) {
        UIManager.onButtonClick(that);
    }
    btnClick1.call(that);
    let clickInterval = this.clickInterval || 0;
    if (clickInterval > 0) {
        setClickCD(that, clickInterval);
    }
};

GObject.prototype["setClick"] = function (callback: Function, target?: any) {
    this.offClick(callback, target);
    this.onClick(callback, target);
};

GObject.prototype["setClickCD"] = function (cd: number) {
    setClickCD(this, cd);
};

GObject.prototype["setTitle"] = function (data: number | string, ...args: string[]) {
    if (typeof data == "number") {
        let text = I18N.inst.getItem(data)?.Text || `[lang${data}]`;
        if (text) { text = text.replace(/\\n/g, '\n'); }
        this.text = StringUtils.format(text, ...args);
    } else {
        this.text = StringUtils.format(data, ...args);
    }
};

GObject.prototype["setText"] = function (data: number | string, ...args: string[]) {
    if (typeof data == "number") {
        let text = I18N.inst.getItem(data)?.Text || `[lang${data}]`;
        if (text) { text = text.replace(/\\n/g, '\n'); }
        this.text = StringUtils.format(text, ...args);
    } else {
        this.text = StringUtils.format(data, ...args);
    }
};

GComponent.prototype["clone"] = function () {
    let that = this as GComponent;
    return UIPackage.createObjectFromURL(that.resourceURL) as GComponent;
}

ScrollPane["globalTouchEffect"] = true;
Object.defineProperty(ScrollPane.prototype, "_touchEffect", {
    get: function () { return this.touchEffect__ && ScrollPane["globalTouchEffect"]; },
    set: function (v) { this.touchEffect__ = v; }
})

declare module "fairygui-cc" {
    export interface GObject {
        setClick(callback: Function, target?: any): void;
        setClickCD(cd: number);

        setTitle(tid: number | string, ...args: string[]);
        setText(tid: number | string, ...args: string[]);
    }

    export interface GButton {
        /**
         * 设置点击CD，单位秒，默认1秒
         */
        clickInterval?: number;
    }

    export interface GComponent {
        clone(): GComponent;
    }

    // export interface ScrollPane {
    //     static globalTouchEffect: boolean;
    // }
}

export default null;