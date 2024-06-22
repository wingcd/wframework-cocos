import { IActivityProxy } from "./IActivityProxy";
import { GButton } from "fairygui-cc";
import { UIPackage } from "fairygui-cc";
import { GComponent } from "fairygui-cc";
import { GLoader } from "fairygui-cc";
import { GList } from "fairygui-cc";
import { GObject } from "fairygui-cc";
import { BaseActivityController, EActivityStatus } from "../controller/BaseActivityController";
import View from "../../view/View";
import IContainer from "../../view/interface/IContainer";
import { EventCenter } from "../../common/EventCenter";

export type GContainer = GLoader | GComponent | GList;

export type ProxyContext = {
    indexInList?: number;
    // 是否适配父节点高度
    adaptHeight?: boolean;
    adaptWidth?: boolean;
    viewCreateCallback?: (view: View) => void;
    viewDisposeCallback?: () => void;
    canShowView?: () => boolean;
    enterView?: GComponent;
    needUpdateView?: boolean;
    disposeOnClose?: boolean;
}

export class BaseActivityProxy implements IActivityProxy {
    protected _holder?: GContainer;
    protected _opened = false;
    private _name: string;
    protected _parent: IContainer;
    protected enterView: View;
    protected enterViewComponent: string = "BtnEnter";
    protected enterViewType: typeof View = EnterButton;
    protected context: ProxyContext;
    protected declare ctrl: BaseActivityController;
    private _enable: boolean = false;
    protected needOpenOnPreview: boolean = true;

    get name(): string {
        return this._name;
    }

    get enable() {
        return this._enable;
    }

    get opened(): boolean {
        return this._opened;
    }

    constructor(name: string, ctrl: BaseActivityController, parent: IContainer, holder: GContainer, ctx?: ProxyContext) {
        this._name = name;
        this._holder = holder;
        this._parent = parent;
        this.context = ctx || {};
        this.context.indexInList = this.context.indexInList ?? -1;
        this.ctrl = ctrl;
        if(this.context.enterView) {
            this.context.enterView.visible = false;
        }
        if(this.context.disposeOnClose == undefined) {
            this.context.disposeOnClose = true;
        }

        EventCenter.I.on(BaseActivityController.ACTIVITY_STATUS_CHANGE, this.onActivityStatusChanged, this);
        EventCenter.I.on(BaseActivityController.ACTIVITY_CONTROLLER_REGISTED, this.onControllerRegisted, this);
    }

    private onControllerRegisted(controller: BaseActivityController) {
        if(controller == this.ctrl) {
            this.checkOpen();
        }
    }

    private onActivityStatusChanged(proxy: BaseActivityController, status: number, oldStatus: number) {
        if(proxy == this.ctrl) {
            // 需要先执行，防止有状态切换
            this.onStatusChanged(status, oldStatus);

            if(!this.checkOpen()) {
                this.close();
            }
        }
    }

    protected onStatusChanged(status: number, oldStatus: number) {
    }

    protected create() {        
        this.checkOpen();
    }

    private checkOpen() {
        if(!this.isOpening()) {
            return false;
        }
        // 需要检查是否加载资源
        this.ctrl.loadRes(() => {
            this.open();
        }, this);
        return true;
    }

    regist(): IActivityProxy {
        this.onRegist();
        return this;        
    }
    
    unregist(destoryEnterView?: boolean): void {   
        if (destoryEnterView) {
            this.close(true);
        }     
        this.onUnregist();
    }    

    protected isOpening() {
        if(this.needOpenOnPreview) {
            return this.ctrl.status != EActivityStatus.NotOpen && this.ctrl.status != EActivityStatus.End;
        }
        return this.ctrl.status == EActivityStatus.Opening || 
               this.ctrl.status == EActivityStatus.PreEnd;
    }

    protected onCreateView() {
        if(!this.enterView && (this.enterViewComponent || this.context.enterView) && this.enterViewType) {
            let view: GObject = this.context.enterView;
            if(!view) {
                let pkgName = this.ctrl.config.pkgName;
                if(this._holder instanceof GLoader) {
                    let url = UIPackage.getItemURL(pkgName, this.enterViewComponent);
                    this._holder.url = url;
                    view = this._holder.component;
                }else{
                    view = UIPackage.createObject(pkgName, this.enterViewComponent);
                    if(this.context.indexInList >= 0) {
                        this._holder.addChildAt(view, this.context.indexInList);
                    }else{
                        this._holder.addChild(view);
                    }
                }
            }else{
                view.visible = true;
            }

            this.enterView = new this.enterViewType();
            this.enterView.inject(view);
            this.enterView.injectSource = this._parent;
            this._parent.addView(this.enterView);
            this.enterView.show(null, false);

            this.layoutParent();

            if(this.context.viewCreateCallback) {
                this.context.viewCreateCallback(this.enterView);
            }
        }
    }

    protected layoutParent() {
        if ((this.context.adaptHeight || this.context.adaptWidth) && this._holder) {
            if(this._holder instanceof GComponent) {
                if(this._holder.scrollPane) {
                    this._holder.ensureBoundsCorrect();
                    if(this.context.adaptHeight) {
                        this._holder.height = this._holder.scrollPane.contentHeight;   
                    }

                    if(this.context.adaptWidth) {
                        this._holder.width = this._holder.scrollPane.contentWidth;
                    }
                }else if(this.enterView){
                    if(this.context.adaptHeight) {
                        this._holder.height = this.enterView.component.height;
                    }

                    if(this.context.adaptWidth) {
                        this._holder.width = this.enterView.component.width;
                    }
                }else{
                    if(this.context.adaptHeight) {
                        this._holder.height = 0;
                    }

                    if(this.context.adaptWidth) {
                        this._holder.width = 0;
                    }
                }             
            }else if(this._holder instanceof GLoader) {
                if(this.context.adaptHeight) {
                    this._holder.component.height = this._holder.height;
                }

                if(this.context.adaptWidth) {
                    this._holder.component.width = this._holder.width;
                }
            }
        }
    }

    /**
     * 打开活动, 资源加载完成后调用
     * @returns 
     */
    private open(): void {
        if(this._opened) {
            return;
        }
        this._opened = true;      

        this.onCreateView();
        this.onOpen();
    }

    /**
     * 关闭活动, 会卸载资源
     * @returns 
     */
    private close(forceDispose?: boolean): void {
        if(!this._opened) {
            return;
        }

        this._opened = false;

        this.onClose();

        // 卸载资源
        if(this.context.disposeOnClose || forceDispose) {
            this.enterView.dispose();
            this.enterView = null;

            if(this.context.viewDisposeCallback) {
                this.context.viewDisposeCallback();
            }
        }

        this.layoutParent();
    }

    public dispose() {
        if(this.enterView) {
            this.enterView.dispose();
            this.enterView = null;
        }
        this.setEnable(false);
        if(this.context.viewDisposeCallback) {
            this.context.viewDisposeCallback();
        }
    }
    
    update(dt: number, secondTick: boolean): void {
        if(!this._opened) {
            return;
        }

        //@ts-ignore
        if(this.enterView && this.context.needUpdateView && this.enterView.onUpdate) {
            //@ts-ignore
            this.enterView.onUpdate(dt, secondTick);
        }

        this.onUpdate(dt, secondTick);
    }

    setEnable(enable: boolean) {
        if(this._enable == enable) {
            if(this.enterView && this.enterView.visible != enable) {
                if(this.enterView) {
                    this.enterView.visible = enable;
                }
                this.layoutParent();
            }
            return;
        }

        if(enable) {
            this.onEnable();
        }else{
            this.onDisable();
        }
        this._enable = enable;
        
        if(this.enterView) {
            this.enterView.visible = enable;
        }
        this.layoutParent();
    }    

    protected onRegist() {

    }

    protected onUnregist(destoryEnterView?: boolean) {
        
    }

    protected onOpen() {
        if(this.enterView) {
            this.enterView.visible = this.context.canShowView ? this.context.canShowView() : true;
        }
    }

    protected onClose() {
        if(this.enterView) {
            this.enterView.visible = false;
        }
    }

    protected onUpdate(dt: number, secondTick: boolean) {
    }

    protected onEnable() {
       
    }

    protected onDisable() {

    }
}

export class EnterButton extends View {
    protected btn: GButton;

    protected onCreate(data?: any) {
        super.onCreate(data);

        this.btn = this.component as GButton;
        this.btn.onClick(this.onClick, this);
    }

    protected onClick() {
        
    }
}