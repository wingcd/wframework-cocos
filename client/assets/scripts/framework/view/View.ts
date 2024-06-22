import { GComponent, GObject } from "fairygui-cc";
import IView from "./interface/IView";
import { IInjectInfo, InjectObject } from "./interface/IInjectInfo";
import IAutoInject from "./interface/IAutoInject";
import SkinHelper from "./SkinHelper";
import Container from "./Container";
import Skin from "./Skin";
import IContainer from "./interface/IContainer";

export default class View extends Container implements IView, IInjectInfo, IAutoInject {
    injectInfos: InjectObject = {};

    data: any = null;
    injectSource = null;
    injectData: any = null;

    skin: Skin;
    gObject: GObject;
    parent: IContainer;

    ///////////////////////////////////////////////////////

    constructor() {
        super();
        this.enableWating = false;
    }

    registInfos() {

    }

    get visible(): boolean {
        return this.gObject.visible;
    }

    set visible(val: boolean) {
        this.gObject.visible = val;
    }

    get component(): GComponent {
        return this.gObject as GComponent;
    }

    public inject(go: GObject, data?: any): void {
        //@ts-ignore
        this._isCreated = false;

        this.gObject = go;
        
        this.injectData = data;
        this.data = data;

        this.onInitial();
        SkinHelper.InjectView(go, this);
        
        let ret = this.onCreate(data);  
        if(ret instanceof Promise) {
            (async ()=>{
                await ret;
                //@ts-ignore
                this.endCreate();
            })();
        }else{
            //@ts-ignore
            this.endCreate();
        }   
    }

    async show(data?: any, changeVisiable: boolean = true) {
        //@ts-ignore
        this._isShown = false;

        this.data = data;
        if(changeVisiable) {
            this.gObject.visible = true;
        }

        this.children.forEach(v => {
            v.show(data, false);
        });        

        let ret = this.onShown(data, changeVisiable);
        if(ret instanceof Promise) {
            await ret;
        }
        
        //@ts-ignore
        this.endShown();
    }

    hide(changeVisiable: boolean = true) {
        if(changeVisiable) {
            this.gObject.visible = false;
        }

        this.children.forEach(v => {
            v.hide(false);
        });

        this.clearEventCenter();

        this.onHide(changeVisiable);
    }

    dispose() {
        if(this._destoried) {
            return;
        }
        this._destoried = true;

        this.children.forEach(v => {
            v.dispose();
        });

        this.clearEventCenter();

        if (this.gObject != null) {
            this.gObject.dispose();
        }
        this.gObject = null;

        this.onDispose();
    }


    //////////////////////////////////////////////////////////////////////////

    protected onInitial() {

    }

    protected onCreate(data?: any): void | Promise<void>{
        
    }

    protected onShown(data: any, changeVisiable?: boolean): void | Promise<void> {

    }

    protected onHide(changeVisiable?: boolean) {

    }

    protected onDispose() {

    }
}