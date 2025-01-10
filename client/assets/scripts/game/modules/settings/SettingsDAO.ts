import { BaseDAO } from "../../../framework/modules/base/BaseDAO";
import { SettingsModel } from "./SetttingsModel";

class SettingDAO extends BaseDAO<SettingsModel> {

    get storageKey() {
        return "settings";
    }
}

export const settingsDAO = new SettingDAO(SettingsModel);