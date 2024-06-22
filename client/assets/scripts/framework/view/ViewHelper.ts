import {GComponent,GRoot,RelationType,UIPackage} from "fairygui-cc";
import Skin from "./Skin";
import IActivity from "./interface/IActivity";
import ViewMap from "./ViewMap";
import IWindow from "./interface/IWindow";
import { view } from "cc";

export enum ELayer {
    Background,
    UI,
    Overlay,
}

export class ViewHelper{
    private _views = {};
    private _windows = {};
    private _packages = {};
    private _initialed = false;
    private _layers = new Array<GComponent>();    

    private _scaleX = 1;
    private _scaleY = 1;

    public get scaleX() {
        return this._scaleX;
    }

    public get scaleY() {
        return this._scaleY;
    }
    
    public get scale() {
        return Math.min(this._scaleX, this._scaleY);
    }
    
    private static _instance :ViewHelper = null;
    public static get instance(){
        if(this._instance == null){
            this._instance = new ViewHelper();
        }
        return this._instance;
    }

    public get packages():Object{
        return this._packages;
    }

    public initialize(opts:any = null){
        if(this._initialed) {
            return;
        }

        this._initialed = true;

        let dsize = view.getDesignResolutionSize();
        let screenRatio = screen.width / screen.height;
        let designRatio = dsize.x / dsize.y;

        if(screenRatio > designRatio) {
            //高优先
            let swidth = screen.height * designRatio;
            this._scaleY = 1;
            this._scaleX = swidth / screen.width;
        } else {
            //宽优先
            let sheight = screen.width / designRatio;
            this._scaleX = 1;
            this._scaleY = sheight / screen.height;
        }

        this.addLayer();
        this.addLayer();
        this.addLayer();
    }

    private addLayer() {
        let comp = new GComponent();
        comp.setSize(GRoot.inst.width, GRoot.inst.height);
        // GRoot.inst.on(Event.SIZE_CHANGED, ()=>{
        //     comp.setSize(GRoot.inst.width, GRoot.inst.height);
        // }, this);        
        GRoot.inst.addChild(comp);
        comp.addRelation(GRoot.inst, RelationType.Size);
        this._layers.push(comp);
    }

    public getLayer(layer:ELayer):GComponent {
        return this._layers[<number>layer];
    }

    public createWindow(mediator: Function): IWindow | null {
        if (!mediator) {
            console.error("class type cannot be null!");
            return null;
        }

        let view = new (mediator as ObjectConstructor)() as IWindow;

        let skin = view.skin;
        if (!this._packages[skin.path]) {
            let pkg = UIPackage.addPackage(skin.path);
            this._packages[skin.path] = pkg;
        }

        view.initial();

        if (!view.component) {
            return null;
        }

        return view;
    }
    
    public createView(skin: Skin, mediator: Function, layer = ELayer.UI): IActivity | null {
        if (!mediator) {
            console.error("class type cannot be null!");
            return null;
        }

        let view = new (mediator as ObjectConstructor)() as IActivity;

        skin = view.skin;
        if (!this._packages[skin.path]) {
            let pkg = UIPackage.addPackage(skin.path);
            this._packages[skin.path] = pkg;
        }

        view.initial();

        if (!view.viewObject.container) {
            return null;
        }

        let container = this.getLayer(layer);
        let warpper = view.viewObject.container;
        if (warpper != container) {
            container.addChild(warpper);
        }

        warpper.setSize(container.width, container.height);
        warpper.setScale(1, 1);
        warpper.addRelation(container, RelationType.Size);

        view.create();

        return view;
    }

    public getSingleWindowByName(name: string): IWindow {
        let skin = ViewMap.instance.getSkinByName(name);
        return this.getSingleWindow(skin);
    }

   public getSingleWindow(skin: Skin): IWindow | null {
        if (!skin) {
            console.error("can not get undefined skin!");
            return null;
        }

        let key = skin.getKey();
        let view = this._windows[key];

        if (!view) {
            // Create the logic code for the interface and bind it to the logic code
            let viewClass = ViewMap.instance.get(skin);
            view = this.createWindow(viewClass);

            if (view) {
                // Register
                this._windows[key] = view;
            }
        }

        return view;
    }

    public getSingleWindowByType(viewClass: Function): IWindow | null {
        if (!viewClass) {
            console.error("can not get undefined viewType!");
            return null;
        }

        let skin = Skin.getSkin(viewClass);
        let key = skin.getKey();
        let view = this._windows[key];

        if (!view) {
            // Create the logic code for the interface and bind it to the logic code
            view = this.createWindow(viewClass);

            if (view) {
                // Register
                this._windows[key] = view;
            }
        }

        return view;
    }
    
    public getSingleView(skin: Skin, layer = ELayer.UI): IActivity | null {
        if (!skin) {
            console.error("can not get undefined viewType!");
            return null;
        }

        let key = skin.getKey();
        let view = this._views[key];

        if (!view) {
            // Create the logic code for the interface and bind it to the logic code
            let viewClass = ViewMap.instance.get(skin);
            view = this.createView(skin, viewClass, layer);

            if (view) {
                // Register
                this._views[key] = view;
            }
        }

        return view;
    }

    public getSingleViewByType(viewClass: Function, layer = ELayer.UI): IActivity | null {
        if (!viewClass) {
            console.error("can not get undefined viewType!");
            return null;
        }

        let tempSkin = Skin.getSkin(viewClass);
        if (!tempSkin) {
            console.error("can not get viewType's binding skin!");
            return null;
        }

        let tempKey = tempSkin.getKey();
        let view = this._views[tempKey];

        if (!view) {
            // Create the logic code for the interface and bind it to the logic code
            view = this.createView(null, viewClass, layer);

            if (view) {
                // Register
                let skin = view.skin;
                let key = skin.getKey();
                this._views[key] = view;
            }
        }

        return view;
    }

    public destoryWindow(skin: Skin): void {
        let key = skin.getKey();
        let view = this._windows[key];

        if (view) {
            view.dispose();
            delete this._windows[key];
        }
    }

    public destroyView(skin: Skin, layer = ELayer.UI): void {
        let key = skin.getKey();
        let view = this._views[key];

        if (view) {
            // Remove from fgui
            let ui = this.getLayer(layer);
            ui.removeChild(view.viewObject.container);

            try {
                view.dispose();
            } catch (e) {
                console.error("view " + skin.getKey() + " onDestroy() error:" + e);
            }

            // Remove registration
            delete this._views[key];
        }
    }
}