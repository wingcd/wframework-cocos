import {AlignType, Event, GComponent, GGroup, GLoader, GObject, GRoot, LoaderFillType, RelationType, UIPackage, VertAlignType} from "fairygui-cc";
import Skin from "./Skin";
import IActivity from "./interface/IActivity";
import ViewObject from "./ViewObject";
import { IInjectInfo, InjectObject } from "./interface/IInjectInfo";
import SkinHelper from "./SkinHelper";
import { ViewHelper, ELayer } from "./ViewHelper";
import Container from "./Container";
import { Timer } from "../common/Timer";
import { UIManager } from "./UIManager";
import { SoundManager } from "../common/SoundManager";
import { game } from "cc";

// [l100,t100,b80,y+10]name"
var NAME_REGEX = /\[((([tbrlwh]|(?:[xy][+-]\d{0,3})){1}(?:\d{0,3},?))+)\](.*)/i;
export class Activity extends Container implements IActivity,IInjectInfo{      
    public viewObject:ViewObject;
    public data:any;
    public disposeOnExit = false;
    public overflow = false;

    public injectInfos:InjectObject = {};
    public registInfos():void{
        
    }

    private _skin:Skin;
    private _updating = false;
    private _secondTicker = 0;
    private _enableUpdate = false;

    protected bgmSouce: string|number;
    protected bgmLoop: boolean = true;

    get component(): GComponent {
        return this.viewObject.component;
    }
    
    get destoried(): boolean {
        return this._destoried;
    }

    get skin(): Skin {
        if(!this._skin) {
            this._skin = Skin.getSkin((this as any).constructor);
        }
        return this._skin;
    }

    get visible(): boolean {
        return this.component.visible;
    }

    get enableUpdate() {
        return this._enableUpdate;
    }

    set enableUpdate(val: boolean) {
        if(this._enableUpdate != val) {
            this._enableUpdate = val;
            //@ts-ignore
            if(this._isShown) {
                this.setUpdateEnable(val);
            }
        }
    }

    initial() {  
        //@ts-ignore
        this.beginCreate();
        UIManager.instance.onContainerCreate(this);
        
        UIPackage.addPackage(this.skin.path);

        //视图对象                
        let viewObj = new ViewObject();
        let component: GComponent = null;

        if(this.skin.autoWarpper) {
            let warpper = new GComponent();
            warpper.node.name = "[AUTO]GComponent";    
            viewObj.warpper = warpper; 

            let loader = new GLoader();
            viewObj.warpLoader = loader;
            loader.node.name = "[AUTO]GLoader";
            let url = UIPackage.getItemURL(this.skin.packageName, this.skin.componentName);
            loader.url = url;            
            component = loader.component;

            warpper.opaque = component.opaque;

            warpper.addChild(loader);

            loader.fill = LoaderFillType.Scale;
            loader.align = AlignType.Center;
            loader.verticalAlign = VertAlignType.Middle;
            loader.autoSize = false;
            
            warpper.setSize(component.width, component.height);
                        
            loader.setSize(warpper.width, warpper.height);
            loader.setPosition(0, 0);
            loader.addRelation(warpper, RelationType.Size);

            // 背景图
            let bg = component.getChild("_bg_");
            let count = 0;
            if (bg != null)
            {
                warpper.addChildAt(bg, 0);
                bg.addRelation(warpper, RelationType.Size);

                count++;
            }      

            let children = component._children.slice();
            children.forEach(child=>{
                let name = child.name;
                    
                if(name.startsWith("_out_")) {
                    let defs:{
                        percent: boolean;
                        type: number;
                        axis: number;
                    }[] = [];
                    child.relations["_items"].filter(item=>item.target==component).map(item=>{
                        defs = defs.concat(item["_defs"]);
                    });
                    child.removeFromParent();
                    child.relations.clearFor(component);
                    warpper.addChildAt(child, count);

                    defs.forEach(def=>{
                        child.addRelation(warpper, def.type, def.percent);
                    });
                    count++;
                }else{
                    let matches = NAME_REGEX.exec(name);
                    if(matches) {
                        let groups = matches[1].split(","); 
                        groups.forEach(group=>{
                            let type = group[0].toLocaleLowerCase();
                            let isPosType = type == "x" || type == "y" ;
                            let startPos = isPosType ? 2 : 1;
                            let sign = 1;
                            if(isPosType) {
                                sign = group[1] == "+" ? 1 : -1;
                            }
                            let precentStr = group.substring(startPos);
                            let precent = !!precentStr ? parseInt(precentStr) / 100 : 1;
                            if(Number.isNaN(precent)) {
                                precent = 1;
                                console.error("precent is not number," + precentStr, name);
                            }

                            let fullWidth = GRoot.inst.width;
                            let fullHeight = GRoot.inst.height;
                            // 重新计算位置
                            if(type == 't') {
                                child.setPosition(child.x, child.y - (fullHeight - component.height) * 0.5 * precent); 
                            } else if(type == 'b') {
                                child.setPosition(child.x, child.y + (fullHeight - component.height) * 0.5 * precent);
                            } else if(type == 'l') {
                                child.setPosition(child.x - (fullWidth - component.width) * 0.5 * precent, child.y);
                            } else if(type == 'r') {
                                child.setPosition(child.x + (fullWidth - component.width) * 0.5 * precent, child.y);
                            } else if(type == 'w') {
                                child.setSize(child.width + (fullWidth - component.width) * precent, child.height);
                            }else if(type == "h") {
                                child.setSize(child.width, child.height + (fullHeight - component.height) * precent);
                            }else if(type == "x") {
                                child.setPosition(child.x + (fullWidth - component.width) * 0.5 * sign * precent, child.y);
                            }else if(type == "y") {
                                child.setPosition(child.x, child.y + (fullHeight - component.height) * 0.5 * sign * precent);
                            }else {
                                console.error("unknow type", type);
                            }
                        });

                        // 重命名
                        child.name = matches[4];
                    }
                }
            });
        }
        else{
            component = UIPackage.createObject(this.skin.packageName, this.skin.componentName).asCom;  
            component.node.name = `[${this.skin.componentName}]`;
        }  

        viewObj.go = component;
        viewObj.skin = this.skin;
        this.viewObject = viewObj;
    }
    
    async create(): Promise<void> {
        this.onInitial();

        SkinHelper.InjectView(this.viewObject.go, this);

        let groot = ViewHelper.instance.getLayer(ELayer.UI);
        groot.on(Event.SIZE_CHANGED, this.onSizeChanged, this);
        this.viewObject.container.setSize(groot.width, groot.height);

        let ret = this.onCreate();
        if (ret instanceof Promise) {
            await ret;
        }

        //@ts-ignore
        this.endCreate();
    }

    private onSizeChanged() {
        let groot =  ViewHelper.instance.getLayer(ELayer.UI);
         this.viewObject.container.setSize(groot.width,groot.height);
    }

    enter(data: any): void {
        this.show(true, data);
    }
    
    private async show(isEnter: boolean, data: any): Promise<void> {        
        //@ts-ignore
        this._isShown = false;

        this.viewObject.container.visible = true;
        this.children.forEach(v => {
            v.show(data, false);
        });

        let ret = this.onShown(isEnter, data);
        if (ret instanceof Promise) {
            await ret;
        }

        //@ts-ignore
        this.endShown();
        this.setUpdateEnable(this._enableUpdate);

        if (this.bgmSouce) {
            SoundManager.instance.playMusic(this.bgmSouce, this.bgmLoop);
        }
    }

    exit(): void {
        this.hide(true);
    }

    private hide(isExit: boolean):void{        
        this.viewObject.container.visible = false;
        this.children.forEach(v=>{
            v.hide(false);
        });
        
        this.clearEventCenter();
        this.setUpdateEnable(false);

        this.onHide(isExit);
    }

    pause():void{
        this.hide(false);    }
    
    resume(data: any):void{
        this.show(false, data);
    }
    
    dispose():void{
        if(this._destoried) {
            return;
        }
        this._destoried = true;

        this.clearEventCenter();

        this.children.forEach(v=>{
            v.dispose();
        })
        
        let groot =  ViewHelper.instance.getLayer(ELayer.UI);
        groot.off(Event.SIZE_CHANGED, this.onSizeChanged, this);
        this.viewObject.go.dispose();

        this.onDispose();
    }  

    private update() {      
        let dt = game.deltaTime * 1000;  
        this._secondTicker += dt;
        let seconds = false;
        if(this._secondTicker >= 1000) {
            seconds = true;
            this._secondTicker = 0;
        }

        this.onUpdate(dt/1000, seconds);
    }

    private setUpdateEnable(val: boolean) {
        if(this._updating == val) {
            return;
        }

        this._updating = val;
        if(val) {
            Timer.inst.frameLoop(1, this.update, this);
        }else{
            Timer.inst.clear(this.update, this);
        }
    }

    //////////////////////////////////////////////////////////////////////////

    protected onInitial() {

    }

    protected onCreate(): void | Promise<void> {

    }
    
    protected onShown(isEnter: boolean, data: any): void | Promise<void> 
    {
        
    }

    protected onHide(isExit: boolean) 
    {
        
    }

    protected onDispose() {

    }

    /**
     * 
     * @param dt 间隔时间(s)
     * @param secondTick 
     */
    protected onUpdate(dt: number, secondTick: boolean) {

    }
}