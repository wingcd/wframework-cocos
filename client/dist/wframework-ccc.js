var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("common/Pool", ["require", "exports", "cc"], function (require, exports, cc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mat4Pool = exports.QuatPool = exports.Vec4Pool = exports.Vec3Pool = exports.Vec2Pool = exports.V2_LEFT = exports.V2_RIGHT = exports.V2_DOWN = exports.V2_UP = exports.V3_LEFT = exports.V3_BACKWARD = exports.V3_DOWN = void 0;
    exports.V3_DOWN = Object.freeze(new cc_1.Vec3(0, -1, 0));
    exports.V3_BACKWARD = Object.freeze(new cc_1.Vec3(0, 0, 1));
    exports.V3_LEFT = Object.freeze(new cc_1.Vec3(-1, 0, 0));
    exports.V2_UP = Object.freeze(new cc_1.Vec2(0, 1));
    exports.V2_DOWN = Object.freeze(new cc_1.Vec2(0, -1));
    exports.V2_RIGHT = Object.freeze(new cc_1.Vec2(1, 0));
    exports.V2_LEFT = Object.freeze(new cc_1.Vec2(-1, 0));
    class Pool {
        constructor(type) {
            this._pool = [];
            this._poolSize = 0;
            this._type = type;
        }
        get(...args) {
            if (this._poolSize > 0) {
                this._poolSize--;
                let val = this._pool.pop();
                val.set(...args);
                return val;
            }
            // @ts-ignore
            return new this._type(...args);
        }
        put(v) {
            this._pool.push(v);
            this._poolSize++;
        }
        puts(...vs) {
            for (let i = 0; i < vs.length; i++) {
                this.put(vs[i]);
            }
        }
        clear() {
            this._pool.length = 0;
            this._poolSize = 0;
        }
    }
    exports.Vec2Pool = new Pool(cc_1.Vec2);
    exports.Vec3Pool = new Pool(cc_1.Vec3);
    exports.Vec4Pool = new Pool(cc_1.Vec4);
    exports.QuatPool = new Pool(cc_1.Quat);
    exports.Mat4Pool = new Pool(cc_1.Mat4);
});
define("common/Timer", ["require", "exports", "cc", "common/UtilsHelper"], function (require, exports, cc_2, UtilsHelper_1) {
    "use strict";
    var Timer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LaterHandler = exports.TimerHandler = exports.Timer = void 0;
    const { ccclass, property } = cc_2._decorator;
    class TimerItem {
    }
    /**
     * 定时器
     */
    let Timer = Timer_1 = class Timer extends cc_2.Component {
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
        static get inst() {
            if (this._inst == null) {
                var node = new cc_2.Node("Timer");
                cc_2.director.getScene().addChild(node);
                cc_2.game.addPersistRootNode(node);
                this._inst = node.addComponent(Timer_1);
            }
            return this._inst;
        }
        start() {
            let directorTicker = cc_2.director.tick;
            cc_2.director.tick = (dt) => {
                try {
                    directorTicker.call(cc_2.director, dt * this.scale);
                }
                catch (e) {
                    console.error(e);
                }
            };
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
        update(dt) {
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
            Timer_1._pool.push(handler);
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
            handler = Timer_1._pool.length > 0 ? Timer_1._pool.pop() : new TimerHandler();
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
            var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper_1.UtilsHelper.getGID()) : 0;
            var mid = method.$_TID || (method.$_TID = (Timer_1._mid++) * 100000);
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
        once(delay, method, caller, args = null, coverBefore = true) {
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
        loop(delay, method, caller, args = null, coverBefore = true, jumpFrame = false) {
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
        frameOnce(delay, method, caller, args = null, coverBefore = true) {
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
        frameLoop(delay, method, caller, args = null, coverBefore = true) {
            this._create(true, true, delay, method, caller, args, coverBefore);
        }
        toString() {
            return " handlers:" + this._handlers.length + " pool:" + Timer_1._pool.length;
        }
        /**
         * 移除timer
         * @param method
         * @param caller
         */
        clear(method, caller) {
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
        clearAll(caller) {
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
        _getHandler(method, caller) {
            var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper_1.UtilsHelper.getGID()) : 0;
            var mid = method.$_TID || (method.$_TID = (Timer_1._mid++) * 100000);
            return this._map[cid + mid];
        }
        callLater(method, caller, args = null) {
            CallLater.inst.callLater(method, caller, args);
        }
        runCallLater(method, caller) {
            CallLater.inst.runCallLater(method, caller);
        }
        runTimer(method, caller) {
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
    };
    Timer.gSysTimer = null;
    Timer._pool = [];
    Timer._mid = 1;
    Timer = Timer_1 = __decorate([
        ccclass('Timer')
    ], Timer);
    exports.Timer = Timer;
    class Handler {
        constructor() {
            this.repeat = 0;
            this.useFrame = false;
            this.delay = 0;
            this.exeTime = 0;
            this.jumpFrame = false;
            this.key = 0;
            this.caller = null;
            this.method = null;
            this.args = null;
        }
        clear() {
        }
        run(withClear) {
        }
    }
    class TimerHandler extends Handler {
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
    exports.TimerHandler = TimerHandler;
    class LaterHandler extends Handler {
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
    exports.LaterHandler = LaterHandler;
    class CallLater {
        constructor() {
            this._pool = [];
            this._map = {};
            this._laters = [];
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
            var cid = caller ? caller.$_GID || (caller.$_GID = UtilsHelper_1.UtilsHelper.getGID()) : 0;
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
    CallLater.inst = new CallLater();
});
define("common/UtilsHelper", ["require", "exports", "cc", "fairygui-cc", "common/Pool", "common/Timer"], function (require, exports, cc_3, fairygui_cc_1, Pool_1, Timer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UtilsHelper = exports.EPlatform = void 0;
    var EPlatform;
    (function (EPlatform) {
        EPlatform[EPlatform["Windows"] = 0] = "Windows";
        EPlatform[EPlatform["Android"] = 1] = "Android";
        EPlatform[EPlatform["iOS"] = 2] = "iOS";
    })(EPlatform = exports.EPlatform || (exports.EPlatform = {}));
    class UtilsHelper {
        static tryPraseBoolean(val, defVal) {
            return val != null ? val : defVal;
        }
        static instance(type, ...args) {
            // var newInstance = Object.create(type.prototype);
            // newInstance.constructor.apply(newInstance, args);
            return new type(...args);
        }
        static getPlatform() {
            if (!navigator || !navigator.userAgent) {
                return EPlatform.Windows;
            }
            var u = navigator.userAgent;
            var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
            if (isAndroid) {
                return EPlatform.Android;
            }
            var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
            if (isiOS) {
                return EPlatform.iOS;
            }
            var isWindows = u.match(/.*Windows.*/gi);
            if (isWindows) {
                return EPlatform.Windows;
            }
        }
        static randomFuncName(len) {
            var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var s = "";
            var random = function () {
                var rand = Math.floor(Math.random() * str.length);
                return str.charAt(rand);
            };
            s += random();
            str += '0123456789';
            for (var i = 0; i < len - 1; i++) {
                s += random();
            }
            return s;
        }
        static randomString(len) {
            len = len || 32;
            var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
            var maxPos = $chars.length;
            var pwd = '';
            for (let i = 0; i < len; i++) {
                pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
            }
            return pwd;
        }
        static stringToColor(color) {
            let r = parseInt(color.substr(1, 2), 16);
            let g = parseInt(color.substr(3, 2), 16);
            let b = parseInt(color.substr(5, 2), 16);
            return [r, g, b];
        }
        static getGID() {
            return UtilsHelper._gid++;
        }
        static convertTouchLocationToNodeSpaceAR(pos, node, outPos, nodeCamera) {
            var camera = nodeCamera ? nodeCamera.camera : cc_3.director.root.batcher2D.getFirstRenderCamera(node);
            s_vec3_2.set(pos.x, pos.y, 0);
            camera.screenToWorld(s_vec3, s_vec3_2);
            node._uiProps.uiTransformComp.convertToNodeSpaceAR(s_vec3, s_vec3_2);
            if (!outPos) {
                outPos = new cc_3.Vec3;
            }
            outPos.set(s_vec3_2);
            return outPos;
        }
        static convertTouchLocationToGRoot(pos, node, outPos, nodeCamera) {
            let vec3 = Pool_1.Vec3Pool.get();
            this.convertTouchLocationToNodeSpaceAR(pos, node, vec3, nodeCamera);
            let vec2 = Pool_1.Vec2Pool.get(vec3.x, vec3.y);
            UtilsHelper.cnode2groot(vec2, node, vec2);
            if (!outPos) {
                outPos = new cc_3.Vec2;
            }
            outPos.set(vec2);
            Pool_1.Vec3Pool.put(vec3);
            Pool_1.Vec2Pool.put(vec2);
            return outPos;
        }
        static convertToNodeSpace(pos, sourceNode, targetNode, outPos) {
            if (!outPos) {
                outPos = new cc_3.Vec3;
            }
            outPos.set(s_vec3);
            sourceNode.updateWorldTransform();
            targetNode.updateWorldTransform();
            sourceNode._uiProps.uiTransformComp.convertToWorldSpaceAR(pos, outPos);
            targetNode._uiProps.uiTransformComp.convertToNodeSpaceAR(outPos, outPos);
            return outPos;
        }
        static grootYFlip(gpos, outpos) {
            s_vec3.set(gpos.x, fairygui_cc_1.GRoot.inst.height - gpos.y, 0);
            if (!outpos) {
                outpos = new cc_3.Vec2;
            }
            outpos.set(s_vec3.x, s_vec3.y);
            return outpos;
        }
        static groot2Screen(gpos, outpos) {
            outpos = UtilsHelper.grootYFlip(gpos, outpos);
            s_vec3.set(outpos.x, outpos.y, 0);
            var camera = cc_3.director.root.batcher2D.getFirstRenderCamera(fairygui_cc_1.GRoot.inst.node);
            camera.worldToScreen(s_vec3, s_vec3);
            outpos.set(s_vec3.x, s_vec3.y);
            return outpos;
        }
        static groot2cnode(gpos, node, outpos) {
            var camera = cc_3.director.root.batcher2D.getFirstRenderCamera(fairygui_cc_1.GRoot.inst.node);
            s_vec3.set(gpos.x, fairygui_cc_1.GRoot.inst.height - gpos.y, 0);
            camera.worldToScreen(s_vec3_2, s_vec3);
            camera = cc_3.director.root.batcher2D.getFirstRenderCamera(node);
            camera.screenToWorld(s_vec3, s_vec3_2);
            node.updateWorldTransform();
            node.getComponent(cc_3.UITransform).convertToNodeSpaceAR(s_vec3, s_vec3_2);
            if (!outpos) {
                outpos = new cc_3.Vec2;
            }
            outpos.set(s_vec3_2.x, s_vec3_2.y);
            return outpos;
        }
        static cnode2fnode(npos, node, fnode, outpos) {
            this.cnode2groot(npos, node, outpos);
            fnode.globalToLocal(outpos.x + fnode.width * fnode.pivotX, outpos.y + fnode.height * fnode.pivotY, outpos);
            return outpos;
        }
        static world2groot(node, camera, outpos) {
            node.updateWorldTransform();
            node.getWorldPosition(s_vec3);
            camera.convertToUINode(s_vec3, fairygui_cc_1.GRoot.inst.node, s_vec3);
            s_vec3.y = -s_vec3.y;
            if (!outpos) {
                outpos = new cc_3.Vec2;
            }
            outpos.set(s_vec3.x, s_vec3.y);
            return outpos;
        }
        static cnode2groot(npos, node, outpos) {
            var camera = cc_3.director.root.batcher2D.getFirstRenderCamera(node);
            s_vec3_2.set(npos.x, npos.y);
            node.updateWorldTransform();
            node.getComponent(cc_3.UITransform).convertToWorldSpaceAR(s_vec3_2, s_vec3);
            camera.worldToScreen(s_vec3_2, s_vec3);
            camera = cc_3.director.root.batcher2D.getFirstRenderCamera(fairygui_cc_1.GRoot.inst.node);
            camera.screenToWorld(s_vec3, s_vec3_2);
            s_vec2.set(s_vec3.x, fairygui_cc_1.GRoot.inst.height - s_vec3.y);
            if (!outpos) {
                outpos = new cc_3.Vec2;
            }
            outpos.set(s_vec2);
            return outpos;
        }
        /** 等待一帧 */
        static oneframe() {
            return new Promise((resolve, reject) => {
                Timer_2.Timer.inst.frameOnce(1, resolve, this);
            });
        }
        /** 等待帧结束 */
        static endframe() {
            return new Promise((resolve, reject) => {
                cc_3.director.once(cc_3.Director.EVENT_END_FRAME, resolve, this);
            });
        }
        /** 等待num帧 */
        static waitframe(num) {
            return new Promise((resolve, reject) => {
                Timer_2.Timer.inst.frameOnce(num, resolve, this);
            });
        }
        /** 等待成功 */
        static until(condition, timeout = 0) {
            let timer = 0;
            return new Promise((resolve, reject) => {
                let func = () => {
                    if (condition() || (timeout > 0 && timer >= timeout)) {
                        Timer_2.Timer.inst.clear(func, this);
                        resolve();
                    }
                    timer += Timer_2.Timer.inst.delta / 1000;
                };
                Timer_2.Timer.inst.frameLoop(1, func, this);
            });
        }
        /** 延迟指定时间（秒） */
        static wait(time = 1) {
            return new Promise((resolve, reject) => {
                Timer_2.Timer.inst.once(time * 1000, resolve, this);
            });
        }
        /**
         * 设置延迟点击
         * @param gObj GObject
         * @param cd  延迟时间（秒）
         */
        static async setClickCD(gObj, cd = 1) {
            if (gObj["_ck_interval_"]) {
                return;
            }
            gObj["_ck_interval_"] = true;
            await this.oneframe();
            if (gObj.isDisposed) {
                return;
            }
            delete gObj["_ck_interval_"];
            gObj.touchable = false;
            await this.wait(cd);
            gObj.touchable = true;
        }
        static setChildLayer(node, layer, depth = 0) {
            if (depth == 0) {
                if (layer) {
                    node["_old_lyr_"] = node.layer;
                    node.layer = layer;
                }
                else {
                    node.layer = node["_old_lyr_"];
                    delete node["_old_lyr_"];
                }
            }
            let children = node.children;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (layer) {
                    child["_old_lyr_"] = child.layer;
                    child.layer = layer;
                }
                else {
                    child.layer = child["_old_lyr_"];
                    delete child["_old_lyr_"];
                }
                this.setChildLayer(child, layer, depth + 1);
            }
        }
        static toWxFile(arrayBuffer, size, type = "png") {
            //@ts-ignore
            let canvas = wx.createCanvas();
            let width = canvas.width = Math.floor(size.width);
            let height = canvas.height = Math.floor(size.height);
            let ctx = canvas.getContext("2d");
            let imageU8Data = new Uint8Array(arrayBuffer);
            let rowBytes = width * 4;
            let rowBytesh = height * 4;
            for (let row = 0; row < rowBytesh; row++) {
                let sRow = height - 1 - row;
                let imageData = ctx.createImageData(width, 1);
                let start = sRow * rowBytes;
                for (let i = 0; i < rowBytes; i++) {
                    imageData.data[i] = imageU8Data[start + i];
                }
                ctx.putImageData(imageData, 0, row);
            }
            // @ts-ignore
            if (type == "png" && canvas.style) {
                // @ts-ignore
                canvas.style.backgroundColor = null;
            }
            //@ts-ignore
            let tempFilePath = canvas.toTempFilePathSync({
                x: 0,
                y: 0,
                width: width,
                height: height,
                destWidth: width,
                destHeight: height,
            });
            return tempFilePath;
        }
        static copyTo(from, to) {
            // return Object.assign(to, from);
            if (!from) {
                return;
            }
            let keys = Object.keys(from);
            keys.forEach(key => {
                let field = from[key];
                if (Array.isArray(field)) {
                    to[key] = [];
                    for (let i = 0; i < field.length; i++) {
                        let item = field[i];
                        if (item && typeof item == "object") {
                            to[key][i] = {};
                            this.copyTo(item, to[key][i]);
                        }
                        else {
                            to[key][i] = item;
                        }
                    }
                }
                else if (field && typeof field === "object") {
                    if (!to[key])
                        to[key] = {};
                    this.copyTo(field, to[key]);
                }
                else {
                    to[key] = field;
                }
            });
            return to;
        }
        /**
         * 获取节点的中心世界坐标系坐标值
         * @param node
         * @param outPos
         * @returns
         */
        static getNodeCenterInWorld(node, outPos) {
            let tr = node._uiProps.uiTransformComp;
            let temp = Pool_1.Vec3Pool.get();
            temp.set(tr.width * (0.5 - tr.anchorX), tr.height * (0.5 - tr.anchorY));
            tr.convertToWorldSpaceAR(temp, temp);
            outPos.set(temp.x, temp.y);
            Pool_1.Vec3Pool.put(temp);
            return outPos;
        }
        static format(source, ...params) {
            if (!source) {
                return source;
            }
            params.forEach((val, idx) => {
                source = source.replace(new RegExp("\\{" + idx + "\\}", "g"), val === null || val === void 0 ? void 0 : val.toString());
            });
            return source;
        }
        ;
        static dateFormat(time, fmt = "yyyy-MM-dd hh:mm:ss") {
            let date = new Date(time);
            var o = {
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "h+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds(),
                "q+": Math.floor((date.getMonth() + 3) / 3),
                "S": date.getMilliseconds() //毫秒
            };
            return this.formatDateOrTime(fmt, o, date.getFullYear());
        }
        static timeFormat(t, format = "hh:mm:ss") {
            const day = Math.floor(t / 86400);
            const hour = Math.floor((t % 86400) / 3600);
            const minute = Math.floor((t % 3600) / 60);
            const second = Math.floor(t % 60);
            var o = {
                "D+": day,
                "h+": hour,
                "m+": minute,
                "s+": second
            };
            return this.formatDateOrTime(format, o);
        }
        static formatDateOrTime(fmt, o, year) {
            if (year && /(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (year + "").substr(4 - RegExp.$1.length));
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return fmt;
        }
    }
    exports.UtilsHelper = UtilsHelper;
    UtilsHelper._gid = 0;
    var s_vec2 = new cc_3.Vec2;
    var s_vec3 = new cc_3.Vec3;
    var s_vec3_2 = new cc_3.Vec3;
});
define("patch/ccc_patch", ["require", "exports", "cc", "cc/env", "fairygui-cc"], function (require, exports, cc_4, env_1, fairygui_cc_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clearUselessCache = exports.PackageVersionMap = void 0;
    // 解决fairygui层级不一致造成mask异常问题
    if (!env_1.EDITOR) {
        var layer2D = fairygui_cc_2.UIConfig.defaultUILayer;
        var setParent = cc_4.Node.prototype.setParent;
        cc_4.Node.prototype.setParent = function (value, keepWorldTransform) {
            let that = this;
            setParent.call(that, value, keepWorldTransform);
            if (value && value.$gobj && value.layer == layer2D) {
                that.layer = value.layer;
            }
        };
    }
    // let tiledTileOnEnable = TiledTile.prototype.onEnable;
    // TiledTile.prototype.onEnable = function () {
    //     let that = this as TiledTile;
    //     tiledTileOnEnable.call(that);
    //     let trans = that.node.getComponent(UITransform);
    //     trans.anchorY = 0;   
    // }
    exports.PackageVersionMap = {};
    var clearUselessCache = function (version) {
    };
    exports.clearUselessCache = clearUselessCache;
    if (env_1.MINIGAME) {
        if (typeof wx != 'undefined' && wx.onMemoryWarning) {
            wx.onMemoryWarning && wx.onMemoryWarning(() => {
                wx.triggerGC();
                console.log("内存警告");
            });
        }
        //@ts-ignore
        const { fs } = window.fsUtils;
        const ASSET_MGR_REGEX = /^https?:\/\/.*/;
        const cacheManager = cc_4.assetManager.cacheManager;
        const downloader = cc_4.assetManager.downloader;
        const downloadJson = downloader["_downloaders"][".json"];
        const downloadBundle = downloader["_downloaders"]["bundle"];
        const subpackages = {};
        const subpacks = cc_4.settings.querySettings('assets', 'subpackages');
        subpacks && subpacks.forEach((x) => subpackages[x] = `subpackages/${x}`);
        function existsAsync(file) {
            try {
                fs.accessSync(file);
                return true;
            }
            catch (e) {
                return false;
            }
        }
        // 重写文件创建方法，需要提前写，否则取出来的是原始方法
        //@ts-ignore
        const makeDirSync = window.fsUtils.makeDirSync = function (path, recursive) {
            try {
                if (!existsAsync(path)) {
                    fs.mkdirSync(path, recursive);
                }
                return null;
            }
            catch (e) {
                console.warn(`Make directory failed: path: ${path} message: ${e.message}`);
                return new Error(e.message);
            }
        };
        //@ts-ignore
        const { downloadFile, readText, readArrayBuffer, readJson, loadSubpackage, getUserDataPath, exists, unzip, rmdirSync, isOutOfStorage } = window.fsUtils;
        //@ts-ignore
        const unzipCacheBundle = cacheManager.unzipAndCacheBundle;
        //@ts-ignore
        cacheManager.makeBundleFolder = function (bundleName) {
            let dir = this.cacheDir + '/' + bundleName;
            if (!existsAsync(dir)) {
                //@ts-ignore
                makeDirSync(dir, true);
            }
        };
        function copyDirsSync(srcDir, destDir) {
            let files = fs.readdirSync(srcDir);
            files.forEach((filename) => {
                let srcPath = cc_4.path.join(srcDir, filename);
                let destPath = cc_4.path.join(destDir, filename);
                let stat = fs.statSync(srcPath);
                if (stat.isFile()) {
                    fs.copyFileSync(srcPath, destPath);
                }
                else if (stat.isDirectory()) {
                    if (!existsAsync(destPath)) {
                        makeDirSync(destPath, true);
                    }
                    copyDirsSync(srcPath, destPath);
                }
            });
        }
        // /**
        //  * 有些平台的解压目录最后必须带一个/【比如美团】，有些不会，支付宝末尾不支持双斜杠
        //  */
        var suffix = 0;
        //@ts-ignore
        cacheManager.unzipAndCacheBundle = function (id, zipFilePath, cacheBundleRoot, onComplete, targetPath = null) {
            // 只有美团ios需要处理下解压路径，其他平台走引擎默认逻辑
            if (!env_1.ALIPAY) {
                unzipCacheBundle.call(this, id, zipFilePath, cacheBundleRoot, onComplete, targetPath);
                return;
            }
            let needCopy = true;
            if (!targetPath) {
                needCopy = false;
                let time = Date.now().toString();
                targetPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat("" + suffix++).concat("/");
            }
            let time = Date.now().toString();
            let self = this;
            let tempDir = needCopy ? (targetPath + '/temp_' + time + (suffix++) + "/") : (targetPath.endsWith("/") ? targetPath : targetPath + "/");
            makeDirSync(tempDir, true);
            unzip(zipFilePath, tempDir, function (err) {
                if (err) {
                    rmdirSync(targetPath, true);
                    if (needCopy) {
                        rmdirSync(tempDir, true);
                    }
                    if (isOutOfStorage(err.message)) {
                        self.outOfStorage = true;
                        self.autoClear && self.clearLRU();
                    }
                    self.cachedFiles.remove(id);
                    onComplete && onComplete(err);
                    return;
                }
                else {
                    // copy to real dir
                    if (needCopy) {
                        copyDirsSync(tempDir, targetPath);
                        rmdirSync(tempDir, true);
                    }
                    self.cachedFiles.add(id, { bundle: cacheBundleRoot, url: targetPath, lastTime: time });
                }
                self.writeCacheFile();
                onComplete && onComplete(null, targetPath);
            });
        };
        function handleZip(url, options, onComplete) {
            let cachedUnzip = cacheManager.cachedFiles.get(url);
            if (cachedUnzip) {
                //@ts-ignore
                cacheManager.updateLastTime(url);
                onComplete && onComplete(null, cachedUnzip.url);
            }
            else if (ASSET_MGR_REGEX.test(url)) {
                console.log(`unzip file ${url}`);
                downloadFile(url, null, options.header, options.onFileProgress, function (err, downloadedZipPath) {
                    if (err) {
                        console.error(`download ${url} failed : ${err.message}`);
                        onComplete && onComplete(err);
                        return;
                    }
                    //@ts-ignore
                    cacheManager.unzipAndCacheBundle(url, downloadedZipPath, options.__cacheBundleRoot__, onComplete); //, options?._targetPath);
                });
            }
            else {
                //@ts-ignore
                cacheManager.unzipAndCacheBundle(url, url, options.__cacheBundleRoot__, onComplete); //, options?._targetPath);
            }
        }
        cc_4.assetManager.downloader.register("bundle", (nameOrUrl, options, onComplete) => {
            console.log("bundle", nameOrUrl, options);
            let pkg = exports.PackageVersionMap[nameOrUrl];
            if (!pkg) {
                downloadBundle(nameOrUrl, options, onComplete);
                return;
            }
            let bundleName = cc_4.path.basename(nameOrUrl);
            let version = options.version || cc_4.assetManager.downloader.bundleVers[bundleName];
            let suffix = version ? version + '.' : '';
            let localVersion = cc_4.assetManager.downloader.bundleVers[bundleName];
            let localSuffix = localVersion ? localVersion + '.' : '';
            function getConfigPathForSubPackage() {
                if (cc_4.sys.platform === cc_4.sys.Platform.TAOBAO_MINI_GAME) {
                    return `${bundleName}/config.${suffix}json`;
                }
                return `subpackages/${bundleName}/config.${localSuffix}json`;
            }
            function appendBaseToJsonData(data) {
                if (!data)
                    return;
                if (cc_4.sys.platform === cc_4.sys.Platform.TAOBAO_MINI_GAME) {
                    data.base = `${bundleName}/`;
                }
                else {
                    data.base = `subpackages/${bundleName}/`;
                }
            }
            // @ts-ignore
            if (subpackages[bundleName]) {
                const config = getConfigPathForSubPackage();
                loadSubpackage(bundleName, options.onFileProgress, (err) => {
                    if (err) {
                        onComplete(err, null);
                        return;
                    }
                    downloadJson(config, options, (err, data) => {
                        appendBaseToJsonData(data);
                        onComplete(err, data);
                    });
                });
            }
            else {
                let js;
                let url;
                if (ASSET_MGR_REGEX.test(nameOrUrl) || nameOrUrl.startsWith(getUserDataPath())) {
                    url = nameOrUrl;
                    js = `src/bundle-scripts/${bundleName}/index.${localSuffix}js`;
                    // @ts-ignore
                    cacheManager.makeBundleFolder(bundleName);
                }
                else if (downloader.remoteBundles.indexOf(bundleName) !== -1) {
                    url = `${downloader.remoteServerAddress}remote/${bundleName}`;
                    js = `src/bundle-scripts/${bundleName}/index.${localSuffix}js`;
                    // @ts-ignore
                    cacheManager.makeBundleFolder(bundleName);
                }
                else {
                    url = `assets/${bundleName}`;
                    js = `assets/${bundleName}/index.${localSuffix}js`;
                }
                try {
                    // 自己重写的require js后，加载地址不一样了，需要处理一下
                    if (cc_4.sys.platform === cc_4.sys.Platform.TAOBAO_MINI_GAME) {
                        // @ts-ignore
                        require(`/../../${js}`);
                    }
                    else if (cc_4.sys.platform !== cc_4.sys.Platform.TAOBAO_CREATIVE_APP) { // Can't load scripts dynamically on Taobao platform
                        // @ts-ignore
                        require(`../../${js}`);
                    }
                }
                catch (e) {
                    console.error("require error:" + e);
                }
                options.__cacheBundleRoot__ = bundleName;
                const config = `${url}/config.${suffix}json`;
                downloadJson(config, options, function (err, data) {
                    if (err) {
                        onComplete && onComplete(err);
                        return;
                    }
                    if (data.isZip) {
                        let zipVersion = data.zipVersion;
                        let zipUrl = getZipUrl(pkg, url, zipVersion);
                        console.log(`zipUrl: ${zipUrl}`);
                        handleZip(zipUrl, options, (err, unzipPath) => {
                            if (!err) {
                                data.base = unzipPath + '/res/';
                                // PATCH: for android alipay version before v10.1.95 (v10.1.95 included)
                                // to remove in the future
                                if (cc_4.sys.platform === cc_4.sys.Platform.ALIPAY_MINI_GAME && cc_4.sys.os === cc_4.sys.OS.ANDROID) {
                                    let resPath = unzipPath + 'res/';
                                    if (fs.accessSync({ path: resPath })) {
                                        data.base = resPath;
                                    }
                                }
                                if (!options) {
                                    options = {};
                                }
                                options._targetPath = unzipPath;
                            }
                            else {
                                console.error(err);
                            }
                            onComplete && onComplete(err, data);
                        });
                    }
                    else {
                        data.base = url + '/';
                        onComplete && onComplete(null, data);
                    }
                });
            }
        });
        function getZipUrl(pkg, url, zipVersion) {
            let defaultUrl = `${url}/res.${zipVersion ? zipVersion + '.' : ''}zip`;
            if (!pkg || typeof (pkg) !== 'object' || pkg.formats == null || pkg.formats.length === 0) {
                return defaultUrl;
            }
            let device = cc_4.director.root.device;
            let ext = "";
            if (device) {
                for (let i = 0; i < pkg.formats.length; i++) {
                    let tmpExt = pkg.formats[i];
                    if (tmpExt === 'astc' && device.getFormatFeatures(cc_4.gfx.Format.ASTC_RGBA_4X4)) {
                        ext = ".astc";
                        break;
                    }
                    else if (tmpExt === 'pvr' && (device.getFormatFeatures(cc_4.gfx.Format.PVRTC_RGB2) || device.getFormatFeatures(cc_4.gfx.Format.PVRTC_RGBA2))) {
                        ext = ".pvr";
                        break;
                    }
                    else if (tmpExt === 'pkm' && device.getFormatFeatures(cc_4.gfx.Format.ETC_RGB8)) {
                        ext = ".pkm";
                        break;
                    }
                    else if (tmpExt === 'webp' && cc_4.sys.hasFeature(cc_4.sys.Feature.WEBP)) {
                        ext = ".webp";
                        break;
                    }
                }
            }
            // if no suitable format found, use default format
            if (!ext) {
                return defaultUrl;
            }
            return `${url}/res.${(zipVersion ? zipVersion : '') + ext + "."}zip`;
        }
        function clearUselessCacheF(version) {
            console.log("clearUselessCache", version);
            let caches = cc_4.assetManager.cacheManager.cachedFiles;
            let curVersion = `/${version}/`;
            let versionRegex = /\/((debug\d?)|((\d.*?\.?){1,4}))\//gi;
            // 移除所有hash不在PackageVersionMap中的缓存
            let regex = /https?:\/\/.*?\/remote\/(.*?)\/.*?/gi;
            caches.forEach((value, key) => {
                let arr = regex.exec(key);
                if (value && key && arr && arr.length > 1 && arr[1]) {
                    let exits = false;
                    // console.log("check cache:", key, value.url, value.bundle);
                    let pkgName = arr[1];
                    let dotSplits = key.split(".");
                    let hashValue = dotSplits[dotSplits.length - 2]; // xxxx.hash.ext
                    var pkg = exports.PackageVersionMap[pkgName];
                    if (pkg) {
                        if (pkg == hashValue) {
                            exits = true;
                        }
                        else if (pkg.files) {
                            let fn = cc_4.path.basename(key);
                            if (!!pkg.files[fn]) {
                                exits = true;
                            }
                        }
                        else {
                            exits = pkg.hash == hashValue || pkg.zipHash == hashValue;
                        }
                    }
                    if (!exits) {
                        console.log("删除:", value.url, key);
                        cc_4.assetManager.cacheManager.removeCache(key);
                    }
                    else if (key.indexOf(curVersion) < 0) {
                        console.log("替换:", value.url, key);
                        cc_4.assetManager.cacheManager.cachedFiles.remove(key);
                        cc_4.assetManager.cacheManager.cachedFiles.add(key.replace(versionRegex, curVersion), value);
                    }
                }
            });
            cc_4.assetManager.cacheManager["writeCacheFile"]();
        }
        exports.clearUselessCache = clearUselessCacheF;
    }
    exports.default = null;
});
define("view/ViewMap", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewMap {
        constructor() {
            this._views = {};
            this._skins = {};
            this._skinNames = {};
        }
        static get instance() {
            if (!this._instance) {
                this._instance = new ViewMap();
            }
            return this._instance;
        }
        add(skin, viewClass) {
            let key = skin.getKey();
            this._views[key] = viewClass;
            viewClass[ViewMap.sTypeName] = key;
            this._skins[key] = skin;
            this._skinNames[skin.componentName] = skin;
        }
        remove(skin) {
            let key = skin.getKey();
            if (this._views[key]) {
                delete this._views[key][ViewMap.sTypeName];
            }
            delete this._views[key];
            delete this._skins[key];
            delete this._skinNames[skin.componentName];
        }
        get(skin) {
            return this._views[skin.getKey()];
        }
        getByName(name) {
            let skin = this.getSkinByName(name);
            if (skin) {
                return this.get(skin);
            }
            console.error("ViewMap getByName error: " + name);
            return null;
        }
        getSkin(key) {
            return this._skins[key];
        }
        getSkinByName(name) {
            return this._skinNames[name];
        }
        getSkinByType(type) {
            let key = type[ViewMap.sTypeName];
            return this.getSkin(key);
        }
        get allViews() {
            return this._views;
        }
    }
    exports.default = ViewMap;
    ViewMap.sTypeName = "__type_name__";
});
define("view/Skin", ["require", "exports", "view/ViewMap"], function (require, exports, ViewMap_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Skin {
        constructor(_path, _pkgName, _cmpName, _data, _isWindow, _autoWarpper, _assetbundle) {
            this.suffix = "";
            this.isWindow = false;
            // activity是否自动被loader包含
            this.autoWarpper = false;
            this._key = null;
            this.path = _path;
            this.packageName = _pkgName;
            this.componentName = _cmpName;
            this.data = _data;
            this.isWindow = _isWindow;
            this.autoWarpper = _autoWarpper;
            this.assetbundle = _assetbundle;
        }
        getKey() {
            if (this._key) {
                return this._key;
            }
            let key = this.path + "|" + this.packageName + "|" + this.componentName + this.suffix;
            if (this.data) {
                key += "|" + this.data;
            }
            this._key = key.toLowerCase();
            return this._key;
        }
        static bindSkin(viewType, skin) {
            ViewMap_1.default.instance.add(skin, viewType);
        }
        static getSkin(viewType) {
            return ViewMap_1.default.instance.getSkinByType(viewType);
        }
    }
    exports.default = Skin;
});
define("view/utils/FGUIExt", ["require", "exports", "view/Skin", "fairygui-cc", "cc", "fairygui-cc"], function (require, exports, Skin_1, fairygui_cc_3, cc_5, fairygui_cc_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FGUIExt {
        static unloadPackage(name) {
            var _a;
            (_a = fairygui_cc_3.UIPackage.getByName(name)) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        static async preloadPackage(abname, path, progress, delay) {
            return new Promise((resolve, reject) => {
                if (abname) {
                    let defaultDelay = delay !== null && delay !== void 0 ? delay : fairygui_cc_4.UIConfig.enableDelayLoad;
                    abname = abname !== null && abname !== void 0 ? abname : Skin_1.default.defaultAssetBundle;
                    let assetbundle = cc_5.assetManager.getBundle(abname);
                    fairygui_cc_3.UIPackage.loadPackage(assetbundle, path, (finish, total, item) => {
                        progress === null || progress === void 0 ? void 0 : progress.call(finish / total, total);
                    }, (err, pk) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    }, defaultDelay);
                }
                else {
                    fairygui_cc_3.UIPackage.loadPackage(path, (finish, total, item) => {
                        progress === null || progress === void 0 ? void 0 : progress.call(finish / total, total);
                    }, (err, pk) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            });
        }
        static checkPackageLoaded(skin) {
            var _a;
            let pkg = fairygui_cc_3.UIPackage.getByName(skin.packageName);
            if (pkg == null) {
                let abname = (_a = Skin_1.default.defaultAssetBundle) !== null && _a !== void 0 ? _a : skin.assetbundle;
                if (abname) {
                    let assetbundle = cc_5.assetManager.getBundle(abname);
                    fairygui_cc_3.UIPackage.loadPackage(assetbundle, skin.path, (err, pk) => {
                        pkg = pk;
                    });
                    console.log("please preload ui assets in assetbundle mode");
                }
                pkg = fairygui_cc_3.UIPackage.addPackage(skin.path);
            }
            return pkg;
        }
        static createObject(skin) {
            let pkg = FGUIExt.checkPackageLoaded(skin);
            return pkg.createObject(skin.componentName);
        }
        static createObjectByType(skin, type) {
            let pkg = FGUIExt.checkPackageLoaded(skin);
            return pkg.createObject(skin.componentName, type);
        }
        static cloneObject(obj) {
            return fairygui_cc_3.UIPackage.createObjectFromURL(obj.resourceURL);
        }
    }
    exports.default = FGUIExt;
});
define("common/ResManager", ["require", "exports", "cc", "patch/ccc_patch", "fairygui-cc", "view/utils/FGUIExt"], function (require, exports, cc_6, ccc_patch_1, fairygui_cc_5, FGUIExt_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResManager = void 0;
    const RESOURCES = "resources";
    class ResManager {
        static async preload(uuid, progress) {
            return new Promise((resolve, reject) => {
                cc_6.assetManager.preloadAny(uuid, (p) => {
                    progress && progress(p);
                }, (err, res) => {
                    resolve(res);
                });
            });
        }
        static async loadBundle(abName) {
            if (abName == RESOURCES || !abName) {
                return true;
            }
            let pkg = ccc_patch_1.PackageVersionMap[abName];
            let version = pkg && typeof pkg == "object" ? pkg.hash : pkg;
            let config = {
                version: version,
            };
            try {
                let bundle = await new Promise((resolve, reject) => {
                    cc_6.assetManager.loadBundle(abName, config, (err, bundle) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(bundle);
                        }
                    });
                });
                let loaders = bundle.deps.map(dep => this.loadBundle(dep));
                if (loaders.length > 0) {
                    await Promise.all(loaders);
                }
                return true;
            }
            catch (err) {
                console.error("下载失败", abName);
                return false;
            }
        }
        static getBundle(abName, check = true) {
            if (!abName || abName == RESOURCES) {
                return cc_6.resources;
            }
            let ab = cc_6.assetManager.getBundle(abName);
            if (!ab && check) {
                console.error(`can not find asset bundle named ${abName}`);
            }
            return ab;
        }
        static get(abName, url, type) {
            let ab = this.getBundle(abName, true);
            if (!ab) {
                throw new Error(`Cannot find asset bundle named ${abName}`);
            }
            if (typeof url == "string") {
                return ab.get(url, type);
            }
            else {
                return url.map(u => ab.get(u, type));
            }
        }
        static async getAsync(abName, url, type) {
            let ab = this.getBundle(abName, false);
            if (!ab) {
                await this.loadBundle(abName);
            }
            let res = this.get(abName, url, type);
            if (res) {
                return res;
            }
            try {
                res = await this.load(abName, url, type);
            }
            catch (e) {
                throw new Error(`load ${abName}:${url} data err:${e}`);
            }
            return res;
        }
        static async load(abName, url, type, onProgress) {
            let ab = this.getBundle(abName);
            if (!ab) {
                throw new Error(`Cannot find asset bundle named ${abName}`);
            }
            return new Promise((resolve, reject) => {
                ab.load(url, type, onProgress, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        }
        static async loadDir(abName, url, onProgress) {
            url = url || "";
            let ab = this.getBundle(abName);
            if (!ab) {
                throw new Error(`can not find asset bundle named ${abName}`);
            }
            return new Promise((resolve, reject) => {
                ab.loadDir(url, onProgress, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        }
        static destory(asset) {
            asset.destroy();
        }
        static async loadFUIBundle(bundle, pkg, progress, delay) {
            if (!this.isValidBundleAndPackage(bundle, pkg)) {
                return false;
            }
            await this.loadBundle(bundle);
            return await FGUIExt_1.default.preloadPackage(bundle, pkg, progress, delay);
        }
        static unloadFUIBundle(bundle, pkg) {
            if (!this.isValidBundleAndPackage(bundle, pkg)) {
                return;
            }
            fairygui_cc_5.UIPackage.removePackage(pkg);
            let b = this.getBundle(bundle);
            b.releaseAll();
            cc_6.assetManager.removeBundle(b);
        }
        static isValidBundleAndPackage(bundle, pkg) {
            if (!pkg || fairygui_cc_5.UIPackage.getByName(pkg)) {
                return false;
            }
            if (!bundle || !this.getBundle(bundle)) {
                return false;
            }
            return true;
        }
    }
    exports.ResManager = ResManager;
});
/**
 * 优先级1将会在首次加载，优先级2为后台加载，其他优先级不自动加载
 */
define("GameSettings", ["require", "exports", "cc/env", "cc", "common/ResManager"], function (require, exports, env_2, cc_7, ResManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GameSettings = void 0;
    ;
    ;
    class GameSettings {
        static getValue(key) {
            return this.datas[key];
        }
        static setValue(key, value) {
            this.datas[key] = value;
        }
        static async initial() {
            let configAsset = await ResManager_1.ResManager.getAsync(null, "config", cc_7.JsonAsset);
            this._initial(configAsset.json);
        }
        static _initial(config) {
            this.rawData = config;
            let keys = Object.keys(config);
            for (let key of keys) {
                if (key == "isDebug") {
                    continue;
                }
                this[key] = config[key];
            }
            if (window["configVersion"]) {
                this.realVersion = window["configVersion"];
            }
            console.log("Build Time: " + this.time);
            console.log("GitInfo: ", this.gitInfo);
        }
        /**
         * 重置远程服务器地址，用于通过版本号或者配置版本号来重置远程服务器地址
         * @param configVersion 配置版本号
         * @returns
         */
        static resetRemoveServer(configVersion) {
            if (env_2.HTML5 && env_2.PREVIEW) {
                console.log("HTML5不需要重置远程服务器地址");
                return;
            }
            let downloader = cc_7.assetManager.downloader;
            if (!env_2.PREVIEW) {
                // 程序版本号优先
                if (!window["configVersion"] && configVersion) {
                    // 设置为线上配置版本号
                    const versionCfg = configVersion;
                    if (versionCfg && versionCfg.configVersion) {
                        GameSettings.realVersion = versionCfg.configVersion;
                    }
                }
            }
            let newUrl = downloader.remoteServerAddress;
            let version = GameSettings.realVersion;
            newUrl = `${newUrl.replace(/\/$/g, "")}/${GameSettings.channel}/${version}/`;
            //@ts-ignore
            downloader.init(newUrl, downloader.bundleVers, downloader.remoteBundles);
        }
    }
    exports.GameSettings = GameSettings;
    GameSettings.rawData = {};
    GameSettings.useid = "";
    GameSettings.channel = "wx";
    GameSettings.version = "1.0.0";
    GameSettings.isDebug = false;
    GameSettings.realVersion = "1.0.0";
    GameSettings.mergeTimeScale = 1;
    GameSettings.packages = [];
    GameSettings.uiPackages = [];
    GameSettings.datas = {};
    GameSettings.debug = {};
    GameSettings.time = "";
    GameSettings.gitInfo = {
        version: "",
        shortVersion: "",
        author: "",
        time: "",
    };
});
define("macro", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ALIPAY = exports.PIAP = exports.MEITUAN = exports.WECHAT = void 0;
    exports.WECHAT = false;
    exports.MEITUAN = false;
    exports.PIAP = false;
    exports.ALIPAY = false;
});
define("common/EventHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventHandler = void 0;
    class Handler {
    }
    /**
     * 事件处理器
     */
    class EventHandler {
        constructor() {
            this._handlers = [];
        }
        _add(runner, thisObj, once) {
            if (!runner) {
                console.warn("add none runner to event handler");
                return;
            }
            let handler = new Handler();
            handler.caller = thisObj;
            handler.runner = runner;
            handler.once = once;
            this._handlers.push(handler);
        }
        add(runner, thisObj) {
            this._add(runner, thisObj);
        }
        set(runner, thisObj) {
            this.remove(runner, thisObj);
            this.add(runner, thisObj);
        }
        once(runner, thisObj) {
            this._add(runner, thisObj, true);
        }
        remove(runner, thisObj) {
            let temp = this._handlers.slice();
            for (let i = 0; i < this._handlers.length; i++) {
                let handler = this._handlers[i];
                let sameRunner = handler.runner == runner;
                if (sameRunner) {
                    if (!thisObj || handler.caller == thisObj) {
                        let idx = temp.indexOf(handler);
                        if (idx >= 0) {
                            temp.splice(idx, 1);
                        }
                    }
                }
            }
            this._handlers = temp;
        }
        clear() {
            this._handlers.length = 0;
        }
        fire(...args) {
            let handlers = this._handlers.slice();
            for (let i = 0; i < handlers.length; i++) {
                let handler = handlers[i];
                if (handler.once) {
                    let idx = this._handlers.indexOf(handler);
                    this._handlers.splice(idx, 1);
                }
                handler.runner.call(handler.caller, ...args);
            }
        }
    }
    exports.EventHandler = EventHandler;
});
define("common/PoolManager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PoolManager = void 0;
    class PoolManager {
        constructor(defaultType) {
            this._defaultKey = "default";
            this._types = new Map();
            this._items = new Map();
            if (defaultType) {
                this.register(this._defaultKey, defaultType);
            }
        }
        getKey(type, key) {
            return key != undefined ? `${type}|${key}` : `${type}`;
        }
        register(type, classType, count = 0, data) {
            this._types.set(type, classType);
            // @ts-ignore
            classType.__pool_type__ = type;
            let keyStr = this.getKey(type, data);
            if (!this._items.has(keyStr)) {
                this._items.set(keyStr, this.createItems(classType, count, keyStr, data));
            }
        }
        createItems(classType, count, keyStr, data) {
            let items = [];
            while (count > 0) {
                let item = new classType();
                if (item.createFromPool) {
                    item.createFromPool(data);
                }
                item.__pool_key__ = keyStr;
                items.push(item);
                count--;
            }
            return items;
        }
        getFreeCount(cls, data) {
            let type = cls.__pool_type__;
            let keyStr = this.getKey(type, data);
            let pool = this._items[keyStr];
            if (!pool) {
                return 0;
            }
            return pool.length;
        }
        get(cls, data) {
            cls = cls || this._types.get(this._defaultKey);
            // @ts-ignore
            let type = cls.__pool_type__;
            return this.getByType(type, data);
        }
        async getAsync(cls, data) {
            cls = cls || this._types.get(this._defaultKey);
            // @ts-ignore
            let type = cls.__pool_type__;
            return await this.getByTypeAsync(type, data);
        }
        async getByKeyAsync(key) {
            return await this.getAsync(null, key);
        }
        getByKey(key) {
            return this.get(null, key);
        }
        async getByTypeAsync(type, data) {
            if (type == null) {
                console.warn(`缓存错误：尝试缓存非池化数据`);
                return;
            }
            let keyStr = this.getKey(type, data);
            let pool = this._items[keyStr];
            if (!pool) {
                pool = this._items[keyStr] = [];
            }
            if (pool.length > 0) {
                let item = pool.pop();
                item.fromPool && item.fromPool();
                return item;
            }
            let cls = this._types.get(type);
            let item = new cls();
            if (item.createFromPool) {
                await item.createFromPool(data);
            }
            item.__pool_key__ = data;
            item.fromPool && item.fromPool();
            return item;
        }
        getByType(type, data) {
            if (type == null) {
                console.warn(`缓存错误：缓存非池化数据`);
                return;
            }
            let keyStr = this.getKey(type, data);
            let pool = this._items[keyStr];
            if (!pool) {
                pool = this._items[keyStr] = [];
            }
            if (pool.length > 0) {
                let item = pool.pop();
                item.fromPool && item.fromPool();
                return item;
            }
            let cls = this._types.get(type);
            let item = new cls();
            if (item.createFromPool) {
                item.createFromPool(data);
            }
            item.__pool_key__ = data;
            item.fromPool && item.fromPool();
            return item;
        }
        put(item) {
            if (!item) {
                console.warn(`缓存错误：缓存空数据`);
                return;
            }
            //@ts-ignore
            let type = item.constructor.__pool_type__;
            if (type == null) {
                console.warn(`缓存错误：缓存非池化数据`);
                return;
            }
            //@ts-ignore
            let keyStr = this.getKey(type, item.__pool_key__);
            let pool = this._items[keyStr];
            if (!pool) {
                console.error(`缓存错误：未注册缓存类型${keyStr}`);
                return;
            }
            item.toPool && item.toPool();
            pool.push(item);
        }
        registDefault(cls, count = 0, data) {
            this.register(this._defaultKey, cls, count, data);
        }
    }
    exports.PoolManager = PoolManager;
});
define("view/interface/IComponent", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/interface/IView", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/interface/IContainer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/Container", ["require", "exports", "common/EventCenter"], function (require, exports, EventCenter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Container {
        constructor() {
            this.children = [];
            this._destoried = false;
            this._isCreated = false;
            this._isShown = false;
            this.enableWating = true;
        }
        get component() {
            return null;
        }
        get destoried() {
            return this._destoried;
        }
        get isCreated() {
            return this._isCreated;
        }
        beginCreate() {
            this._isCreated = false;
        }
        endCreate() {
            this._isCreated = true;
        }
        endShown() {
            this._isShown = true;
        }
        addView(view) {
            if (Container.showDebug)
                console.error("check point addview", view.component.name);
            view.parent = this;
            this.children.push(view);
        }
        removeView(view) {
            view.parent = null;
            this.children = this.children.filter(item => item !== view);
        }
        on(type, listener, target) {
            this.component.node.on(type, listener, target);
        }
        once(type, listener, target) {
            this.component.node.once(type, listener, target);
        }
        off(type, listener, target) {
            this.component.node.off(type, listener, target);
        }
        emit(type, ...data) {
            this.component.node.emit(type, ...data);
        }
        onEventCenter(type, listener) {
            EventCenter_1.EventCenter.I.on(type, listener, this);
        }
        offEventCenter(type, listener) {
            EventCenter_1.EventCenter.I.off(type, listener, this);
        }
        emitEventCenter(type, ...data) {
            EventCenter_1.EventCenter.I.emit(type, ...data);
        }
        onceEventCenter(type, listener) {
            EventCenter_1.EventCenter.I.once(type, listener, this);
        }
        clearEventCenter() {
            EventCenter_1.EventCenter.I.clear(this);
        }
    }
    exports.default = Container;
    Container.showDebug = false;
});
define("common/EventCenter", ["require", "exports", "cc", "common/PoolManager", "view/Container", "common/UtilsHelper"], function (require, exports, cc_8, PoolManager_1, Container_1, UtilsHelper_2) {
    "use strict";
    var EventCenter_2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventCenter = void 0;
    const { ccclass, property } = cc_8._decorator;
    class EventHandler {
        createFromPool(data) {
        }
        fromPool() {
            this.handler = null;
            this.target = null;
            this.once = false;
        }
        toPool() {
        }
    }
    const EventHandlerPool = new PoolManager_1.PoolManager(EventHandler);
    let EventCenter = EventCenter_2 = class EventCenter {
        constructor() {
            this._handlers = {};
        }
        /**
         * 监听事件
         * @param {string} eventName 事件名称
         * @param {function} handler 监听函数
         * @param {object} target 监听目标
         */
        on(eventName, handler, target) {
            var handlerList = this._handlers[eventName];
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
        }
        ;
        /**
         * 监听事件
         * @param {string} eventName 事件名称
         * @param {function} handler 监听函数
         * @param {object} target 监听目标
         */
        once(eventName, handler, target) {
            var handlerList = this._handlers[eventName];
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
        }
        ;
        /**
         * 取消监听
         * @param {string} eventName 监听事件
         * @param {function} handler 监听函数
         * @param {object} target 监听目标
         */
        off(eventName, handler, target) {
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
        }
        ;
        clear(target) {
            let keys = Object.keys(this._handlers);
            for (let ki = 0; ki < keys.length; ki++) {
                let key = keys[ki];
                let newHandles = [];
                let handlerList = this._handlers[key].slice();
                for (var i = 0; i < handlerList.length; i++) {
                    var oldObj = handlerList[i];
                    if (!target || target && target == oldObj.target) {
                        EventHandlerPool.put(oldObj);
                    }
                    else {
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
        async emitDelay(eventName, delay, ...args) {
            if (delay && delay > 0) {
                await UtilsHelper_2.UtilsHelper.wait(delay);
            }
            this.emit(eventName, ...args);
        }
        /**
         * 分发事件
         * @param {string} eventName 分发事件名
         * @param  {...any} params 分发事件参数
         */
        emit(eventName, ...args) {
            var handlerList = this._handlers[eventName];
            if (!handlerList) {
                return;
            }
            let handles = handlerList.slice();
            for (let i = 0; i < handles.length; i++) {
                var objHandler = handles[i];
                if (objHandler.target instanceof Container_1.default) {
                    let cont = objHandler.target;
                    if (cont.destoried || !cc_8.isValid(cont.component.node)) {
                        continue;
                    }
                }
                else if (objHandler.target instanceof cc_8.Node) {
                    if (!cc_8.isValid(objHandler.target)) {
                        continue;
                    }
                }
                else if (objHandler.target instanceof cc_8.Component) {
                    if (!cc_8.isValid(objHandler.target.node)) {
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
        async waitEventValue(eventName, v) {
            let value;
            while (v != value) {
                value = await this.waitEvent(eventName);
            }
        }
        async waitEvent(eventName) {
            return new Promise(resolve => {
                this.once(eventName, resolve, this);
            });
        }
        static get I() {
            if (!this._instance) {
                window['EC'] = this;
                this._instance = new EventCenter_2;
            }
            return this._instance;
        }
    };
    EventCenter = EventCenter_2 = __decorate([
        ccclass('EventCenter')
    ], EventCenter);
    exports.EventCenter = EventCenter;
});
define("common/LoaderHelper", ["require", "exports", "common/ResManager"], function (require, exports, ResManager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoaderHelper = void 0;
    class LoaderHelper {
        constructor(abName, pkgName, callback, thisObj) {
            this._loaded = false;
            this._loading = false;
            this._callback = null;
            this.abName = abName;
            this.pkgName = pkgName;
            if (callback) {
                this._callback = { callback: callback, thisObj: thisObj };
            }
        }
        static tick() {
            if (LoaderHelper._loaders.length == 0 || LoaderHelper._loadingCount >= LoaderHelper.MAX_LOAD_COUNT) {
                return;
            }
            let loader = LoaderHelper._loaders.shift();
            if (loader && !loader._loading) {
                loader.doLoad();
            }
        }
        async load() {
            if (this._loaded) {
                this.onResReady();
                return;
            }
            if (this._loading) {
                return;
            }
            if (LoaderHelper._loadingCount >= LoaderHelper.MAX_LOAD_COUNT) {
                LoaderHelper._loaders.push(this);
                return;
            }
            this.doLoad();
        }
        doLoad() {
            if (this._loading)
                return;
            this._loading = true;
            LoaderHelper._loadingCount++;
            // 由于涉及资源加载，有open，保证资源加载完成
            ResManager_2.ResManager.loadFUIBundle(this.abName, this.pkgName, null, true).then(() => {
                this._loading = false;
                LoaderHelper._loadingCount--;
                this.onResReady();
            });
        }
        loadRes(callback, thisObj) {
            if (this._loaded) {
                if (callback) {
                    callback.call(thisObj);
                }
                return;
            }
            // 由于涉及资源加载，有open，保证资源加载完成
            ResManager_2.ResManager.loadFUIBundle(this.abName, this.pkgName, null, true).then(() => {
                if (callback) {
                    callback.call(thisObj);
                }
            });
        }
        onResReady() {
            this._loaded = true;
            if (this._callback) {
                this._callback.callback.call(this._callback.thisObj);
            }
        }
        get loaded() {
            return this._loaded;
        }
        get loading() {
            return this._loading;
        }
        dispose() {
            this._callback = null;
            ResManager_2.ResManager.unloadFUIBundle(this.abName, this.pkgName);
        }
    }
    exports.LoaderHelper = LoaderHelper;
    LoaderHelper.MAX_LOAD_COUNT = 2;
    LoaderHelper._loadingCount = 0;
    LoaderHelper._loaders = [];
});
define("activity/controller/BaseActivityController", ["require", "exports", "common/EventHandler", "common/EventCenter", "common/LoaderHelper"], function (require, exports, EventHandler_1, EventCenter_3, LoaderHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseActivityController = exports.EActivityStatus = void 0;
    var EActivityStatus;
    (function (EActivityStatus) {
        // 未开启 (无需加载资源)
        EActivityStatus[EActivityStatus["NotOpen"] = 0] = "NotOpen";
        // 等级不足预览 (需加载资源)
        EActivityStatus[EActivityStatus["PreLimit"] = 1] = "PreLimit";
        // 预告开启（需加载资源）
        EActivityStatus[EActivityStatus["PreOpen"] = 2] = "PreOpen";
        // 开启中（需加载资源）
        EActivityStatus[EActivityStatus["Opening"] = 3] = "Opening";
        // 预告结束（需加载资源）
        EActivityStatus[EActivityStatus["PreEnd"] = 4] = "PreEnd";
        // 结束（卸载资源）
        EActivityStatus[EActivityStatus["End"] = 5] = "End";
    })(EActivityStatus = exports.EActivityStatus || (exports.EActivityStatus = {}));
    class BaseActivityController {
        constructor(name) {
            this.beforeCreate = new EventHandler_1.EventHandler();
            this._status = EActivityStatus.NotOpen;
            this._realStatus = EActivityStatus.NotOpen;
            this._oldStatus = EActivityStatus.NotOpen;
            this._needCheck = true;
            this._first = true;
            this.name = name;
        }
        get config() {
            return this._config;
        }
        get loading() {
            return this._loader.loading;
        }
        get loaded() {
            return this._loader.loaded;
        }
        create(config) {
            this.beforeCreate.fire();
            this._config = config || {};
            if (this._config.disposeOnClose == undefined) {
                this._config.disposeOnClose = true;
            }
            if (this._config.hasPay == undefined) {
                this._config.hasPay = true;
            }
            this._loader = new LoaderHelper_1.LoaderHelper(this._config.abName, this._config.pkgName, this.sendChangeEvent, this);
        }
        get status() {
            return this._status;
        }
        doRegist() {
            // 需要先执行，否则有些数据未初始化
            this.onRegist();
            // 初始化状态
            // this.checkState(true);
            EventCenter_3.EventCenter.I.emit(BaseActivityController.ACTIVITY_CONTROLLER_REGISTED, this);
        }
        onRegist() {
        }
        setStatus(status) {
            this._status = status;
        }
        update(dt, secondTick) {
            this.checkState();
            if (secondTick) {
                LoaderHelper_1.LoaderHelper.tick();
            }
        }
        doLoad() {
            this._realStatus = this.status;
            if (this.needLoadRes()) {
                this._loader.load();
            }
            else {
                this.sendChangeEvent();
            }
        }
        checkState() {
            if (!this._needCheck) {
                return;
            }
            // 关闭支付的情况下，不检查
            if (this._config.hasPay) {
                return;
            }
            let oldStatus = this._oldStatus;
            this.onUpdateStatus();
            if (this._first) {
                this._realStatus = this.status;
                this._oldStatus = this.status;
                this._first = false;
                if (oldStatus == EActivityStatus.NotOpen && this._realStatus != EActivityStatus.NotOpen && this._realStatus != EActivityStatus.End) {
                    this.doLoad();
                }
            }
            else {
                if (oldStatus != this.status) {
                    this.doLoad();
                }
            }
        }
        loadRes(callback, thisObj) {
            this._loader.loadRes(callback, thisObj);
        }
        onUpdateStatus() {
        }
        needLoadRes() {
            return this.status != EActivityStatus.NotOpen && this.status != EActivityStatus.End;
        }
        sendChangeEvent() {
            this.onRealStateChange(this._realStatus, this._oldStatus);
            this._status = this._realStatus;
            this._oldStatus = this._realStatus;
            EventCenter_3.EventCenter.I.emit(BaseActivityController.ACTIVITY_STATUS_CHANGE, this, this._realStatus, this._oldStatus);
            if (this._status == EActivityStatus.End) {
                this.onClose();
            }
            else if (this._status == EActivityStatus.Opening) {
                if (this._config.onceCheck) {
                    this._needCheck = false;
                }
            }
        }
        onRealStateChange(status, oldStatus) {
        }
        onClose() {
            // 卸载资源
            if (this._config.disposeOnClose) {
                this._loader.dispose();
            }
        }
    }
    exports.BaseActivityController = BaseActivityController;
    BaseActivityController.ACTIVITY_STATUS_CHANGE = "ACTIVITY_STATUS_CHANGE";
    BaseActivityController.ACTIVITY_CONTROLLER_REGISTED = "ACTIVITY_CONTROLLER_REGISTED";
});
define("activity/controller/ActivityController", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityController = void 0;
    class ActivityController {
        constructor() {
            this._controllers = [];
            this._controllerMap = {};
            this._timer = -1;
            this._delayTime = 3;
        }
        static get inst() {
            if (!this._inst) {
                this._inst = new ActivityController();
            }
            return this._inst;
        }
        start() {
            this._timer = 0;
        }
        async register(controller, now = false) {
            if (!controller)
                return;
            if (this._controllerMap[controller.name]) {
                console.warn("ActivityController register repeat: " + controller.name);
                return;
            }
            this._controllers.push(controller);
            this._controllerMap[controller.name] = controller;
            if (now) {
                controller.doRegist();
            }
        }
        ready() {
            for (let i = 0; i < this._controllers.length; i++) {
                this._controllers[i].doRegist();
            }
        }
        getController(name) {
            return this._controllerMap[name];
        }
        update(dt, secondTick) {
            if (this._timer < 0)
                return;
            this._timer += dt;
            if (this._timer < this._delayTime)
                return;
            if (!secondTick)
                return;
            for (let i = 0; i < this._controllers.length; i++) {
                this._controllers[i].update(dt, secondTick);
            }
        }
    }
    exports.ActivityController = ActivityController;
});
define("activity/proxy/IActivityProxy", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("activity/proxy/AcitivityProxyManager", ["require", "exports", "cc/env"], function (require, exports, env_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityProxyManager = void 0;
    class ActivityProxyManager {
        constructor() {
            this._proxyList = [];
            this._proxyMap = {};
        }
        static get inst() {
            return this._inst;
        }
        regist(proxy) {
            if (this._proxyMap[proxy.name]) {
                this.unregist(proxy.name);
            }
            this._proxyMap[proxy.name] = proxy;
            this._proxyList.push(proxy);
            proxy.regist();
        }
        unregist(name, destoryEnterView) {
            let proxy = this._proxyMap[name];
            if (!proxy) {
                console.error(`卸载未注册proxy=${proxy.name}`);
                return;
            }
            proxy.unregist(destoryEnterView);
            delete this._proxyMap[name];
            let idx = this._proxyList.indexOf(proxy);
            if (idx >= 0) {
                this._proxyList.splice(idx, 1);
            }
        }
        update(dt, secondTick) {
            for (let i = this._proxyList.length - 1; i >= 0; i--) {
                let proxy = this._proxyList[i];
                if (proxy.enable) {
                    proxy.update(dt, secondTick);
                }
            }
        }
        setEnable(name, enable) {
            let proxy = this._proxyMap[name];
            if (!proxy) {
                if (env_3.EDITOR) {
                    console.error(`未注册proxy=${name}`);
                }
                return;
            }
            proxy.setEnable(enable);
        }
    }
    exports.ActivityProxyManager = ActivityProxyManager;
    ActivityProxyManager._inst = new ActivityProxyManager();
});
define("view/interface/IInjectInfo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/interface/IAutoInject", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/SkinHelper", ["require", "exports", "fairygui-cc", "view/Skin", "view/utils/FGUIExt", "fairygui-cc", "fairygui-cc"], function (require, exports, fairygui_cc_6, Skin_2, FGUIExt_2, fairygui_cc_7, fairygui_cc_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SkinHelper {
        static registUIPackage(pkg, abName, path = "") {
            this._uiPackagePath[pkg] = { abName, path };
        }
        static getUIPackage(pkg) {
            return this._uiPackagePath[pkg];
        }
        static initial() {
            for (let info of this._bindingInfos) {
                this.bindingSkin(info.type, info.uiPackage, info.componentName, info.data, info.isWindow, info.autoWarpper);
            }
            this._bindingInfos.length = 0;
        }
        static preBindingSkin(type, uiPackage, componentName, data, isWindow, autoWarpper) {
            let bindingInfo = {
                type,
                uiPackage,
                componentName,
                data,
                isWindow,
                autoWarpper,
            };
            this._bindingInfos.push(bindingInfo);
        }
        static bindingSkin(type, uiPackage, componentName, data, isWindow, autoWarpper) {
            let info = this.getUIPackage(uiPackage);
            if (!info) {
                console.error(`UI包 ${uiPackage} 未绑定`);
                return;
            }
            let preifx = info.path ? `${info.path}/` : "";
            Skin_2.default.bindSkin(type, new Skin_2.default(`${preifx}${uiPackage}`, uiPackage, componentName, data, isWindow, autoWarpper, info.abName));
        }
        static preloadUIPackage(uiPackage, progress) {
            let info = this.getUIPackage(uiPackage);
            if (!info) {
                console.error(`UI包 ${uiPackage} 未绑定`);
                return;
            }
            let preifx = info.path ? `${info.path}/` : "";
            return FGUIExt_2.default.preloadPackage(info.abName, `${preifx}${uiPackage}`, progress);
        }
        static getNames(path) {
            return path ? path.split(".") : [""];
        }
        static getIndex(name) {
            let match = name.match(SkinHelper.regex);
            if (match && match.length == 1) {
                let g = match[0].replace("[", "").replace("]", "");
                let newname = name.replace(SkinHelper.regex, "");
                return { id: Number(g), newName: newname };
            }
            else {
                return null;
            }
        }
        static InjectSkin(skin, view) {
            let go = FGUIExt_2.default.createObject(skin);
            SkinHelper.InjectView(go, view);
        }
        static IsGLoader(type) {
            if (type == fairygui_cc_6.GLoader) {
                return true;
            }
            if (type.__proto__ && type.__proto__.name) {
                return SkinHelper.IsGObject(type.__proto__);
            }
            return false;
        }
        static IsGObject(type) {
            // if( type['__className'] === 'GObject') {
            //     return true;
            // }
            // if(type['__super']) {
            //     return SkinHelper.IsGObject(type['__super']);
            // }
            if (type == fairygui_cc_6.GObject) {
                return true;
            }
            if (type.__proto__ && type.__proto__.name) {
                return SkinHelper.IsGObject(type.__proto__);
            }
            return false;
        }
        static OtherFGUIType(type) {
            return SkinHelper.IsController(type) || SkinHelper.IsTransition(type);
        }
        static IsController(type) {
            // if(type['__className'] === 'Controller') {
            //     return true;
            // }
            // if(type['__super']) {
            //     return SkinHelper.IsController(type['__super']);
            // }
            if (type == fairygui_cc_6.Controller) {
                return true;
            }
            if (type.__proto__ && type.__proto__.name) {
                return SkinHelper.IsController(type.__proto__);
            }
            return false;
        }
        static IsTransition(type) {
            if (type == fairygui_cc_6.Transition) {
                return true;
            }
            if (type.__proto__ && type.__proto__.name) {
                return SkinHelper.IsTransition(type.__proto__);
            }
            return false;
        }
        static IsFGUIObject(type) {
            if (SkinHelper.IsGObject(type)) {
                return true;
            }
            if (SkinHelper.IsController(type)) {
                return true;
            }
            if (SkinHelper.IsTransition(type)) {
                return true;
            }
            return false;
        }
        static InjectView(component, view) {
            view = view || component;
            if (!view) {
                return;
            }
            if (view.registInfos) {
                view.registInfos();
            }
            if (!view.injectInfos && !view.__injectInfos) {
                return;
            }
            component['__docker__'] = view;
            let injectInfos = Object.assign(Object.assign({}, (view.__injectInfos || {})), (view.injectInfos || {}));
            //过滤值属性
            for (let field in injectInfos) {
                let f = view[field];
                let t = typeof (f);
                if (f instanceof Function ||
                    t == "boolean" ||
                    t == "string" ||
                    t == "number") {
                    continue;
                }
                let names = [field];
                let type = null;
                let optional = true;
                let data = null;
                let hasCache = !!(this._cache[component.resourceURL] && this._cache[component.resourceURL][field]);
                //当给定了值时，更新names
                if (injectInfos[field]) {
                    let oldpath = injectInfos[field];
                    //过滤方法
                    if (oldpath instanceof Function) {
                        continue;
                    }
                    let path = oldpath;
                    //当给定的是对象时，解析对象
                    if (oldpath instanceof Object) {
                        type = oldpath.type;
                        path = oldpath.path;
                        data = oldpath.data;
                        optional = oldpath.optional;
                    }
                    if (!type) {
                        console.error(`${field}的类型不能为空`);
                        return;
                    }
                    // 获取缓存路径
                    if (hasCache) {
                        path = this._cache[component.resourceURL][field];
                        this._hitCache++;
                    }
                    names = SkinHelper.getNames(path);
                    if (!names[0]) {
                        names[0] = field;
                    }
                    else if (!names[names.length - 1]) {
                        names[names.length - 1] = field;
                    }
                }
                else {
                    // 获取缓存路径
                    if (hasCache) {
                        names = SkinHelper.getNames(this._cache[component.resourceURL][field]);
                        this._hitCache++;
                    }
                }
                let go = component;
                let endName = field;
                let endIndex = -1;
                let indices = [];
                for (let id = 0; id < names.length; id++) {
                    let name = names[id];
                    let ids = SkinHelper.getIndex(name);
                    endName = name;
                    if (ids) {
                        if (go && go.asCom.getChild) {
                            if (id != names.length - 1 || id == names.length - 1 && !SkinHelper.OtherFGUIType(type)) {
                                if (ids.newName) {
                                    let parent = go.asCom;
                                    go = parent.getChild(ids.newName);
                                    // 缓存id
                                    if (!hasCache) {
                                        indices.push(parent.getChildIndex(go));
                                    }
                                }
                                if (go.asCom.getChild) {
                                    if (!SkinHelper.OtherFGUIType(type)) {
                                        go = go.asCom.getChildAt(ids.id);
                                        // 缓存id
                                        if (!hasCache) {
                                            indices.push(ids.id);
                                        }
                                    }
                                }
                                else {
                                    console.error("can not find view with path:" + names.join("-") + " in " + ids.newName);
                                }
                            }
                        }
                        else if (go && SkinHelper.IsGLoader(go.constructor)) {
                            if (id != names.length - 1 || id == names.length - 1 && !SkinHelper.OtherFGUIType(type)) {
                                var loader = go;
                                if (ids.newName) {
                                    go = loader.component.getChild(ids.newName);
                                    // 缓存id
                                    if (!hasCache) {
                                        indices.push(loader.component.getChildIndex(go));
                                    }
                                }
                                if (loader.component.getChild) {
                                    if (!SkinHelper.OtherFGUIType(type)) {
                                        go = loader.component.getChildAt(ids.id);
                                        // 缓存id
                                        if (!hasCache) {
                                            indices.push(ids.id);
                                        }
                                    }
                                }
                                else {
                                    console.error("can not find view with path:" + names.join("-") + " in " + ids.newName);
                                }
                            }
                        }
                        else {
                            console.error("can not find view with path:" + names.join("-") + " in " + name);
                        }
                        endIndex = ids.id;
                    }
                    else if (go && go.asCom.getChild) {
                        if (id != names.length - 1 || (id == names.length - 1 && !SkinHelper.OtherFGUIType(type))) {
                            let parent = go.asCom;
                            go = parent.getChild(name);
                            // 缓存id
                            if (!hasCache) {
                                indices.push(parent.getChildIndex(go));
                            }
                        }
                    }
                    else if (go && SkinHelper.IsGLoader(go.constructor)) {
                        if (id != names.length - 1 || (id == names.length - 1 && !SkinHelper.OtherFGUIType(type))) {
                            var loader = go;
                            go = loader.component.getChild(name);
                            // 缓存id
                            if (!hasCache) {
                                indices.push(loader.component.getChildIndex(go));
                            }
                        }
                    }
                    else {
                        go = null;
                        console.error("can not find view with path:" + names.join("-") + " in " + name);
                    }
                }
                if (go) {
                    //当示例为空时，实例化变量
                    if (type && !view[field] && !SkinHelper.IsFGUIObject(type)) {
                        // var obj  = {};
                        // obj["__proto__"] = type.prototype;
                        // type.call(obj); 
                        var obj = new type();
                        view[field] = obj;
                    }
                    if (view[field] == null) {
                        view[field] = go;
                        SkinHelper.checkButtionAnimation(go, false);
                        if (SkinHelper.IsController(type)) {
                            var loader = go;
                            let comp = SkinHelper.IsGLoader(go.constructor) && loader.component ? loader.component : go.asCom;
                            if (endIndex >= 0) {
                                view[field] = comp.getControllerAt(endIndex);
                                // 缓存id
                                if (!hasCache) {
                                    indices.push(endIndex);
                                }
                            }
                            else {
                                view[field] = comp.getController(endName);
                                if (!hasCache) {
                                    for (let i = 0; i < comp.controllers.length; i++) {
                                        if (comp.controllers[i].name == endName) {
                                            // 缓存id
                                            indices.push(i);
                                        }
                                    }
                                }
                            }
                        }
                        else if (SkinHelper.IsTransition(type)) {
                            var loader = go;
                            let comp = SkinHelper.IsGLoader(go.constructor) && loader.component ? loader.component : go.asCom;
                            if (endIndex >= 0) {
                                view[field] = comp.getTransitionAt(endIndex);
                                // 缓存id
                                if (!hasCache) {
                                    indices.push(endIndex);
                                }
                            }
                            else {
                                view[field] = comp.getTransition(endName);
                                if (!hasCache) {
                                    for (let i = 0; i < comp._transitions.length; i++) {
                                        if (comp._transitions[i].name == endName) {
                                            // 缓存id
                                            indices.push(i);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if (view[field].inject instanceof Function) {
                        SkinHelper.checkButtionAnimation(go, false);
                        view[field].injectSource = view;
                        view[field].inject(go, data);
                        // view[field].onCreate();
                        // 缓存路径
                        if (!hasCache) {
                            this.cacheView(field, indices, component.resourceURL);
                        }
                        if (view.addView) {
                            view.addView(view[field]);
                        }
                    }
                }
                else if (!go && !view[field]) {
                    let info = "can not find view in " + typeof (view) + " with path:" + names.join("-");
                    if (!optional) {
                        console.error(info);
                    }
                    else {
                        console.warn(info);
                    }
                }
            }
            // for(let i=0;i<component.numChildren;i++){
            //     let child = component.getChildAt(i).asCom;
            //     let field = view[child.name];
            //     if(!field){
            //         view[child.name] = child;
            //     }else if(field.InjectView){
            //         field.InjectView(child);
            //     }
            //     SkinHelper.InjectView(child, view);
            // }
        }
        static cacheView(field, indices, resUrl) {
            if (!this.enableCache) {
                return;
            }
            if (!this._cache[resUrl]) {
                this._cache[resUrl] = {};
            }
            let cache = this._cache[resUrl];
            cache[field] = indices.map(id => `[${id}]`).join(".");
        }
        static checkButtionAnimation(item, force = false) {
            if (!(item instanceof fairygui_cc_7.GButton)) {
                return;
            }
            let button = item;
            if (button.downEffect > 0 || force) {
                button.downEffect = 0;
                let controller = button.getController("button");
                if (!controller) {
                    controller = new fairygui_cc_6.Controller();
                    controller.name = "button";
                    controller.addPage("up");
                    controller.addPage("down");
                    controller.addPage("over");
                    controller.addPage("selectedOver");
                    button.addController(controller);
                    controller.selectedIndex = 0;
                    //@ts-ignore
                    button._buttonController = controller;
                }
                if (SkinHelper.buttonUpTranslation) {
                    button.addControllerAction("button", SkinHelper.buttonUpTranslation, ["down", "selectedOver"], ["up", "over"]);
                }
                if (SkinHelper.buttonDownTranslation) {
                    button.addControllerAction("button", SkinHelper.buttonDownTranslation, ["up", "over"], ["down", "selectedOver"]);
                }
            }
        }
        static addButtonCommonAnimation(button) {
            SkinHelper.checkButtionAnimation(button);
        }
        static createAndInjectByUrl(type, url, parent, data) {
            const comp = fairygui_cc_8.UIPackage.createObjectFromURL(url);
            return SkinHelper.createAndInject(type, comp, parent, data);
        }
        static createAndInject(type, comp, parent, data) {
            const view = new type();
            view.inject(comp);
            view.injectSource = parent;
            parent === null || parent === void 0 ? void 0 : parent.addView(view);
            view.show(data, false);
            return view;
        }
    }
    exports.default = SkinHelper;
    SkinHelper.regex = /\[\d+\]$/g;
    SkinHelper._bindingInfos = [];
    SkinHelper._uiPackagePath = {};
    // 缓存路径与索引的关系
    SkinHelper._cache = {};
    SkinHelper._hitCache = 0;
    SkinHelper.enableCache = true;
});
define("view/View", ["require", "exports", "view/SkinHelper", "view/Container"], function (require, exports, SkinHelper_1, Container_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class View extends Container_2.default {
        ///////////////////////////////////////////////////////
        constructor() {
            super();
            this.injectInfos = {};
            this.data = null;
            this.injectSource = null;
            this.injectData = null;
            this.enableWating = false;
        }
        registInfos() {
        }
        get visible() {
            return this.gObject.visible;
        }
        set visible(val) {
            this.gObject.visible = val;
        }
        get component() {
            return this.gObject;
        }
        inject(go, data) {
            //@ts-ignore
            this._isCreated = false;
            this.gObject = go;
            this.injectData = data;
            this.data = data;
            this.onInitial();
            SkinHelper_1.default.InjectView(go, this);
            let ret = this.onCreate(data);
            if (ret instanceof Promise) {
                (async () => {
                    await ret;
                    //@ts-ignore
                    this.endCreate();
                })();
            }
            else {
                //@ts-ignore
                this.endCreate();
            }
        }
        async show(data, changeVisiable = true) {
            //@ts-ignore
            this._isShown = false;
            this.data = data;
            if (changeVisiable) {
                this.gObject.visible = true;
            }
            this.children.forEach(v => {
                v.show(data, false);
            });
            let ret = this.onShown(data, changeVisiable);
            if (ret instanceof Promise) {
                await ret;
            }
            //@ts-ignore
            this.endShown();
        }
        hide(changeVisiable = true) {
            if (changeVisiable) {
                this.gObject.visible = false;
            }
            this.children.forEach(v => {
                v.hide(false);
            });
            this.clearEventCenter();
            this.onHide(changeVisiable);
        }
        dispose() {
            if (this._destoried) {
                return;
            }
            this._destoried = true;
            this.children.forEach(v => {
                v.dispose();
            });
            this.clearEventCenter();
            if (this.gObject != null) {
                this.gObject.dispose();
            }
            this.gObject = null;
            this.onDispose();
        }
        //////////////////////////////////////////////////////////////////////////
        onInitial() {
        }
        onCreate(data) {
        }
        onShown(data, changeVisiable) {
        }
        onHide(changeVisiable) {
        }
        onDispose() {
        }
    }
    exports.default = View;
});
define("activity/proxy/BaseActivityProxy", ["require", "exports", "fairygui-cc", "fairygui-cc", "fairygui-cc", "activity/controller/BaseActivityController", "view/View", "common/EventCenter"], function (require, exports, fairygui_cc_9, fairygui_cc_10, fairygui_cc_11, BaseActivityController_1, View_1, EventCenter_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnterButton = exports.BaseActivityProxy = void 0;
    class BaseActivityProxy {
        constructor(name, ctrl, parent, holder, ctx) {
            var _a;
            this._opened = false;
            this.enterViewComponent = "BtnEnter";
            this.enterViewType = EnterButton;
            this._enable = false;
            this.needOpenOnPreview = true;
            this._name = name;
            this._holder = holder;
            this._parent = parent;
            this.context = ctx || {};
            this.context.indexInList = (_a = this.context.indexInList) !== null && _a !== void 0 ? _a : -1;
            this.ctrl = ctrl;
            if (this.context.enterView) {
                this.context.enterView.visible = false;
            }
            if (this.context.disposeOnClose == undefined) {
                this.context.disposeOnClose = true;
            }
            EventCenter_4.EventCenter.I.on(BaseActivityController_1.BaseActivityController.ACTIVITY_STATUS_CHANGE, this.onActivityStatusChanged, this);
            EventCenter_4.EventCenter.I.on(BaseActivityController_1.BaseActivityController.ACTIVITY_CONTROLLER_REGISTED, this.onControllerRegisted, this);
        }
        get name() {
            return this._name;
        }
        get enable() {
            return this._enable;
        }
        get opened() {
            return this._opened;
        }
        onControllerRegisted(controller) {
            if (controller == this.ctrl) {
                this.checkOpen();
            }
        }
        onActivityStatusChanged(proxy, status, oldStatus) {
            if (proxy == this.ctrl) {
                // 需要先执行，防止有状态切换
                this.onStatusChanged(status, oldStatus);
                if (!this.checkOpen()) {
                    this.close();
                }
            }
        }
        onStatusChanged(status, oldStatus) {
        }
        create() {
            this.checkOpen();
        }
        checkOpen() {
            if (!this.isOpening()) {
                return false;
            }
            // 需要检查是否加载资源
            this.ctrl.loadRes(() => {
                this.open();
            }, this);
            return true;
        }
        regist() {
            this.onRegist();
            return this;
        }
        unregist(destoryEnterView) {
            if (destoryEnterView) {
                this.close(true);
            }
            this.onUnregist();
        }
        isOpening() {
            if (this.needOpenOnPreview) {
                return this.ctrl.status != BaseActivityController_1.EActivityStatus.NotOpen && this.ctrl.status != BaseActivityController_1.EActivityStatus.End;
            }
            return this.ctrl.status == BaseActivityController_1.EActivityStatus.Opening ||
                this.ctrl.status == BaseActivityController_1.EActivityStatus.PreEnd;
        }
        onCreateView() {
            if (!this.enterView && (this.enterViewComponent || this.context.enterView) && this.enterViewType) {
                let view = this.context.enterView;
                if (!view) {
                    let pkgName = this.ctrl.config.pkgName;
                    if (this._holder instanceof fairygui_cc_11.GLoader) {
                        let url = fairygui_cc_9.UIPackage.getItemURL(pkgName, this.enterViewComponent);
                        this._holder.url = url;
                        view = this._holder.component;
                    }
                    else {
                        view = fairygui_cc_9.UIPackage.createObject(pkgName, this.enterViewComponent);
                        if (this.context.indexInList >= 0) {
                            this._holder.addChildAt(view, this.context.indexInList);
                        }
                        else {
                            this._holder.addChild(view);
                        }
                    }
                }
                else {
                    view.visible = true;
                }
                this.enterView = new this.enterViewType();
                this.enterView.inject(view);
                this.enterView.injectSource = this._parent;
                this._parent.addView(this.enterView);
                this.enterView.show(null, false);
                this.layoutParent();
                if (this.context.viewCreateCallback) {
                    this.context.viewCreateCallback(this.enterView);
                }
            }
        }
        layoutParent() {
            if ((this.context.adaptHeight || this.context.adaptWidth) && this._holder) {
                if (this._holder instanceof fairygui_cc_10.GComponent) {
                    if (this._holder.scrollPane) {
                        this._holder.ensureBoundsCorrect();
                        if (this.context.adaptHeight) {
                            this._holder.height = this._holder.scrollPane.contentHeight;
                        }
                        if (this.context.adaptWidth) {
                            this._holder.width = this._holder.scrollPane.contentWidth;
                        }
                    }
                    else if (this.enterView) {
                        if (this.context.adaptHeight) {
                            this._holder.height = this.enterView.component.height;
                        }
                        if (this.context.adaptWidth) {
                            this._holder.width = this.enterView.component.width;
                        }
                    }
                    else {
                        if (this.context.adaptHeight) {
                            this._holder.height = 0;
                        }
                        if (this.context.adaptWidth) {
                            this._holder.width = 0;
                        }
                    }
                }
                else if (this._holder instanceof fairygui_cc_11.GLoader) {
                    if (this.context.adaptHeight) {
                        this._holder.component.height = this._holder.height;
                    }
                    if (this.context.adaptWidth) {
                        this._holder.component.width = this._holder.width;
                    }
                }
            }
        }
        /**
         * 打开活动, 资源加载完成后调用
         * @returns
         */
        open() {
            if (this._opened) {
                return;
            }
            this._opened = true;
            this.onCreateView();
            this.onOpen();
        }
        /**
         * 关闭活动, 会卸载资源
         * @returns
         */
        close(forceDispose) {
            if (!this._opened) {
                return;
            }
            this._opened = false;
            this.onClose();
            // 卸载资源
            if (this.context.disposeOnClose || forceDispose) {
                this.enterView.dispose();
                this.enterView = null;
                if (this.context.viewDisposeCallback) {
                    this.context.viewDisposeCallback();
                }
            }
            this.layoutParent();
        }
        dispose() {
            if (this.enterView) {
                this.enterView.dispose();
                this.enterView = null;
            }
            this.setEnable(false);
            if (this.context.viewDisposeCallback) {
                this.context.viewDisposeCallback();
            }
        }
        update(dt, secondTick) {
            if (!this._opened) {
                return;
            }
            //@ts-ignore
            if (this.enterView && this.context.needUpdateView && this.enterView.onUpdate) {
                //@ts-ignore
                this.enterView.onUpdate(dt, secondTick);
            }
            this.onUpdate(dt, secondTick);
        }
        setEnable(enable) {
            if (this._enable == enable) {
                if (this.enterView && this.enterView.visible != enable) {
                    if (this.enterView) {
                        this.enterView.visible = enable;
                    }
                    this.layoutParent();
                }
                return;
            }
            if (enable) {
                this.onEnable();
            }
            else {
                this.onDisable();
            }
            this._enable = enable;
            if (this.enterView) {
                this.enterView.visible = enable;
            }
            this.layoutParent();
        }
        onRegist() {
        }
        onUnregist(destoryEnterView) {
        }
        onOpen() {
            if (this.enterView) {
                this.enterView.visible = this.context.canShowView ? this.context.canShowView() : true;
            }
        }
        onClose() {
            if (this.enterView) {
                this.enterView.visible = false;
            }
        }
        onUpdate(dt, secondTick) {
        }
        onEnable() {
        }
        onDisable() {
        }
    }
    exports.BaseActivityProxy = BaseActivityProxy;
    class EnterButton extends View_1.default {
        onCreate(data) {
            super.onCreate(data);
            this.btn = this.component;
            this.btn.onClick(this.onClick, this);
        }
        onClick() {
        }
    }
    exports.EnterButton = EnterButton;
});
// import { Material, UIRenderer, Texture2D, Node, Sprite, TiledLayer, Color, RenderData, Layers, spriteAssembler, UIVertexFormat, __private, IRenderData, RecyclePool, gfx, director, resources, EffectAsset, builtinResMgr, Mat4, Vec3, Graphics, Label, ImageAsset } from "cc";
// import { PREVIEW } from "cc/env";
// var tempSprite = new Sprite();
// let simpleAssembler: any = spriteAssembler.getAssembler(tempSprite);
// let simpleUpdateColor = simpleAssembler.updateColor;
// simpleAssembler.updateColor = function (sprite: Sprite) {
//     const renderData = sprite.renderData!;
//     const vData = renderData.chunk.vb;
//     simpleUpdateColor(sprite);
//     const vertexCount = renderData.vertexCount;
//     if (sprite["color2"]) {
//         let colorOffset = 9;
//         const color = sprite["color2"];
//         const colorR = color.r / 255;
//         const colorG = color.g / 255;
//         const colorB = color.b / 255;
//         const colorA = color.a / 255;
//         for (let i = 0; i < vertexCount; i++, colorOffset += renderData.floatStride) {
//             vData[colorOffset] = colorR;
//             vData[colorOffset + 1] = colorG;
//             vData[colorOffset + 2] = colorB;
//             vData[colorOffset + 3] = colorA;
//         }
//     }
// };
// simpleAssembler.updateUVs = function (sprite: Sprite) {
//     if (!sprite.spriteFrame) return;
//     if (this["color2"]) {
//         if (sprite && sprite.spriteFrame && (sprite.spriteFrame.flipUVX || sprite.spriteFrame.flipUVY)) {
//             sprite.spriteFrame._calculateUV();
//         }
//     }
//     const renderData = sprite.renderData!;
//     const stride = renderData.floatStride;
//     const vData = renderData.chunk.vb;
//     const uv = sprite.spriteFrame.uv;
//     vData[3] = uv[0];
//     vData[4] = uv[1];
//     vData[stride + 3] = uv[2];
//     vData[stride + 4] = uv[3];
//     vData[stride * 2 + 3] = uv[4];
//     vData[stride * 2 + 4] = uv[5];
//     vData[stride * 3 + 3] = uv[6];
//     vData[stride * 3 + 4] = uv[7];
// };
// tempSprite["_type"] = Sprite.Type.SLICED;
// let slicedAssembler: any = spriteAssembler.getAssembler(tempSprite);
// let slicedUpdateColor = slicedAssembler.updateColor;
// slicedAssembler.updateColor = function (sprite: Sprite) {
//     const renderData = sprite.renderData!;
//     const vData = renderData.chunk.vb;
//     slicedUpdateColor(sprite);
//     const vertexCount = renderData.vertexCount;
//     if (sprite["color2"]) {
//         let colorOffset = 9;
//         const color = sprite["color2"];
//         const colorR = color.r / 255;
//         const colorG = color.g / 255;
//         const colorB = color.b / 255;
//         const colorA = color.a / 255;
//         for (let i = 0; i < vertexCount; i++, colorOffset += renderData.floatStride) {
//             vData[colorOffset] = colorR;
//             vData[colorOffset + 1] = colorG;
//             vData[colorOffset + 2] = colorB;
//             vData[colorOffset + 3] = colorA;
//         }
//     }
// };
// tempSprite["_type"] = Sprite.Type.TILED;
// let tiledAssembler: any = spriteAssembler.getAssembler(tempSprite);
// let tiledUpdataColorLate = tiledAssembler.updataColorLate;
// tiledAssembler.updataColorLate = function (sprite: Sprite) {
//     const renderData = sprite.renderData!;
//     const vData = renderData.chunk.vb;
//     tiledUpdataColorLate(sprite);
//     const vertexCount = renderData.vertexCount;
//     if (sprite["color2"]) {
//         let colorOffset = 9;
//         const color = sprite["color2"];
//         const colorR = color.r / 255;
//         const colorG = color.g / 255;
//         const colorB = color.b / 255;
//         const colorA = color.a / 255;
//         for (let i = 0; i < vertexCount; i++, colorOffset += renderData.floatStride) {
//             vData[colorOffset] = colorR;
//             vData[colorOffset + 1] = colorG;
//             vData[colorOffset + 2] = colorB;
//             vData[colorOffset + 3] = colorA;
//         }
//     }
// };
// tempSprite["_type"] = Sprite.Type.FILLED;
// tempSprite["_fillType"] = Sprite.FillType.RADIAL;
// let radialFilledAssembler: any = spriteAssembler.getAssembler(tempSprite);
// let radialFilledUpdataColorLate = radialFilledAssembler.updataColorLate;
// radialFilledAssembler.updataColorLate = function (sprite: Sprite) {
//     const renderData = sprite.renderData!;
//     const vData = renderData.chunk.vb;
//     radialFilledUpdataColorLate(sprite);
//     const vertexCount = renderData.vertexCount;
//     if (sprite["color2"]) {
//         let colorOffset = 9;
//         const color = sprite["color2"];
//         const colorR = color.r / 255;
//         const colorG = color.g / 255;
//         const colorB = color.b / 255;
//         const colorA = color.a / 255;
//         for (let i = 0; i < vertexCount; i++, colorOffset += renderData.floatStride) {
//             vData[colorOffset] = colorR;
//             vData[colorOffset + 1] = colorG;
//             vData[colorOffset + 2] = colorB;
//             vData[colorOffset + 3] = colorA;
//         }
//     }
// };
// tempSprite["_type"] = Sprite.Type.FILLED;
// tempSprite["_fillType"] = Sprite.FillType.HORIZONTAL;
// let barFilledAssembler: any = spriteAssembler.getAssembler(tempSprite);
// let barFilledUpdataColorLate = barFilledAssembler.updataColorLate;
// barFilledAssembler.updataColorLate = function (sprite: Sprite) {
//     const renderData = sprite.renderData!;
//     const vData = renderData.chunk.vb;
//     barFilledUpdataColorLate(sprite);
//     const vertexCount = renderData.vertexCount;
//     if (sprite["color2"]) {
//         let colorOffset = 9;
//         const color = sprite["color2"];
//         const colorR = color.r / 255;
//         const colorG = color.g / 255;
//         const colorB = color.b / 255;
//         const colorA = color.a / 255;
//         for (let i = 0; i < vertexCount; i++, colorOffset += renderData.floatStride) {
//             vData[colorOffset] = colorR;
//             vData[colorOffset + 1] = colorG;
//             vData[colorOffset + 2] = colorB;
//             vData[colorOffset + 3] = colorA;
//         }
//     }
// };
// let barFillAssemblerupdateUVs = barFilledAssembler.updateUVs;
// barFilledAssembler.updateUVs = function(sprite: Sprite, fillStart: number, fillEnd: number) {
//     if(!sprite.spriteFrame) {
//         return;
//     }
//     barFillAssemblerupdateUVs.call(this, sprite, fillStart, fillEnd);
// }
// let requestRenderData = Sprite.prototype.requestRenderData;
// Sprite.prototype.requestRenderData = function () {
//     if (this["color2"]) {
//         const data = RenderData.add(UIVertexFormat.vfmtPosUvTwoColor);
//         this._renderData = data;
//         return data;
//     }
//     return requestRenderData.call(this);
// };
// // const DEFAULT_STRIDE = UIVertexFormat.getAttributeStride(UIVertexFormat.vfmtPosUvColor) >> 2;
// // let _pools = new Map<gfx.Attribute[], RecyclePool>();
// // RenderData.add = function(vertexFormat:gfx.Attribute[] = UIVertexFormat.vfmtPosUvColor, accessor?: __private._cocos_2d_renderer_static_vb_accessor__StaticVBAccessor) {
// //     if (!_pools.get(vertexFormat)) {
// //         _pools.set(vertexFormat, new RecyclePool(() => new RenderData(vertexFormat), 32));
// //     }
// //     this._pool = _pools.get(vertexFormat);
// //     const rd = this._pool.add();
// //     rd._floatStride = vertexFormat === UIVertexFormat.vfmtPosUvColor ? DEFAULT_STRIDE : (UIVertexFormat.getAttributeStride(vertexFormat) >> 2);
// //     rd._vertexFormat = vertexFormat;
// //     if (!accessor) {
// //         const batcher = director.root!.batcher2D;
// //         accessor = batcher.switchBufferAccessor(rd._vertexFormat);
// //     }
// //     rd._accessor = accessor;
// //     return rd;
// // };
// // RenderData.remove = function(data: RenderData) {
// //     const idx = this._pool.data.indexOf(data);
// //     if (idx === -1) {
// //         return;
// //     }
// //     data.clear();
// //     (data as any)._accessor = null!;
// //     this._pool.removeAt(idx);
// // };
// const getUint8ForString = String.prototype.charCodeAt;
// function getUint8ForArray(this: Uint8Array, idx: number) { return this[idx]; }
// export function murmurhash2_32_gc(input: string | Uint8Array, seed: number) {
//     let l = input.length;
//     let h = seed ^ l;
//     let i = 0;
//     const getUint8 = typeof input === 'string' ? getUint8ForString : getUint8ForArray;
//     while (l >= 4) {
//         let k = ((getUint8.call(input, i) & 0xff))
//             | ((getUint8.call(input, ++i) & 0xff) << 8)
//             | ((getUint8.call(input, ++i) & 0xff) << 16)
//             | ((getUint8.call(input, ++i) & 0xff) << 24);
//         k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
//         k ^= k >>> 24;
//         k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
//         h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;
//         l -= 4;
//         ++i;
//     }
//     switch (l) {
//         case 3: h ^= (getUint8.call(input, i + 2) & 0xff) << 16;
//         case 2: h ^= (getUint8.call(input, i + 1) & 0xff) << 8;
//         case 1: h ^= (getUint8.call(input, i) & 0xff);
//             h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
//     }
//     h ^= h >>> 13;
//     h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
//     h ^= h >>> 15;
//     return h >>> 0;
// }
// let updateHash = RenderData.prototype.updateHash;
// RenderData.prototype.updateHash = function () {
//     let inst = this as RenderData;
//     if (inst.material && inst.material["__multi_tex__"]) {
//         const bid = this.chunk ? this.chunk.bufferId : -1;
//         const hashString = `${bid}${this.layer} ${this.blendHash} ${inst.material.hash}`;
//         this.dataHash = murmurhash2_32_gc(hashString, 666);
//         this.hashDirty = false;
//         return;
//     }
//     return updateHash.call(this);
// }
// interface MatrialItem {
//     material: Material,
//     textures: Array<Texture2D>,
//     matIndex: { [key: string]: number },
// }
// export enum MapMaterialType {
//     ui = "ui",
//     ui_shop = "ui_shop",
//     forest = "forest",
//     diningroom = "diningroom",
//     gate = "gate",
//     hall = "hall",
//     outdoor = "outdoor",
//     gamehall = "gamehall"
// }
// export class CombineTexMaterialMgr {
//     private static sEffectName = "shader/multi-text-sprite";
//     private _materialCount: number = 0;
//     private _layer: number = 0;
//     private _commonMat: Material;
//     private _withETC1: boolean = null;
//     private _mapMat: { [key: string]: { [id: string]: MatrialItem } } = {};
//     constructor(layer: number) {
//         this._layer = layer; //1 << Layers.nameToLayer("WORLD");
//         this._commonMat = new Material();
//     }
//     updateMaterial(node: Node, type: MapMaterialType = MapMaterialType.forest) {
//         if (PREVIEW && (type != MapMaterialType.forest && type != MapMaterialType.ui && type != MapMaterialType.ui_shop)) {
//             return;
//         }
//         if (!this._mapMat[type]) {
//             this._mapMat[type] = {};
//         }
//         // this._commonMat = this._mapMat[type];
//         if (type != MapMaterialType.ui && type != MapMaterialType.ui_shop) { //ui不需要修改层级
//             node.layer = this._layer;
//         }
//         let r2d = node.getComponent(UIRenderer);
//         if (!r2d) {
//             node.children.forEach(n => { this.updateMaterial(n, type) });
//             return;
//         }
//         let texture: Texture2D = null;
//         if (r2d instanceof Sprite) {
//             if(r2d instanceof Graphics || r2d instanceof Label) {
//                 return;
//             }
//             texture = r2d.spriteFrame?.texture as Texture2D;
//             node["__sprite__"] = r2d;            
//         } else if (r2d instanceof TiledLayer) {
//             return;
//             // let layerInfo = r2d["_layerInfo"];
//             // let tid = layerInfo.tiles.find(i=>i!=0);
//             // let grid = r2d.texGrids.get(tid);
//             // if(grid) {
//             //     texture = grid.texture;
//             // }
//         }
//         if (!texture) {
//             node.children.forEach(n => { this.updateMaterial(n, type) });
//             return;
//         }
//         // 检测是否应该使用etc1
//         if (this._withETC1 == null) {
//             let value = texture.image._native.endsWith(".pkm");
//             console.log(`地图文件格式：${texture.image._native},${value}`);
//             let effect = resources.get<EffectAsset>(CombineTexMaterialMgr.sEffectName);
//             if (value) {
//                 this._commonMat.initialize({
//                     effectAsset: effect,
//                     defines: {
//                         USE_TEXTURE: true,
//                         CC_USE_EMBEDDED_ALPHA: true,
//                     }
//                 });
//             } else {
//                 this._commonMat.initialize({ effectAsset: effect });
//             }
//             this._withETC1 = value;
//         }
//         if (this._withETC1 && r2d instanceof TiledLayer) {
//             //@ts-ignore
//             r2d._instanceMaterialType = 3;
//             let m = builtinResMgr.get(`ui-sprite-alpha-sep-material`) as Material;
//             r2d.setMaterialInstance(m, 0);
//             //@ts-ignore
//             r2d._materialInstances[0] = m;
//             console.log("set ui-sprite-alpha-sep-material");
//             return;
//         }
//         let key = type + texture["_id"];
//         let materials = this._mapMat[type];
//         let mat: MatrialItem = materials[key];
//         if (!mat) {
//             let keys = Object.keys(materials);
//             if (keys.length > 0) {
//                 mat = materials[keys[keys.length - 1]];
//                 if (mat.textures.length == 8) {
//                     // console.log("超过8张合图", type, mat.textures)
//                     mat = null;
//                 }
//             }
//             if (!mat) {
//                 let material = new Material();
//                 let pass = this._commonMat.passes[0];
//                 material.initialize({ effectAsset: this._commonMat.effectAsset, defines: pass.defines });
//                 material["__multi_tex__"] = true;
//                 this._materialCount++;
//                 material.name = `${this._commonMat.effectAsset.name}Clone(${this._materialCount}-${material.hash})`;
//                 mat = {
//                     matIndex: {},
//                     material: material,
//                     textures: [],
//                 };
//             }
//             mat.matIndex[key] = mat.textures.length;
//             mat.textures.push(texture);
//             materials[key] = mat;
//             // if(director.root.pipeline.device.gfxAPI == gfx.API.WEBGL2) {
//             //     let tex = mat.textures[0];
//             //     if(mat.textures.length > 1) {
//             //         tex.mipmaps = tex.mipmaps.concat(texture.mipmaps[0]);
//             //     }
//             //     mat.material.setProperty(`textures`, tex);
//             // }else{
//             //     mat.material.setProperty(`texture${mat.matIndex[key]}`, texture);
//             // }
//             mat.material.setProperty(`texture${mat.matIndex[key]}`, texture);
//         }
//         r2d.name = mat.material.name;
//         r2d.customMaterial = mat.material;
//         r2d["color2"] = new Color(mat.matIndex[key], 0, 0, 0);
//         if (r2d.renderData && r2d.renderData.data) {
//             r2d.destroyRenderData();
//             if(r2d instanceof Sprite) {
//                 if(r2d.type == Sprite.Type.SIMPLE) {
//                     simpleAssembler.createData(r2d);
//                     simpleAssembler.updateColor(r2d);
//                 }else if(r2d.type == Sprite.Type.SLICED) {
//                     slicedAssembler.createData(r2d);
//                     slicedAssembler.updateColor(r2d);
//                 }else if(r2d.type == Sprite.Type.TILED) {
//                     tiledAssembler.createData(r2d);
//                     tiledAssembler.updateColor(r2d);
//                 }else if(r2d.type == Sprite.Type.FILLED) {
//                     if(r2d.fillType == Sprite.FillType.RADIAL) {
//                         radialFilledAssembler.createData(r2d);
//                         radialFilledAssembler.updateColor(r2d);
//                     } else {
//                         barFilledAssembler.createData(r2d);
//                         barFilledAssembler.updateColor(r2d);
//                     }
//                 }
//             }
//         }
//         node.children.forEach(n => { this.updateMaterial(n, type) });
//     }
// }
define("common/EncryptHelper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptHelper = void 0;
    /**
     * 加密解密工具类
     */
    class EncryptHelper {
        //public method for encoding
        /**
         * base64加密
         * @param {string}input
         * @returns
         */
        static _base64encode(input) {
            let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            let output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
            input = this._utf8Encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                }
                else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return output;
        }
        /**
         * utf-8 加密
         * @param string
         * @returns
         */
        static _utf8Encode(string) {
            string = string.replace(/\r\n/g, "\n");
            let utftext = "";
            for (let n = 0; n < string.length; n++) {
                let c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            return utftext;
        }
        /**
         * utf-8解密
         * @param utftext
         * @returns
         */
        static _utf8Decode(utftext) {
            let string = "";
            let i = 0;
            let c = 0;
            let c1 = 0;
            let c2 = 0;
            let c3 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
        /**
         * base64解密
         * @param {string}input 解密字符串
         * @returns
         */
        static _base64Decode(input) {
            let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            let output = "";
            let chr1;
            let chr2;
            let chr3;
            let enc1;
            let enc2;
            let enc3;
            let enc4;
            let i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = this._utf8Decode(output);
            return output;
        }
        /**
         * 数据解密【请根据实际情况重写该方法】
         * @param {String} str
         */
        static decrypt(b64Data) {
            return this._base64Decode(b64Data);
        }
        /**
         * 数据加密[请根据实际情况重写该方法]
         * @param {String} str
         */
        static encrypt(str) {
            return str;
        }
    }
    exports.EncryptHelper = EncryptHelper;
});
define("common/Logger", ["require", "exports", "cc/env"], function (require, exports, env_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogSettings = exports.LogLevel = void 0;
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["INFO"] = 1] = "INFO";
        LogLevel[LogLevel["WARN"] = 2] = "WARN";
        LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
        LogLevel[LogLevel["OFF"] = 4] = "OFF";
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
    exports.LogSettings = {
        logLevel: LogLevel.INFO,
    };
    if (!env_4.DEBUG) {
        const sysLog = console.log;
        const sysWarn = console.warn;
        const sysError = console.error;
        const sysDebug = console.debug;
        console.log = function (...data) {
            if (exports.LogSettings.logLevel <= LogLevel.INFO) {
                sysLog.call(console, ...data);
            }
        };
        console.warn = function (...data) {
            if (exports.LogSettings.logLevel <= LogLevel.WARN) {
                sysWarn.call(console, ...data);
            }
        };
        console.error = function (...data) {
            if (exports.LogSettings.logLevel <= LogLevel.ERROR) {
                sysError.call(console, ...data);
            }
        };
        console.debug = function (...data) {
            if (exports.LogSettings.logLevel <= LogLevel.DEBUG) {
                sysDebug.call(console, ...data);
            }
        };
    }
});
define("common/SoundManager", ["require", "exports", "cc", "cc/env", "fairygui-cc"], function (require, exports, cc_9, env_5, fairygui_cc_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundManager = void 0;
    /**
     * 音频管理器
     */
    class SoundManager {
        constructor() {
            this.audioFinder = null;
            this.musicVolume = 1;
            this.soundVolume = 1;
            this._persistRootNode = new cc_9.Node('SoundManager');
            cc_9.game.addPersistRootNode(this._persistRootNode);
            let isPlayAudio = true;
            if (env_5.JSB) {
                //获取安卓是否可以播放音乐，例如打电话时候音乐关闭
                isPlayAudio = cc_9.native.reflection.callStaticMethod('com/cocos/game/AppActivity', 'isPlayAudio', '()Z');
            }
            this.isPlayAudio = isPlayAudio;
        }
        static get instance() {
            if (!this._instance) {
                this._instance = new SoundManager();
            }
            return this._instance;
        }
        async playAudio(name, loop, source) {
            let clip = await this.audioFinder(name);
            if (!clip) {
                console.error(`音频文件${name}不存在`);
                return;
            }
            source.stop();
            source.volume = loop ? this.musicVolume : this.soundVolume;
            source.clip = clip;
            source.loop = loop;
            if (source.volume > 0) {
                source.play();
            }
        }
        /**
         * 播放音乐
         * @param name
         * @param loop
         */
        async playMusic(name, loop = true) {
            this.music = this.music || this._persistRootNode.addComponent(cc_9.AudioSource);
            await this.playAudio(name, loop, this.music);
        }
        /**
         * 播放音效
         * @param name
         * @returns
         */
        async playSound(name) {
            if (!this.soundVolume) {
                return;
            }
            this.sound = this.sound || this._persistRootNode.addComponent(cc_9.AudioSource);
            await this.playAudio(name, false, this.sound);
        }
        /**
         * 播放音效
         * @param clip
         * @returns
         */
        playSoundByClip(clip) {
            if (!this.soundVolume) {
                return;
            }
            this.sound = this.sound || this._persistRootNode.addComponent(cc_9.AudioSource);
            this.sound.volume = this.soundVolume;
            this.sound.loop = false;
            this.sound.playOneShot(clip);
        }
        setVolume(flag, source) {
            source.volume = flag;
            if (flag > 0) {
                if (source && !source.playing) {
                    source.play();
                }
            }
            else {
                if (source && source.playing) {
                    source.stop();
                }
            }
        }
        setMusicVolume(volume) {
            this.musicVolume = volume;
            this.music && this.setVolume(volume, this.music);
        }
        setSoundVolume(volume) {
            this.soundVolume = volume;
        }
    }
    exports.SoundManager = SoundManager;
    SoundManager._instance = null;
    fairygui_cc_12.GRoot.prototype.playOneShotSound = function (clip, volumeScale) {
        if (SoundManager.instance.soundVolume) {
            SoundManager.instance.playSoundByClip(clip);
        }
    };
});
define("common/StorageManager", ["require", "exports", "cc", "common/EncryptHelper", "common/EventHandler"], function (require, exports, cc_10, EncryptHelper_1, EventHandler_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageManager = void 0;
    class Storage {
        constructor(file) {
            this._file = file;
            this._path = this._getConfigPath();
            this._loadData();
        }
        get file() {
            return this._file;
        }
        /**
         * 获取配置文件路径
         * @returns 获取配置文件路径
         */
        _getConfigPath() {
            let platform = cc_10.sys.platform;
            let path = "";
            if (platform === cc_10.sys.OS.WINDOWS) {
                path = "src/conf";
            }
            else if (platform === cc_10.sys.OS.LINUX) {
                path = "./conf";
            }
            else {
                if (cc_10.sys.isNative) {
                    path = cc_10.native.fileUtils.getWritablePath();
                    path = path + "conf";
                }
                else {
                    path = "src/conf";
                }
            }
            return `${path}/${this._file}`;
        }
        _loadData() {
            var content;
            if (cc_10.sys.isNative) {
                if (cc_10.native.fileUtils.isFileExist(this._path)) {
                    content = cc_10.native.fileUtils.getStringFromFile(this._path);
                }
            }
            else {
                content = cc_10.sys.localStorage.getItem(this._file);
            }
            // 解密
            if (content && content.length) {
                if (content.startsWith('@')) {
                    content = content.substring(1);
                    content = EncryptHelper_1.EncryptHelper.decrypt(content);
                }
                try {
                    if (!content || content == "Ԁ\x00") {
                        content = "{}";
                    }
                    //初始化操作
                    var jsonData = JSON.parse(content);
                    this._jsonData = jsonData;
                }
                catch (excepaiton) {
                    console.error(`${this._file}解析失败`);
                }
            }
        }
        getData() {
            return this._jsonData;
        }
        getValue(key) {
            return this._jsonData[key];
        }
        setData(data) {
            this._jsonData = data;
        }
        setKV(key, value) {
            this._jsonData[key] = value;
        }
        /**
         * 保存配置文件
         * @returns
         */
        save(fireEvent = true) {
            if (!StorageManager.enableSave) {
                return false;
            }
            // 写入文件
            var str = JSON.stringify(this._jsonData) || "";
            let zipStr = '@' + EncryptHelper_1.EncryptHelper.encrypt(str);
            // console.log(`${this._file} save to storage`);
            if (fireEvent) {
                StorageManager.anyItemSaved.fire(this._file);
            }
            if (!cc_10.sys.isNative) {
                var ls = cc_10.sys.localStorage;
                ls.setItem(this._file, zipStr);
                return;
            }
            cc_10.native.fileUtils.writeStringToFile(this._file, zipStr);
            return true;
        }
    }
    class StorageManager {
        constructor() {
            this._saveInterval = 5; //s
            this._timer = 0;
            this._dirty = false;
            this._fireEvent = true;
        }
        initial(file, saveInterval = 5) {
            this._saveInterval = saveInterval;
            this._storage = new Storage(file);
        }
        update(dt) {
            this._timer += dt;
            if (this._timer >= this._saveInterval) {
                this._timer = 0;
                if (this._dirty) {
                    let saved = this._storage.save();
                    if (this._fireEvent) {
                        StorageManager.anyItemSaved.fire(this._storage.file);
                    }
                    if (saved) {
                        this._dirty = false;
                        this._fireEvent = true;
                    }
                }
            }
        }
        saveNow(fireEvent = true) {
            this._timer = this._saveInterval;
            this._fireEvent = fireEvent;
        }
        getData() {
            return this._storage.getData();
        }
        getValue(key) {
            return this._storage.getValue(key);
        }
        easySave() {
            this._dirty = true;
        }
        setData(data) {
            this._storage.setData(data);
            this._dirty = true;
        }
        setKV(key, value) {
            this._storage.setKV(key, value);
            this._dirty = true;
        }
    }
    exports.StorageManager = StorageManager;
    StorageManager.anyItemSaved = new EventHandler_2.EventHandler;
    StorageManager.enableSave = true;
});
define("common/TaskManager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskManager = exports.Task = void 0;
    class Task {
        constructor(name, weight, runner) {
            this.name = name;
            this.weight = weight;
            this.runner = runner;
        }
    }
    exports.Task = Task;
    class TaskManager {
        constructor(name) {
            this._tasks = [];
            this._totalWeight = 0;
            this.name = '';
            this.name = name || `${++TaskManager.sID}`;
        }
        add(name, weight, runnder) {
            this._tasks.push(new Task(name, weight, runnder));
            this._totalWeight += weight;
        }
        async runSerial(progress, thisObj) {
            let weight = 0;
            let totalTime = Date.now();
            progress === null || progress === void 0 ? void 0 : progress.call(thisObj, 0);
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
        async runParallel(progress, thisObj) {
            let weight = 0;
            let tasks = this._tasks.map(task => this.runTask(task, weight, progress, thisObj));
            let totalTime = Date.now();
            let results = await Promise.all(tasks);
            console.log(`TM:${this.name} total cost ${Date.now() - totalTime}ms`);
            return results.every(result => result);
        }
        async runTask(task, weight, progress, thisObj) {
            console.log(`TM:${this.name} begin task ${task.name}`);
            let startTime = Date.now();
            let result = await task.runner(task, (p) => {
                let w = weight + task.weight * p;
                let pp = w / this._totalWeight;
                progress === null || progress === void 0 ? void 0 : progress.call(thisObj, pp);
            });
            console.log(`TM:${this.name} task ${task.name} done, cost ${Date.now() - startTime}ms`);
            let pp = weight / this._totalWeight;
            progress === null || progress === void 0 ? void 0 : progress.call(thisObj, pp);
            return result;
        }
    }
    exports.TaskManager = TaskManager;
    TaskManager.sID = 0;
});
define("common/TimeWatcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimeWatcher = void 0;
    class TimeWatcher {
        constructor() {
            this._startTime = 0;
            this._endTime = 0;
            this._isRunning = false;
        }
        start() {
            this._startTime = Date.now();
            this._isRunning = true;
        }
        stop() {
            this._endTime = Date.now();
            this._isRunning = false;
        }
        getElapsedTime() {
            return this._endTime - this._startTime;
        }
        getElapsedTimeNow() {
            return Date.now() - this._startTime;
        }
        isRunning() {
            return this._isRunning;
        }
        printElapsedTime(pattern) {
            console.log(pattern.replace("%s", this.getElapsedTimeNow().toString()));
        }
    }
    exports.TimeWatcher = TimeWatcher;
});
define("libs/md5", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Md5 = void 0;
    class Md5 {
        constructor() {
            this._state = new Int32Array(4);
            this._buffer = new ArrayBuffer(68);
            this._buffer8 = new Uint8Array(this._buffer, 0, 68);
            this._buffer32 = new Uint32Array(this._buffer, 0, 17);
            this.start();
        }
        static hashStr(str, raw = false) {
            return this.onePassHasher
                .start()
                .appendStr(str)
                .end(raw);
        }
        static hashAsciiStr(str, raw = false) {
            return this.onePassHasher
                .start()
                .appendAsciiStr(str)
                .end(raw);
        }
        static _hex(x) {
            const hc = Md5.hexChars;
            const ho = Md5.hexOut;
            let n;
            let offset;
            let j;
            let i;
            for (i = 0; i < 4; i += 1) {
                offset = i * 8;
                n = x[i];
                for (j = 0; j < 8; j += 2) {
                    ho[offset + 1 + j] = hc.charAt(n & 0x0F);
                    n >>>= 4;
                    ho[offset + 0 + j] = hc.charAt(n & 0x0F);
                    n >>>= 4;
                }
            }
            return ho.join('');
        }
        static _md5cycle(x, k) {
            let a = x[0];
            let b = x[1];
            let c = x[2];
            let d = x[3];
            // ff()
            a += (b & c | ~b & d) + k[0] - 680876936 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[1] - 389564586 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[2] + 606105819 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[4] - 176418897 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[7] - 45705983 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[10] - 42063 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[13] - 40341101 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            // gg()
            a += (b & d | c & ~d) + k[1] - 165796510 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[11] + 643717713 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[0] - 373897302 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[5] - 701558691 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[10] + 38016083 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[15] - 660478335 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[4] - 405537848 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[9] + 568446438 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[3] - 187363961 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[2] - 51403784 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            // hh()
            a += (b ^ c ^ d) + k[5] - 378558 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[14] - 35309556 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[7] - 155497632 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[13] + 681279174 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[0] - 358537222 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[3] - 722521979 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[6] + 76029189 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[9] - 640364487 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[12] - 421815835 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[15] + 530742520 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[2] - 995338651 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            // ii()
            a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            x[0] = a + x[0] | 0;
            x[1] = b + x[1] | 0;
            x[2] = c + x[2] | 0;
            x[3] = d + x[3] | 0;
        }
        start() {
            this._dataLength = 0;
            this._bufferLength = 0;
            this._state.set(Md5.stateIdentity);
            return this;
        }
        // Char to code point to to array conversion:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
        // #Example.3A_Fixing_charCodeAt_to_handle_non-Basic-Multilingual-Plane_characters_if_their_presence_earlier_in_the_string_is_unknown
        appendStr(str) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let code;
            let i;
            for (i = 0; i < str.length; i += 1) {
                code = str.charCodeAt(i);
                if (code < 128) {
                    buf8[bufLen++] = code;
                }
                else if (code < 0x800) {
                    buf8[bufLen++] = (code >>> 6) + 0xC0;
                    buf8[bufLen++] = code & 0x3F | 0x80;
                }
                else if (code < 0xD800 || code > 0xDBFF) {
                    buf8[bufLen++] = (code >>> 12) + 0xE0;
                    buf8[bufLen++] = (code >>> 6 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code & 0x3F) | 0x80;
                }
                else {
                    code = ((code - 0xD800) * 0x400) + (str.charCodeAt(++i) - 0xDC00) + 0x10000;
                    if (code > 0x10FFFF) {
                        throw new Error('Unicode standard supports code points up to U+10FFFF');
                    }
                    buf8[bufLen++] = (code >>> 18) + 0xF0;
                    buf8[bufLen++] = (code >>> 12 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code >>> 6 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code & 0x3F) | 0x80;
                }
                if (bufLen >= 64) {
                    this._dataLength += 64;
                    Md5._md5cycle(this._state, buf32);
                    bufLen -= 64;
                    buf32[0] = buf32[16];
                }
            }
            this._bufferLength = bufLen;
            return this;
        }
        appendAsciiStr(str) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let i;
            let j = 0;
            for (;;) {
                i = Math.min(str.length - j, 64 - bufLen);
                while (i--) {
                    buf8[bufLen++] = str.charCodeAt(j++);
                }
                if (bufLen < 64) {
                    break;
                }
                this._dataLength += 64;
                Md5._md5cycle(this._state, buf32);
                bufLen = 0;
            }
            this._bufferLength = bufLen;
            return this;
        }
        appendByteArray(input) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let i;
            let j = 0;
            for (;;) {
                i = Math.min(input.length - j, 64 - bufLen);
                while (i--) {
                    buf8[bufLen++] = input[j++];
                }
                if (bufLen < 64) {
                    break;
                }
                this._dataLength += 64;
                Md5._md5cycle(this._state, buf32);
                bufLen = 0;
            }
            this._bufferLength = bufLen;
            return this;
        }
        getState() {
            const self = this;
            const s = self._state;
            return {
                buffer: String.fromCharCode.apply(null, self._buffer8),
                buflen: self._bufferLength,
                length: self._dataLength,
                state: [s[0], s[1], s[2], s[3]]
            };
        }
        setState(state) {
            const buf = state.buffer;
            const x = state.state;
            const s = this._state;
            let i;
            this._dataLength = state.length;
            this._bufferLength = state.buflen;
            s[0] = x[0];
            s[1] = x[1];
            s[2] = x[2];
            s[3] = x[3];
            for (i = 0; i < buf.length; i += 1) {
                this._buffer8[i] = buf.charCodeAt(i);
            }
        }
        end(raw = false) {
            const bufLen = this._bufferLength;
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            const i = (bufLen >> 2) + 1;
            let dataBitsLen;
            this._dataLength += bufLen;
            buf8[bufLen] = 0x80;
            buf8[bufLen + 1] = buf8[bufLen + 2] = buf8[bufLen + 3] = 0;
            buf32.set(Md5.buffer32Identity.subarray(i), i);
            if (bufLen > 55) {
                Md5._md5cycle(this._state, buf32);
                buf32.set(Md5.buffer32Identity);
            }
            // Do the final computation based on the tail and length
            // Beware that the final length may not fit in 32 bits so we take care of that
            dataBitsLen = this._dataLength * 8;
            if (dataBitsLen <= 0xFFFFFFFF) {
                buf32[14] = dataBitsLen;
            }
            else {
                const matches = dataBitsLen.toString(16).match(/(.*?)(.{0,8})$/);
                if (matches === null) {
                    return;
                }
                const lo = parseInt(matches[2], 16);
                const hi = parseInt(matches[1], 16) || 0;
                buf32[14] = lo;
                buf32[15] = hi;
            }
            Md5._md5cycle(this._state, buf32);
            return raw ? this._state : Md5._hex(this._state);
        }
    }
    exports.Md5 = Md5;
    // Private Static Variables
    Md5.stateIdentity = new Int32Array([1732584193, -271733879, -1732584194, 271733878]);
    Md5.buffer32Identity = new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    Md5.hexChars = '0123456789abcdef';
    Md5.hexOut = [];
    // Permanent instance is to use for one-call hashing
    Md5.onePassHasher = new Md5();
    if (Md5.hashStr('hello') !== '5d41402abc4b2a76b9719d911017c592') {
        console.error('Md5 self test failed.');
    }
});
define("modules/base/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("modules/Bridge", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bridge = void 0;
    class Bridge {
    }
    exports.Bridge = Bridge;
});
define("modules/base/BaseController", ["require", "exports", "common/EventCenter"], function (require, exports, EventCenter_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseController = void 0;
    class BaseController {
        constructor() {
            this._eventCenter = new EventCenter_5.EventCenter();
        }
        get eventCenter() {
            return this._eventCenter;
        }
        get dataKey() {
            return "";
        }
        processDaos(processor) {
            if (this.daos) {
                this.daos.forEach(processor);
            }
            else if (this.dao) {
                processor(this.dao);
            }
        }
        processDaosAndReturn(processor) {
            if (this.daos) {
                return this.daos.some(processor);
            }
            else if (this.dao) {
                return processor(this.dao);
            }
            return false;
        }
        /**
         * 存档至服务器后，清除数据变化标记
         */
        clearServerDirty() {
            this.processDaos(dao => dao.serverDirty = false);
        }
        /**
         * 获取数据是否有变化
         */
        get serverDirty() {
            return this.processDaosAndReturn(dao => dao.serverDirty);
        }
        /**
         * 本地数据验证是否成功
         */
        get isValidate() {
            return !this.processDaosAndReturn(dao => !dao.isValidate);
        }
        set isValidate(val) {
            this.processDaos(dao => dao.isValidate = val);
        }
        /**
         * 主要数据接口,不为空时将会初始化加载数据，update存储数据
         */
        get dao() {
            return null;
        }
        get daos() {
            return null;
        }
        on(eventName, handler, target) {
            this._eventCenter.on(eventName, handler, target);
        }
        once(eventName, handler, target) {
            this._eventCenter.once(eventName, handler, target);
        }
        off(eventName, handler, target) {
            this._eventCenter.off(eventName, handler, target);
        }
        emit(eventName, ...args) {
            this._eventCenter.emit(eventName, ...args);
        }
        globalEmit(eventName, ...args) {
            EventCenter_5.EventCenter.I.emit(eventName, ...args);
        }
        update(dt) {
            if (this.dao) {
                this.dao.save();
                this.dao.update(dt);
            }
            this.onUpdate(dt);
        }
        /**
         * 每帧刷新
         * @param dt 时间间隔(s)
         */
        onUpdate(dt) {
        }
        load() {
            if (this.daos) {
                for (let i = 0; i < this.daos.length; i++) {
                    let dao = this.daos[i];
                    dao.load();
                }
            }
            else if (this.dao) {
                this.dao.load();
            }
        }
        initial() {
            if (this.daos) {
                for (let i = 0; i < this.daos.length; i++) {
                    let dao = this.daos[i];
                    dao.initial();
                }
            }
            else if (this.dao) {
                this.dao.initial();
            }
            this.onInitial();
        }
        onInitial() {
        }
        save(focus, now) {
            var _a;
            if (this.daos) {
                for (let i = 0; i < this.daos.length; i++) {
                    let dao = this.daos[i];
                    dao.save(focus, now);
                }
            }
            else if (this.dao) {
                (_a = this.dao) === null || _a === void 0 ? void 0 : _a.save(focus, now);
            }
        }
        reset() {
            if (this.daos) {
                for (let i = 0; i < this.daos.length; i++) {
                    let dao = this.daos[i];
                    dao.reset();
                }
            }
            else if (this.dao) {
                this.dao.reset();
            }
        }
        getModelData(holder, serialize) {
            if (!this.dataKey) {
                return;
            }
            if (this.daos) {
                let arr = holder[this.dataKey] = [];
                for (let i = 0; i < this.daos.length; i++) {
                    if (serialize) {
                        arr.push(this.daos[i].serialize());
                    }
                    else {
                        arr.push(this.daos[i].model);
                    }
                }
            }
            else if (this.dao) {
                if (serialize) {
                    holder[this.dataKey] = this.dao.serialize();
                }
                else {
                    holder[this.dataKey] = this.dao.model;
                }
            }
        }
        setModelData(holder, replace, deserialize) {
            if (!this.dataKey) {
                return;
            }
            if (this.daos) {
                let arr = holder[this.dataKey];
                for (let i = 0; i < this.daos.length; i++) {
                    if (deserialize) {
                        this.daos[i].deserialize(arr[i], replace);
                    }
                    else {
                        this.daos[i].setData(arr[i], replace);
                    }
                }
            }
            else {
                if (deserialize) {
                    this.dao.deserialize(holder[this.dataKey], replace);
                }
                else {
                    this.dao.setData(holder[this.dataKey], replace);
                }
            }
        }
    }
    exports.BaseController = BaseController;
});
define("modules/base/BaseModel", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseModel = void 0;
    class BaseModel {
    }
    exports.BaseModel = BaseModel;
});
define("modules/base/SecretModel", ["require", "exports", "modules/base/BaseModel"], function (require, exports, BaseModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SecretModel = void 0;
    class SecretModel extends BaseModel_1.BaseModel {
    }
    exports.SecretModel = SecretModel;
});
define("modules/ModelMapper", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelMapper = void 0;
    const ModelMapperInfo = null;
    class ModelMapper {
        static toData(data, type) {
            if (!this.modelMapperInfo) {
                return data;
            }
            if (Array.isArray(data)) {
                let array = [];
                for (let i = 0; i < data.length; i++) {
                    let item = this.toData(data[i], type);
                    array.push(item);
                }
                return array;
            }
            else if (typeof data != "object") {
                return data;
            }
            let info = this.modelMapperInfo[type];
            if (info) {
                if (info.arrArrayFields) {
                    if (data) {
                        let keys = info.arrArrayFields; //Object.keys(data);
                        let array = [];
                        for (let key of keys) {
                            let item = this.toData(data[key], type);
                            array.push(item);
                        }
                        return array;
                    }
                    else {
                        return null;
                    }
                }
                let model = new info.type();
                let keys = Object.keys(model);
                for (let key of keys) {
                    if (info.fields) {
                        let field = info.fields[key];
                        if (field) {
                            if (field.mapper) {
                                model[field.alias || key] = this.toData(data[key], field.mapper);
                            }
                            else {
                                if (field.type == Boolean) {
                                    model[field.alias || key] = data[key] ? 1 : 0;
                                }
                                else {
                                    model[field.alias || key] = data[key];
                                }
                            }
                        }
                        else {
                            model[key] = data[key];
                        }
                    }
                    else {
                        model[key] = data[key];
                    }
                }
                return model;
            }
            else {
                return data;
            }
        }
        static fromData(data, type, toObject = false) {
            if (!this.modelMapperInfo) {
                return data;
            }
            let info = this.modelMapperInfo[type];
            if (Array.isArray(data) && !toObject) {
                let array = [];
                for (let i = 0; i < data.length; i++) {
                    let item = this.fromData(data[i], type, true);
                    array.push(item);
                }
                return array;
            }
            else if (typeof data != "object") {
                return data;
            }
            if (info) {
                if (info.arrArrayFields) {
                    if (data) {
                        let keys = Object.keys(data);
                        let obj = new info.type();
                        for (let key of keys) {
                            let field = info.arrArrayFields[key];
                            obj[field] = this.fromData(data[key], type);
                        }
                        return obj;
                    }
                    else {
                        return null;
                    }
                }
                let model = {};
                let keys = Object.keys(data);
                for (let key of keys) {
                    if (info.fields) {
                        let field = info.fields[key];
                        if (field) {
                            if (field.mapper) {
                                model[key] = this.fromData(data[field.alias || key], field.mapper);
                            }
                            else {
                                if (field.type == Boolean) {
                                    model[key] = data[field.alias || key] ? 1 : 0;
                                }
                                else {
                                    model[key] = data[field.alias || key];
                                }
                            }
                        }
                        else {
                            model[key] = data[key];
                        }
                    }
                    else {
                        model[key] = data[key];
                    }
                }
                return model;
            }
            else {
                return data;
            }
        }
    }
    exports.ModelMapper = ModelMapper;
    ModelMapper.modelMapperInfo = ModelMapperInfo;
});
define("modules/base/BaseDAO", ["require", "exports", "common/UtilsHelper", "common/StorageManager", "modules/Bridge", "modules/ModelMapper", "GameSettings"], function (require, exports, UtilsHelper_3, StorageManager_1, Bridge_1, ModelMapper_1, GameSettings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseDAO = void 0;
    class BaseDAO {
        constructor(model) {
            this.serverDirty = false;
            this._isNewer = false;
            this._realStorageKey = "";
            this.isValidate = true;
            this._needValidKeys = {};
            this._dirty = false;
            this._type = model;
        }
        get readStorageKey() {
            return this._realStorageKey;
        }
        get storage() {
            return this._storage;
        }
        /**
         * 模块名称，用于通过ModelMapper获取配置数据
         */
        get modelName() {
            return "";
        }
        /**
         * 本地存储的key，为空表示不存储
         */
        get storageKey() {
            return null;
        }
        /**
         * md5验证存储的key，为空表示不校验
         */
        get storageValidKey() {
            return null;
        }
        get dirty() {
            return this._dirty;
        }
        set dirty(value) {
            this._dirty = value;
        }
        get model() {
            return this._model;
        }
        update(dt) {
            if (this.storage) {
                this.storage.update(dt);
            }
        }
        load() {
            if (this.storageKey) {
                this._storage = new StorageManager_1.StorageManager();
                this._realStorageKey = `${GameSettings_1.GameSettings.useid || 0}:${this.storageKey}`;
                this._storage.initial(this._realStorageKey);
            }
            this.beforeLoad();
            this.loadData();
            this.afterLoad();
        }
        initial() {
            this.beforeInitial();
            this.refreshValidKeys();
        }
        beforeLoad() {
        }
        afterLoad() {
        }
        beforeInitial() {
        }
        setValidKey(...keys) {
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (!key) {
                    continue;
                }
                let token = UtilsHelper_3.UtilsHelper.randomString(6);
                this._needValidKeys[key] = {
                    token,
                    md5: Bridge_1.Bridge.secertCtrl.getMd5(this.model[key], token),
                };
            }
        }
        refreshValidKeys() {
            let keys = Object.keys(this._needValidKeys);
            this.setValidKey(...keys);
        }
        checkAndUpdateValue(field, value) {
            let item = this._needValidKeys[field];
            if (item) {
                let ret = item.md5 == Bridge_1.Bridge.secertCtrl.getMd5(this.model[field], item.token);
                if (ret) {
                    this.model[field] = value;
                    item.md5 = Bridge_1.Bridge.secertCtrl.getMd5(value, item.token);
                    this.easySave();
                }
                else {
                    console.error(`key=${field}， 数据验证失败`);
                }
                return ret;
            }
            else {
                console.error(`未注册相关key：${field}`);
            }
            return false;
        }
        loadData() {
            if (this.storageKey) {
                this._model = this._storage.getData();
                this.validateAndCreateModel();
            }
        }
        /**
         * 直接覆盖数据，此数据无需验证
         * @param data
         */
        setData(data, replace = false) {
            UtilsHelper_3.UtilsHelper.copyTo(data, this._model);
            // this._model = data;
            // 
            if (this.storageValidKey) {
                Bridge_1.Bridge.secertCtrl.setValidKey(this._model, this.storageValidKey);
            }
            if (replace) {
                this._isNewer = false;
            }
            if (this.storage) {
                this.storage.setData(this._model);
            }
            this.easySave();
        }
        copyData(source, target, keys) {
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (source[key]) {
                    target[key] = source[key];
                }
            }
        }
        validateAndCreateModel() {
            // 从本地读取时，如果需要验证，将对整个对象进行一次验证，验证不通过时，直接复制为空对象
            if (this._model && this.storageValidKey) {
                if (!Bridge_1.Bridge.secertCtrl.checkValue(this._model, this.storageValidKey)) {
                    this._model = null;
                    Bridge_1.Bridge.secertCtrl.removeKey(this.storageValidKey);
                    console.error("merge_storage_error", { from: this.storageKey });
                    this.isValidate = false;
                }
                else {
                    this.isValidate = true;
                }
            }
            else {
                this.isValidate = true;
            }
            let isNewer = false;
            if (!this._model) {
                this._model = new this._type();
                isNewer = true;
            }
            else {
                let model = this._model;
                this._model = new this._type();
                UtilsHelper_3.UtilsHelper.copyTo(model, this._model);
            }
            this.setData(this._model, true);
            this._isNewer = isNewer;
        }
        saveData(focus, now = false, fireEvent = true) {
            if (this.dirty || focus) {
                if (this.storageValidKey) {
                    Bridge_1.Bridge.secertCtrl.setValidKey(this._model, this.storageValidKey);
                }
                this._storage.setData(this._model);
                if (now) {
                    this._storage.saveNow(fireEvent);
                }
            }
        }
        copyFrom(data, keys) {
            this._owner = data;
            this._keys = keys;
            keys = keys || Object.keys(this._model);
            this.copyData(data, this._model, keys);
        }
        saveTo(data, keys) {
            keys = keys || Object.keys(this._model);
            this.copyData(this._model, data, keys);
        }
        reset() {
            this._model = new this._type();
            this.saveNow(false);
        }
        easySave() {
            this.dirty = true;
            this.serverDirty = true;
        }
        saveNow(fireEvent = true) {
            this.save(true, true, fireEvent);
        }
        save(focus, now = false, fireEvent = true) {
            if (this.storageKey) {
                this.saveData(focus, now, fireEvent);
            }
            else if (this._owner) {
                this.saveTo(this._owner, this._keys);
            }
            this.dirty = false;
        }
        serialize() {
            if (this.modelName) {
                let data = ModelMapper_1.ModelMapper.toData(this.model, this.modelName);
                delete data["_md5_"];
                delete data["_token_"];
                return data;
            }
            return this.model;
        }
        deserialize(data, replace) {
            if (this.modelName) {
                let model = ModelMapper_1.ModelMapper.fromData(data, this.modelName);
                this.setData(model, replace);
            }
            else {
                this.setData(data, replace);
            }
        }
    }
    exports.BaseDAO = BaseDAO;
});
define("modules/base/SecretDAO", ["require", "exports", "modules/base/SecretModel", "modules/base/BaseDAO", "common/StorageManager", "modules/Bridge"], function (require, exports, SecretModel_1, BaseDAO_1, StorageManager_2, Bridge_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.secretDAO = void 0;
    class SecretDAO extends BaseDAO_1.BaseDAO {
        constructor(model) {
            super(model);
            this._innerSave = false;
            StorageManager_2.StorageManager.anyItemSaved.add(this._onAnyItemSaved, this);
        }
        get storageKey() {
            return "game_data_secret";
        }
        _onAnyItemSaved(storageKey) {
            if (!this._innerSave) {
                this._innerSave = true;
                Bridge_2.Bridge.secertCtrl.fireOnItemSaved(storageKey);
                // 强制保存token
                this.saveNow();
                this._innerSave = false;
            }
        }
        removeSecret(key) {
            delete this.model[key];
            this.easySave();
        }
        getSecret(key) {
            return this.model[key];
        }
        setSecret(key, token, md5) {
            this.model[key] = {
                token,
                md5,
            };
            this.easySave();
        }
        beforeInitial() {
        }
    }
    exports.secretDAO = new SecretDAO(SecretModel_1.SecretModel);
});
define("modules/base/SecretController", ["require", "exports", "common/UtilsHelper", "libs/md5", "modules/Bridge", "modules/base/BaseController", "modules/base/SecretDAO"], function (require, exports, UtilsHelper_4, md5_1, Bridge_3, BaseController_1, SecretDAO_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.secretController = exports.SecretController = void 0;
    class SecretController extends BaseController_1.BaseController {
        get dao() {
            return SecretDAO_1.secretDAO;
        }
        getMd5(data, token) {
            if (typeof data == "object") {
                return md5_1.Md5.hashStr(JSON.stringify(data) + "|" + token);
            }
            return `${data.toString()}|${token}`;
        }
        getTarget(target, field) {
            if (field) {
                return target[field];
            }
            // field为空时，表示target备份，且需要移除token和md5属性
            let obj = {};
            UtilsHelper_4.UtilsHelper.copyTo(target, obj);
            delete obj["_token_"];
            delete obj["_md5_"];
            return obj;
        }
        removeKey(key) {
            SecretDAO_1.secretDAO.removeSecret(key);
        }
        setValidKey(target, key, ...fields) {
            // null 表示target自身
            fields = (!fields || fields.length == 0) ? [null] : fields;
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                let token = UtilsHelper_4.UtilsHelper.randomString(6);
                let obj = this.getTarget(target, field);
                let md5 = this.getMd5(obj, token);
                if (field == null) {
                    // target自身时，在target上添加属性
                    target["_token_"] = token;
                    target["_md5_"] = md5;
                }
                SecretDAO_1.secretDAO.setSecret(key, token, md5);
                // console.log(`MD5: ${key}-${token}-${md5}`);
            }
        }
        checkValue(target, key, field) {
            let item = SecretDAO_1.secretDAO.getSecret(key);
            if (item) {
                let obj = this.getTarget(target, field);
                if (field == null) {
                    // target自身时，优先判定target上的属性
                    if (target["_md5_"] == this.getMd5(obj, target["_token_"])) {
                        return true;
                    }
                }
                let ret = item.md5 == this.getMd5(obj, item.token);
                if (!ret) {
                    console.error(`key=${key}， 数据验证失败`);
                }
                return ret;
            }
            else {
                console.error(`未注册相关key：${key}`);
            }
            return false;
        }
        checkAndUpdateValue(target, key, field, value) {
            let ret = this.checkValue(target, key, field);
            if (ret) {
                target[field] = value;
                this.setValidKey(target, key, field);
            }
            return ret;
        }
        fireOnItemSaved(storageKey) {
            Bridge_3.Bridge.secertCtrl.emit(SecretController.SECRET_DAO_ON_SAVED, storageKey);
        }
    }
    exports.SecretController = SecretController;
    SecretController.SECRET_DAO_ON_SAVED = "SECRET_DAO_ON_SAVED";
    exports.secretController = new SecretController();
    Bridge_3.Bridge.secertCtrl = exports.secretController;
});
define("modules/system/SystemController", ["require", "exports", "common/EventCenter", "modules/base/BaseController"], function (require, exports, EventCenter_6, BaseController_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.systemController = void 0;
    class SystemController extends BaseController_2.BaseController {
        constructor() {
            super(...arguments);
            this._nextDayZeroTime = 0;
            // 服务器毫秒时间
            this._serverTime = Date.now();
            // 上一次设置服务器时间后的运行时间
            this._timeTicker = 0;
            this._checkH = 0;
        }
        /**
         * 设置服务器时间(秒/毫秒)
         * @param servertime
         */
        setTime(servertime) {
            if (servertime < 10000000000) {
                servertime *= 1000;
            }
            this._serverTime = servertime;
            this._timeTicker = 0;
        }
        onInitial() {
            this._checkH = this.getH();
            setInterval(() => {
                this._timeTicker += 1000;
            }, 1000);
        }
        /**
         * 获取当前时间戳(毫秒)，与服务器时间同步
         * @returns {number} 毫秒
         */
        getTimeMS() {
            return Math.floor(this._serverTime + this._timeTicker);
        }
        /**
         * 获取当前时间戳(秒)，与服务器时间同步
         * @returns {number} 秒
         */
        getTime() {
            return Math.floor((this._serverTime + this._timeTicker) * 0.001);
        }
        /**
         * 获取当前是本年第几周
         * @returns
         */
        getWeek() {
            let date = this.getTime();
            let query_date = new Date(date * 1000 + 1);
            // 年的第一天
            const fist_day_of_year = new Date(query_date.getFullYear(), 0, 1);
            // 年的第一天是周几
            let week = fist_day_of_year.getDay(); //0-6 0是周末
            // 毫秒差
            const ms_count = query_date.getTime() - fist_day_of_year.getTime();
            // 今天是今年的第几天
            let days_count = Math.ceil(ms_count / 86400000);
            days_count += (week - 1); //凑齐一周
            return Math.ceil(days_count / 7);
        }
        // 当前周几 1-7
        getWeekDay() {
            const day = this.getServerDate().getDay();
            return day == 0 ? 7 : day;
        }
        getServerDate() {
            return new Date(this.getTimeMS());
        }
        getH() {
            let t = this.getTimeMS();
            let h = new Date(t).getHours();
            return h;
        }
        /**
         * 获取任意一天,任意时间点
         * @param day 天
         * @param hour 小时
         * @returns ms
         */
        getDayTime(day = 0, hour = 0) {
            return new Date(new Date(this.getServerDate()).setDate(new Date(this.getServerDate()).getDate() + day)).setHours(hour, 0, 0, 0);
        }
        // 判断是否跨天
        _checkCrossDay() {
            if (this._nextDayZeroTime == 0) {
                this._nextDayZeroTime = this.getDayTime(1);
            }
            // 跨天了
            if (this.getTimeMS() >= this._nextDayZeroTime) {
                console.log("跨天了", this.getTimeMS(), this._nextDayZeroTime, this.getTimeMS() - this._nextDayZeroTime, this.getDayTime(1), this.getTimeMS() - this.getDayTime(1));
                EventCenter_6.EventCenter.I.emit(SystemController.SYSTEM_CROSS_DAY);
                this._nextDayZeroTime = this.getDayTime(1);
            }
        }
        // 整点报时
        _checkHouse() {
            let h = this.getH();
            if (this._checkH != h) {
                this._checkH = h;
                EventCenter_6.EventCenter.I.emit(SystemController.SYSTEM_CROSS_HOUR);
            }
        }
        onUpdate(dt) {
            this._checkCrossDay();
            this._checkHouse();
        }
    }
    SystemController.SYSTEM_CROSS_DAY = "SYSTEM_CROSS_DAY";
    SystemController.SYSTEM_CROSS_HOUR = "SYSTEM_CROSS_HOUR";
    exports.systemController = new SystemController();
});
define("platform/PlatformSDK", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PlatformSDK = void 0;
    let WX;
    let inMiniGame = typeof wx !== 'undefined';
    if (inMiniGame) {
        WX = wx;
    }
    // 以上是引用的模块
    exports.PlatformSDK = Object.assign({ inMiniGame }, WX);
});
define("modules/ControllerManager", ["require", "exports", "cc", "cc/env", "common/StorageManager", "modules/base/SecretController", "modules/system/SystemController", "platform/PlatformSDK", "GameSettings"], function (require, exports, cc_11, env_6, StorageManager_3, SecretController_1, SystemController_1, PlatformSDK_1, GameSettings_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ControllerManager = void 0;
    class ControllerManager {
        static get controls() {
            return this._ctrls;
        }
        static getController(key) {
            return this._controllerMap[key];
        }
        static get controllerMap() {
            return this._controllerMap;
        }
        static regist() {
            // 需要最先加载，后面有数据需要验证
            this._ctrls.push(SecretController_1.secretController);
            this._ctrls.push(SystemController_1.systemController);
            this.onRegistControllers();
            for (let i = 0; i < this._ctrls.length; i++) {
                let ctrl = this._ctrls[i];
                ctrl.load();
                if (ctrl.dataKey) {
                    this._controllerMap[ctrl.dataKey] = this._ctrls[i];
                }
                else {
                    console.info("controller dataKey is null", ctrl);
                }
            }
        }
        static registController(ctrl) {
            this._ctrls.push(ctrl);
        }
        static onRegistControllers() {
        }
        static initial() {
            for (let i = 0; i < this._ctrls.length; i++) {
                this._ctrls[i].initial();
            }
            this.onInitial();
        }
        static onInitial() {
        }
        static update(dt) {
            for (let i = 0; i < this._ctrls.length; i++) {
                if (this._ctrls[i] == SecretController_1.secretController) {
                    continue;
                }
                this._ctrls[i].update(dt);
            }
            // 中间验证数据可能会被保存多次，放到最后，简单的优化一下
            SecretController_1.secretController.update(dt);
        }
        /**
         * 加载数据后是否验证成功
         */
        static get isValidate() {
            for (let i = 0; i < this._ctrls.length; i++) {
                if (!this._ctrls[i].isValidate) {
                    console.info("controller validate fail", this._ctrls[i].dataKey);
                    return false;
                }
            }
            return true;
        }
        static clearData() {
            StorageManager_3.StorageManager.enableSave = false;
            for (let i = 0; i < this._ctrls.length; i++) {
                this._ctrls[i].reset();
            }
            cc_11.director.pause();
            localStorage.clear();
            if (env_6.DEBUG) {
                location.reload();
            }
            else {
                cc_11.game.end();
                if (PlatformSDK_1.PlatformSDK.inMiniGame) {
                    PlatformSDK_1.PlatformSDK.restartMiniProgram({});
                }
            }
        }
        /**
         * 获取用户存档数据
         * @param serialize
         * @param checkServerDirty
         * @returns
         */
        static getUserStorage(serialize = false, checkServerDirty = false) {
            let ret = {
                version: GameSettings_2.GameSettings.version,
                serialized: serialize ? 1 : 0,
                time: SystemController_1.systemController.getTimeMS(),
                modules: {},
            };
            let dirty = false;
            for (let i = 0; i < this._ctrls.length; i++) {
                let ctrl = this._ctrls[i];
                if (!checkServerDirty || checkServerDirty && ctrl.serverDirty) {
                    ctrl.getModelData(ret.modules, serialize);
                    dirty = true;
                }
            }
            return dirty ? ret : null;
        }
        /**
         * 设置用户存档数据
         * @param data
         * @param replace
         * @param deserialize
         */
        static setUserStorage(data, replace = false) {
            if (data.modules) {
                let keys = Object.keys(data.modules);
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    let ctrl = this._controllerMap[key];
                    if (!ctrl)
                        continue;
                    ctrl.setModelData(data.modules, replace, data.serialized == 1);
                    ctrl.isValidate = true;
                }
            }
            this.onUserStorageChanged();
        }
        static onUserStorageChanged() {
        }
        /**
         * 强制本地保存数据
         */
        static forceSave() {
            for (let i = 0; i < this._ctrls.length; i++) {
                let ctrl = this._ctrls[i];
                ctrl.save(true, true);
            }
        }
        /**
         * 清除存档脏数据标记
         */
        static clearServerDirty() {
            for (let i = 0; i < this._ctrls.length; i++) {
                let ctrl = this._ctrls[i];
                ctrl.clearServerDirty();
            }
        }
    }
    exports.ControllerManager = ControllerManager;
    ControllerManager._ctrls = [];
    ControllerManager._controllerMap = {};
    ControllerManager.lastSaveTime = 0;
});
define("patch/ccc_pref_renderer", ["require", "exports", "cc", "fairygui-cc", "fairygui-cc"], function (require, exports, cc_12, fairygui_cc_13, fairygui_cc_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stage = exports.updateOpacity = exports.overlayInPreformance = exports.clearIgnorePreformance = exports.ignorePreformance = exports.preformanceSorting = exports.setSorting = exports.preformanceNodeRenderer = exports.isVisibility = exports.setVisibility = void 0;
    function setVisibility(node, visible) {
        node["_visible_"] = visible;
    }
    exports.setVisibility = setVisibility;
    function isVisibility(node) {
        return node["_visible_"] === undefined ? true : node["_visible_"];
    }
    exports.isVisibility = isVisibility;
    function preformanceNodeRenderer(node, childLevel = 2) {
        node["_children_pref_"] = {
            level: childLevel,
        };
    }
    exports.preformanceNodeRenderer = preformanceNodeRenderer;
    function setSorting(node, orderLayer, order) {
        let render = node.getComponent(cc_12.Renderer);
        if (render && (render instanceof fairygui_cc_14.Image || render instanceof cc_12.Sprite)) {
            let sorting = node.getComponent(cc_12.Sorting);
            if (!sorting) {
                sorting = node.addComponent(cc_12.Sorting);
            }
            sorting.sortingLayer = orderLayer;
            sorting.sortingOrder = order;
        }
        let children = node.children;
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];
            setSorting(child, orderLayer, order);
        }
    }
    exports.setSorting = setSorting;
    function preformanceSorting(node, orderLayer, order, childLevel = 2) {
        let children = node.children;
        // 将深度优先转换为广度优先
        let caches = [];
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];
            let level = childLevel;
            while (level > 1) {
                child = child.children[0];
                level--;
            }
            if (child.children.length > 0) {
                for (let k = 0; k < child.children.length; k++) {
                    if (!caches[k]) {
                        caches.push([]);
                    }
                    caches[k].push(child.children[k]);
                }
            }
        }
        for (let i = 0; i < caches.length; i++) {
            let arr = caches[i];
            let sortingOrder = order + i;
            for (let j = 0; j < arr.length; j++) {
                setSorting(arr[j], orderLayer, sortingOrder);
            }
        }
    }
    exports.preformanceSorting = preformanceSorting;
    function ignorePreformance(node) {
        node["_ignore_pref_"] = true;
    }
    exports.ignorePreformance = ignorePreformance;
    function clearIgnorePreformance(node) {
        delete node["_ignore_pref_"];
        delete node["_overlay_pref_"];
        delete node["_sorting_order_"];
        // 因为修改sprite材质，3.8 以上版本会消失，所以这里需要重新设置
        let active = node.active;
        node.active = false;
        node.active = active;
    }
    exports.clearIgnorePreformance = clearIgnorePreformance;
    function overlayInPreformance(node, sortingOrder, parent) {
        node["_overlay_pref_"] = true;
        node["_sorting_order_"] = {
            order: sortingOrder || 0,
            parent: parent || fairygui_cc_13.GRoot.inst.node,
        };
    }
    exports.overlayInPreformance = overlayInPreformance;
    function updateOpacity(renderData, opacity) {
        const vfmt = renderData.vertexFormat;
        const vb = renderData.chunk.vb;
        let attr;
        let format;
        let stride;
        // Color component offset
        let offset = 0;
        for (let i = 0; i < vfmt.length; ++i) {
            attr = vfmt[i];
            format = cc_12.gfx.FormatInfos[attr.format];
            if (format.hasAlpha) {
                stride = renderData.floatStride;
                if (format.size / format.count === 1) {
                    const alpha = ~~cc_12.clamp(Math.round(opacity * 255), 0, 255);
                    // Uint color RGBA8
                    for (let color = offset; color < vb.length; color += stride) {
                        vb[color] = ((vb[color] & 0xffffff00) | alpha) >>> 0;
                    }
                }
                else if (format.size / format.count === 4) {
                    // RGBA32 color, alpha at position 3
                    for (let alpha = offset + 3; alpha < vb.length; alpha += stride) {
                        vb[alpha] = opacity;
                    }
                }
            }
            offset += format.size >> 2;
        }
    }
    exports.updateOpacity = updateOpacity;
    var Stage;
    (function (Stage) {
        // Stencil disabled
        Stage[Stage["DISABLED"] = 0] = "DISABLED";
        // Clear stencil buffer
        Stage[Stage["CLEAR"] = 1] = "CLEAR";
        // Entering a new level, should handle new stencil
        Stage[Stage["ENTER_LEVEL"] = 2] = "ENTER_LEVEL";
        // In content
        Stage[Stage["ENABLED"] = 3] = "ENABLED";
        // Exiting a level, should restore old stencil or disable
        Stage[Stage["EXIT_LEVEL"] = 4] = "EXIT_LEVEL";
        // Clear stencil buffer & USE INVERTED
        Stage[Stage["CLEAR_INVERTED"] = 5] = "CLEAR_INVERTED";
        // Entering a new level & USE INVERTED
        Stage[Stage["ENTER_LEVEL_INVERTED"] = 6] = "ENTER_LEVEL_INVERTED";
    })(Stage = exports.Stage || (exports.Stage = {}));
    let overlay = [];
    cc_12.UI.prototype.walk = function (node, level = 0) {
        if (!node.activeInHierarchy || !isVisibility(node)) {
            return;
        }
        const children = node.children;
        const uiProps = node._uiProps;
        const render = uiProps.uiComp;
        // Save opacity
        const parentOpacity = this._pOpacity;
        let opacity = parentOpacity;
        // TODO Always cascade ui property's local opacity before remove it
        const selfOpacity = render && render.color ? render.color.a / 255 : 1;
        this._pOpacity = opacity *= selfOpacity * uiProps.localOpacity;
        // TODO Set opacity to ui property's opacity before remove it
        // @ts-ignore
        uiProps.setOpacity(opacity);
        if (!cc_12.math.approx(opacity, 0, cc_12.EPSILON)) {
            if (uiProps.colorDirty) {
                // Cascade color dirty state
                this._opacityDirty++;
            }
            // Render assembler update logic
            if (render && render.enabledInHierarchy) {
                render.fillBuffers(this); // for rendering
            }
            // Update cascaded opacity to vertex buffer
            if (this._opacityDirty && render && !render.useVertexOpacity && render.renderData && render.renderData.vertexCount > 0) {
                // HARD COUPLING
                updateOpacity(render.renderData, opacity);
                const buffer = render.renderData.getMeshBuffer();
                if (buffer) {
                    buffer.setDirty();
                }
            }
            let data = node["_children_pref_"];
            if (data) {
                if (children.length > 0 && !node._static) {
                    // 将深度优先转换为广度优先      
                    let caches = [];
                    for (let i = 0; i < children.length; ++i) {
                        let child = children[i];
                        if (child["_ignore_pref_"]) {
                            this.walk(child, level);
                        }
                        else if (child["_overlay_pref_"]) {
                            overlay.push(child);
                        }
                        else {
                            if (!child._static) {
                                if (data.level == 2) {
                                    child = child.children[0];
                                }
                                for (let k = 0; k < child.children.length; k++) {
                                    if (!caches[k]) {
                                        caches[k] = [];
                                    }
                                    caches[k].push(child.children[k]);
                                }
                            }
                        }
                    }
                    for (let i = 0; i < caches.length; i++) {
                        let arr = caches[i];
                        for (let j = 0; j < arr.length; j++) {
                            let oldLv = level;
                            this.walk(arr[j], level);
                            level = oldLv;
                        }
                    }
                }
            }
            else {
                if (children.length > 0 && !node._static) {
                    for (let i = 0; i < children.length; ++i) {
                        const child = children[i];
                        this.walk(child, level);
                    }
                }
            }
            if (overlay.length > 0) {
                let parent = overlay[0]["_sorting_order_"].parent;
                if (node == parent) {
                    overlay.sort((a, b) => {
                        return a["_sorting_order_"].order - b["_sorting_order_"].order;
                    });
                    for (let i = 0; i < overlay.length; i++) {
                        this.walk(overlay[i], -1);
                    }
                    overlay.length = 0;
                }
            }
            if (uiProps.colorDirty) {
                // Reduce cascaded color dirty state
                this._opacityDirty--;
                // Reset color dirty
                uiProps.colorDirty = false;
            }
        }
        // Restore opacity
        this._pOpacity = parentOpacity;
        // Post render assembler update logic
        // ATTENTION: Will also reset colorDirty inside postUpdateAssembler
        if (render && render.enabledInHierarchy) {
            render.postUpdateAssembler(this);
            if ((render.stencilStage === Stage.ENTER_LEVEL || render.stencilStage === Stage.ENTER_LEVEL_INVERTED)
                && (cc_12.StencilManager.sharedManager.getMaskStackSize() > 0)) {
                this.autoMergeBatches(this._currComponent);
                this.resetRenderStates();
                cc_12.StencilManager.sharedManager.exitMask();
            }
        }
        level += 1;
    };
});
define("platform/Platform", ["require", "exports", "cc/env", "macro", "platform/PlatformSDK"], function (require, exports, env_7, macro_1, PlatformSDK_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PlatformHelper = exports.EPlatform = void 0;
    var EPlatform;
    (function (EPlatform) {
        EPlatform["WECHAT"] = "WECHAT";
        EPlatform["MEITUAN"] = "MEITUAN";
        EPlatform["ALIPAY"] = "ALIPAY";
    })(EPlatform = exports.EPlatform || (exports.EPlatform = {}));
    class PlatformHelper {
        static get isEnable() {
            return this._isEnable;
        }
        static get isWechat() {
            return this.platform === EPlatform.WECHAT;
        }
        static get isMeituan() {
            return this.platform === EPlatform.MEITUAN;
        }
        static get isAlipay() {
            return this.platform === EPlatform.ALIPAY;
        }
        static isMiniGame() {
            return this.platform === EPlatform.WECHAT ||
                this.platform === EPlatform.MEITUAN ||
                this.platform === EPlatform.ALIPAY;
        }
        static initial(config) {
            this._isEnable = typeof wx !== 'undefined';
            if (!this._isEnable) {
                return;
            }
            this._rewardVideoAd = PlatformSDK_2.PlatformSDK.createRewardedVideoAd({
                adUnitId: config.rewardVideoAdUnitId,
            });
            this._rewardVideoAd.load();
        }
        static login(options) {
            var _a;
            if (this._isEnable) {
                PlatformSDK_2.PlatformSDK.login({
                    success: options.success,
                    fail: options.fail,
                });
            }
            else {
                (_a = options.success) === null || _a === void 0 ? void 0 : _a.call(options, null);
            }
        }
        static shareAppMessage(options) {
            if (!this.isEnable) {
                if (options.success) {
                    options.success();
                }
                return;
            }
            PlatformSDK_2.PlatformSDK.shareAppMessage({
                title: options.title,
                imageUrl: options.imageUrl,
                query: options.query,
            });
            const moniterTime = options.enableMonitor === false ? 0 : PlatformHelper.shareMonitorTime;
            if (moniterTime > 0) {
                setTimeout(() => {
                    if (options.success) {
                        options.success();
                    }
                }, moniterTime * 1000);
            }
            else {
                if (options.success) {
                    options.success();
                }
            }
        }
        static showRewardedVideoAd(options) {
            if (!this.isEnable) {
                if (options.success) {
                    options.success();
                }
                return;
            }
            this._rewardVideoAd.load().then(() => {
                this._rewardVideoAd.show().then(() => {
                    console.log('激励视频 广告显示');
                    if (options.success) {
                        options.success();
                    }
                }).catch(() => {
                    console.log('激励视频 广告显示失败');
                    if (options.fail) {
                        options.fail();
                    }
                });
            }).catch(() => {
                console.log('激励视频 广告加载失败');
                if (options.fail) {
                    options.fail();
                }
            });
        }
    }
    exports.PlatformHelper = PlatformHelper;
    PlatformHelper.platform = EPlatform.WECHAT;
    PlatformHelper.shareMonitorTime = 2;
    PlatformHelper._isEnable = false;
    ;
    if (macro_1.MEITUAN) {
        PlatformHelper.platform = EPlatform.MEITUAN;
    }
    else if (env_7.WECHAT) {
        PlatformHelper.platform = EPlatform.WECHAT;
    }
    else if (env_7.ALIPAY) {
        PlatformHelper.platform = EPlatform.ALIPAY;
    }
});
define("plugins/capture/CanvasPool", ["require", "exports", "cc"], function (require, exports, cc_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CanvasPool = void 0;
    let _canvasPool;
    class CanvasPool {
        constructor() {
            this.pool = [];
        }
        static getInstance() {
            if (!_canvasPool) {
                _canvasPool = new CanvasPool();
            }
            return _canvasPool;
        }
        get() {
            let data = this.pool.pop();
            if (!data) {
                const canvas = cc_13.cclegacy._global.window.document.createElement('canvas');
                const context = canvas.getContext('2d');
                data = {
                    canvas,
                    context,
                };
            }
            return data;
        }
        put(canvas) {
            if (this.pool.length >= cc_13.macro.MAX_LABEL_CANVAS_POOL_SIZE) {
                return;
            }
            this.pool.push(canvas);
        }
    }
    exports.CanvasPool = CanvasPool;
});
define("plugins/capture/CaptureHelper", ["require", "exports", "cc", "plugins/capture/CanvasPool"], function (require, exports, cc_14, CanvasPool_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CaptureHelper = void 0;
    var canvasPool = CanvasPool_1.CanvasPool;
    var versions = cc_14.VERSION.split(".");
    var mVersion = parseInt(versions[0]);
    var FLIP_Y_VERSION = mVersion != 3 || mVersion == 3 && parseInt(versions[1]) != 6;
    /**
     * CocosCreator截图辅助工具类
     * 不支持WebView截图（此为单独的dom）
     */
    class CaptureHelper {
        static setChildLayer(node, layer, depth = 0) {
            if (!node) {
                return;
            }
            let key = "__old_layer__";
            if (depth == 0) {
                if (layer) {
                    node[key] = node.layer;
                    node.layer = layer;
                }
                else {
                    node.layer = node[key];
                    delete node[key];
                }
            }
            let children = node.children;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (!child.active) {
                    continue;
                }
                if (layer) {
                    child[key] = child.layer;
                    child.layer = layer;
                }
                else {
                    child.layer = child[key];
                    delete child[key];
                }
                this.setChildLayer(child, layer, depth + 1);
            }
        }
        static canvasEncodeTexture(canvas, type = "jpeg", quality) {
            return new Promise((resolve) => {
                if (canvas.toDataURL) {
                    resolve(canvas.toDataURL("image/" + type, quality));
                }
                else {
                    canvas.toBlob((blob) => {
                        var reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onload = (e) => {
                            resolve(e.target.result);
                        };
                    }, "image/" + type, quality);
                }
            });
        }
        /**
         * 将RGBA纹理编码为图片数据[不支持原生平台]
         * @param arrayBuffer 像素数组
         * @param size 纹理大小
         * @param type 编码类型
         * @param trimHeader 是否移除base64文件头
         * @param quality 编码质量
         * @param flipY 是否进行y轴翻转，相对比较耗性能
         * @returns
         */
        static async toBase64Image(arrayBuffer, size, type = "png", trimHeader, quality = 1, flipY = null) {
            if (flipY == null) {
                flipY = !FLIP_Y_VERSION;
            }
            let canvas = canvasPool.getInstance().get();
            let width = canvas.canvas.width = Math.floor(size.width);
            let height = canvas.canvas.height = Math.floor(size.height);
            let ctx = canvas.context;
            let imageU8Data = new Uint8Array(arrayBuffer);
            let imageData = ctx.createImageData(width, height);
            if (flipY) {
                let bytesWidth = width * 4;
                for (let hi = 0; hi < height; hi++) {
                    let sindex = hi * bytesWidth;
                    let eindex = sindex + bytesWidth;
                    let tsindex = (height - 1 - hi) * bytesWidth;
                    for (let start = sindex; start < eindex; start++) {
                        imageData.data[tsindex] = imageU8Data[start];
                        tsindex++;
                    }
                }
            }
            else {
                imageData.data.set(imageU8Data);
            }
            ctx.putImageData(imageData, 0, 0);
            if (type == "png") {
                canvas.canvas.style.backgroundColor = null;
            }
            var base64 = await this.canvasEncodeTexture(canvas.canvas, type, quality);
            canvasPool.getInstance().put(canvas);
            if (trimHeader) {
                let index = base64.indexOf(",");
                if (index != -1) {
                    base64 = base64.substring(index + 1);
                }
            }
            return base64;
        }
        /**
         * 通过纹理读取制定区域的像素值
         * @param src 纹理
         * @param rect 区域，为空表示全部区域
         * @param buffer 返回数组
         * @returns 返回数组
         */
        static readTexturePixels(src, rect, buffer) {
            rect = rect || new cc_14.Rect(0, 0, src.width, src.height);
            rect.x = Math.floor(rect.x);
            rect.y = Math.floor(rect.y);
            rect.width = Math.floor(rect.width);
            rect.height = Math.floor(rect.height);
            const gfxTexture = src.getGFXTexture();
            if (!gfxTexture) {
                cc_14.errorID(7606);
                return null;
            }
            const needSize = 4 * rect.width * rect.height;
            if (buffer === undefined) {
                buffer = new Uint8Array(needSize);
            }
            else if (buffer.length < needSize) {
                cc_14.errorID(7607, needSize);
                return null;
            }
            const bufferViews = [];
            const regions = [];
            const region0 = new cc_14.gfx.BufferTextureCopy();
            region0.texOffset.x = rect.x;
            region0.texOffset.y = rect.y;
            region0.texExtent.width = rect.width;
            region0.texExtent.height = rect.height;
            regions.push(region0);
            bufferViews.push(buffer);
            const gfxDevice = src["_getGFXDevice"]();
            gfxDevice === null || gfxDevice === void 0 ? void 0 : gfxDevice.copyTextureToBuffers(gfxTexture, bufferViews, regions);
            return buffer;
        }
        static getComponentInParent(node, type) {
            if (node.parent) {
                let comp = node.parent.getComponent(type);
                if (comp) {
                    return comp;
                }
                if (node.parent.parent) {
                    return this.getComponentInParent(node.parent, type);
                }
            }
            return null;
        }
        /**
         * 通过相机截图,返回纹理需要自己管理
         * 当使用新建相机时，如果屏幕适配是SHOW_ALL策略，将可能会有ui缩放错误的问题(应该是引擎bug)
         * @param target 目标节点
         * @param cam 节点渲染相机
         * @param rect 裁剪区域
         * @param scale 图片缩放大小
         * @param pos 是否需要将相机对齐到给定点
         * @param useRawCamera 是否使用节点渲染的相机来截图，开启后不剔除物体
         * @param flipY 是否在y轴方向进行翻转
         * @returns 纹理
         */
        static async capture(target, cam, rect, scale, pos, useRawCamera, flipY = true) {
            let node = new cc_14.Node("CaptureCamera");
            cam.node.parent.addChild(node);
            let wpos = cam.node.worldPosition;
            let camera;
            if (useRawCamera) {
                camera = cam;
            }
            else {
                let layer = 1 << cc_14.Layers.nameToLayer("CAPTURE");
                if (pos) {
                    node.setWorldPosition(pos.x, pos.y, wpos.z);
                }
                else {
                    node.setWorldPosition(wpos.x, wpos.y, wpos.z);
                }
                camera = node.addComponent(cc_14.Camera);
                camera.node.setWorldScale(cam.node.getWorldScale());
                camera.clearFlags = cc_14.gfx.ClearFlagBit.ALL;
                camera.clearColor = new cc_14.Color(0, 0, 0, 0);
                camera.clearDepth = cam.clearDepth;
                camera.clearStencil = cam.clearStencil;
                camera.projection = cam.projection;
                camera.priority = cam.priority;
                camera.orthoHeight = cam.orthoHeight;
                camera.far = cam.far;
                camera.near = cam.near;
                camera.fov = cam.fov;
                camera.fovAxis = cam.fovAxis;
                camera.iso = cam.iso;
                camera.aperture = cam.aperture;
                camera.shutter = cam.shutter;
                camera.screenScale = cam.screenScale;
                camera.node.up.set(cam.node.up);
                camera.rect.set(cam.rect);
                camera.visibility = layer;
                this.setChildLayer(target, layer);
                await new Promise((resolve) => {
                    cc_14.director.once(cc_14.Director.EVENT_BEGIN_FRAME, () => {
                        resolve(0);
                    });
                });
            }
            let camScale;
            if (flipY) {
                camScale = cc_14.v3(camera.node.scale);
                camera.node.setScale(camScale.x, -camScale.y, camScale.z);
            }
            scale = scale || 1;
            let rt = new cc_14.RenderTexture();
            let size = cc_14.view.getVisibleSize();
            rt.reset({ width: size.width * scale, height: size.height * scale });
            camera.targetTexture = rt;
            cc_14.director.root.frameMove(0);
            let clear = () => {
                node.destroy();
                camera.targetTexture = null;
                if (flipY) {
                    camera.node.setScale(camScale);
                }
                if (!useRawCamera) {
                    this.setChildLayer(target);
                }
            };
            if (rect) {
                if (flipY && FLIP_Y_VERSION) {
                    rect.y = size.height - rect.y - rect.height;
                }
                rect.set(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);
                let tex2d = new cc_14.Texture2D();
                tex2d.reset({
                    width: rect.width,
                    height: rect.height,
                    format: cc_14.Texture2D.PixelFormat.RGBA8888,
                    mipmapLevel: 0
                });
                tex2d.uploadData(rt.readPixels(rect.x, rect.y, rect.width, rect.height));
                rt.destroy();
                clear();
                return tex2d;
            }
            clear();
            return rt;
        }
        /**
         * 抓取指定ui区域为纹理（支持透明）,返回纹理需要自己管理
         * @param target 指定ui节点, 不支持缩放
         * @param cam 渲染此ui的相机
         * @param opts 截图参数
         * @returns 纹理
         */
        static async captureUI2Texture(target, cam, opts) {
            var _a, _b;
            opts = opts || {};
            opts.useRawCamera = (_a = opts.useRawCamera) !== null && _a !== void 0 ? _a : true;
            let utr = target.getComponent(cc_14.UITransform);
            let rect = (_b = opts === null || opts === void 0 ? void 0 : opts.rect) !== null && _b !== void 0 ? _b : utr.getBoundingBox();
            let width = rect.width;
            let height = rect.height;
            let scale = 1;
            if (opts.firstSize) {
                if (opts.heightFrist) {
                    scale = opts.firstSize / height;
                }
                else {
                    scale = opts.firstSize / width;
                }
            }
            if (opts.aspect) {
                if (!opts.heightFrist) {
                    width = rect.width;
                    height = width / opts.aspect;
                }
                else {
                    height = rect.height;
                    width = height * opts.aspect;
                }
            }
            let pos = utr.convertToWorldSpaceAR(cc_14.v3(-width * utr.anchorX, -height * utr.anchorY, 0));
            let snapPos = null;
            if (!opts.useRawCamera) {
                rect.x = 0;
                rect.y = 0;
                let size = cc_14.view.getVisibleSize();
                pos.x += size.width * 0.5;
                pos.y += size.height * 0.5;
                let ap = size.width / size.height;
                let policy = cc_14.view.getResolutionPolicy();
                let strategy = policy["_contentStrategy"];
                if ((strategy && strategy.name == "ShowAll") && ap < 1) {
                    if (cc_14.sys.platform == cc_14.sys.Platform.DESKTOP_BROWSER) {
                        pos.y += size.height * (1 - cc_14.screen.devicePixelRatio) * 0.5;
                    }
                    else {
                        pos.y += (cc_14.view.getViewportRect().height - size.height) * 0.5;
                    }
                }
                snapPos = cc_14.v2(pos.x, pos.y);
            }
            else {
                rect.x = pos.x;
                rect.y = pos.y;
            }
            return await this.capture(target, cam, rect, scale, snapPos, opts.useRawCamera, opts.useRawCamera || FLIP_Y_VERSION);
        }
        /**
         * 纹理编码为jpg/png图片
         * @param texture 目标纹理
         * @param type 编码格式
         * @param trimHeader 是否移除图片头(微信存储base64时不需要文件头)
         * @param quality 图片编码质量
         * @param flipY 是否进行y轴翻转，比较耗性能
         * @returns 返回指定格式的base64编码图片
         */
        static async textureToImage(texture, type = "png", trimHeader, quality = 1, flipY = null) {
            let arrayBuffer = await this.readTexturePixels(texture);
            return await this.toBase64Image(arrayBuffer, new cc_14.Size(texture.width, texture.height), type, trimHeader, quality, flipY);
        }
        /**
         * 按实际屏幕分辨率，全屏截图，此方法直接截取游戏canvas画面[不支持原生平台]
         * @returns 纹理
         */
        static async captureFullScreen() {
            let tex2d = new cc_14.Texture2D();
            tex2d.reset({
                width: cc_14.game.canvas.width,
                height: cc_14.game.canvas.height,
                format: cc_14.Texture2D.PixelFormat.RGBA8888,
                mipmapLevel: 0
            });
            cc_14.director.root.frameMove(0);
            tex2d.uploadData(cc_14.game.canvas);
            return tex2d;
        }
        /**
         * 按实际屏幕分辨率，全屏截图，此方法直接截取游戏canvas画面[不支持原生平台]
         * @param trimHeader 是否移除文件头
         * @returns 返回指定格式的base64编码图片
         */
        static async captureFullScreenToImage(trimHeader, quality = 1) {
            cc_14.director.root.frameMove(0);
            var base64 = await this.canvasEncodeTexture(cc_14.game.canvas, "jpeg", quality);
            if (trimHeader) {
                let index = base64.indexOf(",");
                if (index != -1) {
                    base64 = base64.substring(index + 1);
                }
            }
            return base64;
        }
        /**
         * 按实际屏幕分辨率，全屏截图（支持透明）,返回纹理需要自己管理
         * @param cam 用来截屏的相机
         * @returns 纹理
         */
        static async captureCameraToTexture(cam) {
            return this.capture(null, cam, null, 1, null, true, true);
        }
        /**
         * 按设计分辨率，生成微信分享图片（支持透明）
         * @param target 目标ui
         * @param cam ui相机
         * @param type 生成图片类型
         * @param heightFrist 是否高度优先
         * @param firstSize 优先边的长度
         * @returns 返回指定格式的base64编码图片
         */
        static async captureWechatShareImage(target, cam, type = "png", heightFrist = true, firstSize = 400, quality = 1) {
            let opts = {
                heightFrist: heightFrist,
                aspect: 5 / 4,
                firstSize: firstSize,
            };
            let texture = await this.captureUI2Texture(target, cam, opts);
            let img = this.textureToImage(texture, type, true, quality);
            texture.destroy();
            return img;
        }
        /**
         * 测试用接口
         * @param base64
         * @param name
         * @returns
         */
        static downloadImage(base64, type = "png", name) {
            if (!cc_14.sys.isBrowser) {
                return;
            }
            var byteCharacters = atob(base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""));
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var blob = new Blob([byteArray], {
                type: `image/${type}`,
            });
            var aLink = document.createElement("a");
            document.body.appendChild(aLink);
            aLink.style.display = 'none';
            aLink.href = URL.createObjectURL(blob);
            aLink.setAttribute('download', (name || "image") + (type == "jpeg" ? ".jpg" : ".png"));
            aLink.click();
            document.body.removeChild(aLink);
        }
    }
    exports.CaptureHelper = CaptureHelper;
});
define("plugins/config/DataAccess", ["require", "exports", "cc"], function (require, exports, cc_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTable = exports.DataItem = exports.DataAccess = void 0;
    class DataAccess {
        static initial(dataDir, loadHandle, fileNameGenerateHandle) {
            this.dataDir = dataDir;
            this.generator = fileNameGenerateHandle;
            this.loader = loadHandle;
        }
        /**
         * 获取配置表
         * @param dataType 配置的数据类型
         * @returns
         */
        static getDataItem(dataType) {
            let typename = dataType["__type_name__"];
            if (this._items[typename]) {
                return this._items[typename];
            }
            return this._items[typename] = new DataItem(dataType);
        }
        /**
         * 获取配置表, 可自定义主键名称
         * @param dataType 配置的数据类型
         * @param keyName 主键名称
         * @returns
         */
        static getDataTable(dataType, keyName = "ID") {
            let typename = dataType["__type_name__"];
            if (this._tables[typename]) {
                return this._tables[typename];
            }
            return this._tables[typename] = new DataTable(dataType, keyName);
        }
    }
    exports.DataAccess = DataAccess;
    /// <summary>
    /// 是否使用ProtoMember的tag作为hashtable的key
    /// </summary>
    DataAccess.useProtoMemberTagAsHashtableKey = false;
    DataAccess.cacheHashValue = true;
    DataAccess.dataExt = ".bin";
    DataAccess._items = {};
    DataAccess._tables = {};
    class DataItem {
        constructor(dataType) {
            this.dataType = dataType;
        }
        onGenerateFilename(typeName) {
            if (this.localGenerator != null) {
                return this.localGenerator(typeName);
            }
            if (DataAccess.generator != null) {
                return DataAccess.generator(typeName);
            }
            typeName = typeName.replace("_ARRAY", "");
            return DataAccess.dataDir + typeName.toLocaleLowerCase();
        }
        onLoadData(typeName) {
            if (this.source != null) {
                return new Uint8Array(this.source.buffer());
            }
            var datafile = this.onGenerateFilename(typeName);
            if (this.localLoader != null) {
                return this.localLoader(datafile);
            }
            if (DataAccess.loader != null) {
                return DataAccess.loader(datafile);
            }
            this.source = cc_15.resources.get(datafile, cc_15.BufferAsset);
            if (this.source) {
                return new Uint8Array(this.source.buffer());
            }
            return null;
        }
        setSource(source) {
            this.source = source;
        }
        initial(dataType, loadHandle, fileNameGenerateHandle) {
            this.dataType = dataType;
            this.localLoader = loadHandle;
            this.localGenerator = fileNameGenerateHandle;
        }
        static create(dataType, source) {
            var instance = new DataItem(dataType);
            instance.setSource(source);
            return instance;
        }
        clear() {
            if (this.source != null) {
                this.source.destroy();
                this.source = null;
            }
        }
        load() {
            var buffer = this.onLoadData(this.dataType["__array_type_name__"]);
            var msgType = this.dataType["__array_type__"];
            return msgType.decode(buffer);
        }
        get data() {
            if (this._item == null) {
                this._item = this.load();
            }
            return this._item;
        }
    }
    exports.DataItem = DataItem;
    class DataTable extends DataItem {
        constructor(dataType, keyName = "ID") {
            super(dataType);
            this._keyName = "ID";
            this._keyName = keyName;
        }
        get keyName() {
            return this._keyName;
        }
        load() {
            var arrTypeName = this.dataType["__array_type_name__"];
            var buffer = this.onLoadData(arrTypeName);
            var msgType = this.dataType["getArrayType"]();
            var message = msgType.decode(buffer);
            return message.Items;
        }
        static create(dataType, source, keyName = "ID") {
            var instance = new DataTable(dataType, keyName);
            instance.setSource(source);
            return instance;
        }
        get itemMap() {
            if (this._itemMap == null) {
                this._itemMap = this.initDataAsDict();
            }
            return this._itemMap;
        }
        get items() {
            try {
                if (this._items == null) {
                    this._items = this.initDataAsList();
                }
            }
            catch (e) {
                console.log(`config data load error: ${e}`);
            }
            return this._items;
        }
        get IDs() {
            if (this._ids == null) {
                this._ids = this.items.map((val, idx, arr) => {
                    //@ts-ignore
                    arr.push(val[this.keyName]);
                }, []);
            }
            return this._ids;
        }
        getItem(key) {
            return this.itemMap[key];
        }
        initDataAsDict() {
            let itemMap = {};
            try {
                this.items.forEach((val) => {
                    itemMap[val[this.keyName]] = val;
                });
                return itemMap;
            }
            catch (e) {
                console.error(`can not get data map by key ${this.keyName}`);
                return itemMap;
            }
        }
        initDataAsList() {
            return this.load();
        }
        contains(id) {
            return this.itemMap[id] != null;
        }
        clear() {
            super.clear();
            this._itemMap = null;
            this._items = null;
        }
    }
    exports.DataTable = DataTable;
});
define("plugins/config/Lang", ["require", "exports", "protobufjs"], function (require, exports, protobufjs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Language_ARRAY = exports.Language = void 0;
    var $Reader = protobufjs_1.default.Reader, $Writer = protobufjs_1.default.Writer, $util = protobufjs_1.default.util;
    class Language {
        /**
         * Properties of a Language.
         * @memberof GameData
         * @interface ILanguage
         * @property {string|null} [ID] Language ID
         * @property {string|null} [Text] Language Text
         */
        /**
         * Constructs a new Language.
         * @memberof GameData
         * @classdesc Represents a Language.
         * @implements ILanguage
         * @constructor
         * @param {ILanguage=} [properties] Properties to set
         */
        constructor(properties) {
            /**
             * Language ID.
             * @member {string} ID
             * @memberof Language
             * @instance
             */
            this.ID = "";
            /**
             * Language Text.
             * @member {string} Text
             * @memberof Language
             * @instance
             */
            this.Text = "";
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * Creates a new Language instance using the specified properties.
         * @function create
         * @memberof Language
         * @static
         * @param {ILanguage=} [properties] Properties to set
         * @returns {Language} Language instance
         */
        static create(properties) {
            return new Language(properties);
        }
        ;
        /**
         * Encodes the specified Language message. Does not implicitly {@link Language.verify|verify} messages.
         * @function encode
         * @memberof Language
         * @static
         * @param {ILanguage} message Language message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        static encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ID != null && Object.hasOwnProperty.call(message, "ID"))
                writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.ID);
            if (message.Text != null && Object.hasOwnProperty.call(message, "Text"))
                writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.Text);
            return writer;
        }
        ;
        /**
         * Encodes the specified Language message, length delimited. Does not implicitly {@link Language.verify|verify} messages.
         * @function encodeDelimited
         * @memberof Language
         * @static
         * @param {ILanguage} message Language message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        static encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        }
        ;
        /**
         * Decodes a Language message from the specified reader or buffer.
         * @function decode
         * @memberof Language
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {Language} Language
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new Language();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.ID = reader.string();
                        break;
                    case 2:
                        message.Text = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        }
        ;
        /**
         * Decodes a Language message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof Language
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {Language} Language
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        }
        ;
        /**
         * Verifies a Language message.
         * @function verify
         * @memberof Language
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        static verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ID != null && message.hasOwnProperty("ID"))
                if (!$util.isString(message.ID))
                    return "ID: string expected";
            if (message.Text != null && message.hasOwnProperty("Text"))
                if (!$util.isString(message.Text))
                    return "Text: string expected";
            return null;
        }
        ;
        /**
         * Creates a Language message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof Language
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {Language} Language
         */
        static fromObject(object) {
            if (object instanceof Language)
                return object;
            var message = new Language();
            if (object.ID != null)
                message.ID = String(object.ID);
            if (object.Text != null)
                message.Text = String(object.Text);
            return message;
        }
        ;
        /**
         * Creates a plain object from a Language message. Also converts values to other types if specified.
         * @function toObject
         * @memberof Language
         * @static
         * @param {Language} message Language
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        static toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.ID = "";
                object.Text = "";
            }
            if (message.ID != null && message.hasOwnProperty("ID"))
                object.ID = message.ID;
            if (message.Text != null && message.hasOwnProperty("Text"))
                object.Text = message.Text;
            return object;
        }
        ;
        /**
         * Converts this Language to JSON.
         * @function toJSON
         * @memberof Language
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        toJSON() {
            return Language.toObject(this, protobufjs_1.default.util.toJSONOptions);
        }
        ;
    }
    exports.Language = Language;
    class Language_ARRAY {
        /**
         * Properties of a Language_ARRAY.
         * @memberof GameData
         * @interface ILanguage_ARRAY
         * @property {Array.<ILanguage>|null} [Items] Language_ARRAY Items
         */
        /**
         * Constructs a new Language_ARRAY.
         * @memberof GameData
         * @classdesc Represents a Language_ARRAY.
         * @implements ILanguage_ARRAY
         * @constructor
         * @param {ILanguage_ARRAY=} [properties] Properties to set
         */
        constructor(properties) {
            /**
             * Language_ARRAY Items.
             * @member {Array.<ILanguage>} Items
             * @memberof Language_ARRAY
             * @instance
             */
            this.Items = $util.emptyArray;
            this.Items = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * Creates a new Language_ARRAY instance using the specified properties.
         * @function create
         * @memberof Language_ARRAY
         * @static
         * @param {ILanguage_ARRAY=} [properties] Properties to set
         * @returns {Language_ARRAY} Language_ARRAY instance
         */
        static create(properties) {
            return new Language_ARRAY(properties);
        }
        ;
        /**
         * Encodes the specified Language_ARRAY message. Does not implicitly {@link Language_ARRAY.verify|verify} messages.
         * @function encode
         * @memberof Language_ARRAY
         * @static
         * @param {ILanguage_ARRAY} message Language_ARRAY message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        static encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Items != null && message.Items.length)
                for (var i = 0; i < message.Items.length; ++i)
                    Language.encode(message.Items[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
            return writer;
        }
        ;
        /**
         * Encodes the specified Language_ARRAY message, length delimited. Does not implicitly {@link Language_ARRAY.verify|verify} messages.
         * @function encodeDelimited
         * @memberof Language_ARRAY
         * @static
         * @param {ILanguage_ARRAY} message Language_ARRAY message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        static encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        }
        ;
        /**
         * Decodes a Language_ARRAY message from the specified reader or buffer.
         * @function decode
         * @memberof Language_ARRAY
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {Language_ARRAY} Language_ARRAY
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new Language_ARRAY();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        if (!(message.Items && message.Items.length))
                            message.Items = [];
                        message.Items.push(Language.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        }
        ;
        /**
         * Decodes a Language_ARRAY message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof Language_ARRAY
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {Language_ARRAY} Language_ARRAY
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        }
        ;
        /**
         * Verifies a Language_ARRAY message.
         * @function verify
         * @memberof Language_ARRAY
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        static verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Items != null && message.hasOwnProperty("Items")) {
                if (!Array.isArray(message.Items))
                    return "Items: array expected";
                for (var i = 0; i < message.Items.length; ++i) {
                    var error = Language.verify(message.Items[i]);
                    if (error)
                        return "Items." + error;
                }
            }
            return null;
        }
        ;
        /**
         * Creates a Language_ARRAY message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof Language_ARRAY
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {Language_ARRAY} Language_ARRAY
         */
        static fromObject(object) {
            if (object instanceof Language_ARRAY)
                return object;
            var message = new Language_ARRAY();
            if (object.Items) {
                if (!Array.isArray(object.Items))
                    throw TypeError(".Language_ARRAY.Items: array expected");
                message.Items = [];
                for (var i = 0; i < object.Items.length; ++i) {
                    if (typeof object.Items[i] !== "object")
                        throw TypeError(".Language_ARRAY.Items: object expected");
                    message.Items[i] = Language.fromObject(object.Items[i]);
                }
            }
            return message;
        }
        ;
        /**
         * Creates a plain object from a Language_ARRAY message. Also converts values to other types if specified.
         * @function toObject
         * @memberof Language_ARRAY
         * @static
         * @param {Language_ARRAY} message Language_ARRAY
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        static toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Items = [];
            if (message.Items && message.Items.length) {
                object.Items = [];
                for (var j = 0; j < message.Items.length; ++j)
                    object.Items[j] = Language.toObject(message.Items[j], options);
            }
            return object;
        }
        ;
        /**
         * Converts this Language_ARRAY to JSON.
         * @function toJSON
         * @memberof Language_ARRAY
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        toJSON() {
            return Language_ARRAY.toObject(this, protobufjs_1.default.util.toJSONOptions);
        }
        ;
    }
    exports.Language_ARRAY = Language_ARRAY;
});
define("plugins/config/I18N", ["require", "exports", "plugins/config/DataAccess", "plugins/config/Lang"], function (require, exports, DataAccess_1, Lang_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.I18N = void 0;
    class I18N extends DataAccess_1.DataTable {
        constructor(keyName = "ID") {
            super(Lang_1.Language, keyName);
            this.initial(this.dataType, null, I18N.getFilename);
        }
        static get inst() {
            if (!this._inst) {
                this._inst = new I18N();
            }
            return this._inst;
        }
        load() {
            var buffer = this.onLoadData("Language_ARRAY");
            var message = Lang_1.Language_ARRAY.decode(buffer);
            return message.Items;
        }
        static setLanguage(lan = "cn") {
            if (this.currentLanguage != "") {
                this.inst.clear();
            }
            this.currentLanguage = lan;
        }
        static getFilename(typeName) {
            typeName = typeName.replace("_ARRAY", "");
            var datafile = DataAccess_1.DataAccess.dataDir + typeName.toLocaleLowerCase();
            return `${datafile}.${I18N.currentLanguage}`;
        }
        static translate(key) {
            let lan = this.inst.itemMap[key];
            if (lan) {
                return lan.Text;
            }
            return null;
        }
    }
    exports.I18N = I18N;
    I18N.currentLanguage = "cn";
});
define("plugins/fsm/FSM", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FSM = void 0;
    var FSM;
    (function (FSM) {
        class State {
            constructor(owner, hsm, name) {
                this._name = name;
                this._hsm = hsm;
                this._owner = owner;
            }
            get isCompositeState() {
                return false;
            }
            init() {
            }
            onEnter(data) {
            }
            onExit() {
            }
            onStateChange(stateName) {
            }
            onUpdate(dt) {
            }
            onLaterUpdate(dt) {
            }
            onRefresh() {
            }
            get name() {
                return this._name;
            }
            get hierachicalName() {
                return this._name;
            }
            get hsm() {
                return this._hsm;
            }
            get owner() {
                return this._owner;
            }
        }
        FSM.State = State;
        class CompositeState {
            constructor(owner, hsm, name) {
                this._hierachicalName = "";
                this._currentState = null;
                this._defaultStateName = "";
                this._nameDictionary = {};
                this._currentOverwriteFlag = false;
                this._name = name;
                this._hsm = hsm;
                this._owner = owner;
            }
            isCompositeState() {
                return true;
            }
            init(states, defaultStateName) {
                if (!(states instanceof Array)) {
                    console.log("states must be array data!");
                    return;
                }
                this._currentOverwriteFlag = false;
                for (var i in states) {
                    var state = states[i];
                    this._nameDictionary[state.name] = state;
                }
                this._defaultStateName = defaultStateName;
            }
            get currentState() {
                return this._currentState;
            }
            onEnter(data) {
                //set to default state
                this._currentState = this.getStateByName(this._defaultStateName);
                if (!this._currentState) {
                    console.log("Invalid state name:" + this._defaultStateName);
                    return;
                }
                if (this._hsm.enableDebug) {
                    console.log("CompositeState::onEnter " + this._currentState.name);
                }
                if (this._currentState && this._currentState.onEnter) {
                    this._currentState.onEnter(data);
                }
            }
            onExit() {
                if (this._currentState && this._currentState.onExit) {
                    this._currentState.onExit();
                }
                if (this._hsm.enableDebug) {
                    console.log("CompositeState::onExit " + this._currentState.name);
                }
                this._currentState = null;
            }
            onStateChange(stateName) {
                if (this._currentState && this._currentState.onExit) {
                    //exit current state
                    this._currentState.onExit();
                }
                //set new state
                var newState = this.getStateByName(stateName);
                if (!newState) {
                    console.log("Invalid state name: " + stateName);
                    return;
                }
                if (this._hsm.enableDebug) {
                    console.log("Change sub state from " + (this._currentState ? this._currentState.name : "_empty_") + " to " + newState.name);
                }
                this._currentState = newState;
                //enter new state
                if (this._currentState.onEnter) {
                    this._currentState.onEnter();
                }
            }
            onUpdate(dt) {
                if (this._currentState && this._currentState.onUpdate) {
                    this._currentState.onUpdate(dt);
                }
            }
            onLaterUpdate(dt) {
                if (this._currentState && this._currentState.onLaterUpdate) {
                    this._currentState.onLaterUpdate(dt);
                }
            }
            get name() {
                return this._name;
            }
            get hierachicalName() {
                if (this._currentState) {
                    return this.name + "::" + this._currentState.hierachicalName;
                }
                else {
                    return this._name;
                }
            }
            getStateByName(stateName) {
                return this._nameDictionary[stateName];
            }
            get hsm() {
                return this._hsm;
            }
            get owner() {
                return this._owner;
            }
        }
        FSM.CompositeState = CompositeState;
        class ChangeStateInfo {
            constructor() {
                this.dirtyFlag = false;
            }
        }
        class HierarchicalStateMachine {
            constructor(owner, enableDebug) {
                this.onStateChanged = null;
                this._enableDebug = false;
                this._currentState = null;
                this._previousState = null;
                this._nameDictionary = {};
                this._pendingStateChange = null; //string
                this._currentOverwriteFlag = false;
                this._changeStateData = null;
                this._states = [];
                this._pendingStateChangeInfo = new ChangeStateInfo();
                this._owner = owner;
                this._enableDebug = enableDebug || false;
            }
            ;
            get owner() {
                return this._owner;
            }
            get currentState() {
                return this._currentState;
            }
            get previousState() {
                return this._previousState;
            }
            get enableDebug() {
                return this._enableDebug;
            }
            set enableDebug(value) {
                this._enableDebug = value;
            }
            get states() {
                return this._states;
            }
            init(states, defaultStateName) {
                if (!(states instanceof Array)) {
                    console.log("states must be array data!");
                    return;
                }
                this._states = states;
                this._currentOverwriteFlag = false;
                for (var i in states) {
                    var state = states[i];
                    this._nameDictionary[state.name] = state;
                }
                //to default state
                if (defaultStateName) {
                    this.doChangeState(defaultStateName);
                }
            }
            update(dt) {
                if (this._pendingStateChange) {
                    this.doChangeState(this._pendingStateChange, this._changeStateData);
                    //clean state
                    this._pendingStateChange = null;
                    this._changeStateData = null;
                }
                //reset flag
                this._currentOverwriteFlag = true;
                //update current state
                if (this._currentState && this._currentState.onUpdate) {
                    this._currentState.onUpdate(dt);
                }
                if (this._pendingStateChangeInfo.dirtyFlag) {
                    let info = this._pendingStateChangeInfo;
                    this._changeState(info.stateName, info.data, info.overwriteFlag);
                    this._pendingStateChangeInfo.dirtyFlag = false;
                }
            }
            laterUpdate(dt) {
                if (this._pendingStateChange) {
                    this.doChangeState(this._pendingStateChange, this._changeStateData);
                    //clean state
                    this._pendingStateChange = null;
                    this._changeStateData = null;
                }
                //reset flag
                this._currentOverwriteFlag = true;
                //update current state
                if (this._currentState && this._currentState.onLaterUpdate) {
                    this._currentState.onLaterUpdate(dt);
                }
            }
            cleanPendingState() {
                this._pendingStateChange = null;
                this._currentOverwriteFlag = true;
                this._changeStateData = null;
            }
            forceChangeState(stateName, data) {
                this.doChangeState(stateName, data);
                //reset flag
                this.cleanPendingState();
            }
            changeState(stateName, data, overwriteFlag) {
                if (this._currentState && this._currentState.name == stateName) {
                    return;
                }
                let stateInfo = this._pendingStateChangeInfo;
                stateInfo.stateName = stateName;
                stateInfo.data = data;
                stateInfo.overwriteFlag = overwriteFlag || true;
                stateInfo.dirtyFlag = true;
            }
            _changeState(stateName, data, overwriteFlag) {
                overwriteFlag = overwriteFlag || true;
                //check current flag
                if (this._currentOverwriteFlag) {
                    //enable overwrite
                    if (this._pendingStateChange && this._enableDebug) {
                        console.log("ChangeState will replace state " + this._pendingStateChange + " with " + stateName);
                    }
                    this._pendingStateChange = stateName;
                    this._changeStateData = data;
                }
                else {
                    //disable overwrite
                    if (this._pendingStateChange) {
                        if (this._enableDebug) {
                            console.log("Reject state changing from " + this._pendingStateChange + " to " + stateName);
                        }
                        return;
                    }
                    this._pendingStateChange = stateName;
                    this._changeStateData = data;
                }
                //save flag
                this._currentOverwriteFlag = overwriteFlag;
            }
            hasState(stateName) {
                return this._nameDictionary[stateName] != null;
            }
            getStateByName(stateName) {
                return this._nameDictionary[stateName];
            }
            doChangeState(stateName, data) {
                //save old state
                this._previousState = this._currentState;
                var names = stateName.split("::");
                if (names.length == 1) {
                    var name = names[0];
                    if (this._currentState && this._currentState.onExit) {
                        this._currentState.onExit();
                    }
                    var newState = this._nameDictionary[stateName];
                    if (!newState) {
                        console.log("Invalid state name: " + stateName);
                        return;
                    }
                    if (this.enableDebug) {
                        console.log("Change state from: " +
                            (this._currentState ? this._currentState.name : "_empty_") +
                            " to: " + newState.name);
                    }
                    this._currentState = newState;
                    if (this._currentState.onEnter)
                        this._currentState.onEnter(data);
                }
                else if (names.length == 2) {
                    //composite state
                    var parentStateName = names[0];
                    //find parent state
                    var parentState = this.getStateByName(parentStateName);
                    if (!parentState) {
                        console.log("Invalid state name: " + parentStateName);
                        return;
                    }
                    //check if parent state is current state
                    if (parentState != this._currentState) {
                        if (this._currentState && this._currentState.onExit) {
                            //exit current state
                            this._currentState.onExit();
                            //waring
                            if (this.enableDebug) {
                                console.log("Transfer to internal state!");
                            }
                        }
                    }
                    //let state to handle it
                    var subStateName = names[1];
                    parentState.onStateChange(subStateName);
                }
                else {
                    console.log("Invalid state name: " + stateName);
                }
                if (this.onStateChanged) {
                    this.onStateChanged(this._previousState.hierachicalName, this._currentState.hierachicalName);
                }
            }
        }
        FSM.HierarchicalStateMachine = HierarchicalStateMachine;
    })(FSM = exports.FSM || (exports.FSM = {}));
});
define("plugins/gesture/Gesture", ["require", "exports", "fairygui-cc"], function (require, exports, fairygui_cc_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Gesture {
        constructor(host) {
            this.touchDragSensitivity = fairygui_cc_15.UIConfig.touchDragSensitivity;
            this._host = host;
        }
        get host() {
            return this._host;
        }
        on(type, listener, target) {
            this.host.node.on(type, listener, target);
        }
        once(type, listener, target) {
            this.host.node.once(type, listener, target);
        }
        off(type, listener, target) {
            this.host.node.off(type, listener, target);
        }
        emit(type, event) {
            this.host.node.emit(type, event);
        }
        dispose() {
            this._host = null;
        }
        getTouchIds() {
            let touchIds = [];
            touchIds = fairygui_cc_15.GRoot.inst.inputProcessor.getAllTouches();
            if (!touchIds) {
                touchIds = [];
            }
            return touchIds;
        }
    }
    exports.default = Gesture;
});
define("plugins/gesture/LongTouchGesture", ["require", "exports", "plugins/gesture/Gesture", "cc", "fairygui-cc", "common/Timer"], function (require, exports, Gesture_1, cc_16, fairygui_cc_16, Timer_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LongTouchGesture extends Gesture_1.default {
        constructor() {
            super(...arguments);
            /**
             * 长按时间(s)
             */
            this.touchTime = 1.5;
            /**
             * 长按位置最大移动距离(小于等于0不进行检查)
             */
            this.minDistance = 20;
            /**
             * 是否进行实时移动检查
             */
            this.checkEndOnMoving = true;
            this._touchPos = new cc_16.Vec2();
            this._started = false;
            this._paused = false;
            this._enabled = false;
            this._timer = 0;
            this._triggered = false;
        }
        get started() {
            return this._started;
        }
        enable(value) {
            if (value) {
                if (!this._enabled) {
                    this.on(fairygui_cc_16.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = true;
                }
            }
            else {
                this._started = false;
                if (this._enabled) {
                    this.off(fairygui_cc_16.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = false;
                }
            }
        }
        dispose() {
            super.dispose();
            this.enable(false);
        }
        checkTouchValid(evt) {
            return this.minDistance <= 0 || cc_16.Vec2.distance(evt.pos, this._touchPos) <= this.minDistance;
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
        __touchBegin(evt) {
            let touchIds = this.getTouchIds();
            if (touchIds.length >= 1) {
                this._started = true;
                this._timer = 0;
                this._touchPos.set(evt.pos);
                Timer_3.Timer.inst.clearAll(this);
                Timer_3.Timer.inst.frameLoop(1, () => {
                    this._timer += Timer_3.Timer.inst.delta;
                    if (!this._triggered && this._timer >= this.touchTime * 1000) {
                        if (this._started && !this._paused) {
                            this._paused = true;
                            if (this.checkTouchValid(evt)) {
                                this._triggered = true;
                                this.emit(LongTouchGesture.LONG_TOUCH, evt);
                            }
                            else {
                                this.onEnd(evt);
                            }
                        }
                    }
                }, this);
                if (this.checkEndOnMoving) {
                    fairygui_cc_16.GRoot.inst.on(fairygui_cc_16.Event.TOUCH_MOVE, this.__touchMove, this);
                }
                fairygui_cc_16.GRoot.inst.on(fairygui_cc_16.Event.TOUCH_END, this.__touchEnd, this);
            }
        }
        onEnd(evt) {
            Timer_3.Timer.inst.clearAll(this);
            if (this.checkEndOnMoving) {
                fairygui_cc_16.GRoot.inst.off(fairygui_cc_16.Event.TOUCH_MOVE, this.__touchMove, this);
            }
            fairygui_cc_16.GRoot.inst.off(fairygui_cc_16.Event.TOUCH_END, this.__touchEnd, this);
            this._timer = 0;
            this._triggered = false;
            this._paused = false;
            if (this._started) {
                this.emit(LongTouchGesture.LONG_TOUCH_END, evt);
            }
            this._started = false;
        }
        __touchMove(evt) {
            if (this._started) {
                if (!this.checkTouchValid(evt)) {
                    this.onEnd(evt);
                }
            }
        }
        __touchEnd(evt) {
            this.onEnd(evt);
        }
    }
    exports.default = LongTouchGesture;
    /**
     *  长按事件。
     */
    LongTouchGesture.LONG_TOUCH = "LONG_TOUCH";
    /**
     * 监听结束
     */
    LongTouchGesture.LONG_TOUCH_END = "LONG_TOUCH_END";
});
define("plugins/gesture/PinchGesture", ["require", "exports", "plugins/gesture/Gesture", "cc", "fairygui-cc"], function (require, exports, Gesture_2, cc_17, fairygui_cc_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PinchGesture extends Gesture_2.default {
        constructor() {
            super(...arguments);
            /// <summary>
            /// 总共缩放的量。
            /// </summary>
            this.scale = 0;
            /// <summary>
            /// 从上次通知后的改变量。
            /// </summary>
            this.delta = 0;
            /**
             * 中心位置
             */
            this.center = new cc_17.Vec2();
            this._startDistance = 0;
            this._lastScale = 0;
            this._started = false;
            this._touchBegan = false;
            this._enabled = false;
        }
        enable(value) {
            if (value) {
                if (!this._enabled) {
                    this.on(fairygui_cc_17.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = true;
                }
            }
            else {
                this._started = false;
                this._touchBegan = false;
                if (this._enabled) {
                    this.off(fairygui_cc_17.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = false;
                }
            }
        }
        dispose() {
            super.dispose();
            this.enable(false);
        }
        __touchBegin(evt) {
            let touchIds = this.getTouchIds();
            if (touchIds.length == 2) {
                if (!this._started && !this._touchBegan) {
                    this._touchBegan = true;
                    evt.captureTouch();
                    let pt1 = fairygui_cc_17.GRoot.inst.getTouchPosition(touchIds[0]);
                    let pt2 = fairygui_cc_17.GRoot.inst.getTouchPosition(touchIds[1]);
                    let dist = cc_17.Vec2.distance(pt1, pt2);
                    this._startDistance = Math.max(1, dist);
                    fairygui_cc_17.GRoot.inst.on(fairygui_cc_17.Event.TOUCH_MOVE, this.__touchMove, this);
                    fairygui_cc_17.GRoot.inst.on(fairygui_cc_17.Event.TOUCH_END, this.__touchEnd, this);
                    console.log("PinchGesture begin");
                }
            }
            else if (this._started) {
                this.__touchEnd(evt);
            }
        }
        __touchMove(evt) {
            let touchIds = this.getTouchIds();
            if (!this._touchBegan || touchIds.length != 2) {
                this.__touchEnd(evt);
                return;
            }
            let pt1 = fairygui_cc_17.GRoot.inst.getTouchPosition(touchIds[0]);
            let pt2 = fairygui_cc_17.GRoot.inst.getTouchPosition(touchIds[1]);
            let dist = cc_17.Vec2.distance(pt1, pt2);
            this.center.set(pt1);
            this.center.add(pt2).multiplyScalar(0.5);
            if (!this._started && Math.abs(dist - this._startDistance) > this.touchDragSensitivity) {
                this._started = true;
                this.scale = 1;
                this._lastScale = 1;
                this.emit(PinchGesture.PINCH_BEGIN, evt);
            }
            if (this._started) {
                let ss = dist / this._startDistance;
                this.delta = ss - this._lastScale;
                this._lastScale = ss;
                this.scale += this.delta;
                this.emit(PinchGesture.PINCH_ACTION, evt);
            }
        }
        __touchEnd(evt) {
            if (!this._touchBegan) {
                return;
            }
            fairygui_cc_17.GRoot.inst.off(fairygui_cc_17.Event.TOUCH_MOVE, this.__touchMove, this);
            fairygui_cc_17.GRoot.inst.off(fairygui_cc_17.Event.TOUCH_END, this.__touchEnd, this);
            this._touchBegan = false;
            if (this._started) {
                this._started = false;
                this.emit(PinchGesture.PINCH_END, evt);
                console.log("PinchGesture end");
            }
            else {
                console.log("PinchGesture cancel");
            }
        }
    }
    exports.default = PinchGesture;
    /// <summary>
    /// 当两个手指开始呈捏手势时派发该事件。
    /// </summary>
    PinchGesture.PINCH_BEGIN = "onPinchBegin";
    /// <summary>
    /// 当其中一个手指离开屏幕时派发该事件。
    /// </summary>
    PinchGesture.PINCH_END = "onPinchEnd";
    /// <summary>
    /// 当手势动作时派发该事件。
    /// </summary>
    PinchGesture.PINCH_ACTION = "onPinchAction";
});
define("plugins/gesture/SwipeGesture", ["require", "exports", "cc", "fairygui-cc", "common/Pool", "common/Timer", "plugins/gesture/Gesture"], function (require, exports, cc_18, fairygui_cc_18, Pool_2, Timer_4, Gesture_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SwipeGesture extends Gesture_3.default {
        constructor() {
            super(...arguments);
            /// <summary>
            /// 手指离开时的加速度
            /// </summary>
            this.velocity = new cc_18.Vec2(0, 0);
            /// <summary>
            /// 你可以在onBegin事件中设置这个值，那个后续将根据手指移动的距离修改这个值。如果不设置，那position初始为(0,0)，反映手指扫过的距离。
            /// </summary>
            this.position = new cc_18.Vec2(0, 0);
            /// <summary>
            /// 移动的变化值
            /// </summary>
            this.delta = new cc_18.Vec2(0, 0);
            /// <summary>
            /// The min distance to fire onAction event
            /// 派发onAction事件的最小距离。如果手指扫过的距离少于此值，onAction不会触发（但onEnd仍然会派发）
            /// </summary>
            this.actionDistance = 0;
            /// <summary>
            /// 是否把变化量强制为整数。默认true。
            /// </summary>
            this.snapping = true;
            this._enabled = false;
            this._startPoint = new cc_18.Vec2(0, 0);
            this._lastPoint = new cc_18.Vec2(0, 0);
            this._lastPoint2 = new cc_18.Vec2(0, 0);
            this._time = 0;
            this._deltaTime = 0;
            this._started = false;
            this._touchBegan = false;
            this._lastTouchId = -1;
        }
        enable(value) {
            if (value) {
                if (!this._enabled) {
                    this.on(fairygui_cc_18.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = true;
                }
            }
            else {
                this._started = false;
                this._touchBegan = false;
                if (this._enabled) {
                    this.off(fairygui_cc_18.Event.TOUCH_BEGIN, this.__touchBegin, this);
                    this._enabled = false;
                }
            }
        }
        dispose() {
            super.dispose();
            this.enable(false);
        }
        __touchBegin(evt) {
            let touchIds = this.getTouchIds();
            if (touchIds.length > 1) {
                this._touchBegan = false;
                if (this._started) {
                    this._started = false;
                    this.emit(SwipeGesture.SWIPE_END, evt);
                }
                return;
            }
            s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
            this._lastPoint.set(s_vec2);
            this._startPoint.set(s_vec2);
            this._time = Timer_4.Timer.inst.unscaleTimer;
            this._started = false;
            this.velocity.set(0, 0);
            this.position.set(0, 0);
            this._touchBegan = true;
            this._lastTouchId = evt.touchId;
            evt.captureTouch();
            fairygui_cc_18.GRoot.inst.on(fairygui_cc_18.Event.TOUCH_MOVE, this.__touchMove, this);
            fairygui_cc_18.GRoot.inst.on(fairygui_cc_18.Event.TOUCH_END, this.__touchEnd, this);
        }
        __touchMove(evt) {
            let touchIds = this.getTouchIds();
            if (!this._touchBegan || touchIds.length > 1 || evt.touchId != this._lastTouchId) {
                if (this._started) {
                    this._started = false;
                    this.emit(SwipeGesture.SWIPE_END, evt);
                }
                return;
            }
            s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
            let curPos = Pool_2.Vec2Pool.get(s_vec2);
            s_vec2.subtract(this._lastPoint);
            this.delta.set(s_vec2);
            if (this.snapping) {
                this.delta.x = Math.round(this.delta.x);
                this.delta.y = Math.round(this.delta.y);
                if (this.delta.x == 0 && this.delta.y == 0) {
                    return;
                }
            }
            let deltaTime = Timer_4.Timer.inst.unscaleDelta * 0.001;
            let elapsed = (Timer_4.Timer.inst.unscaleTimer - this._time) * 0.001 * 60 - 1;
            if (elapsed > 1) {
                this.velocity.multiplyScalar(Math.pow(0.833, elapsed));
            }
            s_vec2.set(this.delta);
            s_vec2.divide2f(deltaTime, deltaTime);
            cc_18.Vec2.lerp(this.velocity, this.velocity, s_vec2, deltaTime * 10);
            this._time = Timer_4.Timer.inst.unscaleTimer;
            this.position.add(this.delta);
            this._lastPoint2.set(this._lastPoint);
            this._lastPoint.set(curPos);
            Pool_2.Vec2Pool.put(curPos);
            if (!this._started) {
                let sensitivity = 0;
                sensitivity = this.touchDragSensitivity;
                if (Math.abs(this.delta.x) < sensitivity && Math.abs(this.delta.y) < sensitivity) {
                    return;
                }
                this._started = true;
                this.emit(SwipeGesture.SWIPE_BEGIN, evt);
            }
            this.emit(SwipeGesture.SWIPE_MOVE, evt);
        }
        __touchEnd(evt) {
            this._touchBegan = false;
            fairygui_cc_18.GRoot.inst.off(fairygui_cc_18.Event.TOUCH_MOVE, this.__touchMove, this);
            fairygui_cc_18.GRoot.inst.off(fairygui_cc_18.Event.TOUCH_END, this.__touchEnd, this);
            if (!this._started) {
                return;
            }
            this._started = false;
            this._lastTouchId = -1;
            s_vec2 = this.host.globalToLocal(evt.pos.x, evt.pos.y, s_vec2);
            let pt = Pool_2.Vec2Pool.get(s_vec2);
            this.delta.set(s_vec2.subtract(this._lastPoint2));
            if (this.snapping) {
                this.delta.x = Math.round(this.delta.x);
                this.delta.y = Math.round(this.delta.y);
            }
            let elapsed = (Timer_4.Timer.inst.unscaleTimer - this._time) * 0.001 * 60 - 1;
            if (elapsed > 1) {
                this.velocity.multiplyScalar(Math.pow(0.833, elapsed));
            }
            if (this.snapping) {
                this.velocity.x = Math.round(this.velocity.x);
                this.velocity.y = Math.round(this.velocity.y);
            }
            this.emit(SwipeGesture.SWIPE_END, evt);
            pt.subtract(this._startPoint);
            if (Math.abs(pt.x) > this.actionDistance || Math.abs(pt.y) > this.actionDistance) {
                this.emit(SwipeGesture.SWIPE_ACTION, evt);
            }
            Pool_2.Vec2Pool.put(pt);
        }
    }
    exports.default = SwipeGesture;
    /// <summary>
    /// 当手指开始扫动时派发该事件。
    /// </summary>
    SwipeGesture.SWIPE_BEGIN = "onSwipeBegin";
    /// <summary>
    /// 手指离开屏幕时派发该事件。
    /// </summary>
    SwipeGesture.SWIPE_END = "onSwipeEnd";
    /// <summary>
    /// 手指在滑动时派发该事件。
    /// </summary>
    SwipeGesture.SWIPE_MOVE = "onSwipeMove";
    /// <summary>
    /// 当手指从按下到离开经过的距离大于actionDistance时派发该事件。
    /// </summary>
    SwipeGesture.SWIPE_ACTION = "onSwipeAction";
    var s_vec2 = new cc_18.Vec2(0, 0);
});
define("plugins/reddot/serialize", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TTree = exports.TNode = void 0;
    class TNode {
    }
    exports.TNode = TNode;
    class TTree {
    }
    exports.TTree = TTree;
});
define("plugins/reddot/RedDotTree", ["require", "exports", "plugins/reddot/RedDotNode", "plugins/reddot/serialize"], function (require, exports, RedDotNode_1, serialize_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RedDotTree = void 0;
    class RedDotTree {
        constructor() {
            this._keyNodes = {};
            this._pathNodes = {};
            this._root = null;
            this._root = new RedDotNode_1.RedDotNode(this, "root", "");
            this._keyNodes[this._root.key] = this._root;
            this._pathNodes[this._root.path] = this._root;
        }
        get root() {
            return this._root;
        }
        printTree() {
            let sb = [`---${this._root.name}:${this._root.messageCount}---`];
            if (this.root.children.length > 0) {
                let nodes = this.root.children;
                this.print(sb, nodes);
            }
            console.log(sb.join());
        }
        print(sb, nodes) {
            sb.push("\r\n\r\n");
            let subnodes = [];
            let list = [];
            var maxChildCnt = 0;
            nodes.forEach(item => {
                maxChildCnt = Math.max((item === null || item === void 0 ? void 0 : item.children.length) || 0, 0);
            });
            for (let i = 0; i < nodes.length; i++) {
                let child = nodes[i];
                if (child != null) {
                    sb.push(`---${child.name}:${child.messageCount}---`);
                }
                else {
                    sb.push("----");
                }
                for (let j = 0; j < maxChildCnt; j++) {
                    if (child && j < child.children.length) {
                        list.push(child.children[j]);
                    }
                    else {
                        list.push(null);
                    }
                }
            }
            if (list.length > 0) {
                this.print(sb, list);
            }
        }
        addMessage(key, count = 1) {
            let node = this.getNode(key);
            if (node == null) {
                throw `can not find node which key equal to ${key}`;
            }
            node.addMessage(count);
        }
        setMessage(key, count = 1) {
            let node = this.getNode(key);
            if (!node) {
                throw `can not find node which key equal to ${key}`;
            }
            node.setMessage(count);
        }
        clearMessage(key) {
            let node = this.getNode(key);
            if (node == null) {
                throw `can not find node which key equal to ${key}`;
            }
            node.clearMessage();
        }
        clearAllMessage(key) {
            let node = this.getNode(key);
            if (node == null) {
                throw `can not find node which key equal to ${key}`;
            }
            node.clearAllMessage();
        }
        addNode(path, userData, index = -1) {
            if (!(path.trim())) {
                throw "path can not be empty";
            }
            path = RedDotTree.getChildPath(path, index);
            let n = this.getNodeByPath(path);
            if (n) {
                n.userData = userData;
                return n;
            }
            let strs = path.split('.');
            let baseNode = this._root;
            let subPath = [];
            for (let i = 0; i < strs.length; i++) {
                let name = strs[i];
                if (i > 0) {
                    subPath.push(".");
                }
                subPath.push(name);
                let spath = subPath.join();
                let node = this.getNodeByPath(spath);
                let last = i == strs.length - 1;
                if (!node) {
                    node = new RedDotNode_1.RedDotNode(this, name, spath, baseNode, last ? userData : null);
                    this._keyNodes[node.key] = node;
                    this._pathNodes[spath] = node;
                }
                else {
                    node.userData = userData;
                }
                baseNode = node;
            }
            return baseNode;
        }
        removeNode(node) {
            if (node) {
                if (node.parent) {
                    node.parent.removeChild(node);
                }
                delete this._keyNodes[node.key];
                delete this._pathNodes[node.path];
            }
        }
        removeNodeByPath(path, index = -1) {
            path = RedDotTree.getChildPath(path, index);
            let node = this.getNodeByPath(path);
            this.removeNode(node);
        }
        removeNodeByKey(key) {
            let node = this.getNode(key);
            this.removeNode(node);
        }
        getNode(key) {
            return this._keyNodes[key];
        }
        getNodeByPath(path, index = -1) {
            path = RedDotTree.getChildPath(path, index);
            return this._pathNodes[path];
        }
        serialize() {
            let tree = new serialize_1.TTree();
            tree.nodes = this.root.convertToTNodes();
            return JSON.stringify(tree);
        }
        deserialize(data) {
            let tree = JSON.parse(data);
            this._keyNodes = {};
            this._pathNodes = {};
            let root = RedDotNode_1.RedDotNode.createNode(this, tree.nodes, (node) => {
                this._keyNodes[node.key] = node;
                this._pathNodes[node.path] = node;
            });
        }
        static getChildPath(path, index) {
            if (index < 0) {
                return path;
            }
            return `${path}.${index}`;
        }
    }
    exports.RedDotTree = RedDotTree;
});
define("plugins/reddot/RedDotNode", ["require", "exports", "common/EventHandler", "plugins/reddot/serialize"], function (require, exports, EventHandler_3, serialize_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RedDotNode = void 0;
    class RedDotNode {
        constructor(tree, name, path, parent, userData) {
            this._selfMsgCount = 0;
            this._dirty = false;
            this._messageCount = 0;
            this._internalOp = false;
            this._level = 0;
            this._tree = tree;
            this._name = name;
            this._path = path;
            this.userData = userData;
            this._key = RedDotNode._sKey++;
            this._children = [];
            if (parent != null && parent.children.indexOf(this) < 0) {
                parent.addChild(this);
            }
        }
        get onChanged() {
            if (!this._onChanged) {
                this._onChanged = new EventHandler_3.EventHandler;
            }
            return this._onChanged;
        }
        get tree() {
            return this._tree;
        }
        get key() {
            return this._key;
        }
        get name() {
            return this._name;
        }
        get path() {
            return this._path;
        }
        get parent() {
            return this._parent;
        }
        get children() {
            return this._children;
        }
        get level() {
            return this._level;
        }
        get messageCount() {
            if (!this._dirty) {
                return this._messageCount;
            }
            this._dirty = false;
            this._messageCount = this._selfMsgCount;
            for (let i = 0; i < this._children.length; i++) {
                this._messageCount += this._children[i].messageCount;
            }
            return this._messageCount;
        }
        addChild(node) {
            if (node == null || this.children.indexOf(node) >= 0) {
                return;
            }
            node.removeFromParent();
            this._children.push(node);
            node._parent = this;
            node._level = this._level + 1;
        }
        removeFromParent() {
            if (this._parent) {
                this._parent.removeChild(this);
            }
        }
        removeChild(node) {
            let idx = this.children.indexOf(node);
            if (node == null || idx < 0) {
                return;
            }
            node._parent = null;
            node._level = 0;
            this.children.splice(idx, 1);
        }
        addMessage(count = 1) {
            this._selfMsgCount = Math.max(0, this._selfMsgCount + count);
            this.onDirty();
        }
        setMessage(count = 1) {
            this._selfMsgCount = Math.max(0, count);
            this.onDirty();
        }
        clearMessage() {
            this._selfMsgCount = 0;
            this.onDirty();
        }
        clearAllMessage() {
            this._internalOp = true;
            this.clearMessage();
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].clearAllMessage();
            }
            this._internalOp = false;
            this.onDirty();
        }
        onDirty() {
            this._dirty = true;
            if (this._internalOp) {
                return;
            }
            this.onChanged.fire(this);
            if (this._parent) {
                this._parent.onDirty();
            }
        }
        toTNode() {
            var _a, _b;
            let tnode = new serialize_2.TNode;
            tnode.key = this._key;
            tnode.name = this._name;
            tnode.parent = (_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : -1;
            tnode.selfCount = this._selfMsgCount;
            tnode.totalCount = this._messageCount;
            return tnode;
        }
        fromTNode(node) {
            this._key = node.key;
            this._name = node.name;
            this._path = node.name;
            this._selfMsgCount = node.selfCount;
            this._messageCount = node.totalCount;
            if (node.parent != -1) {
                let p = this.tree.getNode(node.parent);
            }
        }
        tranverse(nodes) {
            nodes.push(this);
            for (let i = 0; i < this.children.length; i++) {
                let node = this.children[i];
                node.tranverse(nodes);
            }
        }
        convertToTNodes() {
            let nodes = [];
            this.tranverse(nodes);
            let tnodes = nodes.map(i => i.toTNode());
            tnodes.sort((a, b) => {
                return a.key - b.key;
            });
            return tnodes;
        }
        static createNode(tree, nodes, onAddNode) {
            if (nodes == null || nodes.length == 0)
                return null;
            nodes.sort((a, b) => {
                return a.key - b.key;
            });
            let maxKey = -1;
            let root = new RedDotNode(tree);
            root.fromTNode(nodes[0]);
            for (let i = 0; i < nodes.length; i++) {
                let node = new RedDotNode(tree);
                node.fromTNode(node[i]);
                maxKey = Math.max(node.key, maxKey);
                onAddNode || onAddNode(node);
            }
            this._sKey = Math.max(this._sKey, maxKey);
            return root;
        }
    }
    exports.RedDotNode = RedDotNode;
    RedDotNode._sKey = 1;
});
define("plugins/reddot/RedDotManager", ["require", "exports", "cc", "fairygui-cc", "plugins/reddot/RedDotTree", "common/Timer"], function (require, exports, cc_19, fairygui_cc_19, RedDotTree_1, Timer_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RedDotManager = exports.RedDotItemInfo = void 0;
    class RedDotItemInfo {
        constructor() {
            /**
             * 控制器名称，如果为空，选择第一个
             */
            this.controllerName = null;
            /**
             * 控制器选择
             */
            this.selectedIndex = -1;
            // 相对位置(0-1)
            this.pos = cc_19.v2();
        }
    }
    exports.RedDotItemInfo = RedDotItemInfo;
    const compPool = new Map();
    class RedDotManager {
        constructor() {
            this._tree = new RedDotTree_1.RedDotTree;
        }
        static get inst() {
            if (!this._inst) {
                this._inst = new RedDotManager;
            }
            return this._inst;
        }
        get tree() {
            return this._tree;
        }
        initial(defaultResUrl, onRedDotShown) {
            this._defaultRedDotResUrl = defaultResUrl;
            this._onReddotShown = onRedDotShown;
            if (!onRedDotShown) {
                this._onReddotShown = this._internalShowReddot;
            }
        }
        create(path, childNum = 0) {
            let node = this._tree.addNode(path);
            for (let i = 0; i < childNum; i++) {
                const childPath = RedDotTree_1.RedDotTree.getChildPath(path, i);
                this.create(childPath);
            }
            return node;
        }
        regist(path, config) {
            var _a, _b;
            let index = (_a = config.index) !== null && _a !== void 0 ? _a : -1;
            let info = null;
            let node = this._tree.getNodeByPath(path, index);
            if (node) {
                info = node.userData;
            }
            if (!info) {
                info = new RedDotItemInfo;
            }
            info.holder = config.holder;
            info.pos.set(config.pos);
            info.controllerName = config.controllerName;
            info.selectedIndex = (_b = config.ctrlIdx) !== null && _b !== void 0 ? _b : -1;
            info.onRender = config.onRender;
            info.realDocker = config.realDocker;
            node = this.bind(path, info, index);
            this._regist(path);
            return node;
        }
        bind(path, info, index = -1) {
            if (info.node) {
                this.unRegist(info.node, false);
            }
            let node = this._tree.getNodeByPath(path, index);
            node.userData = info;
            info.node = node;
            return node;
        }
        _regist(path) {
            let node = this._tree.getNodeByPath(path);
            node.onChanged.add(this._internalHandleNodeChanged, this);
            this.refresh(path);
            return node;
        }
        refresh(path) {
            let node = this._tree.getNodeByPath(path);
            if (node) {
                this._internalHandleNodeChanged(node);
            }
        }
        unRegist(node, destory = false) {
            var _a;
            if (node) {
                let data = node.userData;
                if (data && data.reddot) {
                    if (destory) {
                        data.reddot.dispose();
                        data.reddot = null;
                    }
                    else {
                        let url = (_a = data.reddotResUrl) !== null && _a !== void 0 ? _a : this._defaultRedDotResUrl;
                        let pool = compPool.get(url);
                        if (!pool) {
                            pool = [];
                            compPool.set(url, pool);
                        }
                        pool.push(data.reddot);
                        data.reddot.removeFromParent();
                        data.reddot = null;
                    }
                }
                node.onChanged.remove(this._internalHandleNodeChanged, this);
                if (node.children) {
                    for (let child of node.children) {
                        this.unRegist(child, destory);
                    }
                }
            }
        }
        showRedDot(node) {
            if (!node) {
                return;
            }
            if (!node.userData) {
                return;
            }
            let info = node.userData;
            let reddot = info.reddot;
            if (reddot) {
                reddot.visible = true;
            }
        }
        hideRedDot(node) {
            if (!node.userData) {
                return;
            }
            let info = node.userData;
            //@ts-ignore
            let reddot = info.reddot;
            if (reddot) {
                reddot.visible = false;
            }
        }
        refreshRedDot(path) {
            let node = this._tree.getNodeByPath(path);
            if (node) {
                let info = node.userData;
                let reddot = info.reddot;
                if (reddot) {
                    this.setPosition(reddot, info, false);
                }
            }
        }
        setPosition(reddot, info, add) {
            let x = info.holder.width * info.pos.x;
            let y = info.holder.height * info.pos.y;
            if (info.realDocker !== null) {
                if (add) {
                    info.realDocker.addChild(reddot);
                }
                if (info.holder.pivotAsAnchor) {
                    x -= info.holder.width * info.holder.pivotX;
                    y -= info.holder.height * info.holder.pivotY;
                }
                Timer_5.Timer.inst.callLater(() => {
                    let pos = info.holder.localToGlobal(x, y, new cc_19.Vec2());
                    pos = info.realDocker.globalToLocal(pos.x, pos.y, pos);
                    reddot.setPosition(pos.x, pos.y);
                }, this);
            }
            else {
                if (add) {
                    info.holder.addChild(reddot);
                }
                reddot.setPosition(x, y);
            }
        }
        _internalShowReddot(node, info) {
            if (info.onRender) {
                info.onRender(node, info);
            }
        }
        _internalHandleNodeChanged(node) {
            var _a;
            if (!node.userData) {
                return;
            }
            let info = node.userData;
            let reddot = info.reddot;
            if (node.messageCount > 0) {
                if (reddot == null) {
                    const url = (_a = info.reddotResUrl) !== null && _a !== void 0 ? _a : this._defaultRedDotResUrl;
                    let reddotPool = compPool.get(url);
                    while ((reddot == null || reddot.isDisposed) && reddotPool && reddotPool.length > 0) {
                        reddot = reddotPool.pop();
                    }
                    if (!reddot) {
                        reddot = fairygui_cc_19.UIPackage.createObjectFromURL(url);
                    }
                    if (reddot) {
                        info.holder.addChild(reddot);
                        this.setPosition(reddot, info, true);
                        info.reddot = reddot;
                    }
                }
                if (reddot) {
                    reddot.visible = true;
                    reddot.text = node.messageCount.toString();
                    this._onReddotShown(node, info);
                }
            }
            else if (reddot) {
                reddot.visible = false;
            }
        }
    }
    exports.RedDotManager = RedDotManager;
});
define("view/ViewObject", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewObject {
        get component() {
            return this.go.asCom;
        }
        get container() {
            var _a;
            return (_a = this.warpper) !== null && _a !== void 0 ? _a : this.go.asCom;
        }
    }
    exports.default = ViewObject;
});
define("view/interface/IActivity", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/interface/IWindow", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("view/ViewHelper", ["require", "exports", "fairygui-cc", "view/Skin", "view/ViewMap", "cc"], function (require, exports, fairygui_cc_20, Skin_3, ViewMap_2, cc_20) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewHelper = exports.ELayer = void 0;
    var ELayer;
    (function (ELayer) {
        ELayer[ELayer["Background"] = 0] = "Background";
        ELayer[ELayer["UI"] = 1] = "UI";
        ELayer[ELayer["Overlay"] = 2] = "Overlay";
    })(ELayer = exports.ELayer || (exports.ELayer = {}));
    class ViewHelper {
        constructor() {
            this._views = {};
            this._windows = {};
            this._packages = {};
            this._initialed = false;
            this._layers = new Array();
            this._scaleX = 1;
            this._scaleY = 1;
        }
        get scaleX() {
            return this._scaleX;
        }
        get scaleY() {
            return this._scaleY;
        }
        get scale() {
            return Math.min(this._scaleX, this._scaleY);
        }
        static get instance() {
            if (this._instance == null) {
                this._instance = new ViewHelper();
            }
            return this._instance;
        }
        get packages() {
            return this._packages;
        }
        initialize(opts = null) {
            if (this._initialed) {
                return;
            }
            this._initialed = true;
            let dsize = cc_20.view.getDesignResolutionSize();
            let screenRatio = screen.width / screen.height;
            let designRatio = dsize.x / dsize.y;
            if (screenRatio > designRatio) {
                //高优先
                let swidth = screen.height * designRatio;
                this._scaleY = 1;
                this._scaleX = swidth / screen.width;
            }
            else {
                //宽优先
                let sheight = screen.width / designRatio;
                this._scaleX = 1;
                this._scaleY = sheight / screen.height;
            }
            this.addLayer();
            this.addLayer();
            this.addLayer();
        }
        addLayer() {
            let comp = new fairygui_cc_20.GComponent();
            comp.setSize(fairygui_cc_20.GRoot.inst.width, fairygui_cc_20.GRoot.inst.height);
            // GRoot.inst.on(Event.SIZE_CHANGED, ()=>{
            //     comp.setSize(GRoot.inst.width, GRoot.inst.height);
            // }, this);        
            fairygui_cc_20.GRoot.inst.addChild(comp);
            comp.addRelation(fairygui_cc_20.GRoot.inst, fairygui_cc_20.RelationType.Size);
            this._layers.push(comp);
        }
        getLayer(layer) {
            return this._layers[layer];
        }
        createWindow(mediator) {
            if (!mediator) {
                console.error("class type cannot be null!");
                return null;
            }
            let view = new mediator();
            let skin = view.skin;
            if (!this._packages[skin.path]) {
                let pkg = fairygui_cc_20.UIPackage.addPackage(skin.path);
                this._packages[skin.path] = pkg;
            }
            view.initial();
            if (!view.component) {
                return null;
            }
            return view;
        }
        createView(skin, mediator, layer = ELayer.UI) {
            if (!mediator) {
                console.error("class type cannot be null!");
                return null;
            }
            let view = new mediator();
            skin = view.skin;
            if (!this._packages[skin.path]) {
                let pkg = fairygui_cc_20.UIPackage.addPackage(skin.path);
                this._packages[skin.path] = pkg;
            }
            view.initial();
            if (!view.viewObject.container) {
                return null;
            }
            let container = this.getLayer(layer);
            let warpper = view.viewObject.container;
            if (warpper != container) {
                container.addChild(warpper);
            }
            warpper.setSize(container.width, container.height);
            warpper.setScale(1, 1);
            warpper.addRelation(container, fairygui_cc_20.RelationType.Size);
            view.create();
            return view;
        }
        getSingleWindowByName(name) {
            let skin = ViewMap_2.default.instance.getSkinByName(name);
            return this.getSingleWindow(skin);
        }
        getSingleWindow(skin) {
            if (!skin) {
                console.error("can not get undefined skin!");
                return null;
            }
            let key = skin.getKey();
            let view = this._windows[key];
            if (!view) {
                // Create the logic code for the interface and bind it to the logic code
                let viewClass = ViewMap_2.default.instance.get(skin);
                view = this.createWindow(viewClass);
                if (view) {
                    // Register
                    this._windows[key] = view;
                }
            }
            return view;
        }
        getSingleWindowByType(viewClass) {
            if (!viewClass) {
                console.error("can not get undefined viewType!");
                return null;
            }
            let skin = Skin_3.default.getSkin(viewClass);
            let key = skin.getKey();
            let view = this._windows[key];
            if (!view) {
                // Create the logic code for the interface and bind it to the logic code
                view = this.createWindow(viewClass);
                if (view) {
                    // Register
                    this._windows[key] = view;
                }
            }
            return view;
        }
        getSingleView(skin, layer = ELayer.UI) {
            if (!skin) {
                console.error("can not get undefined viewType!");
                return null;
            }
            let key = skin.getKey();
            let view = this._views[key];
            if (!view) {
                // Create the logic code for the interface and bind it to the logic code
                let viewClass = ViewMap_2.default.instance.get(skin);
                view = this.createView(skin, viewClass, layer);
                if (view) {
                    // Register
                    this._views[key] = view;
                }
            }
            return view;
        }
        getSingleViewByType(viewClass, layer = ELayer.UI) {
            if (!viewClass) {
                console.error("can not get undefined viewType!");
                return null;
            }
            let tempSkin = Skin_3.default.getSkin(viewClass);
            if (!tempSkin) {
                console.error("can not get viewType's binding skin!");
                return null;
            }
            let tempKey = tempSkin.getKey();
            let view = this._views[tempKey];
            if (!view) {
                // Create the logic code for the interface and bind it to the logic code
                view = this.createView(null, viewClass, layer);
                if (view) {
                    // Register
                    let skin = view.skin;
                    let key = skin.getKey();
                    this._views[key] = view;
                }
            }
            return view;
        }
        destoryWindow(skin) {
            let key = skin.getKey();
            let view = this._windows[key];
            if (view) {
                view.dispose();
                delete this._windows[key];
            }
        }
        destroyView(skin, layer = ELayer.UI) {
            let key = skin.getKey();
            let view = this._views[key];
            if (view) {
                // Remove from fgui
                let ui = this.getLayer(layer);
                ui.removeChild(view.viewObject.container);
                try {
                    view.dispose();
                }
                catch (e) {
                    console.error("view " + skin.getKey() + " onDestroy() error:" + e);
                }
                // Remove registration
                delete this._views[key];
            }
        }
    }
    exports.ViewHelper = ViewHelper;
    ViewHelper._instance = null;
});
define("view/Window", ["require", "exports", "fairygui-cc", "view/Skin", "view/SkinHelper", "view/Container", "cc", "view/UIManager", "common/UtilsHelper", "common/Timer", "fairygui-cc", "cc/env", "plugins/capture/CaptureHelper", "fairygui-cc", "common/SoundManager"], function (require, exports, fairygui_cc_21, Skin_4, SkinHelper_2, Container_3, cc_21, UIManager_1, UtilsHelper_5, Timer_6, fairygui_cc_22, env_8, CaptureHelper_1, fairygui_cc_23, SoundManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Window extends Container_3.default {
        constructor() {
            super(...arguments);
            this._special = false;
            this._index = 0;
            this.canAutoDestory = true;
            this.modal = true;
            this.topMost = false;
            this.topPriority = 0;
            this.enableClose = true;
            this.hideOnOverlay = false;
            this.canShowBanner = false;
            /**
             * 为true时将会等待动画完成调用onShow,[onHide强制等待]
             */
            this.waitAnimation = false;
            this.safeTopMargin = 0;
            this.injectInfos = {};
            this._updating = false;
            this._secondTicker = 0;
            this._enableUpdate = false;
            this._exitCode = 0;
            this._isShowing = false;
            this._modalLayerColor = new cc_21.Color;
            /**
             * 此模式下，窗口背景将会被截图，用于提高性能(ios下有问题，先关闭)
             */
            this.preformanceMode = false;
            /**
             * 标记为全屏模式，此模式下，表明activity完全不可见，activity将会被隐藏
             */
            this.fullMode = false;
            this._preformanceBG = null;
            this.contentAsFrame = false;
            this.enableDefaultAudio = true;
            this.hideAudioSource = 0;
            this.shownAudioSource = 0;
            this._needBeWait = false;
        }
        get needBeWait() {
            return this._needBeWait;
        }
        get component() {
            return this._component;
        }
        get visible() {
            return this.window.visible;
        }
        get exitCode() {
            return this._exitCode;
        }
        get isShowing() {
            return this._isShowing;
        }
        get modalLayerColor() {
            return this._modalLayerColor;
        }
        get skin() {
            if (!this._skin) {
                this._skin = Skin_4.default.getSkin(this.constructor);
            }
            return this._skin;
        }
        get enableUpdate() {
            return this._enableUpdate;
        }
        set enableUpdate(val) {
            if (this._enableUpdate != val) {
                this._enableUpdate = val;
                //@ts-ignore
                if (this._isShown) {
                    this.setUpdateEnable(val);
                }
            }
        }
        get bringToFontOnClick() {
            var _a;
            return (_a = this.window) === null || _a === void 0 ? void 0 : _a.bringToFontOnClick;
        }
        set bringToFontOnClick(val) {
            if (this.window) {
                this.window.bringToFontOnClick = val;
            }
        }
        inject(go, data) {
            //@ts-ignore
            this.beginCreate();
            UIManager_1.UIManager.instance.onContainerCreate(this);
            this._component = go;
            this.onInitial();
            var content = go;
            if (this.contentAsFrame) {
                content = new fairygui_cc_21.GComponent();
                content.setPosition(go.x, go.y);
                content.setSize(go.width, go.height);
                content.setPivot(go.pivotX, go.pivotY);
                content.addChild(go);
                go.setPosition(0, 0);
                go.name = "frame";
            }
            this.window = new fairygui_cc_21.Window();
            this.window.data = this;
            this.window.contentPane = content;
            SkinHelper_2.default.InjectView(go, this);
            if (this.fullMode) {
                this.window.makeFullScreen();
            }
            this.window.center();
            this.bringToFontOnClick = false;
            this.onAfterInitial();
            let ret = this.onCreate();
            if (ret instanceof Promise) {
                (async () => {
                    await ret;
                    //@ts-ignore
                    this.endCreate();
                });
            }
            else {
                //@ts-ignore
                this.endCreate();
            }
        }
        async enterPreformance() {
            if (!env_8.NATIVE && this.preformanceMode && !this.fullMode) {
                // 截图
                let bg = await CaptureHelper_1.CaptureHelper.captureFullScreen();
                let sf = new cc_21.SpriteFrame();
                sf.texture = bg;
                bg.addRef();
                let image = new fairygui_cc_22.GLoader();
                image.texture = sf;
                sf.addRef();
                image.setSize(fairygui_cc_21.GRoot.inst.width, fairygui_cc_21.GRoot.inst.height);
                image.fill = fairygui_cc_23.LoaderFillType.ScaleFree;
                fairygui_cc_21.GRoot.inst.addChildAt(image, 0);
                this._preformanceBG = image;
            }
            if (this.fullMode && this.preformanceMode) {
                let curAcivity = UIManager_1.UIManager.instance.peekOrNull();
                if (curAcivity) {
                    curAcivity.pause();
                }
            }
        }
        async exitPreformance() {
            if (this._preformanceBG) {
                this._preformanceBG.texture.texture.destroy();
                this._preformanceBG.texture.destroy();
                this._preformanceBG.dispose();
                this._preformanceBG = null;
            }
            if (this.fullMode && this.preformanceMode) {
                let curAcivity = UIManager_1.UIManager.instance.peekOrNull();
                if (curAcivity) {
                    curAcivity.resume(curAcivity.data);
                }
            }
        }
        initial() {
            fairygui_cc_21.UIPackage.addPackage(this.skin.path);
            let go = fairygui_cc_21.UIPackage.createObject(this.skin.packageName, this.skin.componentName);
            this.inject(go.asCom);
        }
        setModalLayerColor(color) {
            fairygui_cc_21.GRoot.inst.modalLayer.color.set(color);
            fairygui_cc_21.GRoot.inst.modalLayer.drawRect(0, cc_21.Color.TRANSPARENT, color);
        }
        overlayBy(otherWindow) {
            if (this.hideOnOverlay) {
                this.component.visible = false;
            }
            this.onOverlayBy(otherWindow);
        }
        bringToFront() {
            if (this.modal) {
                this.setModalLayerColor(this._modalLayerColor);
            }
            this.onBringToFront();
            this.component.visible = true;
        }
        show(data) {
            //@ts-ignore
            this._isShown = false;
            this._exitCode = 0;
            this.component.visible = true;
            this.data = data;
            this.window.visible = true;
            this.window.modal = this.modal;
            this._isShowing = true;
            let ret = this.onBeforeShow(data);
            if (ret instanceof Promise) {
                (async () => {
                    await ret;
                    await this.internalShow(data, false);
                })();
            }
            else {
                this.internalShow(data, false);
            }
        }
        showImmediately() {
            this.window.show();
        }
        async internalShow(data, immediately) {
            var _a;
            this.enterPreformance();
            (_a = this.window) === null || _a === void 0 ? void 0 : _a.show();
            if (immediately) {
                this.showImmediately();
            }
            else {
                let ret = this.playShowAnimation();
                if (ret instanceof Promise) {
                    if (this.waitAnimation) {
                        await ret;
                    }
                    else {
                        (async () => {
                            await ret;
                            this._isShowing = false;
                        })();
                    }
                }
                this._isShowing = false;
            }
            this.children.forEach(view => {
                view.show(data, false);
            });
            this.safeAlign();
            let ret = this.onShown(data);
            if (ret instanceof Promise) {
                await ret;
            }
            //@ts-ignore
            this.endShown();
            this.registTap();
            this.setUpdateEnable(this.enableUpdate);
            const audioSource = this.shownAudioSource || (this.enableDefaultAudio ? Window.defaultShowAudioSource : 0);
            if (audioSource) {
                SoundManager_1.SoundManager.instance.playSound(audioSource);
            }
        }
        safeAlign() {
            if (this.safeTopMargin > 0) {
                let offsetY = this.component.height * this.component.pivotY;
                let top = this.component.y - offsetY;
                if (top < this.safeTopMargin) {
                    this.component.y = this.safeTopMargin + offsetY;
                }
            }
        }
        getModualLayer() {
            return this.modal ? fairygui_cc_21.GRoot.inst.modalLayer : UIManager_1.UIManager.instance.peekOrNull().component;
        }
        async registTap() {
            await UtilsHelper_5.UtilsHelper.oneframe();
            if (this.enableTapClose) {
                let comp = this.getModualLayer();
                comp.onClick(this.modualClick, this);
            }
        }
        clearModualClick() {
            let comp = this.getModualLayer();
            comp.offClick(this.modualClick, this);
        }
        async modualClick(event) {
            let topWindow = UIManager_1.UIManager.instance.getTopModalWindow();
            // 等待一帧，防止点击多窗口同时关闭
            await UtilsHelper_5.UtilsHelper.oneframe();
            if (topWindow == this) {
                UIManager_1.UIManager.instance.hideCurrentWindow(false, null, true);
                this.clearModualClick();
            }
        }
        async playShowAnimation() {
        }
        async playHideAnimation() {
        }
        async internalHide(hideImmediately, code) {
            this._exitCode = code || 0;
            this._component.touchable = false;
            this.setUpdateEnable(false);
            this.clearModualClick();
            this.clearEventCenter();
            this.exitPreformance();
            this.onBeforeHide();
            this.emit(Window.EVENT_WINDOW_BEFORE_HIDE, this);
            if (hideImmediately) {
                this.hideImmediately();
            }
            else {
                await this.playHideAnimation();
            }
            this.children.forEach(view => {
                view.hide(false);
            });
            this.onHide();
            this.window.visible = false;
            this._component.touchable = true;
            this.emit(Window.EVENT_WINDOW_HIDE, this);
            const audioSource = this.hideAudioSource || (this.enableDefaultAudio ? Window.defaultHideAudioSource : 0);
            if (audioSource) {
                SoundManager_1.SoundManager.instance.playSound(audioSource);
            }
        }
        hideImmediately() {
            if (this.enableClose) {
                this.window.hide();
            }
        }
        hide(code) {
            this.internalHide(true, code);
        }
        dispose() {
            if (this._destoried) {
                return;
            }
            this._destoried = true;
            this.clearEventCenter();
            this.children.forEach(view => {
                view.dispose();
            });
            if (this.window) {
                this.window.dispose();
            }
            this.onDispose();
        }
        registInfos() {
        }
        makeFullScreen() {
            this.window.makeFullScreen();
            let y = (fairygui_cc_21.GRoot.inst.height - this.window.height) / 2;
            this.window.y = y;
        }
        setUpdateEnable(val) {
            if (this._updating == val) {
                return;
            }
            this._updating = val;
            if (val) {
                Timer_6.Timer.inst.frameLoop(1, this.update, this);
            }
            else {
                Timer_6.Timer.inst.clear(this.update, this);
            }
        }
        update() {
            let dt = cc_21.game.deltaTime * 1000;
            this._secondTicker += dt;
            let seconds = false;
            if (this._secondTicker >= 1000) {
                seconds = true;
                this._secondTicker = 0;
            }
            this.onUpdate(dt / 1000, seconds);
        }
        //////////////////////////////////////////////////////////////////////////
        onInitial() {
        }
        onAfterInitial() {
        }
        onCreate(data) {
        }
        onBeforeShow(data) {
        }
        onShown(data) {
        }
        onBeforeHide() {
        }
        onHide() {
        }
        onBringToFront() {
        }
        onOverlayBy(otherWindow) {
        }
        onDispose() {
        }
        onUpdate(dt, secondTick) {
        }
    }
    exports.default = Window;
    Window.EVENT_WINDOW_BEFORE_HIDE = "onwindowbeforehide";
    Window.EVENT_WINDOW_HIDE = "onwindowhide";
    Window.defaultShowAudioSource = 0;
    Window.defaultHideAudioSource = 0;
});
define("view/WindowPriorityMap", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowPriorityMap = void 0;
    const defaultPriority = {
        needBeWait: false,
        waitPriority: 0,
        group: 0,
        groupLevel: 0,
    };
    /**
     * WindowPriorityMap.add(ViewNames.PanelLevelUP, {
     *      waitPriority: 0,
     *  })
     * .add(ViewNames.PanelSeasonBP, {
     *      waitPriority: WindowPriority.Activity,
     *      group: WindowGroup.SeasonBP,
     *  }).add(ViewNames.PanelSeasonBPResult, {
     *      waitPriority: WindowPriority.ActivityEnd,
     *      group: WindowGroup.SeasonBP,
     *      groupLevel: 1
     *  })
     */
    class WindowPriorityMap {
        static add(key, info) {
            info.groupLevel = info.groupLevel || 0;
            info.group = info.group || 0;
            info.waitPriority = info.waitPriority || 0;
            info.needBeWait = info.needBeWait != null ? info.needBeWait : true;
            this._priorityMap[key] = info;
            return this;
        }
        static set(key, info) {
            this.add(key, info);
            return this;
        }
        static get(key) {
            return this._priorityMap[key] || defaultPriority;
        }
        static getBySkin(skin) {
            return this.get(skin.componentName);
        }
        static remove(key) {
            delete this._priorityMap[key];
        }
        static clear() {
            this._priorityMap = {};
        }
    }
    exports.WindowPriorityMap = WindowPriorityMap;
    WindowPriorityMap._priorityMap = {};
});
define("view/UIManager", ["require", "exports", "view/ViewHelper", "view/Skin", "fairygui-cc", "cc", "view/Window", "lru-cache", "common/Timer", "common/UtilsHelper", "view/ViewMap", "fairygui-cc", "view/utils/FGUIExt", "view/WindowPriorityMap", "fairygui-cc", "cc/env"], function (require, exports, ViewHelper_1, Skin_5, fairygui_cc_24, cc_22, Window_1, lru_cache_1, Timer_7, UtilsHelper_6, ViewMap_3, fairygui_cc_25, FGUIExt_3, WindowPriorityMap_1, fairygui_cc_26, env_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UIManager = void 0;
    fairygui_cc_24.Window.prototype["onTouchBegin_1"] = function (evt) {
        let that = this;
        if (that.isShowing && that.bringToFontOnClick) {
            if (fairygui_cc_24.GRoot.inst._children[fairygui_cc_24.GRoot.inst._children.length - 1] != this) {
                that.bringToFront();
                if (that.data instanceof Window_1.default) {
                    UIManager.sortWindow(that.data);
                }
            }
        }
    };
    class UIManager {
        constructor() {
            this._views = [];
            this._windows = [];
            this._beginCreateTime = -1;
            this._watingModualOpend = false;
            this.onResourcesNotReady = null;
            this._waitWindows = [];
            this._autoShowing = 0;
            this.maxWindowKeep = 7;
            /**
             * 打开时间超过此时间后，打开等待界面(s)
             */
            this.waitingModualTime = 1;
            // 能否显示等待中的窗口
            this.canShowWaitingWindowNow = true;
        }
        get camera() {
            return this._camera;
        }
        static get instance() {
            if (this._instance == null) {
                this._instance = new UIManager();
            }
            return this._instance;
        }
        initialize(opts = null) {
            this.initializeCanvasNode();
            this.initializeViewHelper(opts);
            this.initializeViews();
            this.initializeLRU();
        }
        initializeCanvasNode() {
            var cnode = cc_22.director.getScene().getChildByName('Canvas');
            cc_22.game.addPersistRootNode(cnode);
            this._canvasNode = cnode;
            this._camera = this._canvasNode.getComponent(cc_22.Canvas).cameraComponent;
            fairygui_cc_24.GRoot.create();
        }
        initializeViewHelper(opts) {
            ViewHelper_1.ViewHelper.instance.initialize(opts);
        }
        initializeViews() {
            this._views[0] = [];
            this._views[1] = [];
            this._views[2] = [];
        }
        initializeLRU() {
            this._lru = new lru_cache_1.default({
                max: this.maxWindowKeep,
                dispose: (value, key) => {
                    if (!value.visible) {
                        ViewHelper_1.ViewHelper.instance.destoryWindow(value.skin);
                    }
                }
            });
        }
        topWindow(ignoreTopMost) {
            if (this._windows.length == 0) {
                return null;
            }
            if (ignoreTopMost) {
                return this.findTopNonTopMostWindow();
            }
            return this.findTopWindow();
        }
        findTopNonTopMostWindow() {
            for (let i = this._windows.length - 1; i >= 0; i--) {
                let w = this._windows[i];
                if (!w.topMost) {
                    return w;
                }
            }
            return null;
        }
        findTopWindow() {
            return this._windows[this._windows.length - 1];
        }
        allShowWindows() {
            return this._windows;
        }
        /**
         * 检查是否有窗口显示
         * @returns
         */
        hasWindow() {
            return this.allShowWindows().some(wnd => wnd._special);
        }
        preloadWindow(viewType) {
            return ViewHelper_1.ViewHelper.instance.getSingleWindowByType(viewType);
        }
        isShowingByType(viewType) {
            return this._windows.some(i => i instanceof viewType);
        }
        isShowing(window) {
            if (typeof window == "string") {
                return this.isShowingByType(ViewMap_3.default.instance.getByName(window));
            }
            else if (window instanceof Function) {
                return this.isShowingByType(window);
            }
            return this._windows.includes(window);
        }
        hidePopup(view) {
            const gobj = view instanceof fairygui_cc_24.GComponent ? view : view.component;
            fairygui_cc_24.GRoot.inst.hidePopup(gobj);
        }
        /*
            Description:
            Show a popup view.
    
            Parameters:
            - view: The view to be displayed.
            - pos: The relative position of the view.
            - anchorName: The name of the anchor.
            - target: The target component to display.
            - dir: The direction of the popup.
        */
        showPopup(view, pos = null, anchorName = null, target = null, dir = fairygui_cc_24.PopupDirection.Auto, horAutoAdapt = true) {
            let gobj = view instanceof fairygui_cc_24.GComponent ? view : view.component;
            let targetPos = pos || new cc_22.Vec2(0, 0);
            if (target) {
                target.localToGlobal(targetPos.x, targetPos.y, targetPos);
                fairygui_cc_24.GRoot.inst.globalToLocal(targetPos.x, targetPos.y, targetPos);
            }
            let anchor = anchorName ? gobj.getChild(anchorName) : null;
            let rawPos = anchor ? anchor.data || new cc_22.Vec4(anchor.x, anchor.y, anchor.x / gobj.width, anchor.y / gobj.height) : new cc_22.Vec4(0, 0, gobj.pivotX, gobj.pivotY);
            let offsetX = 0;
            if (horAutoAdapt) {
                let realWidth = gobj.width * gobj.scaleX;
                let lx = targetPos.x - realWidth * rawPos.z;
                let rx = targetPos.x + realWidth * (1 - rawPos.z) - fairygui_cc_24.GRoot.inst.width;
                offsetX = rx > 0 ? rx / gobj.scaleX : lx < 0 ? lx / gobj.scaleX : 0;
            }
            if (anchor) {
                anchor.setPosition(rawPos.x + offsetX, rawPos.y);
                gobj.setPivot(anchor.x / gobj.width, anchor.y / gobj.height, true);
                offsetX = 0;
            }
            fairygui_cc_24.GRoot.inst.showPopup(gobj, target, dir);
            gobj.setPosition(targetPos.x - offsetX, targetPos.y);
            gobj.node.on(cc_22.Node.EventType.ACTIVE_IN_HIERARCHY_CHANGED, () => {
                if (!gobj.node.activeInHierarchy) {
                    let view = gobj["_docker_"];
                    if (view) {
                        view.hide();
                    }
                }
            });
        }
        onHideWindow(wnd) {
            if (!wnd) {
                return;
            }
            let idx = this._windows.indexOf(wnd);
            if (idx >= 0) {
                this._windows.splice(idx, 1);
                // 重置模块层颜色
                let topModalWnd = this.topWindow(true);
                if (topModalWnd) {
                    topModalWnd.bringToFront();
                }
                if (wnd.canAutoDestory) {
                    this._lru.set(wnd.skin.getKey(), wnd);
                }
                // 防止有的窗口在onHideWindow中调用了showWindow，导致窗口列表被修改
                this._autoShowing = 0.5;
            }
        }
        /**
         * 延迟弹出等待中的窗口
         * @param delay
         */
        delayPopWaitWindow(delay) {
            this._autoShowing = delay || 0.5;
        }
        update(dt) {
            this.checkWaitWindow(dt);
        }
        /**
         * 检查是否可以显示等待中的窗口
         * @param dt
         * @returns
         */
        checkWaitWindow(dt) {
            if (!this.canShowWaitingWindowNow) {
                return;
            }
            this.updateAutoShowing(dt);
            if (this._waitWindows.length > 0) {
                let group = this._waitWindows[0];
                if (group.length > 0) {
                    let waitWnd = group[0];
                    if (this.canShowWaitWindow(waitWnd)) {
                        this._autoShowing = 0.2;
                        group.shift();
                        this.showWindowX(waitWnd);
                    }
                }
                if (group.length == 0) {
                    this._waitWindows.shift();
                }
            }
        }
        updateAutoShowing(dt) {
            if (this._autoShowing > 0) {
                this._autoShowing -= dt;
                this._autoShowing = Math.max(0, this._autoShowing);
            }
        }
        canShowWaitWindow(waitWnd) {
            let backWindow = this._getWaitWindow();
            if (backWindow) {
                let backInfo = WindowPriorityMap_1.WindowPriorityMap.getBySkin(backWindow.skin);
                if (backInfo.group > 0 && backInfo.group == waitWnd.info.group && backInfo.groupLevel < waitWnd.info.groupLevel) {
                    // 同一个组，且当前窗口优先级比正在显示的窗口高，则直接显示
                    return true;
                }
            }
            else {
                return true;
            }
            return false;
        }
        _getWaitWindow() {
            return this._windows.find(wnd => wnd.needBeWait) || null;
        }
        _hasWindowInWaitQueue(viewType) {
            if (this._windows.some(window => window instanceof viewType)) {
                return true;
            }
            if (this._waitWindows.some(group => group.some(window => window.viewType == viewType))) {
                return true;
            }
            return false;
        }
        static sortWindow(wnd) {
            let that = UIManager.instance;
            if (that._windows.length > 0) {
                let startIdx = fairygui_cc_24.GRoot.inst.getChildIndex(wnd.window);
                for (let i = 0; i < that._windows.length; i++) {
                    let w = that._windows[i];
                    if (!wnd.topMost && w.topMost ||
                        wnd.topMost && w.topMost && wnd.topPriority < w.topPriority) {
                        let idx = fairygui_cc_24.GRoot.inst.getChildIndex(w.window);
                        if (idx < 0) {
                            that._windows.splice(i, 1);
                            i--;
                            continue;
                        }
                        fairygui_cc_24.GRoot.inst.setChildIndex(w.window, startIdx);
                    }
                    w._index = fairygui_cc_24.GRoot.inst.getChildIndex(w.window);
                }
            }
            else {
                fairygui_cc_24.GRoot.inst.bringToFront(wnd.window);
            }
            that._windows.push(wnd);
            that._windows.sort((a, b) => a._index - b._index);
        }
        showWindow(viewType, data = null, modal = true, modalLayerColor = null) {
            // If viewType is a string, get the corresponding view from ViewMap
            if (typeof viewType === "string") {
                viewType = ViewMap_3.default.instance.getByName(viewType);
            }
            // Get the window by its type
            const wnd = ViewHelper_1.ViewHelper.instance.getSingleWindowByType(viewType);
            // Show the window
            return this._showWindow(wnd, data, modal, modalLayerColor);
        }
        getTopModalWindow() {
            // Iterate from the end of the _windows array to find the top modal window
            const topModalWindow = this._windows.slice().reverse().find(w => w.modal);
            // Return the top modal window if found, otherwise return null
            return topModalWindow || null;
        }
        /**
         * 检查资源是否准备好
         * @param viewType
         * @param waitResource
         * @returns
         */
        async checkResourceReady(viewType, waitResource) {
            var _a;
            const skin = Skin_5.default.getSkin(viewType);
            if (!skin) {
                console.error(`skin is null, viewType: ${viewType}`);
                return false;
            }
            const packageExists = fairygui_cc_25.UIPackage.getByName(skin.packageName);
            if (!packageExists) {
                return true;
            }
            if (waitResource) {
                await FGUIExt_3.default.preloadPackage(skin.packageName, "/");
                return true;
            }
            (_a = this.onResourcesNotReady) === null || _a === void 0 ? void 0 : _a.call(this, viewType, waitResource);
            return false;
        }
        /**
         * 显示窗口, 如果showNow为false，则会在排序后加入等待队列
         * @param context
         * @param showNow
         * @returns
         */
        async showWindowX(context, showNow = true) {
            let type = context.viewType;
            if (typeof context.viewType == "string") {
                type = ViewMap_3.default.instance.getByName(context.viewType);
            }
            if (!type) {
                console.error(`no window type ${context.viewType}`);
                return null;
            }
            if (context.waitOnResNotReady) {
                let res = await UIManager.instance.checkResourceReady(type, true);
                if (!res) {
                    return null;
                }
            }
            if (showNow) {
                return UIManager.instance.showWindow(type, context.data, context.modal, context.modalLayerColor);
            }
            let wndInfo = WindowPriorityMap_1.WindowPriorityMap.getBySkin(Skin_5.default.getSkin(type));
            if (this._hasWindowInWaitQueue(type)) {
                // 已经在等待队列中, 或者正在显示，则不再加入等待队列
                return null;
            }
            // 按优先级插入等待队列
            let group = this._waitWindows.find(i => i[0].info.group == wndInfo.group);
            if (!group) {
                group = [];
                this._waitWindows.push(group);
            }
            let insertIndex = group.findIndex(i => i.info.waitPriority > wndInfo.waitPriority);
            if (insertIndex < 0) {
                group.push(context);
            }
            else {
                group.splice(insertIndex, 0, context);
            }
            if (env_9.PREVIEW) {
                for (let i = 0; i < this._waitWindows.length; i++) {
                    for (let j = 0; j < this._waitWindows[i].length; j++) {
                        const wnd = this._waitWindows[i][j];
                        const name = typeof wnd.viewType == "string" ? wnd.viewType : wnd.viewType.name;
                        console.log("wait window:", name, wnd.info.waitPriority);
                    }
                }
            }
            return null;
        }
        _showWindow(wnd, data = null, modal = true, modalLayerColor = null) {
            var _a;
            if (wnd == null) {
                return null;
            }
            if (this.topWindow() == wnd) {
                return wnd;
            }
            if (this._windows.indexOf(wnd) >= 0) {
                console.error(`dumplicate open window:${(_a = wnd.skin) === null || _a === void 0 ? void 0 : _a.componentName}`);
                return wnd;
            }
            wnd.modal = modal;
            if (modal) {
                wnd.modalLayerColor.set(modalLayerColor || fairygui_cc_24.UIConfig.modalLayerColor);
            }
            wnd.bringToFront();
            wnd.once(Window_1.default.EVENT_WINDOW_HIDE, (w) => {
                let idx = this._windows.indexOf(w);
                if (idx >= 0) {
                    this._windows.splice(idx, 1);
                }
                this.onHideWindow(w);
                this.emit(UIManager.EVENT_WINDOW_CHANGED, w, false);
            }, this);
            wnd.show(data);
            UIManager.sortWindow(wnd);
            this.emit(UIManager.EVENT_WINDOW_CHANGED, wnd, true);
            let oldWindow = this.topWindow(true);
            if (oldWindow) {
                oldWindow.overlayBy(wnd);
            }
            return wnd;
        }
        setModalLayerColor(color) {
            this._setModalLayerColor(color);
            this._fadeModelLayerColor();
        }
        _setModalLayerColor(color) {
            fairygui_cc_24.GRoot.inst.modalLayer.color.set(color);
            fairygui_cc_24.GRoot.inst.modalLayer.drawRect(0, cc_22.Color.TRANSPARENT, color);
        }
        _setModalLayerAlpha(alpha) {
            let color = fairygui_cc_24.GRoot.inst.modalLayer.color;
            if (color.a == alpha) {
                return;
            }
            color.a = alpha;
            this._setModalLayerColor(color);
        }
        _fadeModelLayerColor(from = 0, to = 200, duration = 0.2, windowCount = 0) {
            // UIOpacity 需要修改底层代码，怕影响性能，暂时不用
            // let uiOpcity = GRoot.inst.modalLayer.node.getComponent(UIOpacity);
            if (this._windows.length == windowCount) {
                //首个弹窗才需要播放淡入动画     
                fairygui_cc_26.GTween.kill(fairygui_cc_24.GRoot.inst.modalLayer);
                fairygui_cc_26.GTween.to(from, to, duration).setTarget(fairygui_cc_24.GRoot.inst.modalLayer).onUpdate((t) => {
                    // uiOpcity.opacity = t.value.x;
                    this._setModalLayerAlpha(t.value.x);
                }, this);
            }
            else {
                // uiOpcity.opacity = 200;
                this._setModalLayerAlpha(to);
            }
        }
        hideWindow(viewType, dispose = false, code) {
            if (typeof viewType == "string") {
                viewType = ViewMap_3.default.instance.getByName(viewType);
            }
            var wnd = ViewHelper_1.ViewHelper.instance.getSingleWindowByType(viewType);
            if (wnd == null) {
                return;
            }
            wnd.hide(code);
            if (dispose) {
                ViewHelper_1.ViewHelper.instance.destoryWindow(wnd.skin);
            }
        }
        async waitWindow(viewType, data = null, modal = true, modalLayerColor = null) {
            if (typeof viewType == "string") {
                viewType = ViewMap_3.default.instance.getByName(viewType);
            }
            let wnd = this.showWindow(viewType, data, modal, modalLayerColor);
            let next = false;
            wnd.once(Window_1.default.EVENT_WINDOW_HIDE, () => {
                next = true;
            }, this);
            await UtilsHelper_6.UtilsHelper.until(() => next);
            return wnd.exitCode;
        }
        hideCurrentWindow(dispose = false, code, ignoreTopMost) {
            const wnd = this.topWindow(ignoreTopMost);
            if (!wnd) {
                return null;
            }
            wnd.hide(code);
            const idx = this._windows.indexOf(wnd);
            if (idx >= 0) {
                this._windows.splice(idx, 1);
                this.onHideWindow(wnd);
            }
            if (dispose) {
                ViewHelper_1.ViewHelper.instance.destoryWindow(wnd.skin);
            }
            return wnd;
        }
        hideAllWindow(code) {
            this._windows.forEach(v => {
                v.hide(code);
            });
            this._windows.length = 0;
            fairygui_cc_24.GRoot.inst.closeAllWindows();
        }
        go(viewType, data, layer = ViewHelper_1.ELayer.UI) {
            return this.push(viewType, data, layer, true);
        }
        push(viewType, data, layer = ViewHelper_1.ELayer.UI, popTop = false) {
            if (!viewType) {
                console.error("can not push undefined viewType!");
                return null;
            }
            if (typeof viewType === "string") {
                viewType = ViewMap_3.default.instance.getByName(viewType);
            }
            let views = this._views[layer];
            let curView;
            if (views.length > 0) {
                curView = views[views.length - 1];
                if (curView && viewType === curView.constructor) {
                    return curView;
                }
            }
            let nextView = ViewHelper_1.ViewHelper.instance.getSingleViewByType(viewType, layer);
            let pause = () => {
                if (curView) {
                    if (!popTop) {
                        curView.pause();
                    }
                    else {
                        this._pop(layer, false, true);
                    }
                }
            };
            let enter = (data) => {
                if (nextView != null) {
                    views.push(nextView);
                    nextView.data = data;
                    if (curView) {
                        // 将当前视图移动至上层
                        let nextgo = nextView.viewObject.container;
                        nextgo.parent.setChildIndex(nextgo, nextgo.parent.numChildren);
                    }
                    nextView.enter(data);
                }
            };
            pause();
            enter(data);
            this.emit(UIManager.EVENT_ACTIVITY_CHANGED, layer, curView, nextView);
            return nextView;
        }
        popTo(viewType, layer = ViewHelper_1.ELayer.UI, data = null) {
            let top = this.peekOrNull(layer);
            while (!(top instanceof viewType)) {
                top = this.peekOrNull2();
                this._pop(layer, top instanceof viewType, false, data);
                top = this.peekOrNull(layer);
                if (!top) {
                    break;
                }
            }
        }
        _pop(layer = ViewHelper_1.ELayer.UI, withResume = true, beforePush = false, data = null) {
            let views = this._views[layer];
            if (views.length > 0 || beforePush) {
                let preView = views.pop();
                let preType = preView.skin;
                let exit = () => {
                    preView.exit();
                    if (preView.disposeOnExit) {
                        //销毁
                        ViewHelper_1.ViewHelper.instance.destroyView(preType);
                    }
                };
                let curView = views.length > 0 ? views[views.length - 1] : null;
                let resume = (data) => {
                    if (curView) {
                        curView.resume(data);
                    }
                };
                exit();
                if (withResume) {
                    resume(data);
                }
                this.emit(UIManager.EVENT_ACTIVITY_CHANGED, layer, preView, curView);
                return curView;
            }
        }
        pop(layer = ViewHelper_1.ELayer.UI, data = null) {
            return this._pop(layer, true, false, data);
        }
        getViewCount(layer = ViewHelper_1.ELayer.UI) {
            return this._views[layer].length;
        }
        peekOrNull(layer = ViewHelper_1.ELayer.UI) {
            let views = this._views[layer];
            if (views.length > 0) {
                return views[views.length - 1];
            }
            return null;
        }
        peekOrNull2(layer = ViewHelper_1.ELayer.UI) {
            let views = this._views[layer];
            if (views.length > 1) {
                return views[views.length - 2];
            }
            return null;
        }
        on(type, listener, target) {
            this._canvasNode.on(type, listener, target);
        }
        once(type, listener, target) {
            this._canvasNode.once(type, listener, target);
        }
        off(type, listener, target) {
            this._canvasNode.off(type, listener, target);
        }
        targetOff(target) {
            this._canvasNode.targetOff(target);
        }
        emit(type, ...data) {
            this._canvasNode.emit(type, ...data);
        }
        onContainerCreate(container) {
            var _a;
            this._currentOpeningContainer = container;
            this._beginCreateTime = Date.now();
            if ((_a = this._currentOpeningContainer) === null || _a === void 0 ? void 0 : _a.enableWating) {
                Timer_7.Timer.inst.frameLoop(1, this.onContainerChecker, this);
            }
        }
        onCreateEnd() {
            var _a;
            if ((_a = this._currentOpeningContainer) === null || _a === void 0 ? void 0 : _a.enableWating) {
                this.emit(UIManager.EVENT_NEED_CLOSE_WATING, this._currentOpeningContainer);
            }
            this._currentOpeningContainer = null;
            this._beginCreateTime = -1;
            this._watingModualOpend = false;
            Timer_7.Timer.inst.clear(this.onContainerChecker, this);
        }
        onContainerChecker() {
            if (this._currentOpeningContainer) {
                if (!this._watingModualOpend) {
                    let duration = Date.now() - this._beginCreateTime;
                    if (duration >= this.waitingModualTime * 1000) {
                        this.emit(UIManager.EVENT_NEED_OPEN_WATING, this._currentOpeningContainer);
                        this._watingModualOpend = true;
                    }
                }
                else if (this._currentOpeningContainer.isCreated) {
                    this.onCreateEnd();
                }
            }
        }
    }
    exports.UIManager = UIManager;
    UIManager.EVENT_NEED_OPEN_WATING = "uimgr_need_open_wating";
    UIManager.EVENT_NEED_CLOSE_WATING = "uimgr_need_open_wating";
    UIManager.EVENT_WINDOW_CHANGED = "uimgr_window_changed";
    UIManager.EVENT_ACTIVITY_CHANGED = "uimgr_activity_changed";
    UIManager.onButtonClick = null;
    UIManager._instance = null;
});
define("view/Activity", ["require", "exports", "fairygui-cc", "view/Skin", "view/ViewObject", "view/SkinHelper", "view/ViewHelper", "view/Container", "common/Timer", "view/UIManager", "common/SoundManager", "cc"], function (require, exports, fairygui_cc_27, Skin_6, ViewObject_1, SkinHelper_3, ViewHelper_2, Container_4, Timer_8, UIManager_2, SoundManager_2, cc_23) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Activity = void 0;
    // [l100,t100,b80,y+10]name"
    var NAME_REGEX = /\[((([tbrlwh]|(?:[xy][+-]\d{0,3})){1}(?:\d{0,3},?))+)\](.*)/i;
    class Activity extends Container_4.default {
        constructor() {
            super(...arguments);
            this.disposeOnExit = false;
            this.overflow = false;
            this.injectInfos = {};
            this._updating = false;
            this._secondTicker = 0;
            this._enableUpdate = false;
            this.bgmLoop = true;
        }
        registInfos() {
        }
        get component() {
            return this.viewObject.component;
        }
        get destoried() {
            return this._destoried;
        }
        get skin() {
            if (!this._skin) {
                this._skin = Skin_6.default.getSkin(this.constructor);
            }
            return this._skin;
        }
        get visible() {
            return this.component.visible;
        }
        get enableUpdate() {
            return this._enableUpdate;
        }
        set enableUpdate(val) {
            if (this._enableUpdate != val) {
                this._enableUpdate = val;
                //@ts-ignore
                if (this._isShown) {
                    this.setUpdateEnable(val);
                }
            }
        }
        initial() {
            //@ts-ignore
            this.beginCreate();
            UIManager_2.UIManager.instance.onContainerCreate(this);
            fairygui_cc_27.UIPackage.addPackage(this.skin.path);
            //视图对象                
            let viewObj = new ViewObject_1.default();
            let component = null;
            if (this.skin.autoWarpper) {
                let warpper = new fairygui_cc_27.GComponent();
                warpper.node.name = "[AUTO]GComponent";
                viewObj.warpper = warpper;
                let loader = new fairygui_cc_27.GLoader();
                viewObj.warpLoader = loader;
                loader.node.name = "[AUTO]GLoader";
                let url = fairygui_cc_27.UIPackage.getItemURL(this.skin.packageName, this.skin.componentName);
                loader.url = url;
                component = loader.component;
                warpper.opaque = component.opaque;
                warpper.addChild(loader);
                loader.fill = fairygui_cc_27.LoaderFillType.Scale;
                loader.align = fairygui_cc_27.AlignType.Center;
                loader.verticalAlign = fairygui_cc_27.VertAlignType.Middle;
                loader.autoSize = false;
                warpper.setSize(component.width, component.height);
                loader.setSize(warpper.width, warpper.height);
                loader.setPosition(0, 0);
                loader.addRelation(warpper, fairygui_cc_27.RelationType.Size);
                // 背景图
                let bg = component.getChild("_bg_");
                let count = 0;
                if (bg != null) {
                    warpper.addChildAt(bg, 0);
                    bg.addRelation(warpper, fairygui_cc_27.RelationType.Size);
                    count++;
                }
                let children = component._children.slice();
                children.forEach(child => {
                    let name = child.name;
                    if (name.startsWith("_out_")) {
                        let defs = [];
                        child.relations["_items"].filter(item => item.target == component).map(item => {
                            defs = defs.concat(item["_defs"]);
                        });
                        child.removeFromParent();
                        child.relations.clearFor(component);
                        warpper.addChildAt(child, count);
                        defs.forEach(def => {
                            child.addRelation(warpper, def.type, def.percent);
                        });
                        count++;
                    }
                    else {
                        let matches = NAME_REGEX.exec(name);
                        if (matches) {
                            let groups = matches[1].split(",");
                            groups.forEach(group => {
                                let type = group[0].toLocaleLowerCase();
                                let isPosType = type == "x" || type == "y";
                                let startPos = isPosType ? 2 : 1;
                                let sign = 1;
                                if (isPosType) {
                                    sign = group[1] == "+" ? 1 : -1;
                                }
                                let precentStr = group.substring(startPos);
                                let precent = !!precentStr ? parseInt(precentStr) / 100 : 1;
                                if (Number.isNaN(precent)) {
                                    precent = 1;
                                    console.error("precent is not number," + precentStr, name);
                                }
                                let fullWidth = fairygui_cc_27.GRoot.inst.width;
                                let fullHeight = fairygui_cc_27.GRoot.inst.height;
                                // 重新计算位置
                                if (type == 't') {
                                    child.setPosition(child.x, child.y - (fullHeight - component.height) * 0.5 * precent);
                                }
                                else if (type == 'b') {
                                    child.setPosition(child.x, child.y + (fullHeight - component.height) * 0.5 * precent);
                                }
                                else if (type == 'l') {
                                    child.setPosition(child.x - (fullWidth - component.width) * 0.5 * precent, child.y);
                                }
                                else if (type == 'r') {
                                    child.setPosition(child.x + (fullWidth - component.width) * 0.5 * precent, child.y);
                                }
                                else if (type == 'w') {
                                    child.setSize(child.width + (fullWidth - component.width) * precent, child.height);
                                }
                                else if (type == "h") {
                                    child.setSize(child.width, child.height + (fullHeight - component.height) * precent);
                                }
                                else if (type == "x") {
                                    child.setPosition(child.x + (fullWidth - component.width) * 0.5 * sign * precent, child.y);
                                }
                                else if (type == "y") {
                                    child.setPosition(child.x, child.y + (fullHeight - component.height) * 0.5 * sign * precent);
                                }
                                else {
                                    console.error("unknow type", type);
                                }
                            });
                            // 重命名
                            child.name = matches[4];
                        }
                    }
                });
            }
            else {
                component = fairygui_cc_27.UIPackage.createObject(this.skin.packageName, this.skin.componentName).asCom;
                component.node.name = `[${this.skin.componentName}]`;
            }
            viewObj.go = component;
            viewObj.skin = this.skin;
            this.viewObject = viewObj;
        }
        async create() {
            this.onInitial();
            SkinHelper_3.default.InjectView(this.viewObject.go, this);
            let groot = ViewHelper_2.ViewHelper.instance.getLayer(ViewHelper_2.ELayer.UI);
            groot.on(fairygui_cc_27.Event.SIZE_CHANGED, this.onSizeChanged, this);
            this.viewObject.container.setSize(groot.width, groot.height);
            let ret = this.onCreate();
            if (ret instanceof Promise) {
                await ret;
            }
            //@ts-ignore
            this.endCreate();
        }
        onSizeChanged() {
            let groot = ViewHelper_2.ViewHelper.instance.getLayer(ViewHelper_2.ELayer.UI);
            this.viewObject.container.setSize(groot.width, groot.height);
        }
        enter(data) {
            this.show(true, data);
        }
        async show(isEnter, data) {
            //@ts-ignore
            this._isShown = false;
            this.viewObject.container.visible = true;
            this.children.forEach(v => {
                v.show(data, false);
            });
            let ret = this.onShown(isEnter, data);
            if (ret instanceof Promise) {
                await ret;
            }
            //@ts-ignore
            this.endShown();
            this.setUpdateEnable(this._enableUpdate);
            if (this.bgmSouce) {
                SoundManager_2.SoundManager.instance.playMusic(this.bgmSouce, this.bgmLoop);
            }
        }
        exit() {
            this.hide(true);
        }
        hide(isExit) {
            this.viewObject.container.visible = false;
            this.children.forEach(v => {
                v.hide(false);
            });
            this.clearEventCenter();
            this.setUpdateEnable(false);
            this.onHide(isExit);
        }
        pause() {
            this.hide(false);
        }
        resume(data) {
            this.show(false, data);
        }
        dispose() {
            if (this._destoried) {
                return;
            }
            this._destoried = true;
            this.clearEventCenter();
            this.children.forEach(v => {
                v.dispose();
            });
            let groot = ViewHelper_2.ViewHelper.instance.getLayer(ViewHelper_2.ELayer.UI);
            groot.off(fairygui_cc_27.Event.SIZE_CHANGED, this.onSizeChanged, this);
            this.viewObject.go.dispose();
            this.onDispose();
        }
        update() {
            let dt = cc_23.game.deltaTime * 1000;
            this._secondTicker += dt;
            let seconds = false;
            if (this._secondTicker >= 1000) {
                seconds = true;
                this._secondTicker = 0;
            }
            this.onUpdate(dt / 1000, seconds);
        }
        setUpdateEnable(val) {
            if (this._updating == val) {
                return;
            }
            this._updating = val;
            if (val) {
                Timer_8.Timer.inst.frameLoop(1, this.update, this);
            }
            else {
                Timer_8.Timer.inst.clear(this.update, this);
            }
        }
        //////////////////////////////////////////////////////////////////////////
        onInitial() {
        }
        onCreate() {
        }
        onShown(isEnter, data) {
        }
        onHide(isExit) {
        }
        onDispose() {
        }
        /**
         *
         * @param dt 间隔时间(s)
         * @param secondTick
         */
        onUpdate(dt, secondTick) {
        }
    }
    exports.Activity = Activity;
});
define("view/Decorators", ["require", "exports", "view/SkinHelper"], function (require, exports, SkinHelper_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registSkin = exports.inject = void 0;
    function inject(type, path, data, optional) {
        return function (target, key) {
            target.__injectInfos = Object.assign({}, target.__injectInfos);
            if (!type) {
                console.error("inject type is null");
            }
            target.__injectInfos[key] = { type, path, data, optional };
        };
    }
    exports.inject = inject;
    function registSkin(uiPackage, componentName, data, isWindow, autoWarpper, registNow = false) {
        return function (target) {
            if (registNow) {
                SkinHelper_4.default.bindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper);
            }
            else {
                SkinHelper_4.default.preBindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper);
            }
        };
    }
    exports.registSkin = registSkin;
});
define("view/TweenWindow", ["require", "exports", "fairygui-cc", "common/UtilsHelper", "view/Window"], function (require, exports, fairygui_cc_28, UtilsHelper_7, Window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TweenWindow = void 0;
    class TweenWindow extends Window_2.default {
        constructor() {
            super(...arguments);
            this.inDuration = 0.375;
            this.outDuration = 0.25;
            this.inEase = fairygui_cc_28.EaseType.BackOut;
            this.outEase = fairygui_cc_28.EaseType.BackIn;
        }
        onAfterInitial() {
            this.addTransitionIfNeeded(TweenWindow.enterTransition, (name) => this.inAnimation = name);
            this.addTransitionIfNeeded(TweenWindow.exitTransition, (name) => this.outAnimation = name);
        }
        addTransitionIfNeeded(transition, assignName) {
            if (transition && !this[assignName]) {
                this[assignName] = transition.name;
                this.window.contentPane.addTransition(transition);
            }
        }
        async playShowAnimation() {
            this.component.touchable = false;
            if (this.inAnimation) {
                await this.playTransition(this.inAnimation);
            }
            else {
                this.playDefaultShowAnimation();
                await UtilsHelper_7.UtilsHelper.wait(this.inDuration);
            }
            this.component.touchable = true;
        }
        async playTransition(animationName) {
            let next = false;
            let tr = this.component.getTransition(animationName);
            tr.play(() => {
                next = true;
            });
            await UtilsHelper_7.UtilsHelper.until(() => next);
        }
        playDefaultShowAnimation() {
            fairygui_cc_28.GTween.kill(this.component, true, this.component.setScale);
            fairygui_cc_28.GTween.to2(0, 0, 1, 1, this.inDuration)
                .setEase(this.inEase)
                .setTarget(this.component, this.component.setScale);
        }
        async playHideAnimation() {
            this.component.touchable = false;
            if (this.outAnimation) {
                await this.playTransitionWithHide(this.outAnimation);
            }
            else {
                this.playDefaultHideAnimation();
                await UtilsHelper_7.UtilsHelper.wait(this.outDuration);
            }
            this.component.touchable = true;
        }
        async playTransitionWithHide(animationName) {
            let next = false;
            let tr = this.component.getTransition(animationName);
            tr.play(() => {
                this.hideImmediately();
                next = true;
            });
            await UtilsHelper_7.UtilsHelper.until(() => next);
        }
        playDefaultHideAnimation() {
            fairygui_cc_28.GTween.kill(this.component, true, this.component.setScale);
            fairygui_cc_28.GTween.to2(1, 1, 0, 0, this.outDuration)
                .setEase(this.outEase)
                .setTarget(this.component, this.component.setScale)
                .onComplete(() => {
                this.hideImmediately();
            });
        }
        hideNow(code) {
            this.internalHide(true, code);
        }
        hide(code) {
            this.internalHide(false, code);
        }
        async registTap() {
            if (!this.waitAnimation) {
                await UtilsHelper_7.UtilsHelper.until(() => !this.isShowing);
            }
            super.registTap();
        }
    }
    exports.TweenWindow = TweenWindow;
});
define("view/index", ["require", "exports", "common/UtilsHelper", "view/UIManager", "view/Skin", "view/Activity", "view/Window", "view/ViewHelper", "view/View", "view/SkinHelper", "plugins/gesture/PinchGesture", "plugins/gesture/SwipeGesture", "view/Decorators", "view/TweenWindow"], function (require, exports, UtilsHelper_8, UIManager_3, Skin_7, Activity_1, Window_3, ViewHelper_3, View_2, SkinHelper_5, PinchGesture_1, SwipeGesture_1, Decorators_1, TweenWindow_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        UtilsHelper: UtilsHelper_8.UtilsHelper,
        UIManager: UIManager_3.UIManager,
        Skin: Skin_7.default,
        Window: Window_3.default,
        TweenWindow: TweenWindow_1.TweenWindow,
        Activity: Activity_1.Activity,
        ELayer: ViewHelper_3.ELayer,
        View: View_2.default,
        SkinHelper: SkinHelper_5.default,
        PinchGesture: PinchGesture_1.default,
        SwipeGesture: SwipeGesture_1.default,
        inject: Decorators_1.inject,
    };
});
define("view/utils/fgui_patch", ["require", "exports", "fairygui-cc", "plugins/config/I18N", "common/UtilsHelper", "view/UIManager"], function (require, exports, fairygui_cc_29, I18N_1, UtilsHelper_9, UIManager_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // 解决fairygui层级不一致造成mask异常问题
    var addChildAt = fairygui_cc_29.GComponent.prototype.addChildAt;
    fairygui_cc_29.GComponent.prototype.addChildAt = function (child, index) {
        let that = this;
        var cld = addChildAt.call(that, child, index);
        if (child && that.parent) {
            child.node.layer = that.parent.node.layer;
        }
        return cld;
    };
    // 让loader支持空白处点击穿透
    fairygui_cc_29.GLoader.prototype["_hitTest"] = function (pt, globalPt) {
        let that = this;
        if (that.node.name.startsWith("[AUTO]") && that.component) {
            return that.component["_hitTest"](pt, globalPt);
        }
        if (!that.touchable) {
            return null;
        }
        if (pt.x >= 0 && pt.y >= 0 && pt.x < this._width && pt.y < this._height)
            return this;
        else
            return null;
    };
    let btnClick1 = fairygui_cc_29.GButton.prototype["onClick_1"];
    fairygui_cc_29.GButton.prototype["onClick_1"] = function () {
        let that = this;
        if (UIManager_4.UIManager.onButtonClick) {
            UIManager_4.UIManager.onButtonClick(that);
        }
        btnClick1.call(that);
        let clickInterval = this.clickInterval || 0;
        if (clickInterval > 0) {
            UtilsHelper_9.UtilsHelper.setClickCD(that, clickInterval);
        }
    };
    fairygui_cc_29.GObject.prototype["setClick"] = function (callback, target) {
        this.offClick(callback, target);
        this.onClick(callback, target);
    };
    fairygui_cc_29.GObject.prototype["setTitle"] = function (data, ...args) {
        var _a;
        if (typeof data == "number") {
            let text = ((_a = I18N_1.I18N.inst.getItem(data)) === null || _a === void 0 ? void 0 : _a.Text) || `[lang${data}]`;
            if (text) {
                text = text.replace(/\\n/g, '\n');
            }
            this.text = UtilsHelper_9.UtilsHelper.format(text, ...args);
        }
        else {
            this.text = UtilsHelper_9.UtilsHelper.format(data, ...args);
        }
    };
    fairygui_cc_29.GObject.prototype["setText"] = function (data, ...args) {
        var _a;
        if (typeof data == "number") {
            let text = ((_a = I18N_1.I18N.inst.getItem(data)) === null || _a === void 0 ? void 0 : _a.Text) || `[lang${data}]`;
            if (text) {
                text = text.replace(/\\n/g, '\n');
            }
            this.text = UtilsHelper_9.UtilsHelper.format(text, ...args);
        }
        else {
            this.text = UtilsHelper_9.UtilsHelper.format(data, ...args);
        }
    };
    fairygui_cc_29.GComponent.prototype["clone"] = function () {
        let that = this;
        return fairygui_cc_29.UIPackage.createObjectFromURL(that.resourceURL);
    };
    fairygui_cc_29.ScrollPane["globalTouchEffect"] = true;
    Object.defineProperty(fairygui_cc_29.ScrollPane.prototype, "_touchEffect", {
        get: function () { return this.touchEffect__ && fairygui_cc_29.ScrollPane["globalTouchEffect"]; },
        set: function (v) { this.touchEffect__ = v; }
    });
    exports.default = null;
});
