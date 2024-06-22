import Gesture from "./Gesture";
import { Vec2 } from "cc";
import { Event, GRoot } from "fairygui-cc";

export default class PinchGesture extends Gesture {
    /// <summary>
    /// 当两个手指开始呈捏手势时派发该事件。
    /// </summary>
    public static readonly PINCH_BEGIN = "onPinchBegin";
    /// <summary>
    /// 当其中一个手指离开屏幕时派发该事件。
    /// </summary>
    public static readonly PINCH_END = "onPinchEnd";
    /// <summary>
    /// 当手势动作时派发该事件。
    /// </summary>
    public static readonly PINCH_ACTION = "onPinchAction";

    /// <summary>
    /// 总共缩放的量。
    /// </summary>
    public scale: number = 0;

    /// <summary>
    /// 从上次通知后的改变量。
    /// </summary>
    public delta: number = 0;

    /**
     * 中心位置
     */
    public center = new Vec2();

    private _startDistance: number = 0;
    private _lastScale: number = 0;
    private _started: boolean = false;
    private _touchBegan: boolean = false;
    private _enabled = false;

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
        if(touchIds.length == 2) {
            if(!this._started && !this._touchBegan) {
                this._touchBegan = true;
                evt.captureTouch();

                let pt1 = GRoot.inst.getTouchPosition(touchIds[0]);
                let pt2 = GRoot.inst.getTouchPosition(touchIds[1]);
                let dist = Vec2.distance(pt1, pt2);
                this._startDistance = Math.max(1, dist);

                GRoot.inst.on(Event.TOUCH_MOVE, this.__touchMove, this);
                GRoot.inst.on(Event.TOUCH_END, this.__touchEnd, this);

                console.log("PinchGesture begin");
            }
        }else if(this._started) {
            this.__touchEnd(evt);
        }
    }

    
    private __touchMove(evt: Event) {
        let touchIds = this.getTouchIds();
        if(!this._touchBegan || touchIds.length != 2) {
            this.__touchEnd(evt);
            return;
        }

        let pt1 = GRoot.inst.getTouchPosition(touchIds[0]);
        let pt2 = GRoot.inst.getTouchPosition(touchIds[1]);
        let dist = Vec2.distance(pt1, pt2);
        this.center.set(pt1);
        this.center.add(pt2).multiplyScalar(0.5);

        if(!this._started && Math.abs(dist - this._startDistance) > this.touchDragSensitivity) {
            this._started = true;
            this.scale = 1;
            this._lastScale = 1;

            this.emit(PinchGesture.PINCH_BEGIN, evt);
        }

        if(this._started) {
            let ss = dist / this._startDistance;
            this.delta = ss - this._lastScale;
            this._lastScale = ss;
            this.scale += this.delta;
            this.emit(PinchGesture.PINCH_ACTION, evt);
        }
    }

    
    private __touchEnd(evt: Event) {
        if(!this._touchBegan) {
            return;
        }
        
        GRoot.inst.off(Event.TOUCH_MOVE, this.__touchMove, this);
        GRoot.inst.off(Event.TOUCH_END, this.__touchEnd, this);

        this._touchBegan = false;
        if(this._started) {
            this._started = false;
            this.emit(PinchGesture.PINCH_END, evt);

            console.log("PinchGesture end");
        }else{
            console.log("PinchGesture cancel");
        }

    }
}