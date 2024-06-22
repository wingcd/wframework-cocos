import {GObject,GComponent, GLoader} from "fairygui-cc";
import Skin from "./Skin";

export default class ViewObject{
    public go: GObject;
    public skin: Skin;
    public warpper: GComponent;
    public warpLoader: GLoader;
    public get component(): GComponent {
        return this.go.asCom;
    }

    public get container(): GComponent {
        return this.warpper ?? this.go.asCom;
    }
}