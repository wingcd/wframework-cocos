import { GameConfig } from "../../../config/DataModel";
import { TaskController } from "../TaskController";

export class BaseTask {
    protected _taskType: GameConfig.ETaskType = 0;
    public get taskType() {
        return this._taskType;
    }

    public taskCfg: Readonly<GameConfig.DailyTask> = null;
    public taskID: number = 0;
    protected controller: TaskController = null;
    private _registed: boolean = false;
    private _id: number = 0;

    public get id() {
        return this._id;
    }

    constructor(id: number = 0) {
        this._id = id;
    }

    public get groupID() {
        return (this._taskType * 100 + this._id);
    }

    public get group() {
        return this.controller.getGroupData(this.groupID);
    }

    public regist(controller: TaskController) {
        this.controller = controller;  

        if(this._registed) {
            return;
        }
        this._registed = true;

        this.onRegist();
    }

    public unregist() {
        if(!this._registed) {
            return;
        }

        this.onUnregist();       
    }

    public update() {
    }

    protected onRegist() {
    }

    protected onUnregist() {
    }

    public isTaskGroupCompleted() {
        return false;
    }

    public getTaskValue() {
        return this.controller.getTaskValue(this.taskID);
    }
}