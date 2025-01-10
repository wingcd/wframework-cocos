import { BaseModel } from "../../../framework/modules/base/BaseModel";

export enum ETaskState {
    None = 0,
    Completed = 1,
    Received = 2,
}

export class TaskModel extends BaseModel {
    public savetime: number = 0;
    public tasks: {
        [key: number]: {
            current: number,
            progress: number,
            state: ETaskState,   
            done?: number,    
        }
    } = {};
}