import {Camera, Vec2, Node, UITransform, director, screen, Texture2D, RenderTexture, Layers, gfx, Rect, view, errorID, Size, v3, v2, game, sys, Director, Canvas, Vec3, ResolutionPolicy, Color, VERSION, Sprite } from "cc";
import { CanvasPool } from "./CanvasPool";
var canvasPool = CanvasPool;

type ImageType = "jpeg" | "png";


interface CaptureParams {
    /**
     * 宽高比例
     */
    aspect?: number;
    /**
     * 在不满足宽高比例时，是否高度优先
     */ 
    heightFrist?: boolean;
    /**
     *  宽或高的大小，取决于谁优先
     */
    firstSize?: number;
    /**
     * 默认为true
     * 是否使用传入相机，将会把传入相机所见全部渲染为图片；
     * 如需支持隐藏UI(layer为CAPTURE或其他原相机不可见图层)，此参数可以传false，此模式在屏幕适配为SHOW_ALL慎用（可能是引擎bug造成相机缩放不一致）
     * 使用原相机性能更优
    */
    useRawCamera?: boolean;
    /**
     * 指定渲染区域，不设置则获取目标的外接矩形
     */
    rect?: Rect;
}

var versions = VERSION.split(".");
var mVersion = parseInt(versions[0]);
var FLIP_Y_VERSION = mVersion != 3 || mVersion == 3 && parseInt(versions[1]) != 6;

/**
 * CocosCreator截图辅助工具类
 * 不支持WebView截图（此为单独的dom）
 */
export class CaptureHelper {
    private static setChildLayer(node: Node, layer?: number, depth: number = 0) {
        if(!node) {
            return;
        }

        let key = "__old_layer__";
        if(depth == 0) {
            if(layer) {
                node[key] = node.layer;
                node.layer = layer; 
            }else{
                node.layer = node[key];
                delete node[key];
            }
        }

        let children = node.children;
        for(let i = 0; i < children.length; i++) {
            let child = children[i];
            if(!child.active) {
                continue;
            }

            if(layer) {
                child[key] = child.layer;
                child.layer = layer; 
            }else{
                child.layer = child[key];
                delete child[key];
            }
            this.setChildLayer(child, layer, depth+1);
        }    
    }

    static canvasEncodeTexture(canvas: HTMLCanvasElement, type: ImageType = "jpeg", quality?: number) {
        return new Promise<string>((resolve)=>{
            if(canvas.toDataURL) {
                resolve(canvas.toDataURL("image/" + type, quality));
            }else {
                canvas.toBlob((blob) => {
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = (e)=>{
                        resolve(e.target.result as string);
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
    static async toBase64Image(arrayBuffer: ArrayBuffer, size: Size, type:ImageType = "png", trimHeader?: boolean, quality = 1, flipY: boolean = null): Promise<string> {
        if(flipY == null) {
            flipY = !FLIP_Y_VERSION;
        }
        
        let canvas = canvasPool.getInstance().get();
        let width = canvas.canvas.width = Math.floor(size.width);    
        let height = canvas.canvas.height = Math.floor(size.height);    
        let ctx = canvas.context;
        let imageU8Data = new Uint8Array(arrayBuffer); 

        let imageData = ctx.createImageData(width, height); 
        if(flipY) {
            let bytesWidth = width * 4;

            for(let hi=0;hi<height;hi++) {
                let sindex = hi * bytesWidth;
                let eindex = sindex + bytesWidth;
                let tsindex = (height - 1 - hi) * bytesWidth;

                for(let start = sindex; start < eindex; start++) {
                    imageData.data[tsindex] = imageU8Data[start];
                    tsindex++;
                }
            }
        }else{
            imageData.data.set(imageU8Data);
        }

        ctx.putImageData(imageData, 0, 0);
        if(type == "png") {
            canvas.canvas.style.backgroundColor = null;
        }
        var base64 = await this.canvasEncodeTexture(canvas.canvas, type, quality);
        canvasPool.getInstance().put(canvas);

        if(trimHeader) {
            let index = base64.indexOf(",");
            if(index != -1) {
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
    static readTexturePixels(src: RenderTexture|Texture2D, rect?: Rect, buffer?: Uint8Array) {
        rect = rect || new Rect(0, 0, src.width, src.height);

        rect.x = Math.floor(rect.x);
        rect.y = Math.floor(rect.y);
        rect.width = Math.floor(rect.width);
        rect.height = Math.floor(rect.height);

        const gfxTexture = src.getGFXTexture();
        if (!gfxTexture) {
            errorID(7606);
            return null;
        }

        const needSize = 4 * rect.width * rect.height;
        if (buffer === undefined) {
            buffer = new Uint8Array(needSize);
        } else if (buffer.length < needSize) {
            errorID(7607, needSize);
            return null;
        }

        const bufferViews: ArrayBufferView[] = [];
        const regions: gfx.BufferTextureCopy[] = [];

        const region0 = new gfx.BufferTextureCopy();
        region0.texOffset.x = rect.x;
        region0.texOffset.y = rect.y;
        region0.texExtent.width = rect.width;
        region0.texExtent.height = rect.height;
        regions.push(region0);

        bufferViews.push(buffer);

        const gfxDevice = src["_getGFXDevice"]();
        gfxDevice?.copyTextureToBuffers(gfxTexture, bufferViews, regions);

        return buffer;
    }

    private static getComponentInParent(node:Node, type: any) {
        if(node.parent) {
            let comp = node.parent.getComponent(type);
            if(comp) {
                return comp;
            }

            if(node.parent.parent) {
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
    private static async capture(target: Node, cam: Camera, rect?: Rect, scale?: number, pos?:Vec2, useRawCamera?: boolean, flipY = true){
        let node = new Node("CaptureCamera");
        cam.node.parent.addChild(node);
        let wpos = cam.node.worldPosition;
        
        let camera:Camera;
        if(useRawCamera) {
            camera = cam;
        }else{
            let layer = 1 << Layers.nameToLayer("CAPTURE");
            if(pos) {
                node.setWorldPosition(pos.x, pos.y,wpos.z);
            }else{
                node.setWorldPosition(wpos.x,wpos.y,wpos.z);
            }

            camera = node.addComponent(Camera);
            camera.node.setWorldScale(cam.node.getWorldScale());
            
            camera.clearFlags = gfx.ClearFlagBit.ALL;
            camera.clearColor = new Color(0,0,0,0);
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

            await new Promise((resolve)=>{
                director.once(Director.EVENT_BEGIN_FRAME, () => {
                    resolve(0);
                });
            });
        }
        
        let camScale: Vec3;
        if(flipY) {
            camScale = v3(camera.node.scale);
            camera.node.setScale(camScale.x, -camScale.y, camScale.z);
        }

        scale = scale || 1;

        let rt = new RenderTexture();
        let size = view.getVisibleSize();
        rt.reset({width:size.width*scale, height:size.height*scale});
        camera.targetTexture = rt;

        director.root.frameMove(0);

        let clear = ()=>{
            node.destroy();
            
            camera.targetTexture = null;
            if(flipY) {
                camera.node.setScale(camScale);
            }
            if(!useRawCamera){
                this.setChildLayer(target);
            }
        };
        
        if(rect) {
            if(flipY && FLIP_Y_VERSION) {
                rect.y = size.height - rect.y - rect.height;
            }

            rect.set(rect.x*scale, rect.y*scale, rect.width*scale, rect.height*scale);

            let tex2d = new Texture2D();
            tex2d.reset({
                width: rect.width,
                height: rect.height,
                format: Texture2D.PixelFormat.RGBA8888,
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
    static async captureUI2Texture(target: Node, cam: Camera, opts?: CaptureParams) {
        opts = opts || {};

        opts.useRawCamera = opts.useRawCamera??true;

        let utr = target.getComponent(UITransform);

        let rect = opts?.rect ?? utr.getBoundingBox();     
        let width = rect.width;
        let height = rect.height;
        let scale = 1;
        if(opts.firstSize) {
            if(opts.heightFrist) {
                scale = opts.firstSize/height;
            } else {
                scale = opts.firstSize/width;
            }
        }
        if(opts.aspect) {   
            if(!opts.heightFrist) {
                width = rect.width;
                height = width / opts.aspect;
            }else{
                height = rect.height;
                width = height * opts.aspect;
            }
        }
        let pos = utr.convertToWorldSpaceAR(v3(-width*utr.anchorX, -height*utr.anchorY, 0)); 
        let snapPos:Vec2 = null;       
        if(!opts.useRawCamera) {
            rect.x = 0;
            rect.y = 0;

            let size = view.getVisibleSize();
            pos.x += size.width*0.5;
            pos.y += size.height*0.5;

            let ap = size.width / size.height;
            let policy = view.getResolutionPolicy();
            let strategy = policy["_contentStrategy"];
            if((strategy && strategy.name == "ShowAll") && ap < 1) {
                if(sys.platform == sys.Platform.DESKTOP_BROWSER) {
                    pos.y += size.height * (1 - screen.devicePixelRatio) * 0.5;
                }else{
                    pos.y += (view.getViewportRect().height - size.height) * 0.5;
                }
            }

            snapPos = v2(pos.x, pos.y);
        }else{
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
    static async textureToImage(texture: RenderTexture|Texture2D, type:ImageType = "png", trimHeader?: boolean, quality = 1, flipY = null){        
        let arrayBuffer = await this.readTexturePixels(texture);
        return await this.toBase64Image(arrayBuffer, new Size(texture.width, texture.height), type, trimHeader, quality, flipY);
    }

    /**
     * 按实际屏幕分辨率，全屏截图，此方法直接截取游戏canvas画面[不支持原生平台]
     * @returns 纹理
     */
     static async captureFullScreen() {
        let tex2d = new Texture2D();
        tex2d.reset({
            width: game.canvas.width,
            height: game.canvas.height,
            format: Texture2D.PixelFormat.RGBA8888,
            mipmapLevel: 0
        });

        director.root.frameMove(0);
        tex2d.uploadData(game.canvas);
        
        return tex2d;
    }

    /**
     * 按实际屏幕分辨率，全屏截图，此方法直接截取游戏canvas画面[不支持原生平台]
     * @param trimHeader 是否移除文件头
     * @returns 返回指定格式的base64编码图片
     */
    static async captureFullScreenToImage(trimHeader?: boolean, quality = 1) {
        director.root.frameMove(0);
        var base64 = await this.canvasEncodeTexture(game.canvas, "jpeg", quality);

        if(trimHeader) {
            let index = base64.indexOf(",");
            if(index != -1) {
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
    static async captureCameraToTexture(cam: Camera) {
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
    static async captureWechatShareImage(target: Node, cam: Camera, type:ImageType = "png", heightFrist: boolean = true, firstSize: number = 400, quality = 1) {
        let opts: any = {
            heightFrist: heightFrist,
            aspect : 5 / 4, //微信要求5/4的图片
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
    static downloadImage(base64: string, type: ImageType = "png", name?: string) {
        if(!sys.isBrowser) {
            return;
        }

        var byteCharacters = atob(
          base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
        );
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