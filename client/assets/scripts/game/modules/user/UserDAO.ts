import { GameSettings } from "../../../framework/GameSettings";
import { BaseDAO } from "../../../framework/modules/base/BaseDAO";
import { systemController } from "../../../framework/modules/system/SystemController";
import { ConfigManager } from "../../config/ConfigManager";
import { UserModel } from "./UserModel";

class UserDAO extends BaseDAO<UserModel> {
    private _isNewUser = false;

    get isNewUser() {
        return this._isNewUser;
    }

    get storageKey() {
        return "user";
    }

    get modelName() {
        return "UserModel";
    }

    setData(data: UserModel, replace?: boolean): void {
        super.setData(data, replace);        
        this.setValidKey("level", "gold", "energy", "star");
    }

    protected afterLoad() {
        if (this.model.saveTime == null) {
            this.model.saveTime = systemController.getTimeMS();
        }
    }

    protected beforeInitial() {
        this._isNewUser = this._isNewer;
        if (this._isNewer) {
            this.model.energy = ConfigManager.settings.INIT_ENERGY;
            this.model.energyTimer = systemController.getTime();
        }
        this.model.level = this.model.level || 1;

        this.model.version = GameSettings.version;
        this.easySave();
    }

    /**
     * 更新存储时间，并强制保存，不会设置为脏数据
     */
    updateTime() {
        this.model.saveTime = systemController.getTimeMS();
        this.save(true, true, false);
    }

    setLevel(val: number) {
        return this.checkAndUpdateValue("level", val);
    }

    addLevel(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`addLevel：错误的数据:${val}`);
            return false;
        }

        val = this.model.level + val;
        return this.checkAndUpdateValue("level", val);
    }

    subLevel(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`subLevel：错误的数据:${val}`);
            return false;
        }

        if (this.model.level < val) {
            console.warn(`subLevel：等级不足:${this.model.level}-${val}`);
            return false;
        }

        val = this.model.level - val;
        return this.checkAndUpdateValue("level", val);
    }

    isValidNumber(val: number) {
        if (typeof val != "number" || Number.isNaN(val)) {
            return false;
        }
        return true;
    }

    addGold(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`addGold：错误的数据:${val}`);
            return false;
        }
        val = this.model.gold + val;
        return this.checkAndUpdateValue("gold", val);
    }

    subGold(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`subGold：错误的数据:${val}`);
            return false;
        }

        if (this.model.gold < val) {
            console.warn(`subGold：资源不足:${this.model.gold}-${val}`);
            return false;
        }

        val = this.model.gold - val;
        return this.checkAndUpdateValue("gold", val);
    }

    addStar(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`addStar：错误的数据:${val}`);
            return false;
        }
        val = this.model.star + val;
        return this.checkAndUpdateValue("star", val);
    }

    subStar(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`subGem：错误的数据:${val}`);
            return false;
        }

        if (this.model.star < val) {
            console.warn(`subGem：资源不足:${this.model.star}-${val}`);
            return false;
        }

        val = this.model.star - val;
        return this.checkAndUpdateValue("star", val);
    }    

    addEnergy(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`addEnergy：错误的数据:${val}`);
            return false;
        }
        val = this.model.energy + val;
        return this.checkAndUpdateValue("energy", val);
    }

    subEnergy(val: number) {
        if (!this.isValidNumber(val) || val <= 0) {
            console.warn(`subEnergy：错误的数据:${val}`);
            return false;
        }

        if (this.model.energy < val) {
            console.warn(`subEnergy：资源不足:${this.model.energy}-${val}`);
            return false;
        }

        if (this.model.energy == ConfigManager.settings.MAX_RECOVER_ENERGY) {
            this.model.energyTimer = systemController.getTime();
        }

        val = this.model.energy - val;
        return this.checkAndUpdateValue("energy", val);
    }
}

export const userDAO = new UserDAO(UserModel);