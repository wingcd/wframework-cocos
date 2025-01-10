import { profiler } from "cc";
import { GMMananger } from "../../../framework/view/GM/GMMananger";
import { GMEvent } from "../../../framework/view/GM/GMItem";
import { userController } from "../../modules/user/UserController";
import { Timer } from "../../../framework/common/Timer";
import { LogSettings } from "../../../framework/common/Logger";
import { EventCenter } from "../../../framework/common/EventCenter";
import { GameEvent } from "../../const/GameEvent";
import { taskController } from "../../modules/task/TaskController";
import { normalLevelBoxTask } from "../../modules/task/tasks/NormalLevelBoxTask";

export class GMSettings {
    static initial() {
        profiler.hideStats();

        GMMananger.inst.addSwitch("系统", "调试信息", false, (evt) => {
            if(evt.value as boolean) {
                profiler.showStats();
            }else{
                profiler.hideStats();
            }
        }, this);        

        GMMananger.inst.addRangeF("系统", "时间缩放", 0, 10, 1, (evt) => {
            Timer.inst.scale = evt.value as number;
        }, this);

        GMMananger.inst.addSelector("系统", "日志级别", 1, ["PREVIEW", "INFO", "WARN", "ERROR", "OFF"], (evt) => {
            LogSettings.logLevel = evt.value as number;
        }, this);

        GMMananger.inst.addButton("系统", "新的一天", () => {
            EventCenter.I.emit(GameEvent.SYSTEM_CROSS_DAY);
        }, this);
        
        GMMananger.inst.addInt("资源", "跳转关卡", 10, this._setLevel, this);
        GMMananger.inst.addInt("资源", "添加金币", 100, this._addGold, this);
        GMMananger.inst.addInt("资源", "添加体力", 10, this._addEnergy, this);
        GMMananger.inst.addInt("资源", "添加通关数", 10, this._addLevelCount, this);
        GMMananger.inst.addInt("资源", "添加移除次数", 1, this._addRemoveCount, this);
        GMMananger.inst.addInt("资源", "添加合成次数", 1, this._addMergeCount, this);
        GMMananger.inst.addInt("资源", "添加洗牌次数", 1, this._addShuffleCount, this);
    }

    private static _addGold(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        if(count < 0) {
            userController.subGold(-count);
            return;
        }
        userController.addGold(count);
    }

    private static _addEnergy(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        if(count < 0) {
            userController.subEnergy(-count);
            return;
        }

        userController.addEnergy(count);
    }

    private static _addLevelCount(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        userController.addLevel(count);

        taskController.addTaskValue(normalLevelBoxTask.taskID, count);
    }

    private static _setLevel(evt: GMEvent) {
        let level = parseInt(evt.value.toString());
        userController.setLevel(level);
    }

    private static _addRemoveCount(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        userController.addRemove(count);
    }

    private static _addMergeCount(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        userController.addCollect(count);
    }

    private static _addShuffleCount(evt: GMEvent) {
        let count = parseInt(evt.value.toString());
        userController.addShuffle(count);
    }
}