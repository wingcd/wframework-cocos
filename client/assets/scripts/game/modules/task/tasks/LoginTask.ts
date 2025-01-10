import { EventCenter } from "../../../../framework/common/EventCenter";
import { GameConfig } from "../../../config/DataModel";
import { GameEvent } from "../../../const/GameEvent";
import { BaseTask } from "./BaseTask";

class LoginTask extends BaseTask {
    constructor(id: number = 0) {
        super(id);
        this._taskType = GameConfig.ETaskType.Login;
    }

    protected onRegist() {
        EventCenter.I.on(GameEvent.GAME_LOADING_ENDED, this.onGameLoadingEnded, this);
    }

    protected onUnregist() {
        EventCenter.I.off(GameEvent.GAME_LOADING_ENDED, this.onGameLoadingEnded, this);
    }

    private onGameLoadingEnded() {
        this.controller.addTaskValue(this.taskID, 1);
    }
}
export const loginTask = new LoginTask();