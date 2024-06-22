import {Window as FWindow, UIPackage, GComponent, GRoot }  from "fairygui-cc";
import { IInjectInfo, InjectObject } from "./interface/IInjectInfo";
import Skin from "./Skin";
import SkinHelper from "./SkinHelper";
import IWindow from "./interface/IWindow";
import Container from "./Container";
import { Color, Event, SpriteFrame, game } from "cc";
import { UIManager } from "./UIManager";
import { UtilsHelper } from "../common/UtilsHelper";
import { Timer } from "../common/Timer";
import { GLoader } from "fairygui-cc";
import { NATIVE } from "cc/env";
import { CaptureHelper } from "../plugins/capture/CaptureHelper";
import { LoaderFillType } from "fairygui-cc";
import { SoundManager } from "../common/SoundManager";

export default class Window extends Container implements IWindow, IInjectInfo{
    static EVENT_WINDOW_BEFORE_HIDE = "onwindowbeforehide";
    static EVENT_WINDOW_HIDE = "onwindowhide";
    static defaultShowAudioSource: string|number = 0;
    static defaultHideAudioSource: string|number = 0;
    
    _special: boolean = false;
    _index: number = 0;

    canAutoDestory = true;
    window: FWindow;
    modal: boolean = true;
    data: any;
    topMost: boolean = false;
    topPriority: number = 0;
    enableTapClose: boolean;
    enableClose = true;
    hideOnOverlay = false;
    canShowBanner = false;

    /**
     * 为true时将会等待动画完成调用onShow,[onHide强制等待]
     */
    waitAnimation = false;
    safeTopMargin: number = 0;
        
    injectInfos: InjectObject = {};

    private _component: GComponent;
    private _updating = false;
    private _secondTicker = 0;
    private _enableUpdate = false;
    private _exitCode = 0;
    private _isShowing = false;
    private _modalLayerColor = new Color;
    
    /**
     * 此模式下，窗口背景将会被截图，用于提高性能(ios下有问题，先关闭)
     */
    protected preformanceMode = false;
    /**
     * 标记为全屏模式，此模式下，表明activity完全不可见，activity将会被隐藏
     */
    protected fullMode = false;
    private _preformanceBG: GLoader = null;

    protected contentAsFrame = false;

    protected enableDefaultAudio = true;
    protected hideAudioSource: string|number = 0;
    protected shownAudioSource: string|number = 0;
    
    protected _needBeWait = false;
    get needBeWait() {
        return this._needBeWait;
    }

    get component(): GComponent {
        return this._component;
    }    

    get visible(): boolean {
        return this.window.visible;
    }

    get exitCode() {
        return this._exitCode;
    }

    get isShowing() {
        return this._isShowing;
    }

    get modalLayerColor() {
        return this._modalLayerColor;
    }
    
    private _skin:Skin;
    get skin(): Skin {
        if(!this._skin) {
            this._skin = Skin.getSkin((this as any).constructor);
        }
        return this._skin;
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

    get bringToFontOnClick() {
        return this.window?.bringToFontOnClick;
    }

    set bringToFontOnClick(val: boolean) {
        if(this.window) {
            this.window.bringToFontOnClick = val;
        }
    }

    inject(go: GComponent, data?: any) {
        //@ts-ignore
        this.beginCreate();
        UIManager.instance.onContainerCreate(this);
          
        this._component = go;   

        this.onInitial();

        var content = go;
        if(this.contentAsFrame) {
            content = new GComponent();
            content.setPosition(go.x, go.y);
            content.setSize(go.width, go.height);
            content.setPivot(go.pivotX, go.pivotY);

            content.addChild(go);
            go.setPosition(0, 0);
            go.name = "frame";
        }

        this.window = new FWindow();
        this.window.data = this;
        this.window.contentPane = content;

        SkinHelper.InjectView(go, this);

        if(this.fullMode) {            
            this.window.makeFullScreen();
        }
        this.window.center(); 
        this.bringToFontOnClick = false;

        this.onAfterInitial();
        
        let ret = this.onCreate();  
        if(ret instanceof Promise) {
            (async ()=>{
                await ret;
                //@ts-ignore
                this.endCreate();
            })
        }else{
            //@ts-ignore
            this.endCreate();
        }
    }    

    private async enterPreformance() {
        if(!NATIVE && this.preformanceMode && !this.fullMode) {
            // 截图
            let bg = await CaptureHelper.captureFullScreen();
            let sf = new SpriteFrame();
            sf.texture = bg;
            bg.addRef();
            let image = new GLoader();
            image.texture = sf;
            sf.addRef();
            image.setSize(GRoot.inst.width, GRoot.inst.height);
            image.fill = LoaderFillType.ScaleFree;
            GRoot.inst.addChildAt(image, 0);

            this._preformanceBG = image;
        }
        
        if(this.fullMode && this.preformanceMode) {
            let curAcivity = UIManager.instance.peekOrNull();
            if(curAcivity) {
                curAcivity.pause();
            }
        }
    }

    private async exitPreformance() {
        if(this._preformanceBG) {
            this._preformanceBG.texture.texture.destroy();
            this._preformanceBG.texture.destroy();
            this._preformanceBG.dispose();
            this._preformanceBG = null;
        }

        if(this.fullMode && this.preformanceMode) {
            let curAcivity = UIManager.instance.peekOrNull();
            if(curAcivity) {
                curAcivity.resume(curAcivity.data);
            }
        }
    }

    initial() {     
        UIPackage.addPackage(this.skin.path);
        let go = UIPackage.createObject(this.skin.packageName, this.skin.componentName);
        this.inject(go.asCom);
    }    

    setModalLayerColor(color: Color) {
        GRoot.inst.modalLayer.color.set(color);
        GRoot.inst.modalLayer.drawRect(0, Color.TRANSPARENT, color);
    }

    overlayBy(otherWindow: IWindow) {
        if(this.hideOnOverlay) {
            this.component.visible = false;
        }

        this.onOverlayBy(otherWindow);
    }

    bringToFront() {
        if(this.modal) {
            this.setModalLayerColor(this._modalLayerColor);
        }
        this.onBringToFront();

        this.component.visible = true;
    }

    show(data?: any) {
        //@ts-ignore
        this._isShown = false;
        this._exitCode = 0;
        this.component.visible = true;

        this.data = data;
        this.window.visible = true;
        this.window.modal = this.modal;

        this._isShowing = true;
        let ret = this.onBeforeShow(data);  
        if(ret instanceof Promise) {
            (async ()=>{
                await ret;
                await this.internalShow(data, false);
            })();
        }else{
            this.internalShow(data, false);
        }
    }   

    protected showImmediately() {
        this.window.show();
    } 

    protected async internalShow(data: any, immediately: boolean) {
        this.enterPreformance();

        this.window?.show();
        if (immediately) {
            this.showImmediately();
        } else {
            let ret = this.playShowAnimation();
            if (ret instanceof Promise) {
                if (this.waitAnimation) {
                    await ret;
                } else {
                    (async () => {
                        await ret;
                        this._isShowing = false;
                    })();
                }
            }
            this._isShowing = false;
        }

        this.children.forEach(view => {
            view.show(data, false);
        });

        this.safeAlign();

        let ret = this.onShown(data);
        if (ret instanceof Promise) {
            await ret;
        }
        //@ts-ignore
        this.endShown();
        this.registTap();
        this.setUpdateEnable(this.enableUpdate);

        const audioSource = this.shownAudioSource || (this.enableDefaultAudio ? Window.defaultShowAudioSource : 0);
        if (audioSource) {
            SoundManager.instance.playSound(audioSource);
        }
    }


    private safeAlign() {
        if(this.safeTopMargin > 0) {
            let offsetY = this.component.height * this.component.pivotY;
            let top = this.component.y - offsetY;
            if(top < this.safeTopMargin) {
                this.component.y = this.safeTopMargin + offsetY;
            }
        }
    }

    private getModualLayer() {
        return this.modal ? GRoot.inst.modalLayer : UIManager.instance.peekOrNull().component;
    }

    protected async registTap() {
        await UtilsHelper.oneframe();
        if(this.enableTapClose) {
            let comp = this.getModualLayer();
            comp.onClick(this.modualClick, this);
        }
    }

    private clearModualClick() {
        let comp = this.getModualLayer();
        comp.offClick(this.modualClick, this);
    }

    private async modualClick(event: Event) {
        let topWindow = UIManager.instance.getTopModalWindow();
        // 等待一帧，防止点击多窗口同时关闭
        await UtilsHelper.oneframe();
        if(topWindow == this) {
            UIManager.instance.hideCurrentWindow(false, null, true);
            this.clearModualClick();
        }
    }

    protected async playShowAnimation() {
    }

    protected async playHideAnimation() {

    }

   protected async internalHide(hideImmediately: boolean, code?: number) {
        this._exitCode = code || 0;
        this._component.touchable = false;        
        this.setUpdateEnable(false);
        
        this.clearModualClick();
        this.clearEventCenter();

        this.exitPreformance();

        this.onBeforeHide();
        
        this.emit(Window.EVENT_WINDOW_BEFORE_HIDE, this);

        if(hideImmediately) {
            this.hideImmediately();
        } else {
            await this.playHideAnimation();
        }

        this.children.forEach(view => {
            view.hide(false);
        });

        this.onHide();
            
        this.window.visible = false;
        this._component.touchable = true;
        this.emit(Window.EVENT_WINDOW_HIDE, this);

        const audioSource = this.hideAudioSource || (this.enableDefaultAudio ? Window.defaultHideAudioSource : 0);
        if(audioSource) {
            SoundManager.instance.playSound(audioSource);
        }
    }

    protected hideImmediately() {
        if(this.enableClose) {
            this.window.hide();
        }
    }

    hide(code?: number) {
        this.internalHide(true, code);
    }

    dispose() {
        if(this._destoried) {
            return;
        }
        this._destoried = true;

        this.clearEventCenter();

        this.children.forEach(view => {
            view.dispose();
        });

        if(this.window) {
            this.window.dispose();
        }

        this.onDispose();
    }

    registInfos():void{

    }

    makeFullScreen() {
        this.window.makeFullScreen();
        let y = (GRoot.inst.height - this.window.height) / 2;
        this.window.y = y;
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

    private update() {      
        let dt = game.deltaTime * 1000;
        this._secondTicker += dt;
        let seconds = false;
        if(this._secondTicker >= 1000) {
            seconds = true;
            this._secondTicker = 0;
        }

        this.onUpdate(dt / 1000, seconds);
    }

    //////////////////////////////////////////////////////////////////////////

    protected onInitial() {

    }

    protected onAfterInitial() {

    }

    protected onCreate(data?: any): void | Promise<void> {
        
    }

    protected onBeforeShow(data: any): void | Promise<void> {

    }

    protected onShown(data: any): void | Promise<void> {

    }

    protected onBeforeHide() {

    }

    protected onHide() {

    }

    protected onBringToFront() {

    }

    protected onOverlayBy(otherWindow: IWindow) {
        
    }

    protected onDispose() {

    }

    protected onUpdate(dt: number, secondTick: boolean) {

    }
}