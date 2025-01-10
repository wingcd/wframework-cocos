import { instantiate, Node, Pool, Prefab, sp, Vec3 } from "cc";
import { IPoolable, PoolManager } from "../../framework/common/PoolManager";
import { ResConst } from "../const/ResConst";
import { ResManager } from "./ResManager";
import { Vec2Pool, Vec3Pool } from "../../framework/common/Pool";
import { GRoot } from "fairygui-cc";
import { StringUtils } from "../../framework/utils/StringUtils";
import { SpaceUtils } from "../../framework/utils/SpaceUtils";
import { CoroutineUtils } from "../../framework/utils/CoroutineUtils";

const _tempVec = new Vec3();
export class GameObjectEntity implements IPoolable {
    private _node: Node;

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
    }

    toPool() {
        if (this._node) {
            this._node.active = false;
        }
    }

    fromPool() {
        if (this._node) {
            this._node.active = true;
        }
    }

    setVisible(value: boolean) {
        if (this._node) {
            this._node.active = value;
        }
    }
}

const GameObjectPool = new PoolManager(GameObjectEntity);

export class GameObjectManager {
    private static _inst: GameObjectManager;
    static get inst() {
        if (!this._inst) {
            this._inst = new GameObjectManager;
        }
        return this._inst;
    }

    async playOneShot(info: {
        res: string | number,
        parent: Node,
        pos?: Vec3,
        delay?: number,
        inUIPos?: boolean,
        duration?: number,
    }) {
        if (!info.res || !info.parent) {
            return;
        }

        if (info.pos) {
            info.pos = Vec3Pool.get().set(info.pos.x, info.pos.y, info.pos.z);
        }

        return new Promise((resolve) => {
            this.loadGameObject(info.res).then(async (ske) => {
                if (!ske) {
                    return;
                }

                const { parent, pos, delay, inUIPos } = info;

                if (delay) {
                    await CoroutineUtils.wait(delay);
                }

                ske.node.parent = parent;
                const oldPos = _tempVec.set(ske.node.position);

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

                if (info.duration) {
                    await CoroutineUtils.wait(info.duration);
                    this.removeGameObject(ske);
                }
            });
        });
    }

    removeGameObject(entity: GameObjectEntity) {
        if (!entity) {
            return;
        }

        entity.node.removeFromParent();
        GameObjectPool.put(entity);
    }

    async loadGameObject(res: string | number) {
        let ske = await GameObjectPool.getByKeyAsync(res);
        return ske;
    }
}