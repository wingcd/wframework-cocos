import { EventHandler } from "../../common/EventHandler";
import { RedDotTree } from "./RedDotTree";
import { TNode } from "./serialize";

export class RedDotNode {

    userData: any;

    private static _sKey = 1;
    private _selfMsgCount = 0;

    private _onChanged: EventHandler;
    private _tree: RedDotTree;
    private _key: number;
    private _name: string;
    private _path: string;
    private _parent: RedDotNode;
    private _children: RedDotNode[];
    private _level: number;

    private _dirty = false;
    private _messageCount = 0;
    private _internalOp = false;

    get onChanged() {
        if(!this._onChanged) {
            this._onChanged = new EventHandler;
        }

        return this._onChanged;
    }
    
    get tree() {
        return this._tree;
    }

    get key() {
        return this._key;
    }

    get name() {
        return this._name;
    }

    get path() {
        return this._path;
    }

    get parent() {
        return this._parent;
    }

    get children() {
        return this._children;
    }

    get level() {
        return this._level;
    }

    get messageCount() {
        if(!this._dirty) {
            return this._messageCount;
        }
        this._dirty = false;

        this._messageCount = this._selfMsgCount;
        for(let i=0;i<this._children.length;i++) {
            this._messageCount += this._children[i].messageCount;
        }

        return this._messageCount;
    }

    constructor(tree: RedDotTree, name?: string, path?: string, parent?: RedDotNode, userData?: any) {
        this._level = 0;
        this._tree = tree;
        this._name = name;
        this._path = path;
        this.userData = userData;
        this._key = RedDotNode._sKey++;
        this._children = [];
        if(parent != null && parent.children.indexOf(this) < 0) {
            parent.addChild(this);
        }
    }

    addChild(node: RedDotNode) {
        if(node == null || this.children.indexOf(node) >= 0) {
            return;
        }
        node.removeFromParent();

        this._children.push(node);
        node._parent = this;
        node._level = this._level + 1;
    }

    removeFromParent() {
        if(this._parent) {
            this._parent.removeChild(this);
        }
    }

    removeChild(node: RedDotNode) {
        let idx = this.children.indexOf(node);
        if(node == null || idx < 0) {
            return;
        }

        node._parent = null;
        node._level = 0;
        this.children.splice(idx, 1);
    }

    addMessage(count = 1) {
        this._selfMsgCount = Math.max(0, this._selfMsgCount + count);
        this.onDirty();
    }

    setMessage(count = 1) {
        this._selfMsgCount = Math.max(0, count);
        this.onDirty();
    }

    clearMessage() {
        this._selfMsgCount = 0;
        this.onDirty();
    }

    clearAllMessage() {
        this._internalOp = true;
        this.clearMessage();
        for(let i = 0;i<this.children.length;i++) {
            this.children[i].clearAllMessage();
        }
        this._internalOp = false;
        this.onDirty();
    }

    private onDirty() {
        this._dirty = true;
        if(this._internalOp) {
            return;
        }

        this.onChanged.fire(this);
        if(this._parent) {
            this._parent.onDirty();
        }
    }

    private toTNode(): TNode {
        let tnode = new TNode;
        tnode.key = this._key;
        tnode.name = this._name;
        tnode.parent = this._parent?.key ?? -1;
        tnode.selfCount = this._selfMsgCount;
        tnode.totalCount = this._messageCount;

        return tnode;
    }

    private fromTNode(node: TNode) {
        this._key = node.key;
        this._name = node.name;
        this._path = node.name;
        this._selfMsgCount = node.selfCount;
        this._messageCount = node.totalCount;
        if(node.parent != -1) {
            let p = this.tree.getNode(node.parent);
        }
    }

    tranverse(nodes: RedDotNode[]) {
        nodes.push(this);
        for(let i=0;i<this.children.length;i++) {
            let node = this.children[i];
            node.tranverse(nodes);
        }
    }

    convertToTNodes() {
        let nodes:RedDotNode[] = [];
        this.tranverse(nodes);
        let tnodes = nodes.map(i=>i.toTNode());
        tnodes.sort((a, b)=>{
            return a.key - b.key;
        });
        return tnodes;
    }

    static createNode(tree: RedDotTree, nodes: TNode[], onAddNode: (node:RedDotNode)=>void): RedDotNode {
        if(nodes == null || nodes.length == 0) return null;

        nodes.sort((a, b) => {
            return a.key - b.key;
        });

        let maxKey = -1;

        let root = new RedDotNode(tree);
        root.fromTNode(nodes[0]);

        for(let i=0;i<nodes.length;i++) {
            let node = new RedDotNode(tree);
            node.fromTNode(node[i]);

            maxKey = Math.max(node.key, maxKey);
            onAddNode || onAddNode(node);
        }

        this._sKey = Math.max(this._sKey, maxKey);

        return root;
    }
}