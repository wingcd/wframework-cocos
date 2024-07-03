import { instantiate, Node, Pool, Prefab, Vec2 } from "cc";
import { GComponent, GPathPoint, UIPackage } from "fairygui-cc"
import { IPoolable, PoolManager } from "./PoolManager"
import { ResManager } from "./ResManager";

export class CGPathPoint extends GPathPoint implements IPoolable {  
    createFromPool(data?: any) {

    }  
    fromPool() {
        this.x = 0;
        this.y = 0;
        this.control1_x = 0;
        this.control1_y = 0;
        this.control2_x = 0;
        this.control2_y = 0;
        this.curveType = 1;
    }
}
export const GPathPointPool = new PoolManager(CGPathPoint);

export class PoolableGComponent implements IPoolable {
    private _component: GComponent;

    get component() {
        return this._component;
    }

    createFromPool(url: any) {
        if(!this._component) {
            this._component = UIPackage.createObjectFromURL(url) as GComponent;
        }
        return this._component;
    }

    fromPool() {
        if(this._component) {
            this._component.visible = true;
        }
    }
    toPool() {
        if(this._component) {
            this._component.removeFromParent();
            this._component.visible = false;
        }
    }

}
export const GComponentPool = new PoolManager(PoolableGComponent);


export class PoolableNode implements IPoolable {
    private _node: Node;

    get node() {
        return this._node;
    }

    createFromPool(url: any) {
        if(!this._node) {
            let prefab = ResManager.getById(url, Prefab);
            this._node = instantiate(prefab);
        }
        return this._node;
    }

    fromPool() {
        if(this._node) {
            this._node.active = true;
        }
    }
    
    toPool() {
        if(this._node) {
            this._node.removeFromParent();
            this._node.active = false;
        }
    }

}
export const UINodePool = new PoolManager(PoolableNode);