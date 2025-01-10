import { DEBUG } from "cc/env";
import { EventCenter } from "../../../framework/common/EventCenter";
import { StorageManager } from "../../../framework/common/StorageManager";
import { GameConst } from "../../const/GameConst";
import { GameEvent } from "../../const/GameEvent";
import { BaseController } from "../../../framework/modules/base/BaseController";
import { ControllerManager, UserStorageType } from "../ControllerManager";

class ServerController extends BaseController {
    private _beatheartTime = 0;
    private _dataSaveTime = 0;

    protected onInitial() {
        EventCenter.I.on(GameEvent.GAME_ON_HIDE, this.onGameHide, this);
        EventCenter.I.on(GameEvent.GAME_ON_SHOW, this.onGameShow, this);
    }

    private onGameShow() {
        // 强行心跳一次
        this.beatheart();
    }

    private onGameHide() {
        // 本地保存
        ControllerManager.forceSave();
        // 上传服务器
        this.saveToServer();
    }

    protected onUpdate(dt: number) {
        this._beatheartTime += dt;
        if (this._beatheartTime >= GameConst.BEAT_HEART_TIME) {
            this._beatheartTime = 0;
            this.beatheart();
        }

        this._dataSaveTime += dt;
        if (this._dataSaveTime >= GameConst.DATA_SAVE_TIME) {
            this._dataSaveTime = 0;
            this.saveToServer();
        }
    }

    /**
     * 上传用户数据档
     */
    async saveToServer() {
        if (DEBUG || !StorageManager.enableSave) {
            return Promise.resolve(0);
        }

        // 上传数据
    }

    /**
     * 下载用户数据档，需要在登录成功后且本地数据档已经加载完成后调用
     */
    async loadFromServer() {
        if (DEBUG) {
            return true;
        }
        // 从服务器下载数据, 成功后覆盖本地数据
        // ControllerManager.setUserStorage(data, true);
        return true;
    }

    /**
     * 清除用户数据档
     */
    async clearServerData() {
        if (DEBUG) {
            ControllerManager.clearData();
            return true;
        }
        
        // 清除服务器数据
    }

    /**
     * 心跳
     * @returns 
     */
    async beatheart() {
        if (DEBUG) {
            return;
        }
        console.log("心跳...");
        return;
    }
}

export const serverController = new ServerController();