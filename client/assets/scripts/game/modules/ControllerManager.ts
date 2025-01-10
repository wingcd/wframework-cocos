import { serverController } from "./server/ServerController";
import { settingsController } from "./settings/SettingsController";
import { userController } from "./user/UserController";
import { ControllerManager as CM } from "../../framework/modules/ControllerManager";
import { taskController } from "./task/TaskController";
import { reddotController } from "./reddot/ReddotController";
import { guideController } from "./guide/GuideController";

export type UserStorageType = {
    version: string,
    serialized: number,
    time: number,
    modules: { [key: string]: any },
}

export class ControllerManager extends CM {
    protected static onRegistControllers() {
        this.registController(settingsController);
        this.registController(serverController);
        this.registController(guideController);

        // 最后初始化，为了适配老数据，可能会覆盖以上数据
        this.registController(userController);
        
        // 必须最后，可能有数据依赖
        this.registController(reddotController);
        this.registController(taskController);
    }

    protected static onInitial(): void {
        this.lastSaveTime = userController.saveTime;
    }    

    protected static onUserStorageChanged(): void {
        this.lastSaveTime = userController.saveTime;
    }
}