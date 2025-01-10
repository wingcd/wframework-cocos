import { EventCenter } from "../../../../framework/common/EventCenter";
import { EAdType } from "../../../ad/AdConfig";
import { AdManager } from "../../../ad/AdManager";
import { GameConfig } from "../../../config/DataModel";
import { BaseTask } from "./BaseTask";

class ADVideoTask extends BaseTask {
    constructor(id: number = 0) {
        super(id);
        this._taskType = GameConfig.ETaskType.VideoCount;
    }

    protected onRegist() {
        EventCenter.I.on(AdManager.SHARE_OR_VIDEO_DONE, this.onVideoOrShareDone, this);
    }

    protected onUnregist() {
        EventCenter.I.off(AdManager.SHARE_OR_VIDEO_DONE, this.onVideoOrShareDone, this);
    }

    private onVideoOrShareDone(type: EAdType, success: boolean) {
        if(type != EAdType.Video || !success) {
            return;
        }
        this.controller.addTaskValue(this.taskID, 1);
    }
}
export const adVideoTask = new ADVideoTask();