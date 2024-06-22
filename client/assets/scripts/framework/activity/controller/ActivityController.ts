import { BaseActivityController } from "./BaseActivityController";

export class ActivityController {
    private static _inst: ActivityController;
    public static get inst() {
        if (!this._inst) {
            this._inst = new ActivityController();
        }
        return this._inst;
    }
    
    private _controllers: BaseActivityController[] = [];
    private _controllerMap: { [key: string]: BaseActivityController } = {};
    private _timer: number = -1;
    private _delayTime = 3;

    constructor() {
    }

    public start() {
        this._timer = 0;
    }

    public async register(controller: BaseActivityController, now=false) {
        if(!controller) return;
        if(this._controllerMap[controller.name]) {
            console.warn("ActivityController register repeat: " + controller.name);
            return;
        }
        this._controllers.push(controller);
        this._controllerMap[controller.name] = controller;
        if(now) {
            controller.doRegist();
        }
    }

    public ready() {
        for (let i = 0; i < this._controllers.length; i++) {
            this._controllers[i].doRegist();
        }
    }
    
    public getController(name: string) {
        return this._controllerMap[name];
    }
     
    public update(dt: number, secondTick: boolean) {
        if(this._timer < 0) return;

        this._timer += dt;
        if(this._timer < this._delayTime) return;

        if(!secondTick) return;

        for (let i = 0; i < this._controllers.length; i++) {
            this._controllers[i].update(dt, secondTick);
        }
    }
}