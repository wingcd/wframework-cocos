import { v2, Vec2, path } from 'cc';
import { GComponent, UIPackage } from "fairygui-cc";
import { RedDotNode } from "./RedDotNode";
import { RedDotTree } from "./RedDotTree";
import { Timer } from "../../common/Timer";

export class RedDotItemInfo {
    /**
     * 控制器名称，如果为空，选择第一个
     */
    public controllerName: string = null;
    /**
     * 控制器选择
     */
    public selectedIndex: number = -1;

    holder: GComponent;
    realDocker: GComponent;
    // 相对位置(0-1)
    pos: Vec2 = v2();
    reddotResUrl: string;
    autoCreateReddot: boolean = true;

    node: RedDotNode;
    reddot: GComponent;

    onRender: (node: RedDotNode, info: RedDotItemInfo) => void;
}

export type RedDotConfig = {
    holder?: GComponent;
    pos?: Vec2;
    index?: number;
    controllerName?: string;
    ctrlIdx?: number;
    onRender?: (node: RedDotNode, info: RedDotItemInfo) => void;  
    realDocker?: GComponent; 
    autoCreateReddot?: boolean;
}

const compPool: Map<string, GComponent[]> = new Map();

export class RedDotManager {
    private static _inst: RedDotManager;
    static get inst() {
        if (!this._inst) {
            this._inst = new RedDotManager;
        }
        return this._inst;
    }

    private _onReddotShown: (node: RedDotNode, info: RedDotItemInfo) => void;
    private _defaultRedDotResUrl: string;
    private _tree = new RedDotTree;

    get tree() {
        return this._tree;
    }

    initial(defaultResUrl?: string, onRedDotShown?: (node: RedDotNode, info: RedDotItemInfo) => void) {
        this._defaultRedDotResUrl = defaultResUrl;
        this._onReddotShown = onRedDotShown;
        if (!onRedDotShown) {
            this._onReddotShown = this._internalShowReddot;
        }
    }

    /**
     * 创建一个节点
     * @param path 
     * @param childNum 
     * @returns 
     */
    create(path: string, childNum = 0) {
        let node = this._tree.addNode(path);
        for (let i = 0; i < childNum; i++) {
            const childPath = RedDotTree.getChildPath(path, i);
            this.create(childPath);
        }
        return node;
    }

    /**
     * 注册一个节点
     * @param path 
     * @param config 
     * @returns 
     */
    regist(path: string, config?: RedDotConfig) {
        let index = config.index ?? -1;
        let info: RedDotItemInfo = null;

        let node = this._tree.getNodeByPath(path, index);
        if (node) {
            info = node.userData as RedDotItemInfo;
        }
        if (!info) {
            info = new RedDotItemInfo;
        }

        info.holder = config.holder;
        info.pos.set(config.pos);
        info.controllerName = config.controllerName;
        info.selectedIndex = config.ctrlIdx ?? -1;
        info.onRender = config.onRender;
        info.realDocker = config.realDocker;
        info.autoCreateReddot = config.autoCreateReddot;

        node = this.bind(path, info, index);
        this._regist(path);
        return node;
    }

    public addMessage(key: string|number, count: number = 1) {
        if(count === 0) {
            return;
        }
        if(count < 0) {
            console.warn(`RedDotManager: addMessage count is less than 0, key: ${key}, count: ${count}`);
            return;
        }

        this._tree.addMessage(key, count);
    }

    public subMessage(key: string|number, count: number = 1) {
        if(count === 0) {
            return;
        }
        if(count < 0) {
            console.warn(`RedDotManager: subMessage count is less than 0, key: ${key}, count: ${count}`);
            return;
        }

        this._tree.addMessage(key, -count);
    }

    public clearMessage(key: string|number) {
        this._tree.clearMessage(key);
    }

    private bind(path: string, info: RedDotItemInfo, index = -1) {
        if (info.node) {
            this.unRegist(info.node, false);
        }

        let node = this._tree.getNodeByPath(path, index);
        node.userData = info;
        info.node = node;
        return node;
    }

    private _regist(path: string) {
        let node = this._tree.getNodeByPath(path);
        node.onChanged.add(this._internalHandleNodeChanged, this);
        this.refresh(path);
        return node;
    }

    refresh(path: string) {
        let node = this._tree.getNodeByPath(path);
        if (node) {
            this._internalHandleNodeChanged(node);
        }
    }

    unRegist(node: RedDotNode|string|number, destory = false) {
        if (typeof node === "string") {
            node = this._tree.getNodeByPath(node);
        } else if (typeof node === "number") {
            node = this._tree.getNode(node);
        }

        if (node) {
            let data = node.userData as RedDotItemInfo;
            if (data && data.reddot) {
                if (destory) {
                    data.reddot.dispose();
                    data.reddot = null;
                } else if(data.autoCreateReddot){
                    let url = data.reddotResUrl ?? this._defaultRedDotResUrl;
                    if(url) {
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
            }
            node.onChanged.remove(this._internalHandleNodeChanged, this);

            if (node.children) {
                for (let child of node.children) {
                    this.unRegist(child, destory);
                }
            }
        }
    }

    showRedDot(node: RedDotNode) {
        if (!node) {
            return;
        }

        if (!node.userData) {
            return;
        }

        let info = node.userData as RedDotItemInfo;
        let reddot = info.reddot as GComponent;
        if (reddot) {
            reddot.visible = true;
        }
    }

    hideRedDot(node: RedDotNode) {
        if (!node.userData) {
            return;
        }

        let info = node.userData as RedDotItemInfo;
        //@ts-ignore
        let reddot = info.reddot as GComponent;
        if (reddot) {
            reddot.visible = false;
        }
    }

    public refreshRedDot(path: string) {
        let node = this._tree.getNodeByPath(path);
        if (node) {
            let info = node.userData as RedDotItemInfo;
            let reddot = info.reddot as GComponent;
            if (reddot) {
                this.setPosition(reddot, info, false);
            }
        }
    }

    private setPosition(reddot: GComponent, info: RedDotItemInfo, add: boolean): void {
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
            
            Timer.inst.callLater(() => {
                let pos = info.holder.localToGlobal(x, y, new Vec2());
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

    private _internalShowReddot(node: RedDotNode, info: RedDotItemInfo) {
        if (info.onRender) {
            info.onRender(node, info);
        }
    }

    private _internalHandleNodeChanged(node: RedDotNode) {
        if (!node.userData) {
            return;
        }

        let info = node.userData as RedDotItemInfo;
        let reddot = info.reddot as GComponent;
        if (node.messageCount > 0) {
            if (reddot == null && info.autoCreateReddot) {
                const url = info.reddotResUrl ?? this._defaultRedDotResUrl;
                if(url) {
                    let reddotPool = compPool.get(url);
                    while ((reddot == null || reddot.isDisposed) && reddotPool && reddotPool.length > 0) {
                        reddot = reddotPool.pop();
                    }
    
                    if (!reddot) {
                        reddot = UIPackage.createObjectFromURL(url) as GComponent;
                    }
    
                    if (reddot) {
                        info.holder.addChild(reddot);
                        this.setPosition(reddot, info, true);
                        info.reddot = reddot;
                    }
                }
            }

            if (reddot) {
                reddot.visible = true;
                reddot.text = node.messageCount.toString();
            }
        } else if (reddot) {
            reddot.visible = false;
        }
        this._onReddotShown(node, info);

        console.log(`RedDotManager: ${node.path} changed, count: ${node.messageCount}`);
    }
}
