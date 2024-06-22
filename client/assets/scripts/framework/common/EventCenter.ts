
import { _decorator, Component, Node, isValid } from 'cc';
import { IPoolable, PoolManager } from './PoolManager';
import Container from '../view/Container';
import { UtilsHelper } from './UtilsHelper';
const { ccclass, property } = _decorator;

class EventHandler implements IPoolable{
    handler: Function;
    target: any;
    once: boolean;
    createFromPool(data?: any) {

    }
    fromPool() {
        this.handler = null;
        this.target = null;
        this.once = false;
    }
    toPool() {
        
    }
}
const EventHandlerPool = new PoolManager(EventHandler);

@ccclass('EventCenter')
export class EventCenter {
    private _handlers: { [key: string]: EventHandler[] } = {};

    /**
     * 监听事件
     * @param {string} eventName 事件名称
     * @param {function} handler 监听函数
     * @param {object} target 监听目标
     */
    public on(eventName: string, handler: Function, target: any) {
        var handlerList: EventHandler[] = this._handlers[eventName];
        if (!handlerList) {
            handlerList = [];
            this._handlers[eventName] = handlerList;
        }
        for (var i = 0; i < handlerList.length; i++) {
            if (handlerList[i] && handlerList[i].handler == handler && handlerList[i].target == target) {
                return i;
            }
        }
        var objHandler = EventHandlerPool.get();
        objHandler.handler = handler;
        objHandler.target = target;
        for (var i = 0; i < handlerList.length; i++) {
            if (!handlerList[i]) {
                handlerList[i] = objHandler;
                return i;
            }
        }
        handlerList.push(objHandler);
        return handlerList.length;
    };

    /**
     * 监听事件
     * @param {string} eventName 事件名称
     * @param {function} handler 监听函数
     * @param {object} target 监听目标
     */
    public once(eventName: string, handler: Function, target: any) {
        var handlerList: Array<any> = this._handlers[eventName];
        if (!handlerList) {
            handlerList = [];
            this._handlers[eventName] = handlerList;
        }
        for (var i = 0; i < handlerList.length; i++) {
            if (handlerList[i] && handlerList[i].handler == handler && handlerList[i].target == target) {
                return i;
            }
        }
        var objHandler = EventHandlerPool.get();
        objHandler.handler = handler;
        objHandler.target = target;
        objHandler.once = true;
        for (var i = 0; i < handlerList.length; i++) {
            if (!handlerList[i]) {
                handlerList[i] = objHandler;
                return i;
            }
        }
        handlerList.push(objHandler);
        return handlerList.length;
    };

    /**
     * 取消监听
     * @param {string} eventName 监听事件
     * @param {function} handler 监听函数
     * @param {object} target 监听目标
     */
    public off(eventName: string, handler: Function, target: any) {
        var handlerList = this._handlers[eventName];

        if (!handlerList) {
            return;
        }

        for (var i = 0; i < handlerList.length; i++) {
            var oldObj = handlerList[i];
            if (oldObj.handler === handler && (!target || target === oldObj.target)) {
                handlerList.splice(i, 1);
                EventHandlerPool.put(oldObj);
                break;
            }
        }
    };

    public clear(target?: any) {
        let keys = Object.keys(this._handlers);
        for (let ki = 0; ki < keys.length; ki++) {
            let key = keys[ki];
            let newHandles = [];
            let handlerList = this._handlers[key].slice();
            for (var i = 0; i < handlerList.length; i++) {
                var oldObj = handlerList[i];
                if (!target || target && target == oldObj.target) {
                    EventHandlerPool.put(oldObj);
                }else{
                    newHandles.push(oldObj);                    
                }
            }
            this._handlers[key] = newHandles;
        }
    }

    /**
     * 延迟发送
     * @param eventName 
     * @param delay 延迟时间(单位秒)
     * @param args 
     */
    public async emitDelay(eventName: string, delay: number, ...args: any) {
        if(delay && delay > 0) {
            await UtilsHelper.wait(delay);
        }
        this.emit(eventName, ...args);
    }

    /**
     * 分发事件
     * @param {string} eventName 分发事件名
     * @param  {...any} params 分发事件参数
     */
    public emit(eventName: string, ...args: any[]) {
        var handlerList = this._handlers[eventName];

        if (!handlerList) {
            return;
        }

        let handles = handlerList.slice();
        for (let i = 0; i < handles.length; i++) {
            var objHandler = handles[i];

            if(objHandler.target instanceof Container) {
                let cont = objHandler.target as Container;
                if(cont.destoried || !isValid(cont.component.node)) {
                    continue;
                }
            }else if(objHandler.target instanceof Node) {
                if(!isValid(objHandler.target)) {
                    continue;
                }
            }else if(objHandler.target instanceof Component) {
                if(!isValid(objHandler.target.node)) {
                    continue;
                }
            }

            if (objHandler.handler) {
                objHandler.handler.call(objHandler.target, ...args);
                if (objHandler.once) {
                    let idx = handlerList.indexOf(objHandler);
                    handlerList.splice(idx, 1);
                }
            }
        }
    }

    async waitEventValue(eventName: string, v: any) {
        let value;
        while (v != value) {
            value = await this.waitEvent(eventName);
        }
    }

    async waitEvent(eventName: string) {
        return new Promise(resolve => {
            this.once(eventName, resolve, this);
        })
    }

    private static _instance: EventCenter;
    static get I() {
        if (!this._instance) {
            window['EC'] = this;
            this._instance = new EventCenter;
        }
        return this._instance;
    }
}