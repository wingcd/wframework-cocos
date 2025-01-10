import { EventCenter } from "../../../../framework/common/EventCenter";
import { GameConfig } from "../../../config/DataModel";
import { GameEvent } from "../../../const/GameEvent";
import { EItemType } from "../../../const/types";
import { BaseTask } from "./BaseTask";

class UseToolTask extends BaseTask {
    constructor(id: number) {
        super(id);

        this._taskType = GameConfig.ETaskType.UseTool;
    }

    protected onRegist() {
        EventCenter.I.on(GameEvent.USER_USE_TOOL, this.onUseTool, this);
    }

    protected onUnregist() {
        EventCenter.I.off(GameEvent.USER_USE_TOOL, this.onUseTool, this);
    }

    private onUseTool(type: EItemType) {
        if(type != this.id) {
            return;
        }
        
        this.controller.addTaskValue(this.taskID, 1);
    }
}
export const useRemoveTask = new UseToolTask(1);
export const useCollectTask = new UseToolTask(2);
export const useShuffleTask = new UseToolTask(3);