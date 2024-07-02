import { _decorator, Component, Node, Game, Director, director, game } from 'cc';
import { UtilsHelper } from '../utils/UtilsHelper';
const { ccclass, property } = _decorator;

class TimerItem {
    event: string;
    caller: any;
    method: Function;
    args?: any[];
    coverBefore?: boolean;
    once?: boolean;
}

/**
 * 定时器
 */
@ccclass('Timer')
export class Timer extends Component{
    static _inst: Timer;
    static get inst():Timer {
        if(this._inst == null) {
            var node = new Node("Timer");
            director.getScene().addChild(node);
            game.addPersistRootNode(node);
            this._inst = node.addComponent(Timer);
        }
        return this._inst;
    }
    
    static gSysTimer: Timer = null;
    static _pool:Handler[] = [];
    static _mid = 1;

    scale = 1;
    currTimer = Date.now();
    unscaleTimer = Date.now();
    currFrame = 0;

    start() {
        let directorTicker = director.tick;
        director.tick = (dt: number) => {
            try {
                directorTicker.call(director, dt * this.scale);
            }catch(e) {
                console.error(e);
            }
        };
    }

    private _delta = 0;
    private _unscaleDelta = 0;
    private _lastTimer = Date.now();
    private _map:Handler[] = [];
    private _handlers: Handler[] = [];
    private _temp: Handler[] = [];
    private _count = 0;

    constructor() { 
        super();

        this.scale = 1;
        this.currTimer = Date.now();
        this.unscaleTimer = Date.now();
        this.currFrame = 0;
        this._delta = 0;
        this._unscaleDelta = 0;
        this._lastTimer = Date.now();
        this._map = [];
        this._handlers = [];
        this._temp = [];
        this._count = 0;
    }
    /**
     * 每帧间隔时间, 包含暂停时间(ms)
     */
    get delta() {
        return this._delta;
    }

    get unscaleDelta() {
        return this._unscaleDelta;
    }

    protected update(dt: number) {
        if (this.scale <= 0) {
            this._lastTimer = Date.now();
            this._delta = 0;
            this._unscaleDelta = 0;
            return;
        }
        var frame = this.currFrame = this.currFrame + this.scale;
        var now = Date.now();
        
        this._unscaleDelta = (now - this._lastTimer);
        this.unscaleTimer += this._unscaleDelta;

        var awake = this._unscaleDelta > 30000;
        this._delta = this._unscaleDelta * this.scale;
        this.currTimer = this.currTimer + this._delta;
        var timer = this.currTimer;
        this._lastTimer = now;
        var handlers = this._handlers;
        this._count = 0;
        for (var i = 0, n = handlers.length; i < n; i++) {
            var handler = handlers[i];
            if (handler.method !== null) {
                var t = handler.useFrame ? frame : timer;
                if (t >= handler.exeTime) {
                    if (handler.repeat) {
                        if (!handler.jumpFrame || awake) {
                            handler.exeTime += handler.delay;
                            handler.run(false);
                            if (t > handler.exeTime) {
                                handler.exeTime += Math.ceil((t - handler.exeTime) / handler.delay) * handler.delay;
                            }
                        }
                        else {
                            while (t >= handler.exeTime) {
                                handler.exeTime += handler.delay;
                                handler.run(false);
                            }
                        }
                    }
                    else {
                        handler.run(true);
                    }
                }
            }
            else {
                this._count++;
            }
        }
        if (this._count > 30 || frame % 200 === 0)
            this._clearHandlers();

        CallLater.inst._update();
    }
    _clearHandlers() {
        var handlers = this._handlers;
        for (var i = 0, n = handlers.length; i < n; i++) {
            var handler = handlers[i];
            if (handler.method !== null)
                this._temp.push(handler);
            else
                this._recoverHandler(handler);
        }
        this._handlers = this._temp;
        handlers.length = 0;
        this._temp = handlers;
    }
    _recoverHandler(handler) {
        if (this._map[handler.key] == handler)
            this._map[handler.key] = null;
        handler.clear();
        Timer._pool.push(handler);
    }
    _create(useFrame, repeat, delay, method, caller, args, coverBefore) {
        if (!delay) {
            method.apply(caller, args);
            return null;
        }
        if (coverBefore) {
            var handler = this._getHandler(method, caller);
            if (handler) {
                handler.repeat = repeat;
                handler.useFrame = useFrame;
                handler.delay = delay;
                handler.caller = caller;
                handler.method = method;
                handler.args = args;
                handler.exeTime = delay + (useFrame ? this.currFrame : this.currTimer + Date.now() - this._lastTimer);
                return handler;
            }
        }
        handler = Timer._pool.length > 0 ? Timer._pool.pop() : new TimerHandler();
        handler.repeat = repeat;
        handler.useFrame = useFrame;
        handler.delay = delay;
        handler.caller = caller;
        handler.method = method;
        handler.args = args;
        handler.exeTime = delay + (useFrame ? this.currFrame : this.currTimer + Date.now() - this._lastTimer);
        this._indexHandler(handler);
        this._handlers.push(handler);
        return handler;
    }
    _indexHandler(handler) {
        var caller = handler.caller;
        var method = handler.method;
        var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper.getGID()) : 0;
        var mid = method.$_TID || (method.$_TID = (Timer._mid++) * 100000);
        handler.key = cid + mid;
        this._map[handler.key] = handler;
    }
    /**
     * 一次延迟
     * @param delay 延迟时间，单位毫秒
     * @param caller 
     * @param method 
     * @param args 
     * @param coverBefore 
     */
    once(delay: number, method: Function, caller: any, args = null, coverBefore = true) {
        this._create(false, false, delay, method, caller, args, coverBefore);
    }
    /**
     * 循环
     * @param delay  延迟时间，单位毫秒
     * @param method 
     * @param caller 
     * @param args 
     * @param coverBefore 
     * @param jumpFrame 
     */
    loop(delay: number, method: Function, caller: any, args = null, coverBefore = true, jumpFrame = false) {
        var handler = this._create(false, true, delay, method, caller, args, coverBefore);
        if (handler)
            handler.jumpFrame = jumpFrame;
    }
    /**
     * 一次帧延迟
     * @param delay  延迟时间，单位毫秒
     * @param method 
     * @param caller 
     * @param args 
     * @param coverBefore 
     */
    frameOnce(delay: number, method: Function, caller: any, args = null, coverBefore = true) {
        this._create(true, false, delay, method, caller, args, coverBefore);
    }
    /**
     * 每帧循环
     * @param delay  延迟时间，单位毫秒
     * @param method 
     * @param caller 
     * @param args 
     * @param coverBefore 
     */
    frameLoop(delay: number, method: Function, caller: any, args = null, coverBefore = true) {
        this._create(true, true, delay, method, caller, args, coverBefore);
    }
    toString() {
        return " handlers:" + this._handlers.length + " pool:" + Timer._pool.length;
    }
    /**
     * 移除timer
     * @param method 
     * @param caller 
     */
    clear(method: Function, caller: any) {
        var handler = this._getHandler(method, caller);
        if (handler) {
            this._map[handler.key] = null;
            handler.key = 0;
            handler.clear();
        }
    }
    /**
     * 移除所有timer
     * @param caller 
     * @returns 
     */
    clearAll(caller: any) {
        if (!caller)
            return;
        for (var i = 0, n = this._handlers.length; i < n; i++) {
            var handler = this._handlers[i];
            if (handler.caller === caller) {
                this._map[handler.key] = null;
                handler.key = 0;
                handler.clear();
            }
        }
    }
    _getHandler(method, caller: any): Handler {
        var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper.getGID()) : 0;
        var mid = method.$_TID || (method.$_TID = (Timer._mid++) * 100000);
        return this._map[cid + mid];
    }
    callLater(method: Function, caller:any, args = null) {
        CallLater.inst.callLater(method, caller, args);
    }
    runCallLater(method: Function, caller: any) {
        CallLater.inst.runCallLater(method, caller);
    }
    runTimer(method: Function, caller: any) {
        var handler = this._getHandler(method, caller);
        if (handler && handler.method != null) {
            this._map[handler.key] = null;
            handler.run(true);
        }
    }
    pause() {
        this.scale = 0;
    }
    resume() {
        this.scale = 1;
    }
}

class Handler {
    repeat = 0;
    useFrame = false;
    delay = 0;
    exeTime = 0;
    jumpFrame = false;
    key = 0;

    caller: any = null;
    method: Function = null;
    args: any[] = null;

    clear() {

    }

    run(withClear: boolean) {

    }
}

export class TimerHandler extends Handler{
    clear() {
        this.caller = null;
        this.method = null;
        this.args = null;
    }
    run(withClear) {
        var caller = this.caller;
        if (caller && caller.destroyed)
            return this.clear();
        var method = this.method;
        var args = this.args;
        withClear && this.clear();
        if (method == null)
            return;
        args ? method.apply(caller, args) : method.call(caller);
    }
}

export class LaterHandler extends Handler{
    clear() {
        this.caller = null;
        this.method = null;
        this.args = null;
    }
    run() {
        var caller = this.caller;
        if (caller && caller.destroyed)
            return this.clear();
        var method = this.method;
        var args = this.args;
        if (method == null)
            return;
        args ? method.apply(caller, args) : method.call(caller);
    }
}

class CallLater {
    static inst = new CallLater();

    _pool = [];
    _map = {};
    _laters = [];

    constructor() {
        this._pool = [];
        this._map = {};
        this._laters = [];
    }
    _update() {
        let laters = this._laters;
        let len = laters.length;
        if (len > 0) {
            for (let i = 0, n = len - 1; i <= n; i++) {
                let handler = laters[i];
                this._map[handler.key] = null;
                if (handler.method !== null) {
                    handler.run();
                    handler.clear();
                }
                this._pool.push(handler);
                i === n && (n = laters.length - 1);
            }
            laters.length = 0;
        }
    }
    _getHandler(method, caller) {
        var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper.getGID()) : 0;
        var mid = method.$_TID || (method.$_TID = (Timer._mid++));
        return this._map[cid + '.' + mid];
    }
    callLater(method, caller, args = null) {
        if (this._getHandler(method, caller) == null) {
            let handler;
            if (this._pool.length)
                handler = this._pool.pop();
            else
                handler = new LaterHandler();
            handler.caller = caller;
            handler.method = method;
            handler.args = args;
            var cid = caller ? caller.$_GID : 0;
            var mid = method["$_TID"];
            handler.key = cid + '.' + mid;
            this._map[handler.key] = handler;
            this._laters.push(handler);
        }
    }
    runCallLater(method, caller) {
        var handler = this._getHandler(method, caller);
        if (handler && handler.method != null) {
            this._map[handler.key] = null;
            handler.run();
            handler.clear();
        }
    }
}