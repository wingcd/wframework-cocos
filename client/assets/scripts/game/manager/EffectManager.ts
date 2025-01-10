import { instantiate, Node, Pool, Prefab, sp, Vec3 } from "cc";
import { IPoolable, PoolManager } from "../../framework/common/PoolManager";
import { ResConst } from "../const/ResConst";
import { ResManager } from "./ResManager";
import { Vec2Pool, Vec3Pool } from "../../framework/common/Pool";
import { GRoot } from "fairygui-cc";
import { StringUtils } from "../../framework/utils/StringUtils";
import { SpaceUtils } from "../../framework/utils/SpaceUtils";
import { CoroutineUtils } from "../../framework/utils/CoroutineUtils";

export class SpEffectEntity implements IPoolable {
    private _skeleton: sp.Skeleton;
    private _node: Node;

    get skeleton() {
        return this._skeleton;
    }

    set skeleton(value: sp.Skeleton) {
        this._skeleton = value;
    }

    get node() {
        return this._node;
    }

    async createFromPool(data: string | number) {
        let prefab: Prefab = null;

        if (typeof data === "string") {
            const resInfo = StringUtils.splitResPath(data, ResConst.AB_COMMON);
            prefab = await ResManager.getAsync(resInfo.pkg, resInfo.res, Prefab);
        } else {
            prefab = await ResManager.getByIdAsync(data, Prefab);
        }

        if (!prefab) {
            console.error("加载spine失败:", data);
            return;
        }

        const node = instantiate(prefab);
        this._node = node;
        this.skeleton = node.getComponent(sp.Skeleton);

        if (!this.skeleton) {
            const effect = node.getChildByName('effect');
            if (effect) {
                this.skeleton = effect.getComponent(sp.Skeleton);
            }
        }
    }

    toPool() {
        if (this._skeleton) {
            if(this._skeleton.node) {
                this._skeleton.node.active = false;
            }
        }
    }

    fromPool() {
        if (this._skeleton) {
            if(this._skeleton.node) {
                this._skeleton.node.active = true;
            }
        }
    }

    setVisible(value: boolean) {
        if (this._skeleton) {
            if(this._skeleton.node) {
                this._skeleton.node.active = value;
            }
        }
    }
}

const SpEffectPool = new PoolManager(SpEffectEntity);

export class EffectManager {
    private static _inst: EffectManager;
    static get inst() {
        if (!this._inst) {
            this._inst = new EffectManager;
        }
        return this._inst;
    }

    async playOneShot(info: {
        res: string | number,
        parent: Node,
        pos?: Vec3,
        anim?: string,
        delay?: number,
        inUIPos?: boolean,
    }) {
        if (!info.res || !info.parent) {
            return;
        }

        if (info.pos) {
            info.pos = Vec3Pool.get().set(info.pos.x, info.pos.y, info.pos.z);
        }

        return new Promise((resolve) => {
            this.loadEffect(info.res).then(async (ske) => {
                if (!ske) {
                    return;
                }

                const { parent, pos, anim = "animation", delay, inUIPos } = info;

                if (delay) {
                    await CoroutineUtils.wait(delay);
                }

                // await CoroutineUtils.until(() => ske.skeleton._skeleton != null);

                ske.node.parent = parent;
                const oldPos = ske.node.position;

                if (pos) {
                    oldPos.set(pos.x, pos.y, pos.z);
                    Vec3Pool.put(pos);
                }

                if (inUIPos) {
                    const vec2 = Vec2Pool.get();
                    vec2.set(oldPos.x, oldPos.y);
                    SpaceUtils.groot2cnode(vec2, GRoot.inst.node, vec2);
                    oldPos.set(vec2.x, vec2.y, 0);
                    Vec2Pool.put(vec2);
                }

                ske.node.setPosition(oldPos);
                ske.skeleton.setAnimation(0, anim, false);
                
                let skeAnim = ske.skeleton.findAnimation(anim);
                if (!skeAnim) {
                    console.error("找不到动画，资源:", info.res, "动画:", anim);
                    this.removeEffect(ske);
                    resolve(null);
                    return;
                }

                // 增加动画完成回调，防止动画播放完毕未进入回调
                let done = false;
                // ske.skeleton.clearTracks();
                // ske.skeleton.clearAnimations();
                ske.skeleton.setCompleteListener(() => {
                    if(!done) {
                        this.removeEffect(ske);
                        resolve(null);
                        done = true;
                    }
                });

                let duration = skeAnim.duration;
                await CoroutineUtils.wait(duration).then(() => {
                    if (!done) {
                        this.removeEffect(ske);
                        resolve(null);
                        done = true;
                        console.log("动画播放超时，强制完成");
                    }
                });
            });
        });
    }

    removeEffect(ske: SpEffectEntity) {
        if (!ske) {
            return;
        }

        ske.node.removeFromParent();
        SpEffectPool.put(ske);
    }

    async loadEffect(res: string | number) {
        let ske = await SpEffectPool.getByKeyAsync(res);
        return ske;
    }
}