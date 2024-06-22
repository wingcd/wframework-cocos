import Skin from "../Skin";
import IContainer from "./IContainer";
import { GComponent, Window } from "fairygui-cc";
import { Color } from "cc";

export default interface IWindow extends IContainer {
    _special: boolean;
    _index: number;
    
    skin: Skin;
    window: Window;
    visible: boolean;
    topMost: boolean;
    topPriority: number;
    modal: boolean;
    destoried: boolean;
    component: GComponent;
    enableClose: boolean;
    canAutoDestory: boolean;
    enableUpdate: boolean;
    exitCode: number;
    modalLayerColor: Color;
    hideOnOverlay: boolean;
    canShowBanner: boolean;
    // 打开后是否需要等待关闭，否则会被下一个需要等待，关闭后会重置为false
    needBeWait: boolean;

    inject(go: GComponent);
    initial();
    show(data: any);
    hide(code?: number);
    dispose();
    overlayBy(otherWindow: IWindow);
    bringToFront();
}