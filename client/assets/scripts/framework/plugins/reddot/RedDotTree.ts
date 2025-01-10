import { RedDotNode } from "./RedDotNode";
import { TTree } from "./serialize";

export class RedDotTree {
    private _keyNodes: {[key: number]: RedDotNode} = {};
    private _pathNodes: {[path: string]: RedDotNode} = {};

    private _root: RedDotNode = null;
    get root() {
        return this._root;
    }

    constructor() {
        this._root = new RedDotNode(this, "root", "");

        this._keyNodes[this._root.key] = this._root;
        this._pathNodes[this._root.path] = this._root;
    }

    printTree() {
        let sb = [`---${this._root.name}:${this._root.messageCount}---`];
        if(this.root.children.length > 0) {
            let nodes = this.root.children;
            this.print(sb, nodes);
        }

        console.log(sb.join());
    }

    private print(sb: string[], nodes: RedDotNode[]) {
        sb.push("\r\n\r\n");

        let subnodes:RedDotNode[] = [];
        let list:RedDotNode[] = [];
        var maxChildCnt = 0;
        nodes.forEach(item=>{
            maxChildCnt = Math.max(item?.children.length||0, 0);
        });

        for(let i=0;i<nodes.length;i++) {
            let child = nodes[i];
            if(child != null) {
                sb.push(`---${child.name}:${child.messageCount}---`);
            }else{
                sb.push("----");
            }

            for(let j=0;j<maxChildCnt;j++) {
                if(child && j < child.children.length) {
                    list.push(child.children[j]);
                }else{
                    list.push(null);
                }
            }
        }

        if(list.length > 0) {
            this.print(sb, list);
        }
    }

    addMessage(key: number|string, count = 1) {
        let node = this.getNode(key);
        if(node == null) {
            throw `can not find node which key equal to ${key}`;
        }

        node.addMessage(count);
    }

    setMessage(key: number|string, count = 1) {
        let node = this.getNode(key);
        if(!node) {
            throw `can not find node which key equal to ${key}`;
        }

        node.setMessage(count);
    }

    clearMessage(key: number|string) {
        let node = this.getNode(key);
        if(node == null) {
            throw `can not find node which key equal to ${key}`;
        }

        node.clearMessage();
    }

    clearAllMessage(key: number|string) {
        let node = this.getNode(key);
        if(node == null) {
            throw `can not find node which key equal to ${key}`;
        }

        node.clearAllMessage();
    }

    addNode(path: string, userData?: any, index = -1): RedDotNode {
        if(!(path.trim())) {
            throw "path can not be empty";
        }

        path = RedDotTree.getChildPath(path, index);
        let n = this.getNodeByPath(path);
        if(n) {
            n.userData = userData;
            return n;
        }

        let strs = path.split('.');
        let baseNode = this._root;
        let subPath = [];
        for(let i=0;i<strs.length;i++) {
            let name = strs[i];
            if(i > 0) {
                subPath.push(".");
            }
            subPath.push(name);

            let spath = subPath.join();
            let node = this.getNodeByPath(spath);
            let last = i == strs.length - 1;
            if(!node) {
                node = new RedDotNode(this, name, spath, baseNode, last ? userData : null);

                this._keyNodes[node.key] = node;
                this._pathNodes[spath] = node;
            }else {
                node.userData = userData;
            }

            baseNode = node;
        }

        return baseNode;
    }

    removeNode(node: RedDotNode) {
        if(node) {
            if(node.parent) {
                node.parent.removeChild(node);
            }

            delete this._keyNodes[node.key];
            delete this._pathNodes[node.path];
        }
    }

    removeNodeByPath(path: string, index = -1) {
        path = RedDotTree.getChildPath(path, index);
        let node = this.getNodeByPath(path);
        this.removeNode(node);
    }

    removeNodeByKey(key: number) {
        let node = this.getNode(key);
        this.removeNode(node);
    }

    getNode(key: number | string): RedDotNode {
        if(typeof key == "string") {
            return this.getNodeByPath(key);
        }
        return this._keyNodes[key];
    }

    getNodeByPath(path: string, index = -1): RedDotNode {
        path = RedDotTree.getChildPath(path, index);
        return this._pathNodes[path];
    }

    serialize(): string {
        let tree = new TTree();
        tree.nodes = this.root.convertToTNodes();
        return JSON.stringify(tree);
    }

    deserialize(data: string) {
        let tree = JSON.parse(data);

        this._keyNodes = {};
        this._pathNodes = {};

        let root = RedDotNode.createNode(this, tree.nodes, (node)=>{
            this._keyNodes[node.key] = node;
            this._pathNodes[node.path] = node;
        });
    }

    public static getChildPath(path: string, index: number): string {
        if (index < 0){
            return path;
        }
        return `${path}.${index}`;
    }
}