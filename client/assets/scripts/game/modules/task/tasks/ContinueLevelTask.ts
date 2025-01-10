import { EventCenter } from "../../../../framework/common/EventCenter";
import { GameConfig } from "../../../config/DataModel";
import { GameEvent } from "../../../const/GameEvent";
import { EGameMode } from "../../../const/types";
import { BaseTask } from "./BaseTask";

class ContinueLevelTask extends BaseTask {
    private _inGameValue: number = 0;
    constructor(id: number = 0) {
        super(id);
        this._taskType = GameConfig.ETaskType.ContinueLevel;
    }

    public get inGameValue() {
        return this._inGameValue;
    }

    protected onRegist() {
        EventCenter.I.on(GameEvent.GAME_LEVEL_SUCCESS, this.onLevelSuccess, this);
        EventCenter.I.on(GameEvent.GAME_START, this.onGameStar, this);
    }

    protected onUnregist() {
        EventCenter.I.off(GameEvent.GAME_LEVEL_SUCCESS, this.onLevelSuccess, this);
        EventCenter.I.off(GameEvent.GAME_START, this.onGameStar, this);
    }

    private onLevelSuccess(model: EGameMode) {
        if(model != EGameMode.Normal) {
            return;
        }
        
        this._inGameValue = this.controller.setTaskValue(this.taskID, this._inGameValue + 1);
    }

    private onGameStar(data: {level: number, mode: EGameMode, challengeLevel: number}) {
        if(data.mode != EGameMode.Normal) {
            return;
        }

        this._inGameValue = this.controller.getTaskValue(this.taskID);
        this.controller.setTaskValue(this.taskID, 0);
    }
}
export const continueLevelTask = new ContinueLevelTask();