import { ELayer, ViewHelper } from "./ViewHelper";
import IActivity from "./interface/IActivity";
import Skin from "./Skin";
import { GComponent, GRoot, UIConfig, GObject, PopupDirection, Window as GWindow } from "fairygui-cc";
import { Camera, Canvas, director, game, Layers, Node, UITransform, v2, Vec3, CameraComponent, Vec2, v3, Color, View, Vec4 } from "cc";
import IWindow from "./interface/IWindow";
import Window from "./Window";
import LRU from "lru-cache";
import { Timer } from "../common/Timer";
import Container from "./Container";
import { UtilsHelper } from "../common/UtilsHelper";
import IView from "./interface/IView";
import ViewMap from "./ViewMap";
import { UIPackage } from "fairygui-cc";
import FGUIExt from "./utils/FGUIExt";
import { WindowPriority, WindowPriorityMap } from "./WindowPriorityMap";
import { GTween } from "fairygui-cc";
import { PREVIEW } from "cc/env";
import { GButton } from "fairygui-cc";
import IContainer from "./interface/IContainer";

GWindow.prototype["onTouchBegin_1"] = function(evt: Event): void {
    let that = this as GWindow;
    if (that.isShowing && that.bringToFontOnClick) {
        if(GRoot.inst._children[GRoot.inst._children.length - 1] != this) {
            that.bringToFront();
    
            if(that.data instanceof Window) {
                UIManager.sortWindow(that.data);
            }
        }
    }
}

type WindowContenxInfo = {
    viewType: Function | string,
    
    data?: any,
    modal?: boolean,
    modalLayerColor?: Color,
    waitOnResNotReady?: boolean,
    
    info?: WindowPriority,
}

export class UIManager {
    static readonly EVENT_NEED_OPEN_WATING = "uimgr_need_open_wating";
    static readonly EVENT_NEED_CLOSE_WATING = "uimgr_need_open_wating";
    static readonly EVENT_WINDOW_CHANGED = "uimgr_window_changed";
    static readonly EVENT_ACTIVITY_CHANGED = "uimgr_activity_changed";

    static onButtonClick: (btn: GButton) => void = null;

    private _views = [];
    private _canvasNode: Node;
    private _camera: Camera;
    private _windows: IWindow[] = [];
    private _lru: LRU<string, IWindow>;

    private _currentOpeningContainer: Container;
    private _beginCreateTime: number = -1;
    private _watingModualOpend = false;

    onResourcesNotReady: (viewType: Function, wait: boolean) => void = null;
    private _waitWindows: WindowContenxInfo[][] = [];
    private _autoShowing = 0;

    maxWindowKeep = 7;
    /**
     * 打开时间超过此时间后，打开等待界面(s)
     */
    waitingModualTime = 1;
    
    // 能否显示等待中的窗口
    canShowWaitingWindowNow = true;

    get camera(): Camera {
        return this._camera;
    }

    private static _instance: UIManager = null;
    public static get instance() {
        if (this._instance == null) {
            this._instance = new UIManager();
        }
        return this._instance;
    }

    public initialize(opts: any = null) {
        this.initializeCanvasNode();
        this.initializeViewHelper(opts);
        this.initializeViews();
        this.initializeLRU();
    }
    
    private initializeCanvasNode() {
        var cnode: any = director.getScene().getChildByName('Canvas');
        game.addPersistRootNode(cnode);
        this._canvasNode = cnode;
        this._camera = this._canvasNode.getComponent(Canvas).cameraComponent;
        GRoot.create();
    }
    
    private initializeViewHelper(opts: any) {
        ViewHelper.instance.initialize(opts);
    }
    
    private initializeViews() {
        this._views[0] = [];
        this._views[1] = [];
        this._views[2] = [];
    }
    
    private initializeLRU() {
        this._lru = new LRU<string, IWindow>({
            max: this.maxWindowKeep,
            dispose: (value, key) => {
                if(!value.visible) {
                    ViewHelper.instance.destoryWindow(value.skin);
                }
            }
        });
    }

    public topWindow(ignoreTopMost?: boolean): IWindow {
        if (this._windows.length == 0) {
            return null;
        }

        if (ignoreTopMost) {
            return this.findTopNonTopMostWindow();
        }

        return this.findTopWindow();
    }

    private findTopNonTopMostWindow(): IWindow {
        for (let i = this._windows.length - 1; i >= 0; i--) {
            let w = this._windows[i];
            if (!w.topMost) {
                return w;
            }
        }

        return null;
    }

    private findTopWindow(): IWindow {
        return this._windows[this._windows.length - 1];
    }

    public allShowWindows(): IWindow[] {
        return this._windows;
    }

    /**
     * 检查是否有窗口显示
     * @returns 
     */
    hasWindow() {
        return this.allShowWindows().some(wnd => wnd._special);
    }

    public preloadWindow(viewType: Function): IWindow {
        return ViewHelper.instance.getSingleWindowByType(viewType);
    }

    private isShowingByType(viewType: Function) {
        return this._windows.some(i => i instanceof viewType);
    }

    public isShowing(window: string | Function | IWindow) {
        if(typeof window == "string") {
            return this.isShowingByType(ViewMap.instance.getByName(window));
        }else if(window instanceof Function) {
            return this.isShowingByType(window);
        }
        return this._windows.includes(window);
    }
    
    public hidePopup(view: IView|GComponent): void {
        const gobj: GComponent = view instanceof GComponent ? view : view.component;
        GRoot.inst.hidePopup(gobj);
    }

    /* 
        Description:
        Show a popup view.

        Parameters:
        - view: The view to be displayed.
        - pos: The relative position of the view.
        - anchorName: The name of the anchor.
        - target: The target component to display.
        - dir: The direction of the popup.
    */
    public showPopup(view: IView|GComponent, pos: Vec2 = null, anchorName: string = null, target: GComponent = null, dir: PopupDirection = PopupDirection.Auto, horAutoAdapt: boolean = true){
        let gobj: GComponent = view instanceof GComponent ? view : view.component;
        let targetPos: Vec2 = pos || new Vec2(0, 0);

        if(target) {
            target.localToGlobal(targetPos.x, targetPos.y, targetPos);
            GRoot.inst.globalToLocal(targetPos.x, targetPos.y, targetPos);
        }

        let anchor:GObject = anchorName ? gobj.getChild(anchorName) : null;
        let rawPos: Vec4 = anchor ? anchor.data || new Vec4(anchor.x, anchor.y, anchor.x / gobj.width, anchor.y / gobj.height) : new Vec4(0, 0, gobj.pivotX, gobj.pivotY);

        let offsetX = 0;
        if (horAutoAdapt) {
            let realWidth = gobj.width * gobj.scaleX;
            let lx = targetPos.x - realWidth * rawPos.z;
            let rx = targetPos.x + realWidth * (1-rawPos.z) - GRoot.inst.width;
            offsetX = rx > 0 ? rx / gobj.scaleX : lx < 0 ? lx / gobj.scaleX : 0;
        }
        
        if (anchor) {
            anchor.setPosition(rawPos.x+offsetX, rawPos.y);
            gobj.setPivot(anchor.x / gobj.width, anchor.y / gobj.height, true);
            offsetX = 0;
        }

        GRoot.inst.showPopup(gobj, target, dir);
        gobj.setPosition(targetPos.x - offsetX, targetPos.y);

        gobj.node.on(Node.EventType.ACTIVE_IN_HIERARCHY_CHANGED, () => {
            if(!gobj.node.activeInHierarchy) {
                let view = gobj["_docker_"];
                if (view) {
                    view.hide();
                }
            }
        });
    }  

    private onHideWindow(wnd: IWindow) {
        if (!wnd) {
            return;
        }

        let idx = this._windows.indexOf(wnd);
        if(idx >= 0) {
            this._windows.splice(idx, 1);

            // 重置模块层颜色
            let topModalWnd = this.topWindow(true);
            if(topModalWnd) {                    
                topModalWnd.bringToFront();
            }  

            if (wnd.canAutoDestory) {
                this._lru.set(wnd.skin.getKey(), wnd);
            }

            // 防止有的窗口在onHideWindow中调用了showWindow，导致窗口列表被修改
            this._autoShowing = 0.5;
        }
    }
    /**
     * 延迟弹出等待中的窗口
     * @param delay 
     */
    public delayPopWaitWindow(delay?: number) {
        this._autoShowing = delay || 0.5;
    }

    public update(dt: number) {
        this.checkWaitWindow(dt);
    }

    /**
     * 检查是否可以显示等待中的窗口
     * @param dt 
     * @returns 
     */
    private checkWaitWindow(dt: number) {
        if(!this.canShowWaitingWindowNow) {
            return;
        }

        this.updateAutoShowing(dt);

        if(this._waitWindows.length > 0) {
            let group = this._waitWindows[0];
            if(group.length > 0) {
                let waitWnd = group[0];
                if(this.canShowWaitWindow(waitWnd)) {
                    this._autoShowing = 0.2;
                    group.shift();
                    this.showWindowX(waitWnd);
                }
            }
            
            if(group.length == 0){
                this._waitWindows.shift();
            }
        }
    }

    private updateAutoShowing(dt: number) {
        if(this._autoShowing > 0) {
            this._autoShowing -= dt;
            this._autoShowing = Math.max(0, this._autoShowing);
        }
    }

    private canShowWaitWindow(waitWnd: any) {
        let backWindow = this._getWaitWindow();
        if(backWindow) {
            let backInfo = WindowPriorityMap.getBySkin(backWindow.skin);
            if(backInfo.group > 0 && backInfo.group == waitWnd.info.group && backInfo.groupLevel < waitWnd.info.groupLevel) {
                // 同一个组，且当前窗口优先级比正在显示的窗口高，则直接显示
                return true;
            }
        }else{
            return true;
        }

        return false;
    }

    private _getWaitWindow() {
        return this._windows.find(wnd => wnd.needBeWait) || null;
    }

    private _hasWindowInWaitQueue(viewType: Function): boolean {
        if (this._windows.some(window => window instanceof viewType)) {
            return true;
        }

        if (this._waitWindows.some(group => group.some(window => window.viewType == viewType))) {
            return true;
        }

        return false;
    }

    static sortWindow(wnd: IWindow) {
        let that = UIManager.instance;
        if (that._windows.length > 0) {
            let startIdx = GRoot.inst.getChildIndex(wnd.window);
            for(let i = 0; i < that._windows.length; i++) {
                let w = that._windows[i];
                if (!wnd.topMost && w.topMost ||
                    wnd.topMost && w.topMost && wnd.topPriority < w.topPriority) {
                    let idx = GRoot.inst.getChildIndex(w.window);
                    if(idx < 0) {
                        that._windows.splice(i, 1);
                        i--;
                        continue;
                    }
                    GRoot.inst.setChildIndex(w.window, startIdx);
                }
                w._index = GRoot.inst.getChildIndex(w.window);
            }
        } else {
            GRoot.inst.bringToFront(wnd.window);
        }

        that._windows.push(wnd);
        that._windows.sort((a, b) => a._index - b._index);
    }

    public showWindow(viewType: string | Function, data: any = null, modal: boolean = true, modalLayerColor = null): IWindow {
        // If viewType is a string, get the corresponding view from ViewMap
        if(typeof viewType === "string") {
            viewType = ViewMap.instance.getByName(viewType);
        }

        // Get the window by its type
        const wnd = ViewHelper.instance.getSingleWindowByType(viewType);

        // Show the window
        return this._showWindow(wnd, data, modal, modalLayerColor);
    }

    getTopModalWindow(): IWindow {
        // Iterate from the end of the _windows array to find the top modal window
        const topModalWindow = this._windows.slice().reverse().find(w => w.modal);

        // Return the top modal window if found, otherwise return null
        return topModalWindow || null;
    }

    /**
     * 检查资源是否准备好
     * @param viewType 
     * @param waitResource 
     * @returns 
     */
    private async checkResourceReady(viewType: Function, waitResource: boolean): Promise<boolean> {
        const skin = Skin.getSkin(viewType);
        if (!skin) {
            console.error(`skin is null, viewType: ${viewType}`);
            return false;
        }

        const packageExists = UIPackage.getByName(skin.packageName);
        if (!packageExists) {
            return true;
        }

        if (waitResource) {
            await FGUIExt.preloadPackage(skin.packageName, "/");
            return true;
        }

        this.onResourcesNotReady?.(viewType, waitResource);
        return false;
    }

    /**
     * 显示窗口, 如果showNow为false，则会在排序后加入等待队列
     * @param context 
     * @param showNow 
     * @returns 
     */
    public async showWindowX(context: WindowContenxInfo, showNow = true): Promise<IWindow> {
        let type = context.viewType as Function;
        if(typeof context.viewType == "string") {
            type = ViewMap.instance.getByName(context.viewType);
        }

        if (!type) {
            console.error(`no window type ${context.viewType}`);
            return null;
        }

        if(context.waitOnResNotReady) {
            let res = await UIManager.instance.checkResourceReady(type, true);
            if(!res) {
                return null;
            }
        }

        if(showNow) {
            return UIManager.instance.showWindow(type, context.data, context.modal, context.modalLayerColor);
        }

        let wndInfo = WindowPriorityMap.getBySkin(Skin.getSkin(type));
        if(this._hasWindowInWaitQueue(type)) {
            // 已经在等待队列中, 或者正在显示，则不再加入等待队列
            return null;
        }

        // 按优先级插入等待队列
        let group = this._waitWindows.find(i => i[0].info.group == wndInfo.group);
        if(!group) {
            group = [];
            this._waitWindows.push(group);
        }

        let insertIndex = group.findIndex(i => i.info.waitPriority > wndInfo.waitPriority);
        if(insertIndex < 0) {
            group.push(context);
        } else {
            group.splice(insertIndex, 0, context);
        }

        if(PREVIEW) {
            for(let i = 0; i < this._waitWindows.length; i++) {
                for(let j = 0; j < this._waitWindows[i].length; j++) {
                    const wnd = this._waitWindows[i][j];
                    const name = typeof wnd.viewType == "string" ? wnd.viewType : wnd.viewType.name;
                    console.log("wait window:", name, wnd.info.waitPriority);
                }
            }
        }

        return null; 
    } 

    private _showWindow(wnd: IWindow, data: any = null, modal: boolean = true, modalLayerColor = null): IWindow {
        if (wnd == null) {
            return null;
        }

        if (this.topWindow() == wnd) {
            return wnd;
        }

        if (this._windows.indexOf(wnd) >= 0) {
            console.error(`dumplicate open window:${wnd.skin?.componentName}`);
            return wnd;
        }

        wnd.modal = modal;
        if(modal) {
            wnd.modalLayerColor.set(modalLayerColor || UIConfig.modalLayerColor);
        }
        wnd.bringToFront();

        wnd.once(Window.EVENT_WINDOW_HIDE, (w) => {
            let idx = this._windows.indexOf(w);
            if (idx >= 0) {
                this._windows.splice(idx, 1);
            }

            this.onHideWindow(w);

            this.emit(UIManager.EVENT_WINDOW_CHANGED, w, false);
        }, this);

        wnd.show(data);        
        UIManager.sortWindow(wnd);

        this.emit(UIManager.EVENT_WINDOW_CHANGED, wnd, true);
        
        let oldWindow = this.topWindow(true);
        if (oldWindow) {
            oldWindow.overlayBy(wnd);
        }
        return wnd;
    }

    setModalLayerColor(color: Color) {
        this._setModalLayerColor(color);  
        this._fadeModelLayerColor();      
    }

    private _setModalLayerColor(color: Color) {
        GRoot.inst.modalLayer.color.set(color);
        GRoot.inst.modalLayer.drawRect(0, Color.TRANSPARENT, color);
    }

    private _setModalLayerAlpha(alpha: number) {
        let color = GRoot.inst.modalLayer.color;
        if(color.a == alpha) {
            return;
        }

        color.a = alpha;
        this._setModalLayerColor(color);
    }

    private _fadeModelLayerColor(from: number = 0, to: number = 200, duration: number = 0.2, windowCount: number = 0) {
        // UIOpacity 需要修改底层代码，怕影响性能，暂时不用
        // let uiOpcity = GRoot.inst.modalLayer.node.getComponent(UIOpacity);
        if (this._windows.length == windowCount) { 
            //首个弹窗才需要播放淡入动画     
            GTween.kill(GRoot.inst.modalLayer);      
            GTween.to(from, to, duration).setTarget(GRoot.inst.modalLayer).onUpdate((t) => {
                // uiOpcity.opacity = t.value.x;
                this._setModalLayerAlpha(t.value.x);
            }, this);
        } else {
            // uiOpcity.opacity = 200;
            this._setModalLayerAlpha(to);
        }
    }

    public hideWindow(viewType: string | Function, dispose = false, code?: number) {
        if(typeof viewType == "string") {
            viewType = ViewMap.instance.getByName(viewType);
        }

        var wnd = ViewHelper.instance.getSingleWindowByType(viewType);
        if (wnd == null) {
            return;
        }

        wnd.hide(code);
        if (dispose) {
            ViewHelper.instance.destoryWindow(wnd.skin);
        }
    }

    public async waitWindow(viewType: string | Function, data: any = null, modal: boolean = true, modalLayerColor = null) {
        if(typeof viewType == "string") {
            viewType = ViewMap.instance.getByName(viewType);
        }

        let wnd = this.showWindow(viewType, data, modal, modalLayerColor) as Window;
        let next = false;
        wnd.once(Window.EVENT_WINDOW_HIDE, () => {
            next = true;
        }, this);
        await UtilsHelper.until(() => next);
        return wnd.exitCode;
    }

    public hideCurrentWindow(dispose: boolean = false, code?: number, ignoreTopMost?: boolean): IWindow {
        const wnd = this.topWindow(ignoreTopMost);
        if (!wnd) {
            return null;
        }

        wnd.hide(code);

        const idx = this._windows.indexOf(wnd);
        if (idx >= 0) {
            this._windows.splice(idx, 1);
            this.onHideWindow(wnd);
        }

        if (dispose) {
            ViewHelper.instance.destoryWindow(wnd.skin);
        }

        return wnd;
    }

    public hideAllWindow(code?: number) {
        this._windows.forEach(v => {
            v.hide(code);
        });
        this._windows.length = 0;

        GRoot.inst.closeAllWindows();
    }

    public go(viewType: string | Function, data?: any, layer = ELayer.UI): IActivity {
        return this.push(viewType, data, layer, true);
    }

    public push(viewType: string | Function, data?: any, layer = ELayer.UI, popTop = false): IActivity {
        if (!viewType) {
            console.error("can not push undefined viewType!");
            return null;
        }

        if(typeof viewType === "string") {
            viewType = ViewMap.instance.getByName(viewType);
        }

        let views = this._views[<number>layer];
        let curView: IActivity;

        if (views.length > 0) {
            curView = views[views.length - 1];

            if (curView && viewType === curView.constructor) {
                return curView;
            }
        }

        let nextView = ViewHelper.instance.getSingleViewByType(viewType, layer);

        let pause = () => {
            if (curView) {
                if (!popTop) {
                    curView.pause();
                } else {
                    this._pop(layer, false, true);
                }
            }
        };

        let enter = (data: any) => {
            if (nextView != null) {
                views.push(nextView);
                nextView.data = data;

                if (curView) {
                    // 将当前视图移动至上层
                    let nextgo = nextView.viewObject.container;
                    nextgo.parent.setChildIndex(nextgo, nextgo.parent.numChildren);
                }

                nextView.enter(data);
            }
        };

        pause();
        enter(data);

        this.emit(UIManager.EVENT_ACTIVITY_CHANGED, layer, curView, nextView);

        return nextView;
    }

    public popTo(viewType: Function, layer: ELayer = ELayer.UI, data: any = null) {
        let top = this.peekOrNull(layer);
        while (!(top instanceof viewType)) {
            top = this.peekOrNull2();
            this._pop(layer, top instanceof viewType, false, data);
            top = this.peekOrNull(layer);
            if (!top) {
                break;
            }
        }
    }

    private _pop(layer: ELayer = ELayer.UI, withResume = true, beforePush = false, data: any = null): IActivity {
        let views = this._views[<number>layer];
        if (views.length > 0 || beforePush) {
            let preView: IActivity = views.pop();
            let preType: Skin = preView.skin;

            let exit = () => {
                preView.exit();
                if (preView.disposeOnExit) {
                    //销毁
                    ViewHelper.instance.destroyView(preType);
                }
            };

            let curView: IActivity = views.length > 0 ? views[views.length - 1] : null;

            let resume = (data: any) => {
                if (curView) {
                    curView.resume(data);
                }
            }

            exit();
            if (withResume) {
                resume(data);
            }

            this.emit(UIManager.EVENT_ACTIVITY_CHANGED, layer, preView, curView);

            return curView;
        }
    }

    public pop(layer: ELayer = ELayer.UI, data: any = null): IActivity {
        return this._pop(layer, true, false, data);
    }

    public getViewCount(layer: ELayer = ELayer.UI): number {
        return this._views[<number>layer].length;
    }

    public peekOrNull(layer: ELayer = ELayer.UI): IActivity {
        let views = this._views[<number>layer];
        if (views.length > 0) {
            return views[views.length - 1];
        }
        return null;
    }

    public peekOrNull2(layer: ELayer = ELayer.UI): IActivity {
        let views = this._views[<number>layer];
        if (views.length > 1) {
            return views[views.length - 2];
        }
        return null;
    }

    on(type: string, listener: Function, target?: any): void {
        this._canvasNode.on(type, listener, target);
    }

    once(type: string, listener: Function, target?: any): void {
        this._canvasNode.once(type, listener, target);
    }

    off(type: string, listener?: Function, target?: any): void {
        this._canvasNode.off(type, listener, target);
    }

    targetOff(target: any): void {
        this._canvasNode.targetOff(target);
    }

    emit(type: string, ...data: any): void {
        this._canvasNode.emit(type, ...data);
    }

    onContainerCreate(container: Container) {
        this._currentOpeningContainer = container;
        this._beginCreateTime = Date.now();

        if (this._currentOpeningContainer?.enableWating) {
            Timer.inst.frameLoop(1, this.onContainerChecker, this);
        }
    }

    private onCreateEnd() {
        if (this._currentOpeningContainer?.enableWating) {
            this.emit(UIManager.EVENT_NEED_CLOSE_WATING, this._currentOpeningContainer);
        }

        this._currentOpeningContainer = null;
        this._beginCreateTime = -1;
        this._watingModualOpend = false;
        Timer.inst.clear(this.onContainerChecker, this);
    }

    private onContainerChecker() {
        if (this._currentOpeningContainer) {
            if (!this._watingModualOpend) {
                let duration = Date.now() - this._beginCreateTime;
                if (duration >= this.waitingModualTime * 1000) {
                    this.emit(UIManager.EVENT_NEED_OPEN_WATING, this._currentOpeningContainer);
                    this._watingModualOpend = true;
                }
            } else if (this._currentOpeningContainer.isCreated) {
                this.onCreateEnd();
            }
        }
    }
}