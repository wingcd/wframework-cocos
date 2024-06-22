import { director, game } from "cc";
import { DEBUG } from "cc/env";
import { StorageManager } from "../common/StorageManager";
import { BaseController } from "../../framework/modules/base/BaseController";
import { secretController } from "../../framework/modules/base/SecretController";
import { systemController } from "./system/SystemController";
import { PlatformSDK } from "../platform/PlatformSDK";
import { GameSettings } from "../GameSettings";

export type UserStorageType = {
    version: string,
    serialized: number,
    time: number,
    modules: { [key: string]: any },
}

export class ControllerManager {
    private static _ctrls: BaseController[] = [];
    private static _controllerMap: { [key: string]: BaseController } = {};
    protected static lastSaveTime: number = 0;

    static get controls() {
        return this._ctrls;
    }

    static getController<T extends BaseController>(key: string): T {
        return this._controllerMap[key] as T;
    }

    static get controllerMap() {
        return this._controllerMap;
    }

    static regist() {
        // 需要最先加载，后面有数据需要验证
        this._ctrls.push(secretController);
        this._ctrls.push(systemController);
        
        this.onRegistControllers();

        for (let i = 0; i < this._ctrls.length; i++) {
            let ctrl = this._ctrls[i];
            ctrl.load();

            if (ctrl.dataKey) {
                this._controllerMap[ctrl.dataKey] = this._ctrls[i];
            } else {
                console.info("controller dataKey is null", ctrl);
            }
        }
    }

    protected static registController(ctrl: BaseController) { 
        this._ctrls.push(ctrl);
    }

    protected static onRegistControllers() {

    }

    static initial() {
        for (let i = 0; i < this._ctrls.length; i++) {
            this._ctrls[i].initial();
        }
        this.onInitial();
    }

    protected static onInitial() {
            
    }

    static update(dt: number) {
        for (let i = 0; i < this._ctrls.length; i++) {
            if (this._ctrls[i] == secretController) {
                continue;
            }
            this._ctrls[i].update(dt);
        }
        // 中间验证数据可能会被保存多次，放到最后，简单的优化一下
        secretController.update(dt);
    }

    /**
     * 加载数据后是否验证成功
     */
    static get isValidate() {
        for (let i = 0; i < this._ctrls.length; i++) {
            if (!this._ctrls[i].isValidate) {
                console.info("controller validate fail", this._ctrls[i].dataKey);
                return false;
            }
        }
        return true;
    }

    static clearData() {
        StorageManager.enableSave = false;

        for (let i = 0; i < this._ctrls.length; i++) {
            this._ctrls[i].reset();
        }

        director.pause();
        localStorage.clear();
        if (DEBUG) {
            location.reload();
        } else {
            game.end();
            if (PlatformSDK.inMiniGame) {
                PlatformSDK.restartMiniProgram({});
            }
        }
    }

    /**
     * 获取用户存档数据
     * @param serialize 
     * @param checkServerDirty 
     * @returns 
     */
    static getUserStorage(serialize: boolean = false, checkServerDirty: boolean = false): UserStorageType {
        let ret = {
            version: GameSettings.version,
            serialized: serialize ? 1 : 0,
            time: systemController.getTimeMS(),
            modules: {},
        };

        let dirty = false;
        for (let i = 0; i < this._ctrls.length; i++) {
            let ctrl = this._ctrls[i];
            if (!checkServerDirty || checkServerDirty && ctrl.serverDirty) {
                ctrl.getModelData(ret.modules, serialize);
                dirty = true;
            }
        }
        return dirty ? ret : null;
    }

    /**
     * 设置用户存档数据
     * @param data 
     * @param replace 
     * @param deserialize 
     */
    static setUserStorage(data: UserStorageType, replace: boolean = false) {
        if (data.modules) {
            let keys = Object.keys(data.modules);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                let ctrl = this._controllerMap[key];
                if (!ctrl) continue;
                ctrl.setModelData(data.modules, replace, data.serialized == 1);
                ctrl.isValidate = true;
            }
        }

        this.onUserStorageChanged();
    }

    protected static onUserStorageChanged() {
            
    }

    /**
     * 强制本地保存数据
     */
    static forceSave() {
        for (let i = 0; i < this._ctrls.length; i++) {
            let ctrl = this._ctrls[i];
            ctrl.save(true, true);
        }
    }

    /**
     * 清除存档脏数据标记
     */
    static clearServerDirty() {
        for (let i = 0; i < this._ctrls.length; i++) {
            let ctrl = this._ctrls[i];
            ctrl.clearServerDirty();
        }
    }
}