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