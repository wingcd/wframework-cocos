import { Node, Vec2 } from "cc";
import { Event, GRoot, UIConfig } from "fairygui-cc";
import { Vec2Pool } from "../../common/Pool";
import { Timer } from "../../common/Timer";
import Gesture from "./Gesture";

export default class SwipeGesture extends Gesture {
    /// <summary>
    /// 手指离开时的加速度
    /// </summary>
    public velocity: Vec2 = new Vec2(0, 0);

    /// <summary>
    /// 你可以在onBegin事件中设置这个值，那个后续将根据手指移动的距离修改这个值。如果不设置，那position初始为(0,0)，反映手指扫过的距离。
    /// </summary>
    public position: Vec2 = new Vec2(0, 0);

    /// <summary>
    /// 移动的变化值
    /// </summary>
    public delta: Vec2 = new Vec2(0, 0);

    /// <summary>
    /// The min distance to fire onAction event
    /// 派发onAction事件的最小距离。如果手指扫过的距离少于此值，onAction不会触发（但onEnd仍然会派发）
    /// </summary>
    public actionDistance: number = 0;

    /// <summary>
    /// 是否把变化量强制为整数。默认true。
    /// </summary>
    public snapping: boolean = true;

    private _enabled = false;
    private _startPoint: Vec2 = new Vec2(0, 0);
    private _lastPoint: Vec2 = new Vec2(0, 0);
    private _lastPoint2: Vec2 = new Vec2(0, 0);
    private _time: number = 0;
    private _deltaTime: number = 0;
    private _started: boolean = false;
    private _touchBegan: boolean = false;
    private _lastTouchId = -1;

     /// <summary>
    /// 当手指开始扫动时派发该事件。
    /// </summary>
    public static readonly SWIPE_BEGIN = "onSwipeBegin";
    /// <summary>
    /// 手指离开屏幕时派发该事件。
    /// </summary>
    public static readonly SWIPE_END = "onSwipeEnd";
    /// <summary>
    /// 手指在滑动时派发该事件。
    /// </summary>
    public static readonly SWIPE_MOVE = "onSwipeMove";
    /// <summary>
    /// 当手指从按下到离开经过的距离大于actionDistance时派发该事件。
    /// </summary>
    public static readonly SWIPE_ACTION = "onSwipeAction";

    enable(value: boolean) {
        if(value) {
            if(!this._enabled) {
                this.on(Event.TOUCH_BEGIN, this.__touchBegin, this);
                this._enabled = true;
            }
        }else{
            this._started = false;
            this._touchBegan = false;

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

    private __touchBegin(evt: Event) {
        let touchIds = this.getTouchIds();
        if(touchIds.length > 1) {
            this._touchBegan = false;
            if(this._started) {
                this._started = false;
                this.emit(SwipeGesture.SWIPE_END, evt);
            }
            return;
        }
        s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
        this._lastPoint.set(s_vec2);
        this._startPoint.set(s_vec2);

        this._time = Timer.inst.unscaleTimer;
        this._started = false;
        this.velocity.set(0, 0);
        this.position.set(0, 0);
        this._touchBegan = true;
        this._lastTouchId = evt.touchId;

        evt.captureTouch();
            
        GRoot.inst.on(Event.TOUCH_MOVE, this.__touchMove, this);
        GRoot.inst.on(Event.TOUCH_END, this.__touchEnd, this);
    }

    private __touchMove(evt: Event) {        
        let touchIds = this.getTouchIds();
        if(!this._touchBegan || touchIds.length > 1 || evt.touchId != this._lastTouchId) {
            if(this._started) {
                this._started = false;
                this.emit(SwipeGesture.SWIPE_END, evt);
            }
            return;
        }

        s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
        let curPos = Vec2Pool.get(s_vec2);

        s_vec2.subtract(this._lastPoint);
        this.delta.set(s_vec2);

        if(this.snapping) {
            this.delta.x = Math.round(this.delta.x);
            this.delta.y = Math.round(this.delta.y);
            if(this.delta.x == 0 && this.delta.y == 0) {
                return;
            }
        }

        let deltaTime = Timer.inst.unscaleDelta * 0.001;
        let elapsed = (Timer.inst.unscaleTimer - this._time) * 0.001 * 60 - 1;
        if(elapsed > 1) {
            this.velocity.multiplyScalar(Math.pow(0.833, elapsed));
        }

        s_vec2.set(this.delta);
        s_vec2.divide2f(deltaTime, deltaTime);
        Vec2.lerp(this.velocity, this.velocity, s_vec2, deltaTime*10);

        this._time = Timer.inst.unscaleTimer;
        this.position.add(this.delta);
        this._lastPoint2.set(this._lastPoint);
        this._lastPoint.set(curPos);
        Vec2Pool.put(curPos);

        if(!this._started) {
            let sensitivity = 0;
            sensitivity = this.touchDragSensitivity;

            if(Math.abs(this.delta.x) < sensitivity && Math.abs(this.delta.y) < sensitivity) {
                return;
            }

            this._started = true;
            this.emit(SwipeGesture.SWIPE_BEGIN, evt);
        }
        
        this.emit(SwipeGesture.SWIPE_MOVE, evt);
    }

    private __touchEnd(evt: Event) {
        this._touchBegan = false;        
        GRoot.inst.off(Event.TOUCH_MOVE, this.__touchMove, this);
        GRoot.inst.off(Event.TOUCH_END, this.__touchEnd, this);

        if (!this._started) {
            return;
        }

        this._started = false;
        this._lastTouchId = -1;

        s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
        let pt = Vec2Pool.get(s_vec2);
        this.delta.set(s_vec2.subtract(this._lastPoint2));
        if(this.snapping) {
            this.delta.x = Math.round(this.delta.x);
            this.delta.y = Math.round(this.delta.y);
        }

        let elapsed = (Timer.inst.unscaleTimer- this._time) * 0.001 * 60 - 1;
        if(elapsed > 1) {
            this.velocity.multiplyScalar(Math.pow(0.833, elapsed));
        }
        if(this.snapping) {
            this.velocity.x = Math.round(this.velocity.x);
            this.velocity.y = Math.round(this.velocity.y);
        }        
        this.emit(SwipeGesture.SWIPE_END, evt);

        pt.subtract(this._startPoint);
        if(Math.abs(pt.x) > this.actionDistance || Math.abs(pt.y) > this.actionDistance) {
            this.emit(SwipeGesture.SWIPE_ACTION, evt);
        }

        Vec2Pool.put(pt);
    }
}
var s_vec2 = new Vec2(0, 0);