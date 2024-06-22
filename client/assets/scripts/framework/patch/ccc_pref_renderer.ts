import { clamp, EPSILON, gfx, math, Node, RenderData, Renderer, Sorting, Sprite, StencilManager, UI, UIRenderer } from "cc";
import { GRoot } from "fairygui-cc";
import { Image } from "fairygui-cc";

export function setVisibility(node: Node, visible: boolean) {
    node["_visible_"] = visible;
}

export function isVisibility(node: Node) {
    return node["_visible_"] === undefined ? true : node["_visible_"];
}

export function preformanceNodeRenderer(node: Node, childLevel = 2) {
    node["_children_pref_"] = {
        level: childLevel,
    };
}

export function setSorting(node: Node, orderLayer: number, order: number) {
    let render = node.getComponent(Renderer);
    if(render && (render instanceof Image || render instanceof Sprite)) {
        let sorting = node.getComponent(Sorting);
        if(!sorting) {
            sorting = node.addComponent(Sorting);
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

export function preformanceSorting(node: Node, orderLayer: number, order: number, childLevel = 2) {  
    let children = node.children;
    // 将深度优先转换为广度优先
    let caches: Node[][] = [];
    for (let i = 0; i < children.length; ++i) {
        let child = children[i];
        let level = childLevel;
        while(level > 1) {
            child = child.children[0];
            level--;
        }

        if(child.children.length > 0) {
            for(let k=0;k<child.children.length;k++) {
                if(!caches[k]) {
                    caches.push([]);
                }

                caches[k].push(child.children[k]);
            }
        }
    }

    for(let i=0;i<caches.length;i++) {
        let arr = caches[i];
        let sortingOrder = order + i;
        for(let j=0;j<arr.length;j++) {
            setSorting(arr[j], orderLayer, sortingOrder);
        }
    }
}

export function ignorePreformance(node: Node) {
    node["_ignore_pref_"] = true;
}

export function clearIgnorePreformance(node: Node) {
    delete node["_ignore_pref_"];
    delete node["_overlay_pref_"];
    delete node["_sorting_order_"];

    // 因为修改sprite材质，3.8 以上版本会消失，所以这里需要重新设置
    let active = node.active;
    node.active = false;
    node.active = active;
}

export function overlayInPreformance(node: Node, sortingOrder?: number, parent?: Node) {
    node["_overlay_pref_"] = true;
    node["_sorting_order_"] = {
        order: sortingOrder || 0,
        parent: parent || GRoot.inst.node,
    };
}

export function updateOpacity (renderData: RenderData, opacity: number): void {
    const vfmt = renderData.vertexFormat;
    const vb = renderData.chunk.vb;
    let attr; let format; let stride;
    // Color component offset
    let offset = 0;
    for (let i = 0; i < vfmt.length; ++i) {
        attr = vfmt[i];
        format = gfx.FormatInfos[attr.format];
        if (format.hasAlpha) {
            stride = renderData.floatStride;
            if (format.size / format.count === 1) {
                const alpha = ~~clamp(Math.round(opacity * 255), 0, 255);
                // Uint color RGBA8
                for (let color = offset; color < vb.length; color += stride) {
                    vb[color] = ((vb[color] & 0xffffff00) | alpha) >>> 0;
                }
            } else if (format.size / format.count === 4) {
                // RGBA32 color, alpha at position 3
                for (let alpha = offset + 3; alpha < vb.length; alpha += stride) {
                    vb[alpha] = opacity;
                }
            }
        }
        offset += format.size >> 2;
    }
}

export enum Stage {
    // Stencil disabled
    DISABLED = 0,
    // Clear stencil buffer
    CLEAR = 1,
    // Entering a new level, should handle new stencil
    ENTER_LEVEL = 2,
    // In content
    ENABLED = 3,
    // Exiting a level, should restore old stencil or disable
    EXIT_LEVEL = 4,
    // Clear stencil buffer & USE INVERTED
    CLEAR_INVERTED = 5,
    // Entering a new level & USE INVERTED
    ENTER_LEVEL_INVERTED = 6,
}

let overlay: any[] = [];
UI.prototype.walk = function(node: Node, level = 0) {
    if (!node.activeInHierarchy || !isVisibility(node)) {
        return;
    }
    
    const children = node.children;
    const uiProps = node._uiProps;
    const render = uiProps.uiComp as UIRenderer;

    // Save opacity
    const parentOpacity = this._pOpacity;
    let opacity = parentOpacity;
    // TODO Always cascade ui property's local opacity before remove it
    const selfOpacity = render && render.color ? render.color.a / 255 : 1;
    this._pOpacity = opacity *= selfOpacity * uiProps.localOpacity;
    // TODO Set opacity to ui property's opacity before remove it
    // @ts-ignore
    uiProps.setOpacity(opacity);
    if (!math.approx(opacity, 0, EPSILON)) {
        if (uiProps.colorDirty) {
        // Cascade color dirty state
            this._opacityDirty++;
        }

        // Render assembler update logic
        if (render && render.enabledInHierarchy) {
            render.fillBuffers(this);// for rendering
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
        if(data) {
            if (children.length > 0 && !node._static) {      
                // 将深度优先转换为广度优先      
                let caches: Node[][] = [];
                for (let i = 0; i < children.length; ++i) {
                    let child = children[i];
                    if(child["_ignore_pref_"]) {
                        this.walk(child, level);
                    }else if(child["_overlay_pref_"]) {
                        overlay.push(child);
                    }else{
                        if(!child._static) {
                            if(data.level == 2) {
                                child = child.children[0];
                            }
                            for(let k=0;k<child.children.length;k++) {
                                if(!caches[k]) {
                                    caches[k] = [];
                                }
                                caches[k].push(child.children[k]);
                            }
                        }
                    }
                }

                for(let i=0;i<caches.length;i++) {
                    let arr = caches[i];
                    for(let j=0;j<arr.length;j++) {
                        let oldLv = level;
                        this.walk(arr[j], level);
                        level = oldLv;
                    }
                }
            }
        }else{
            if (children.length > 0 && !node._static) {
                for (let i = 0; i < children.length; ++i) {
                    const child = children[i];
                    this.walk(child, level);
                }
            }
        }

        if(overlay.length > 0) {
            let parent = overlay[0]["_sorting_order_"].parent;
            if(node == parent) {
                overlay.sort((a, b) => {
                    return a["_sorting_order_"].order - b["_sorting_order_"].order;
                });
        
                for(let i=0;i<overlay.length;i++) {
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
        if ((render.stencilStage === <any>Stage.ENTER_LEVEL || render.stencilStage === <any>Stage.ENTER_LEVEL_INVERTED)
        && (StencilManager.sharedManager!.getMaskStackSize() > 0)) {
            this.autoMergeBatches(this._currComponent!);
            this.resetRenderStates();
            StencilManager.sharedManager!.exitMask();
        }
    }

    level += 1;
};