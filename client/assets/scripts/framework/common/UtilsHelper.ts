import { Camera, director, Director, Node, renderer, Size, UITransform, Vec2, Vec3 } from "cc";
import {  GObject, GRoot } from "fairygui-cc";
import { Vec2Pool, Vec3Pool } from "./Pool";
import { Timer } from "./Timer";

export enum EPlatform{
    Windows,
    Android,
    iOS
}

type ImageType = "jpeg" | "png";

export class UtilsHelper{
    static _gid = 0;

    public static tryPraseBoolean(val:any, defVal:boolean):boolean{
        return val != null ? val : defVal;
    }
    
    public static instance(type: ObjectConstructor,... args:any[]):any{
        // var newInstance = Object.create(type.prototype);
        // newInstance.constructor.apply(newInstance, args);
        return new type(...args);
    }

    public static getPlatform():EPlatform{
        if(!navigator || !navigator.userAgent){
            return EPlatform.Windows;
        }
        var u = navigator.userAgent;
        var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
        if(isAndroid){
            return EPlatform.Android;
        }
        var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        if(isiOS){
            return EPlatform.iOS;
        }
        var isWindows = u.match(/.*Windows.*/gi);
        if(isWindows){
            return EPlatform.Windows;
        }
    }

    public static randomFuncName(len) {
        var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var s = "";

        var random = function(){
            var rand = Math.floor(Math.random() * str.length);
            return str.charAt(rand);
        };

        s += random();
        str += '0123456789';
        for(var i = 0; i < len - 1; i++){
            s += random();
        }
        return s;
    }

    static randomString(len: number) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        var maxPos = $chars.length;
        var pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    }

    static stringToColor(color:string):number[]{
        let r = parseInt(color.substr(1,2),16);
        let g = parseInt(color.substr(3,2),16);
        let b = parseInt(color.substr(5,2),16);

        return [r,g,b];
    }

    static getGID() {
        return UtilsHelper._gid++;
    }

    static convertTouchLocationToNodeSpaceAR(pos: Vec2, node: Node, outPos?: Vec3, nodeCamera?: Camera) {       
        var camera = nodeCamera ? nodeCamera.camera : director.root!.batcher2D.getFirstRenderCamera(node);

        s_vec3_2.set(pos.x, pos.y, 0);
        camera.screenToWorld(s_vec3, s_vec3_2);
        node._uiProps.uiTransformComp.convertToNodeSpaceAR(s_vec3, s_vec3_2);
        if(!outPos) {
            outPos = new Vec3;
        }
        outPos.set(s_vec3_2);

        return outPos;
    }

    static convertTouchLocationToGRoot(pos: Vec2, node: Node, outPos?: Vec2, nodeCamera?: Camera) {   
        let vec3 = Vec3Pool.get();    
        this.convertTouchLocationToNodeSpaceAR(pos, node, vec3, nodeCamera);
        let vec2 = Vec2Pool.get(vec3.x, vec3.y);
        UtilsHelper.cnode2groot(vec2, node, vec2);
        if(!outPos) {
            outPos = new Vec2;
        }
        outPos.set(vec2);

        Vec3Pool.put(vec3);
        Vec2Pool.put(vec2);
        return outPos;
    }

    static convertToNodeSpace(pos: Vec3, sourceNode: Node, targetNode: Node, outPos?: Vec3) {       
        if(!outPos) {
            outPos = new Vec3;
        }
        outPos.set(s_vec3);
        sourceNode.updateWorldTransform();
        targetNode.updateWorldTransform();
        
        sourceNode._uiProps.uiTransformComp.convertToWorldSpaceAR(pos, outPos);
        targetNode._uiProps.uiTransformComp.convertToNodeSpaceAR(outPos, outPos);

        return outPos;
    }
    
    private static grootYFlip(gpos: Vec2, outpos?: Vec2): Vec2 {
        s_vec3.set(gpos.x, GRoot.inst.height - gpos.y, 0);
        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3.x, s_vec3.y);
        return outpos;
    }

    static groot2Screen(gpos: Vec2, outpos?: Vec2) {
        outpos = UtilsHelper.grootYFlip(gpos, outpos);

        s_vec3.set(outpos.x, outpos.y, 0);
        var camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node) as renderer.scene.Camera;
        camera.worldToScreen(s_vec3, s_vec3);
        outpos.set(s_vec3.x, s_vec3.y);

        return outpos;
    }

    static groot2cnode(gpos: Vec2, node: Node, outpos?: Vec2): Vec2 {
        var camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node);

        s_vec3.set(gpos.x, GRoot.inst.height - gpos.y, 0);
        camera.worldToScreen(s_vec3_2, s_vec3);

        camera = director.root!.batcher2D.getFirstRenderCamera(node);
        camera.screenToWorld(s_vec3, s_vec3_2);
        node.updateWorldTransform();
        node.getComponent(UITransform).convertToNodeSpaceAR(s_vec3, s_vec3_2);

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3_2.x, s_vec3_2.y);

        return outpos;
    }

    static cnode2fnode(npos: Vec2, node: Node, fnode: GObject, outpos?: Vec2) {
        this.cnode2groot(npos, node, outpos);
        fnode.globalToLocal(outpos.x+fnode.width*fnode.pivotX, outpos.y+fnode.height*fnode.pivotY, outpos);
        return outpos;
    }

    static world2groot(node: Node, camera: Camera, outpos?: Vec2): Vec2 {
        node.updateWorldTransform();
        node.getWorldPosition(s_vec3);
        camera.convertToUINode(s_vec3, GRoot.inst.node, s_vec3);
        s_vec3.y = -s_vec3.y;

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3.x, s_vec3.y);

        return outpos;
    }

    static cnode2groot(npos: Vec2, node: Node, outpos?: Vec2): Vec2 {
        var camera = director.root!.batcher2D.getFirstRenderCamera(node);

        s_vec3_2.set(npos.x, npos.y);
        node.updateWorldTransform();
        node.getComponent(UITransform).convertToWorldSpaceAR(s_vec3_2, s_vec3);
        camera.worldToScreen(s_vec3_2, s_vec3);

        camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node);
        camera.screenToWorld(s_vec3, s_vec3_2);
        s_vec2.set(s_vec3.x, GRoot.inst.height - s_vec3.y);   

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec2);

        return outpos;
    }

    /** 等待一帧 */
    public static oneframe(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.frameOnce(1, resolve, this);
        });
    }
    
    /** 等待帧结束 */
    public static endframe(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            director.once(Director.EVENT_END_FRAME, resolve, this);
        });
    }

    /** 等待num帧 */
    public static waitframe(num: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.frameOnce(num, resolve, this);
        });
    }

    /** 等待成功 */
    public static until(condition: () => boolean, timeout = 0): Promise<void> {
        let timer = 0;
        return new Promise<void>((resolve, reject) => {
            let func = () => {
                if (condition() || (timeout > 0 && timer >= timeout)) {
                    Timer.inst.clear(func, this);
                    resolve();
                }
                timer += Timer.inst.delta / 1000;
            };
            Timer.inst.frameLoop(1, func, this);
        });
    }

    /** 延迟指定时间（秒） */
    public static wait(time: number = 1): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.once(time * 1000, resolve, this);
        });
    }

    /**
     * 设置延迟点击
     * @param gObj GObject
     * @param cd  延迟时间（秒）
     */
    static async setClickCD(gObj: GObject, cd: number = 1) {
        if(gObj["_ck_interval_"]) {
            return;
        }
        gObj["_ck_interval_"] = true;
        await this.oneframe();
        if(gObj.isDisposed) {
            return;
        }
        delete gObj["_ck_interval_"];

        gObj.touchable = false;
        await this.wait(cd);
        gObj.touchable = true;
    }

    static setChildLayer(node: Node, layer?: number, depth: number = 0) {
        if(depth == 0) {
            if(layer) {
                node["_old_lyr_"] = node.layer;
                node.layer = layer; 
            }else{
                node.layer = node["_old_lyr_"];
                delete node["_old_lyr_"];
            }
        }

        let children = node.children;
        for(let i = 0; i < children.length; i++) {
            let child = children[i];
            if(layer) {
                child["_old_lyr_"] = child.layer;
                child.layer = layer; 
            }else{
                child.layer = child["_old_lyr_"];
                delete child["_old_lyr_"];
            }
            this.setChildLayer(child, layer, depth+1);
        }
    }

    static toWxFile(arrayBuffer: ArrayBuffer, size: Size, type:ImageType = "png") {
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
        if(type == "png" && canvas.style) {
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

    static copyTo(from: any, to: any) {
        // return Object.assign(to, from);
        if(!from) {
            return;
        }

        let keys = Object.keys(from);
        keys.forEach(key=>{
            let field = from[key];
            if(Array.isArray(field)) {
                to[key] = [];
                for(let i=0; i<field.length; i++) {
                    let item = field[i];
                    if(item && typeof item == "object") {
                        to[key][i] = {};
                        this.copyTo(item, to[key][i]);
                    }else{
                        to[key][i] = item;
                    }
                }
            }else if(field && typeof field === "object") {
                if(!to[key]) to[key] = {};
                this.copyTo(field, to[key]);
            }else{
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
    static getNodeCenterInWorld(node: Node, outPos?: Vec2) {
        let tr = node._uiProps.uiTransformComp;
        let temp = Vec3Pool.get();
        temp.set(tr.width * (0.5-tr.anchorX), tr.height * (0.5-tr.anchorY));
        tr.convertToWorldSpaceAR(temp, temp);  
        outPos.set(temp.x, temp.y);
        Vec3Pool.put(temp);
        return outPos;
    }

    static format(source: string, ...params: (string|number|boolean)[]) {
        if(!source) {
            return source;
        }

        params.forEach((val, idx) => {
            source = source.replace(new RegExp("\\{" + idx + "\\}", "g"), val?.toString());
        });
        return source;
    };

    static dateFormat(time: number, fmt: string = "yyyy-MM-dd hh:mm:ss") {
        let date = new Date(time);
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds() //毫秒
        };
        return this.formatDateOrTime(fmt, o, date.getFullYear());
    }

    static timeFormat(t: number, format: string = "hh:mm:ss") {
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

    private static formatDateOrTime(fmt: string, o: any, year?: number) {
        if (year && /(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (year + "").substr(4 - RegExp.$1.length));
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }
}

var s_vec2 = new Vec2;
var s_vec3 = new Vec3;
var s_vec3_2 = new Vec3;