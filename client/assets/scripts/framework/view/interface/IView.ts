import {GObject} from "fairygui-cc";
import Skin from "../Skin";
import IContainer from "./IContainer";

export default interface IView extends IContainer{
    skin: Skin;
    parent: IContainer;
    gObject: GObject;
    visible: boolean;
    injectData: any;
    injectSource: any;

    inject(go: GObject);

    show(data?: any, changeVisible?: boolean);
    hide(changeVisible?: boolean);
    dispose();
}