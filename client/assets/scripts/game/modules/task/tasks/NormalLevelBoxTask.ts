import { EventCenter } from "../../../../framework/common/EventCenter";
import { GameConfig } from "../../../config/DataModel";
import { GameEvent } from "../../../const/GameEvent";
import { EGameMode } from "../../../const/types";
import { BaseTask } from "./BaseTask";

class NormalLevelBoxTask extends BaseTask {
    constructor(id: number = 0) {
        super(id);
        this._taskType = GameConfig.ETaskType.LevelBox;
    }

    protected onRegist() {
        EventCenter.I.on(GameEvent.GAME_LEVEL_SUCCESS, this.onLevelSuccess, this);
    }

    protected onUnregist() {
        EventCenter.I.off(GameEvent.GAME_LEVEL_SUCCESS, this.onLevelSuccess, this);
    }

    private onLevelSuccess(model: EGameMode) {
        if(model != EGameMode.Normal) {
            return;
        }
        
        this.controller.addTaskValue(this.taskID, 1);
    }
}
export const normalLevelBoxTask = new NormalLevelBoxTask();