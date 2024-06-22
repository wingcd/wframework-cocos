import Skin from "../Skin";
import IView from "./IView";
import ViewObject from "../ViewObject";
import { GComponent } from "fairygui-cc";

export default interface IActivity{        
    viewObject:ViewObject;

    data:any;
    skin: Skin;

    disposeOnExit:boolean;
    destoried: boolean;
    component: GComponent;
    enableUpdate: boolean;

    initial():void;

    create(): void;
    
    enter(data: any):void;

    exit():void;

    pause():void;
    
    resume(data: any):void;
    
    dispose():void;
}