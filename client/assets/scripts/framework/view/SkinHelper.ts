import {GObject,GLoader,Controller, Transition} from "fairygui-cc";
import Skin from "./Skin";
import FGUIExt from "./utils/FGUIExt";
import { GButton } from "fairygui-cc";
import { GComponent } from "fairygui-cc";
import IContainer from "./interface/IContainer";
import IView from "./interface/IView";
import { UIPackage } from "fairygui-cc";

type BindingInfo = {
    type: new () => IContainer,
    uiPackage: string,
    componentName: string,
    data?: any,
    isWindow?: boolean,
    autoWarpper?: boolean,
};

export default class SkinHelper{         
    static regex = /\[\d+\]$/g;
    
    private static _bindingInfos: BindingInfo[] = [];

    private static _uiPackagePath: { [key: string]: { abName?: string, path?: string } } = {};

    // 缓存路径与索引的关系
    private static _cache:{
        [key:string]: {
            [key:string]: string,
        }
    } = {};

    private static _hitCache = 0;

    static enableCache = true;

    static buttonDownTranslation: Transition;
    static buttonUpTranslation: Transition;

    static registUIPackage(pkg: string, abName: string, path: string = "") {
        this._uiPackagePath[pkg] = { abName, path };
    }

    static getUIPackage(pkg: string) {
        return this._uiPackagePath[pkg];
    }

    static initial() {
        for (let info of this._bindingInfos) {
            this.bindingSkin(info.type, info.uiPackage, info.componentName, info.data, info.isWindow, info.autoWarpper);
        }
        this._bindingInfos.length = 0;
    }

    static preBindingSkin(type: new () => IContainer, uiPackage: string, componentName: string, data?: any, isWindow?: boolean, autoWarpper?: boolean) {
        let bindingInfo = {
            type,
            uiPackage,
            componentName,
            data,
            isWindow,
            autoWarpper,
        };
        this._bindingInfos.push(bindingInfo);
    }
    
    static bindingSkin(type: new () => IContainer, uiPackage: string, componentName: string, data?: any, isWindow?: boolean, autoWarpper?: boolean) {
        let info = this.getUIPackage(uiPackage);
        if (!info) {
            console.error(`UI包 ${uiPackage} 未绑定`);
            return;
        }

        let preifx = info.path ? `${info.path}/` : "";
        Skin.bindSkin(type, new Skin(`${preifx}${uiPackage}`, uiPackage, componentName, data, isWindow, autoWarpper, info.abName));
    }

    static preloadUIPackage(uiPackage: string, progress?: (p: number) => void) {
        let info = this.getUIPackage(uiPackage);
        if (!info) {
            console.error(`UI包 ${uiPackage} 未绑定`);
            return;
        }

        let preifx = info.path ? `${info.path}/` : "";
        return FGUIExt.preloadPackage(info.abName, `${preifx}${uiPackage}`, progress);
    }

    static getNames(path:string):string[]{
        return path ? path.split(".") : [""];
    }

    static getIndex(name:string):{id:number,newName:string}{
        let match = name.match(SkinHelper.regex);
        if(match && match.length == 1){
            let g = match[0].replace("[","").replace("]","");
            let newname = name.replace(SkinHelper.regex, "");

            return {id:Number(g),newName:newname};
        }else{
            return null;
        }
    }

    static InjectSkin(skin:Skin, view:any):void{
        let go = FGUIExt.createObject(skin);
        SkinHelper.InjectView(go, view);
    }

    static IsGLoader(type) : boolean {
        if(type == GLoader) {
            return true;
        }

        if(type.__proto__ && type.__proto__.name) {
            return SkinHelper.IsGObject(type.__proto__);
        }

        return false;
    }

    static IsGObject(type) : boolean {
        // if( type['__className'] === 'GObject') {
        //     return true;
        // }

        // if(type['__super']) {
        //     return SkinHelper.IsGObject(type['__super']);
        // }

        if(type == GObject) {
            return true;
        }

        if(type.__proto__ && type.__proto__.name) {
            return SkinHelper.IsGObject(type.__proto__);
        }

        return false;
    }

    static OtherFGUIType(type) : boolean {
        return SkinHelper.IsController(type) || SkinHelper.IsTransition(type);
    }

    static IsController(type) : boolean {
        // if(type['__className'] === 'Controller') {
        //     return true;
        // }

        // if(type['__super']) {
        //     return SkinHelper.IsController(type['__super']);
        // }

        if(type == Controller) {
            return true;
        }

        if(type.__proto__ && type.__proto__.name) {
            return SkinHelper.IsController(type.__proto__);
        }

        return false;
    }

    static IsTransition(type) : boolean {
        if(type == Transition) {
            return true;
        }

        if(type.__proto__ && type.__proto__.name) {
            return SkinHelper.IsTransition(type.__proto__);
        }

        return false;
    }

    static IsFGUIObject(type) : boolean {
        if(SkinHelper.IsGObject(type)) {
            return true;
        }

        if(SkinHelper.IsController(type)) {
            return true;
        }

        if(SkinHelper.IsTransition(type)) {
            return true;
        }

        return false;
    }

    static InjectView(component:GObject, view?:any):void{
        view = view || component;
        if(!view){
            return;
        }

        if(view.registInfos){
            view.registInfos();
        }

        if(!view.injectInfos && !view.__injectInfos){
            return;
        }                
        component['__docker__'] = view;

        let injectInfos = {
            ...(view.__injectInfos||{}),
            ...(view.injectInfos||{}),
        };
        
        //过滤值属性
        for(let field in injectInfos){   
            let f = view[field];
            let t =  typeof(f);
            if(f instanceof Function ||
                t == "boolean" ||
                t == "string" ||
                t == "number" ){
                continue;
            }

            let names:string[] = [field];            
            let type: ObjectConstructor = null;
            let optional = true;
            let data = null;

            let hasCache = !!(this._cache[component.resourceURL] && this._cache[component.resourceURL][field]);
            //当给定了值时，更新names
            if(injectInfos[field]){
                let oldpath = injectInfos[field];
                //过滤方法
                if(oldpath instanceof Function){
                    continue;
                }
                
                let path = oldpath;
                //当给定的是对象时，解析对象
                if(oldpath instanceof Object){
                    type = oldpath.type;                        
                    path = oldpath.path;
                    data = oldpath.data;
                    optional = oldpath.optional;
                }      
                
                if(!type) {
                    console.error(`${field}的类型不能为空`);
                    return;
                }
                
                // 获取缓存路径
                if(hasCache) {
                    path = this._cache[component.resourceURL][field];
                    this._hitCache++;
                }

                names = SkinHelper.getNames(path);
                if(!names[0]){
                    names[0] = field;
                }else if(!names[names.length-1]){
                    names[names.length-1] = field;
                }
            }else{               
                // 获取缓存路径
                if(hasCache) {
                    names = SkinHelper.getNames(this._cache[component.resourceURL][field]);
                    this._hitCache++;
                }
            }

            let go = component;
            let endName = field;
            let endIndex = -1;
            let indices = [];
            for(let id=0;id<names.length;id++){
                let name = names[id];
                let ids = SkinHelper.getIndex(name);      
                
                endName = name;
                if(ids){     
                    if(go && go.asCom.getChild){ 
                        if(id != names.length - 1 || id == names.length - 1 && !SkinHelper.OtherFGUIType(type)){
                            if(ids.newName) {
                                let parent = go.asCom;
                                go = parent.getChild(ids.newName);
                                // 缓存id
                                if(!hasCache) {
                                    indices.push(parent.getChildIndex(go));
                                }
                            }

                            if(go.asCom.getChild){   
                                if(!SkinHelper.OtherFGUIType(type)) {                             
                                    go = go.asCom.getChildAt(ids.id);

                                    // 缓存id
                                    if(!hasCache) {
                                        indices.push(ids.id);
                                    }
                                }
                            }else{
                                console.error("can not find view with path:" + names.join("-") + " in " + ids.newName);
                            }
                        }
                    }else if(go && SkinHelper.IsGLoader(go.constructor)){
                        if(id != names.length - 1 || id == names.length - 1 && !SkinHelper.OtherFGUIType(type)){
                            var loader = go as GLoader;
                            if(ids.newName) {
                                go = loader.component.getChild(ids.newName);
                                // 缓存id
                                if(!hasCache) {
                                    indices.push(loader.component.getChildIndex(go));
                                }
                            }

                            if(loader.component.getChild){   
                                if(!SkinHelper.OtherFGUIType(type)) {                             
                                    go = loader.component.getChildAt(ids.id);

                                    // 缓存id
                                    if(!hasCache) {
                                        indices.push(ids.id);
                                    }
                                }
                            }else{
                                console.error("can not find view with path:" + names.join("-") + " in " + ids.newName);
                            }
                        }
                    }else{
                        console.error("can not find view with path:" + names.join("-") + " in " + name);
                    }  

                    endIndex = ids.id;
                }else if(go && go.asCom.getChild){
                    if(id != names.length - 1 || (id == names.length - 1 && !SkinHelper.OtherFGUIType(type))) {  
                        let parent = go.asCom;
                        go = parent.getChild(name);

                        // 缓存id
                        if(!hasCache) {
                            indices.push(parent.getChildIndex(go));
                        }
                    }
                } else if(go && SkinHelper.IsGLoader(go.constructor)){
                    if(id != names.length - 1 || (id == names.length - 1 && !SkinHelper.OtherFGUIType(type))) {  
                        var loader = go as GLoader;
                        go = loader.component.getChild(name);

                        // 缓存id
                        if(!hasCache) {
                            indices.push(loader.component.getChildIndex(go));
                        }
                    }
                }else{
                    go = null;
                    console.error("can not find view with path:" + names.join("-") + " in " + name);
                }
            }

            if(go){    
                //当示例为空时，实例化变量
                if(type && !view[field] && !SkinHelper.IsFGUIObject(type)) {
                    // var obj  = {};
                    // obj["__proto__"] = type.prototype;
                    // type.call(obj); 
                    var obj = new type();

                    view[field] = obj;
                }

                if(view[field] == null){
                    view[field] = go;
                    SkinHelper.checkButtionAnimation(go, false);

                    if(SkinHelper.IsController(type)) {
                        var loader = go as GLoader;
                        let comp = SkinHelper.IsGLoader(go.constructor) && loader.component ? loader.component : go.asCom;
                        if(endIndex >= 0) {
                            view[field] = comp.getControllerAt(endIndex);

                            // 缓存id
                            if(!hasCache) {
                                indices.push(endIndex);
                            }
                        }else {
                            view[field] = comp.getController(endName);

                            if(!hasCache) {
                                for(let i=0;i<comp.controllers.length;i++) {
                                    if(comp.controllers[i].name == endName) {
                                        // 缓存id
                                        indices.push(i);
                                    }
                                }
                            }
                        }
                    }else if(SkinHelper.IsTransition(type)) {
                        var loader = go as GLoader;
                        let comp = SkinHelper.IsGLoader(go.constructor) && loader.component ? loader.component : go.asCom;
                        if(endIndex >= 0) {
                            view[field] = comp.getTransitionAt(endIndex);

                            // 缓存id
                            if(!hasCache) {
                                indices.push(endIndex);
                            }
                        }else {
                            view[field] = comp.getTransition(endName);

                            if(!hasCache) {
                                for(let i=0;i<comp._transitions.length;i++) {
                                    if(comp._transitions[i].name == endName) {
                                        // 缓存id
                                        indices.push(i);
                                    }
                                }
                            }
                        }
                    }
                }else if(view[field].inject instanceof Function){
                    SkinHelper.checkButtionAnimation(go, false);
                    view[field].injectSource = view;
                    view[field].inject(go, data);
                    // view[field].onCreate();
  
                    // 缓存路径
                    if(!hasCache) {  
                        this.cacheView(field, indices, component.resourceURL);
                    }

                    if(view.addView) {
                        view.addView(view[field]);
                    }
                }
            }else if(!go && !view[field]){
                let info = "can not find view in " + typeof(view) + " with path:" + names.join("-");
                if(!optional){
                    console.error(info);
                }else{
                    console.warn(info);
                }
            }
        }

        // for(let i=0;i<component.numChildren;i++){
        //     let child = component.getChildAt(i).asCom;
        //     let field = view[child.name];
        //     if(!field){
        //         view[child.name] = child;
        //     }else if(field.InjectView){
        //         field.InjectView(child);
        //     }

        //     SkinHelper.InjectView(child, view);
        // }
    }

    static cacheView(field: string, indices: number[], resUrl: string) {
        if(!this.enableCache) {
            return;
        }

        if(!this._cache[resUrl]) {
            this._cache[resUrl] = {};
        }

        let cache = this._cache[resUrl];
        cache[field] = indices.map(id => `[${id}]`).join(".");
    }
    private static checkButtionAnimation(item: any, force = false):void{
        if(!(item instanceof GButton)){
            return;
        }

        let button = item as GButton;
        if(button.downEffect > 0 || force){
            button.downEffect = 0;

            let controller = button.getController("button");
            if(!controller){
                controller = new Controller();
                controller.name = "button";
                
                controller.addPage("up");
                controller.addPage("down");
                controller.addPage("over");
                controller.addPage("selectedOver");

                button.addController(controller); 
                controller.selectedIndex = 0;

                //@ts-ignore
                button._buttonController = controller;
            }

            if(SkinHelper.buttonUpTranslation) {
                button.addControllerAction("button", SkinHelper.buttonUpTranslation, ["down", "selectedOver"], ["up", "over"]);
            }

            if(SkinHelper.buttonDownTranslation) {
                button.addControllerAction("button", SkinHelper.buttonDownTranslation, ["up", "over"], ["down", "selectedOver"]);
            }
        }
    }

    static addButtonCommonAnimation(button: GButton):void{
        SkinHelper.checkButtionAnimation(button);
    }
    
    static createAndInjectByUrl(type: any, url: string, parent: IContainer, data?: any): any {
        const comp = UIPackage.createObjectFromURL(url) as GComponent;
        return SkinHelper.createAndInject(type, comp, parent, data);
    }

    static createAndInject(type: any, comp: GComponent, parent?: IContainer, data?: any): any {
        const view = new type() as IView;
        view.inject(comp);
        view.injectSource = parent;
        parent?.addView(view);
        view.show(data, false);
        return view;
    }
}