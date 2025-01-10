import { EventCenter } from "../../../framework/common/EventCenter";
import { BaseController } from "../../../framework/modules/base/BaseController";
import { systemController } from "../../../framework/modules/system/SystemController";
import { RedDotManager } from "../../../framework/plugins/reddot/RedDotManager";
import { TimeUtils } from "../../../framework/utils/TimeUtils";
import { ConfigManager } from "../../config/ConfigManager";
import { GameConfig } from "../../config/DataModel";
import { GameEvent } from "../../const/GameEvent";
import { Reddot } from "../reddot/Reddot";
import { taskDAO } from "./TaskDAO";
import { ETaskState } from "./TaskModel";
import { adVideoTask } from "./tasks/ADVideoTask";
import { BaseTask } from "./tasks/BaseTask";
import { challengeLevelTask } from "./tasks/ChallengeLevelTask";
import { continueLevelTask } from "./tasks/ContinueLevelTask";
import { loginTask } from "./tasks/LoginTask";
import { normalLevelBoxTask } from "./tasks/NormalLevelBoxTask";
import { normalLevelTask } from "./tasks/NormalLevelTask";
import { useCollectTask, useRemoveTask, useShuffleTask } from "./tasks/UseToolTask";

export class TaskController extends BaseController {
    private _tasks: BaseTask[] = [];
    private _taskGroups: { [key: number]: Readonly<GameConfig.DailyTask>[] } = null;
    private _tasksMap: { [key: number]: BaseTask } = {};

    private registTask(task: BaseTask) {
        this._tasks.push(task);

        // 设置当前任务
        for(var groupID in this.model.tasks) {
            let groupData = this.model.tasks[groupID];
            let current = groupData.current;
            let item = ConfigManager.DailyTaskTable.getItem(current);
            let gid = this.getGroupID(item);
            if(item == null || gid != task.groupID) {
                continue;
            }

            let taskProcess = this.model.tasks[groupID];
            task.taskCfg = item;
            task.taskID = taskProcess.current;

            break;
        }

        this._tasksMap[task.groupID] = task;

        if(!this.dao.isTaskGroupCompleted(task.groupID)) {
            task.regist(this);
        }
    }

    private unregistTask(task: BaseTask) {
        task.unregist();
    }

    protected get dao() {
        return taskDAO;
    }

    protected get model() {
        return this.dao.model;
    }

    get dataKey(): string {
        return "task";
    }

    get dailyTasks() {
        return this._tasks.filter((task) => {
            return task.taskCfg.IsDaily;
        });
    }

    get normalTasks() {
        return this._tasks.filter((task) => {
            return !task.taskCfg.IsDaily;
        });
    }

    get dailyTaskData() {
        return this.model.tasks;
    }

    get taskGroups() {
        return this._taskGroups;
    }
    
    protected onInitial(): void {
        super.onInitial();

        EventCenter.I.on(GameEvent.SYSTEM_CROSS_DAY, this.refreshDaily, this);
        this.refreshDaily();
        this.initialTasks();
        this.registTasks();
    }

    protected onUpdate(dt: number): void {
        super.onUpdate(dt);

        for(let task of this._tasks) {
            task.update();
        }
    }

    public getGroupDataByCfg(item: Readonly<GameConfig.DailyTask>) {
        let groupID = this.getGroupID(item);
        return this.dao.getTaskGroup(groupID);
    }

    public getGroupData(groupID: number) {
        return this.dao.getTaskGroup(groupID);
    }

    public getGroupID(item: Readonly<GameConfig.DailyTask>) {
        return item.TaskType * 100 + item.Value;
    }

    private initialTasks() {
        let items = ConfigManager.DailyTaskTable.items;
        if(this._taskGroups == null) {
            let groups: { [key: number]: Readonly<GameConfig.DailyTask>[] } = {};
            for(let item of items) {
                let groupID = this.getGroupID(item);
                if(groups[groupID] == null) {
                    groups[groupID] = [];
                }
                groups[groupID].push(item);
            }
            // 默认是按照ID排序的
            this._taskGroups = groups;
        }

        for(let groupID in this._taskGroups) {
            let group = this._taskGroups[groupID];
            let index = 0;
            let item = group[index];
            let groupData = this.dao.getTaskGroup(parseInt(groupID));
            if(groupData == null) {
                this.dao.addTaskGroup(parseInt(groupID), item.ID);
            }else if(groupData.state == ETaskState.Completed && item.IsDaily) {
                RedDotManager.inst.addMessage(Reddot.HOME_TASK);
            }
        }
    }

    private registTasks() {
        this._tasks = [];
        this.registTask(loginTask);
        this.registTask(adVideoTask);
        this.registTask(normalLevelTask);
        this.registTask(challengeLevelTask);
        this.registTask(useRemoveTask);
        this.registTask(useCollectTask);
        this.registTask(useShuffleTask);
        this.registTask(normalLevelBoxTask);
        this.registTask(continueLevelTask);
    }

    public getTaskValue(taskID: number) {
        let item = ConfigManager.DailyTaskTable.getItem(taskID);
        if(item == null) {
            return 0;
        }

        let groupId = this.getGroupID(item);
        let groupData = this.dao.getTaskGroup(groupId);
        return groupData.progress;
    }

    public setTaskValue(taskID: number, value: number) {
        let item = ConfigManager.DailyTaskTable.getItem(taskID);
        if(item == null) {
            return;
        }

        let groupId = this.getGroupID(item);
        let groupData = this.dao.getTaskGroup(groupId);
        if(item.MaxValue > 0 && value > item.MaxValue) {
            value = item.MaxValue;
        }
        groupData.progress = value;
        if(groupData.progress >= item.Num && groupData.state == ETaskState.None) {
            groupData.state = ETaskState.Completed;
            if(item.IsDaily) {
                RedDotManager.inst.addMessage(Reddot.HOME_TASK);
            }
        }
        this.dao.saveNow();

        let taskProcess = this._tasksMap[groupId];
        EventCenter.I.emit(GameEvent.USER_TASK_CHANGED, taskProcess);

        return groupData.progress;
    }

    public addTaskValue(taskID: number, value: number) {
        let item = ConfigManager.DailyTaskTable.getItem(taskID);
        if(item == null) {
            return;
        }
        
        let groupId = this.getGroupID(item);
        let groupData = this.dao.getTaskGroup(groupId);
        var val =  groupData.progress + value;
        if(item.MaxValue > 0 && groupData.progress > item.MaxValue) {
            val = item.MaxValue;
        }
        groupData.progress = val;
        
        if(groupData.progress >= item.Num && groupData.state == ETaskState.None) {
            groupData.state = ETaskState.Completed;
            
            if(item.IsDaily) {
                RedDotManager.inst.addMessage(Reddot.HOME_TASK);
            }
        }
        this.dao.saveNow();
        
        let taskProcess = this._tasksMap[groupId];
        EventCenter.I.emit(GameEvent.USER_TASK_CHANGED, taskProcess);

        return groupData.progress;
    }

    public hasNextTaskByCfg(item: Readonly<GameConfig.DailyTask>) {
        if(item == null) {
            return false;
        }

        if(item.NextTask == 0) {
            return true;
        }
        
        let groupID = this.getGroupID(item);
        return this.hasNextTask(groupID);
    }

    public hasNextTask(groupID: number) {
        let group = this._taskGroups[groupID];
        if(group == null) {
            return false;
        }

        let index = group.findIndex((item) => {
            return item.ID == item.ID;
        });
        return index < group.length - 1;
    }

    public receiveTaskByCfg(item: Readonly<GameConfig.DailyTask>) {
        let groupId = this.getGroupID(item);
        this.receiveTask(groupId);
    }

    public receiveTask(groupID: number) {
        let groupData = this.model.tasks[groupID];
        if(groupData == null || groupData.state != ETaskState.Completed) {
            return;
        }
        groupData.state = ETaskState.Received;

        let item = ConfigManager.DailyTaskTable.getItem(groupData.current);
        if(item == null) {
            return;
        }
        
        let group = this._taskGroups[groupID];
        let index = group.findIndex((item) => {
            return item.ID == groupData.current;
        });

        let indexNext = 0;
        if(item.NextTask != 0) {
            if(item.NextTask == -1) {
                indexNext = index;
            }else{
                indexNext = group.findIndex((item) => {
                    return item.ID == item.NextTask;
                });
            }
        }else{
            indexNext = index + 1;
        }
        
        let taskProcess = this._tasksMap[groupID];
        if(indexNext < group.length) {
            let nextItem = group[indexNext];
            
            groupData.done = 0;
            groupData.current = nextItem.ID;
            if(item.Clear || item.NextTask != 0) {
                groupData.progress = groupData.progress - item.Num;
            }
            if(groupData.progress >= nextItem.Num) {
                groupData.state = ETaskState.Completed;
            }else{
                groupData.state = ETaskState.None;
            }

            taskProcess.taskID = nextItem.ID;
            taskProcess.taskCfg = nextItem;
        }else{    
            this.achiveTask(taskProcess, groupID);
        }
        this.dao.saveNow();

        RedDotManager.inst.subMessage(Reddot.HOME_TASK);
        EventCenter.I.emit(GameEvent.USER_TASK_CHANGED, taskProcess);
    }

    private achiveTask(task: BaseTask, completeTaskID: number) {
        let groupID = this.getGroupID(task.taskCfg);
        let group = this._taskGroups[groupID];
        if(group) {
            let completed = true;
            for(let item of group) {
                if(!this.dao.isTaskCompleted(item.ID)) {
                    completed = false;
                    break;
                }
            }
            if(completed) {
                this.unregistTask(task);
                this.dao.achiveTaskGroup(groupID);
            }
        }
    }

    private refreshDaily() {
        if(TimeUtils.isToday(this.model.savetime * 1000)) {
            return;
        }

        this.model.savetime = systemController.getTime();
        let keys = Object.keys(this.model.tasks);
        for(let key of keys) {
            let groupData = this.model.tasks[key];
            let item = ConfigManager.DailyTaskTable.getItem(groupData.current);
            if(item == null) {
                continue;
            }
            if(item.IsDaily) {
                groupData.progress = 0;
                groupData.state = ETaskState.None;
                groupData.done = 0;
            }
        }
        this.initialTasks();
        this.dao.saveNow();
    }
}
export const taskController = new TaskController();