import { EventCenter } from "../../../framework/common/EventCenter";
import { SoundManager } from "../../../framework/common/SoundManager";
import { GameEvent } from "../../const/GameEvent";
import { BaseController } from "../../../framework/modules/base/BaseController";
import { settingsDAO } from "./SettingsDAO";
import { TimeUtils } from "../../../framework/utils/TimeUtils";

class SettingsController extends BaseController {
    protected get dao() {
        return settingsDAO;
    }

    private get model() {
        return this.dao.model;
    }

    protected onInitial() {
        this._updateSound();

        //刷新每日
        this._refreshDaily();

        EventCenter.I.on(GameEvent.SYSTEM_CROSS_DAY, this._refreshDaily, this);
    }

    private _updateSound() {
        SoundManager.instance.setSoundVolume(this.soundEnable ? 1 : 0);
        SoundManager.instance.setMusicVolume(this.musicEnable ? 1 : 0);
    }

    get musicEnable() {
        return this.model.musicEnable;
    }

    set musicEnable(value: boolean) {
        if (value != this.model.musicEnable) {
            this.model.musicEnable = value;
            this.dao.easySave();

            if (value) {
                SoundManager.instance.setMusicVolume(1);
            } else {
                SoundManager.instance.setMusicVolume(0);
            }
        }
    }

    get soundEnable() {
        return this.model.soundEnable;
    }

    set soundEnable(value: boolean) {
        if (value != this.model.soundEnable) {
            this.model.soundEnable = value;
            this.dao.easySave();

            if (value) {
                SoundManager.instance.setSoundVolume(1);
            } else {
                SoundManager.instance.setSoundVolume(0);
            }
        }
    }

    get vibrateEnable() {
        return this.model.vibrateEnable;
    }

    set vibrateEnable(value: boolean) {
        this.model.vibrateEnable = value;
        this.dao.easySave();
    }

    private checkRefreshDaily() {
        if (!this.model.daliyTime) {
            return false;
        }
        return this.model.daliyTime == TimeUtils.getDayTime(0);
    }

    /**
     * 重置每日数据
     */
    private _refreshDaily() {
        if (!this.checkRefreshDaily()) {
            this.model.daliyTime = TimeUtils.getDayTime(0);
            
            this.dao.easySave();
        }
    }

    /**
     * 广告计数
     */
    get videoCount() {
        return this.model.videoCount;
    }

    set videoCount(v: number) {
        this.model.videoCount = v;
        this.dao.easySave();
    }
}

export const settingsController = new SettingsController(); 