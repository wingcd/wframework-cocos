import Gesture from "./Gesture";
import { Vec2 } from "cc";
import { Event, GRoot } from "fairygui-cc";
import { Timer } from "../../common/Timer";

export default class LongTouchGesture extends Gesture {
    /**
     *  长按事件。
     */
    public static readonly LONG_TOUCH = "LONG_TOUCH";
    /**
     * 监听结束
     */
    public static readonly LONG_TOUCH_END = "LONG_TOUCH_END";

    /**
     * 长按时间(s)
     */
    touchTime = 1.5;
    /**
     * 长按位置最大移动距离(小于等于0不进行检查)
     */
    minDistance = 20;
    /**
     * 是否进行实时移动检查
     */
    checkEndOnMoving = true;

    private _touchPos: Vec2 = new Vec2();
    private _started: boolean = false;
    private _paused: boolean = false;
    private _enabled = false;
    private _timer: number = 0;
    private _triggered = false;

    get started() {
        return this._started;
    }

    enable(value: boolean) {
        if(value) {
            if(!this._enabled) {
                this.on(Event.TOUCH_BEGIN, this.__touchBegin, this);
                this._enabled = true;
            }
        }else{
            this._started = false;
            
            if(this._enabled) {
                this.off(Event.TOUCH_BEGIN, this.__touchBegin, this);
                this._enabled = false;
            }
        }
    }

    dispose() {
        super.dispose();
        this.enable(false);
    }

    private checkTouchValid(evt: Event) {
        return this.minDistance <= 0 || Vec2.distance(evt.pos, this._touchPos) <= this.minDistance;
    }

    /**
     * 多段触摸时，时间重置
     * @param touchTime 
     */
    resetTime(touchTime = 1.5) {
        this._timer = 0;
        this.touchTime = touchTime;
        this._triggered = false;
        this._paused = false;
    }

    stopAndSetTime(touchTime = 1.5) {
        this.resetTime(touchTime);
        this._started = false; 
    }

    private __touchBegin(evt: Event) {
        let touchIds = this.getTouchIds();
        if(touchIds.length >= 1) {
            this._started = true;
            this._timer = 0;

            this._touchPos.set(evt.pos);
            Timer.inst.clearAll(this);
            Timer.inst.frameLoop(1,  ()=>{
                this._timer += Timer.inst.delta;
                if(!this._triggered && this._timer >= this.touchTime * 1000) {
                    if(this._started && !this._paused) {
                        this._paused = true;
                        
                        if(this.checkTouchValid(evt)) {
                            this._triggered = true;
                            this.emit(LongTouchGesture.LONG_TOUCH, evt);
                        }else{  
                            this.onEnd(evt);
                        }
                    }
                }
            }, this);
                        
            if(this.checkEndOnMoving) {
                GRoot.inst.on(Event.TOUCH_MOVE, this.__touchMove, this);
            }
            GRoot.inst.on(Event.TOUCH_END, this.__touchEnd, this);
        }
    }

    private onEnd(evt: Event) {
        Timer.inst.clearAll(this);
        if(this.checkEndOnMoving) {
            GRoot.inst.off(Event.TOUCH_MOVE, this.__touchMove, this);
        }
        GRoot.inst.off(Event.TOUCH_END, this.__touchEnd, this);
        this._timer = 0;
        this._triggered = false;
        this._paused = false;

        if(this._started) {
            this.emit(LongTouchGesture.LONG_TOUCH_END, evt);
        }
        this._started = false;
    }

    private __touchMove(evt: Event) {   
        if(this._started) {
            if(!this.checkTouchValid(evt)) {                
                this.onEnd(evt);
            }
        }
    }

    private __touchEnd(evt: Event) {   
        this.onEnd(evt);
    }
}