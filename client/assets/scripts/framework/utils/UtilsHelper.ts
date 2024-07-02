import { Animation, Color, Node, Size, sp} from "cc";
import {  GObject } from "fairygui-cc";
import { DEBUG } from "cc/env";
import { PlatformSDK } from "../platform/PlatformSDK";
import { CoroutineUtils } from "./CoroutineUtils";

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

    static getGID() {
        return UtilsHelper._gid++;
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

    /** 复制一份非引用的新数据 */
    public static clone(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    static async playAnimation(anim: Animation, name: string | number) {
        let next = false;
        anim.once(Animation.EventType.FINISHED, () => {
            next = true;
        }, this);

        if (typeof name == "string") {
            anim.play(name);
        } else {
            anim.play(anim.clips[name].name);
        }

        await CoroutineUtils.until(() => next);
    }

    static async playEffect(skeleton: sp.Skeleton, name: string | number, loop = false, trackIndex = 0, timeout = 5) {
        let next = false;
        if (typeof name == "string") {
            skeleton.setAnimation(trackIndex, name, loop);
        } else {
            if (!skeleton.skeletonData) {
                console.error("skeleton.skeletonData is null");
                return;
            }
            let anims = skeleton.skeletonData.getAnimsEnum();
            let keys = Object.keys(anims);
            skeleton.setAnimation(trackIndex, keys[name], loop);
        }

        if (!loop) {
            skeleton.setCompleteListener((te) => {
                next = true;
            });
            await CoroutineUtils.until(() => next || !skeleton.node?.active, timeout);
        }
    }

    /**
     * 
     * @param skeleton 
     * @param alpha 0-1
     */
    static setEffectAlpha(skeleton: sp.Skeleton, alpha: number) {
        let color = skeleton.color as Color;
        color.a = alpha * 255;
        skeleton.color = color;
    }

    /**
     * 设置节点下所有特效的透明度
     * @param node 
     * @param alpha 
     */
    static setAllEffectAlpha(node: Node, alpha: number) {
        for (let child in node.children) {
            let childNode = node.children[child];
            let ske = childNode.getComponent(sp.Skeleton);
            if (ske) {
                this.setEffectAlpha(ske, alpha);
            }
            this.setAllEffectAlpha(childNode, alpha);
        }
    }

    static restart() {
        if (DEBUG) {
            location.reload();
        } else {
            if (PlatformSDK.inMiniGame) {
                PlatformSDK.restartMiniProgram({});
            }
        }
    }
}