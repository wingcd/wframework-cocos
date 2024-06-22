import {GObject} from "fairygui-cc";
import { IInjectInfo } from "./IInjectInfo";

export default interface IAutoInject extends IInjectInfo{         
    injectSource:Object;       
    inject(go:GObject):void;
}