import { Camera, director, Node, renderer, UITransform, Vec2, Vec3, view } from "cc";
import { Vec2Pool, Vec3Pool } from "../common/Pool";
import { GRoot } from "fairygui-cc";
import { GObject } from "fairygui-cc";

var s_vec2 = new Vec2;
var s_vec3 = new Vec3;
var s_vec3_2 = new Vec3;

export class SpaceUtils {
    static convertTouchLocationToNodeSpaceAR(pos: Vec2, node: Node, outPos?: Vec3, nodeCamera?: Camera) {       
        var camera = nodeCamera ? nodeCamera.camera : director.root!.batcher2D.getFirstRenderCamera(node);

        s_vec3_2.set(pos.x, pos.y, 0);
        camera.screenToWorld(s_vec3, s_vec3_2);
        node._uiProps.uiTransformComp.convertToNodeSpaceAR(s_vec3, s_vec3_2);
        if(!outPos) {
            outPos = new Vec3;
        }
        outPos.set(s_vec3_2);

        return outPos;
    }

    static convertTouchLocationToGRoot(pos: Vec2, node: Node, outPos?: Vec2, nodeCamera?: Camera) {   
        let vec3 = Vec3Pool.get();    
        this.convertTouchLocationToNodeSpaceAR(pos, node, vec3, nodeCamera);
        let vec2 = Vec2Pool.get(vec3.x, vec3.y);
        this.cnode2groot(vec2, node, vec2);
        if(!outPos) {
            outPos = new Vec2;
        }
        outPos.set(vec2);

        Vec3Pool.put(vec3);
        Vec2Pool.put(vec2);
        return outPos;
    }

    static convertToNodeSpace(pos: Vec3, sourceNode: Node, targetNode: Node, outPos?: Vec3) {       
        if(!outPos) {
            outPos = new Vec3;
        }
        outPos.set(s_vec3);
        sourceNode.updateWorldTransform();
        targetNode.updateWorldTransform();
        
        sourceNode._uiProps.uiTransformComp.convertToWorldSpaceAR(pos, outPos);
        targetNode._uiProps.uiTransformComp.convertToNodeSpaceAR(outPos, outPos);

        return outPos;
    }
    
    private static grootYFlip(gpos: Vec2, outpos?: Vec2): Vec2 {
        s_vec3.set(gpos.x, GRoot.inst.height - gpos.y, 0);
        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3.x, s_vec3.y);
        return outpos;
    }

    static groot2Screen(gpos: Vec2, outpos?: Vec2) {
        outpos = this.grootYFlip(gpos, outpos);

        s_vec3.set(outpos.x, outpos.y, 0);
        var camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node) as renderer.scene.Camera;
        camera.worldToScreen(s_vec3, s_vec3);
        outpos.set(s_vec3.x, s_vec3.y);

        return outpos;
    }

    static groot2cnode(gpos: Vec2, node: Node, outpos?: Vec2): Vec2 {
        var camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node);

        s_vec3.set(gpos.x, GRoot.inst.height - gpos.y, 0);
        camera.worldToScreen(s_vec3_2, s_vec3);

        camera = director.root!.batcher2D.getFirstRenderCamera(node);
        camera.screenToWorld(s_vec3, s_vec3_2);
        node.updateWorldTransform();
        node.getComponent(UITransform).convertToNodeSpaceAR(s_vec3, s_vec3_2);

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3_2.x, s_vec3_2.y);

        return outpos;
    }

    static cnode2fnode(npos: Vec2, node: Node, fnode: GObject, outpos?: Vec2) {
        this.cnode2groot(npos, node, outpos);        
        outpos.y -= GRoot.inst.height;
        fnode.globalToLocal(outpos.x+fnode.width*fnode.pivotX, outpos.y+fnode.height*fnode.pivotY, outpos);
        return outpos;
    }

    static world2groot(node: Node, camera: Camera, outpos?: Vec2, offset?: Vec3): Vec2 {
        node.updateWorldTransform();
        node.getWorldPosition(s_vec3);
        if(offset) {
            s_vec3.add(offset);
        }
        camera.convertToUINode(s_vec3, GRoot.inst.node, s_vec3);
        s_vec3.y = -s_vec3.y;

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec3.x, s_vec3.y);

        return outpos;
    }

    static groot2world(gpos: Vec2, camera: Camera, outpos?: Vec3, offset?: Vec3): Vec3 {
        s_vec2.set(gpos.x, gpos.y);
        this.groot2Screen(s_vec2, s_vec2);
        // let viewSize = view.getVisibleSize();
        // s_vec2.y = viewSize.height * 0.5 - s_vec2.y;
        s_vec3.set(s_vec2.x, s_vec2.y, 0);
        camera.screenToWorld(s_vec3, s_vec3);
        if(offset) {
            s_vec3.add(offset);
        }
        if(!outpos) {
            outpos = new Vec3;
        }
        outpos.set(s_vec3);
        return outpos;
    }

    static cnode2groot(npos: Vec2, node: Node, outpos?: Vec2): Vec2 {
        var camera = director.root!.batcher2D.getFirstRenderCamera(node);

        s_vec3_2.set(npos.x, npos.y);
        node.updateWorldTransform();
        node.getComponent(UITransform).convertToWorldSpaceAR(s_vec3_2, s_vec3);
        camera.worldToScreen(s_vec3_2, s_vec3);

        camera = director.root!.batcher2D.getFirstRenderCamera(GRoot.inst.node);
        camera.screenToWorld(s_vec3, s_vec3_2);
        s_vec2.set(s_vec3.x, GRoot.inst.height - s_vec3.y);   

        if(!outpos) {
            outpos = new Vec2;
        }
        outpos.set(s_vec2);

        return outpos;
    }

    /**
     * 获取节点的中心世界坐标系坐标值
     * @param node 
     * @param outPos 
     * @returns 
     */
    static getNodeCenterInWorld(node: Node, outPos?: Vec3) {
        let tr = node._uiProps.uiTransformComp;
        let temp = Vec3Pool.get();
        temp.set(tr.width * (0.5-tr.anchorX), tr.height * (0.5-tr.anchorY));
        tr.convertToWorldSpaceAR(temp, temp);  
        outPos.set(temp.x, temp.y, temp.z);
        Vec3Pool.put(temp);
        return outPos;
    }

    /**
     * 获取节点的中心坐标
     * @param go 
     * @param outPos 
     * @returns 
     */
    static getGObjectCenterPos(go: GObject, outPos?: Vec2): Vec2 {
        let x = go.pivotAsAnchor ? go.width * (0.5 - go.pivotX) : go.width * 0.5;
        let y = go.pivotAsAnchor ? go.height * (0.5 - go.pivotY) : go.height * 0.5;
        if (!outPos) {
            outPos = new Vec2();
        }
        outPos.set(x, y);
        return outPos;
    }  
}