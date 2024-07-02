import { Event, GButton, GComponent, GList } from "fairygui-cc";
import { inject, registSkin } from "../Decorators";
import { TweenWindow } from "../TweenWindow";
import { UIManager } from "../UIManager";
import { ViewHelper } from "../ViewHelper";
import { GMDocker } from "./GMDocker";
import { EGMItemType, EGMValueType, GMEvent, GMItem, GMItemInfo } from "./GMItem";

type GMItemCallBack = (evt: GMEvent)=>void;
const GMManangerName = "GMMananger";
const GMDockerName = "GMDocker";

@registSkin("gm", GMManangerName)
export class GMMananger extends TweenWindow {
    private static _inst: GMMananger;
    static get inst() {
        if(!this._inst) {
            this._inst = ViewHelper.instance.getSingleWindowByType(GMMananger) as GMMananger;
        }
        return this._inst;
    }
    
    static show() {
        UIManager.instance.showWindow("GMMananger");
    }

    static setEnable(value: boolean) {
        if(value && !GMDocker.inst?.visible) {
            UIManager.instance.showWindow(GMDockerName, null, false);
        }else if(!value) {
            UIManager.instance.hideWindow(GMDockerName);
            UIManager.instance.hideWindow(GMManangerName);
        }
    }

    @inject(GList)
    private tabs: GList;
    @inject(GList, "content.list")
    private tools: GList;
    @inject(GButton)
    private btnClose: GButton;

    private _tables: {[key: string]: GComponent} = {};
    private _items: {[key: string]: GMItemInfo[]} = {};
    private _first = true;

    protected onInitial() {        
        this.topMost = true;
        this.topPriority = 100;
    }

    protected onCreate() {
        GMMananger._inst = this;

        this.tabs.on(Event.CLICK_ITEM, this._onTabClick, this);
        this.btnClose.onClick(()=>{
            this.hide();
            UIManager.instance.showWindow(GMDockerName, null, false);
        }, this);

        this.tabs.removeChildrenToPool();
        this.tools.removeChildrenToPool();
    }

    private _onTabClick(evt: any) {
        this._refresh(evt.text);
    }

    private _addItem(item: GMItemInfo) {
        let key = item.category;
        let tb = this._tables[key];
        if(!tb) {
            tb = this.tabs.addItemFromPool() as GComponent;
            this._tables[key] = tb;
            tb.text = item.category;

            this._items[key] = [];
        }
        this._items[key].push(item);
    }

    private _updateItem(item: GMItemInfo) {
        let view = this.tools.addItemFromPool();
        let gmitem: GMItem;
        if(!view.data) {
            gmitem = new GMItem;
            gmitem.inject(view, item);
            view.data = gmitem;
        }else{
            gmitem = view.data as GMItem;
        }
        gmitem.reset(item);
    }

    private _refresh(key: string) {
        this.tools.removeChildrenToPool();
        let items = this._items[key];
        items.forEach(item=>{
            this._updateItem(item);
        });
    }

    refresh() {
        if(this.tabs.numChildren > 0) {
            this.tabs.selectedIndex = 0;
            this._refresh(this.tabs.getChildAt(0).text);
        }
    }

    protected onShown(data: any): void | Promise<void> {
        if(this._first) {
            this._first = false;            
            this.refresh();
        }
        
        this.window.makeFullScreen();
        this.window.center();
    }

    addInt(catetory: string, name: string, value: number, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;
        itemInfo.type = EGMItemType.Input;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.valueType = EGMValueType.int;
        itemInfo.defaultValue = value;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addFloat(catetory: string, name: string, value: number, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;
        itemInfo.type = EGMItemType.Input;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.valueType = EGMValueType.float;
        itemInfo.defaultValue = value;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addString(catetory: string, name: string, value: string, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;
        itemInfo.type = EGMItemType.Input;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.valueType = EGMValueType.string;
        itemInfo.defaultValue = value;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addRange(catetory: string, name: string, min: number, max: number, value: number, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;
        itemInfo.type = EGMItemType.Slider;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.min = min;
        itemInfo.max = max;
        itemInfo.defaultValue = value;
        itemInfo.valueType = EGMValueType.int;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addRangeF(catetory: string, name: string, min: number, max: number, value: number, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;
        itemInfo.type = EGMItemType.Slider;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.min = min;
        itemInfo.max = max;
        itemInfo.defaultValue = value;
        itemInfo.valueType = EGMValueType.float;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addButton(catetory: string, name: string, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;        
        itemInfo.type = EGMItemType.Button;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addSwitch(catetory: string, name: string, value: boolean, callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;        
        itemInfo.type = EGMItemType.Switch;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.valueType = EGMValueType.boolean;
        itemInfo.defaultValue = value;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }

    addSelector(catetory: string, name: string, value: number, options: string[], callback: GMItemCallBack, thisObj: any) {
        let itemInfo = new GMItemInfo;        
        itemInfo.type = EGMItemType.Selector;
        itemInfo.category = catetory;
        itemInfo.name = name;
        itemInfo.valueType = EGMValueType.int;
        itemInfo.defaultValue = value;
        itemInfo.defaultValues = options;
        itemInfo.callback = callback;
        itemInfo.thisObj = thisObj;
        this._addItem(itemInfo);
    }
}