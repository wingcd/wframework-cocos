import { Collider, Game, IQuatLike, Quat, game, physics } from "cc";
import { EDITOR } from "cc/env";
let bt = null;

function cocos2BulletQuat (out: number, q: IQuatLike): number {
    bt.Quat_set(out, q.x, q.y, q.z, q.w);
    return out;
}

function patchPhysicsSystem () {
    bt = globalThis.Bullet;
    if (!bt) {
        return;
    }
    
    Object.defineProperty(Collider.prototype, '_rotation', {
        value: new Quat(),
        writable: true
    });
    
    Object.defineProperty(Collider.prototype, 'rotation', {
        get() {
            return this._rotation;
        },
        set(v) {
            Quat.copy(this._rotation, v);
            if (this._shape) {
                this._shape.setRotate(v);
            }
        }
    });

    let selector = physics.selector.wrapper;
    let bulletShape = selector.BoxShape.prototype.constructor.prototype.__proto__;

    const onLoad = bulletShape.onLoad;
    bulletShape.onLoad = function(): void {
        onLoad.call(this);

        this.updateRotate();
    }

    bulletShape.setRotate = function (q: IQuatLike): void {
        bt.Transform_getRotation(this.transform, this.quat);
        cocos2BulletQuat(this.quat, q);
        this.updateCompoundTransform();
    }

    bulletShape.updateRotate = function (): void {
        this.setRotate(this._collider.rotation);
    }
}

if(EDITOR) {
    game.once(Game.EVENT_POST_PROJECT_INIT, patchPhysicsSystem);
}else{
    game.once(Game.EVENT_GAME_INITED, patchPhysicsSystem);
}

export default null;