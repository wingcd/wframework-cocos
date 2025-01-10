import { BaseDAO } from "../../../framework/modules/base/BaseDAO";
import { ETaskState, TaskModel } from "./TaskModel";

export class TaskDAO extends BaseDAO<TaskModel> {
    get storageKey() {
        return "task";
    }

    get modelName() {
        return "TaskModel";
    }

    addTaskGroup(groupID: number, taskID: number) {
        this.model.tasks[groupID] = {current: taskID, progress: 0, state: 0 };
        this.save();
    }

    getTaskGroup(groupID: number) {
        return this.model.tasks[groupID];
    }

    isTaskCompleted(taskID: number) {
        let task = this.model.tasks[taskID];
        if(!task) {
            return true;
        }
        return task.state == ETaskState.Received;
    }

    isTaskGroupCompleted(groupID: number) {
        let task = this.model.tasks[groupID];
        if(!task) {
            return true;
        }
        return !!task.done;
    }

    achiveTaskGroup(groupID: number) {
        let group = this.model.tasks[groupID];
        if(group) {
            group.done = 1;
            this.save();
        }
    }
}
export const taskDAO = new TaskDAO(TaskModel);