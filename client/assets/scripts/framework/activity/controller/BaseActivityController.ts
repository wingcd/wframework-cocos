import { EventHandler } from "../../common/EventHandler";
import { EventCenter } from "../../common/EventCenter";
import { LoaderHelper } from "../../common/LoaderHelper";
import { GameSettings } from "../../GameSettings";

export enum EActivityStatus {
    // 未开启 (无需加载资源)
    NotOpen = 0,
    // 等级不足预览 (需加载资源)
    PreLimit = 1,
    // 预告开启（需加载资源）
    PreOpen = 2,
    // 开启中（需加载资源）
    Opening = 3,
    // 预告结束（需加载资源）
    PreEnd = 4,
    // 结束（卸载资源）
    End = 5,
}

export type ControllerConfig = {
    abName?: string;
    pkgName?: string;
    // 开启(opening)后不再检查
    onceCheck?: boolean;
    disposeOnClose?: boolean;
    // 是否需要支付, 默认为true, 关闭支付的情况下，不检查
    hasPay?: boolean;
}

export class BaseActivityController {
    public static ACTIVITY_STATUS_CHANGE = "ACTIVITY_STATUS_CHANGE";
    public static ACTIVITY_CONTROLLER_REGISTED = "ACTIVITY_CONTROLLER_REGISTED";

    public beforeCreate: EventHandler = new EventHandler();

    public name: string;
    protected _status: EActivityStatus = EActivityStatus.NotOpen;
    private _realStatus: EActivityStatus = EActivityStatus.NotOpen;
    private _oldStatus: EActivityStatus = EActivityStatus.NotOpen;
    private _config: ControllerConfig;
    private _loader: LoaderHelper;
    protected _needCheck = true;
    private _first = true;

    get config() {
        return this._config;
    }

    constructor(name: string) {
        this.name = name;
    }

    public get loading() {
        return this._loader.loading;
    }

    public get loaded() {
        return this._loader.loaded;
    }

    protected create(config: ControllerConfig) {
        this.beforeCreate.fire();

        this._config = config || {};
        if (this._config.disposeOnClose == undefined) {
            this._config.disposeOnClose = true;
        }

        if (this._config.hasPay == undefined) {
            this._config.hasPay = true;
        }

        this._loader = new LoaderHelper(this._config.abName, this._config.pkgName, this.sendChangeEvent, this);
    }

    public get status(): EActivityStatus {
        return this._status;
    }

    public doRegist() {
        // 需要先执行，否则有些数据未初始化
        this.onRegist();
        // 初始化状态
        // this.checkState(true);

        EventCenter.I.emit(BaseActivityController.ACTIVITY_CONTROLLER_REGISTED, this);
    }

    protected onRegist() {
    }

    public setStatus(status: EActivityStatus) {
        this._status = status;
    }

    public update(dt: number, secondTick: boolean) {
        this.checkState();

        if (secondTick) {
            LoaderHelper.tick();
        }
    }

    private doLoad() {
        this._realStatus = this.status;
        if (this.needLoadRes()) {
            this._loader.load();
        } else {
            this.sendChangeEvent();
        }
    }

    private checkState() {
        if (!this._needCheck) {
            return;
        }

        // 关闭支付的情况下，不检查
        if (this._config.hasPay) {
            return;
        }

        let oldStatus = this._oldStatus;
        this.onUpdateStatus();
        if (this._first) {
            this._realStatus = this.status;
            this._oldStatus = this.status;
            this._first = false;

            if (oldStatus == EActivityStatus.NotOpen && this._realStatus != EActivityStatus.NotOpen && this._realStatus != EActivityStatus.End) {
                this.doLoad();
            }
        } else {
            if (oldStatus != this.status) {
                this.doLoad();
            }
        }
    }

    public loadRes(callback?: () => void, thisObj?: any) {
        this._loader.loadRes(callback, thisObj);
    }

    protected onUpdateStatus() {

    }

    protected needLoadRes() {
        return this.status != EActivityStatus.NotOpen && this.status != EActivityStatus.End;
    }

    private sendChangeEvent(): void {
        this.onRealStateChange(this._realStatus, this._oldStatus);
        this._status = this._realStatus;
        this._oldStatus = this._realStatus;
        EventCenter.I.emit(BaseActivityController.ACTIVITY_STATUS_CHANGE, this, this._realStatus, this._oldStatus);

        if (this._status == EActivityStatus.End) {
            this.onClose();
        } else if (this._status == EActivityStatus.Opening) {
            if (this._config.onceCheck) {
                this._needCheck = false;
            }
        }
    }

    protected onRealStateChange(status: EActivityStatus, oldStatus: EActivityStatus) {

    }

    private onClose() {
        // 卸载资源
        if (this._config.disposeOnClose) {
            this._loader.dispose();
        }
    }
}