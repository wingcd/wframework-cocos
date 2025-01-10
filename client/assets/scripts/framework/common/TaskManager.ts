export type Progressor = (p: number) => void;
export type Runner = (task: Task, progress: Progressor) => Promise<boolean>;

export class Task {
    name: string;
    weight: number;
    runner: Runner;

    constructor(name: string, weight: number, runner: Runner) {
        this.name = name;
        this.weight = weight;
        this.runner = runner;
    }
}

export class TaskManager {
    private _tasks: Task[] = [];
    private _totalWeight: number = 0;
    public name = '';

    private static sID = 0;
    constructor(name?: string) {
        this.name = name || `${++TaskManager.sID}`;
    }

    add(name: string, weight: number, runnder: Runner) {
        this._tasks.push(new Task(name, weight, runnder));
        this._totalWeight += weight;
    }

    async runSerial(progress?: Progressor, thisObj?: any) {      
        let weight = 0;   
        let totalTime = Date.now();
        progress?.call(thisObj, 0);        
        for (let task of this._tasks) {
            const taskResult = await this.runTask(task, weight, progress, thisObj);
            if (!taskResult) {
                return false;
            }
            weight += task.weight;
        }
        console.log(`TM:${this.name} total cost ${Date.now() - totalTime}ms`);
        return true;
    }

    async runParallel(progress?: Progressor, thisObj?: any) {  
        let weight = 0; 
        let tasks: Promise<any>[] = [];
        for (let task of this._tasks) {
            tasks.push(this.runTask(task, 0, ()=>{
                weight += task.weight;
                let pp = weight / this._totalWeight;
                progress?.call(thisObj, pp);
            }, thisObj));
        }
        let totalTime = Date.now();
        let results = await Promise.all(tasks);
        console.log(`TM:${this.name} total cost ${Date.now() - totalTime}ms`);
        return results.every(result => result);
    }

    private async runTask(task, weight, progress, thisObj) {
        console.log(`TM:${this.name} begin task ${task.name}`);
        let startTime = Date.now();
        let result = await task.runner(task, (p) => {
            let w = weight + task.weight * p;
            let pp = w / this._totalWeight;
            progress?.call(thisObj, pp);
        });
        console.log(`TM:${this.name} task ${task.name} done, cost ${Date.now() - startTime}ms`);              
        let pp = weight / this._totalWeight;
        progress?.call(thisObj, pp);
        return result;
    }
}