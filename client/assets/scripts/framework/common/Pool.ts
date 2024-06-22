import { Mat4, Quat, Vec2, Vec3, Vec4 } from "cc";

export const V3_DOWN = Object.freeze(new Vec3(0, -1, 0));
export const V3_BACKWARD = Object.freeze(new Vec3(0, 0, 1));
export const V3_LEFT = Object.freeze(new Vec3(-1, 0, 0));

export const V2_UP = Object.freeze(new Vec2(0, 1));
export const V2_DOWN = Object.freeze(new Vec2(0, -1));
export const V2_RIGHT = Object.freeze(new Vec2(1, 0));
export const V2_LEFT = Object.freeze(new Vec2(-1, 0));

interface PoolType {
    set(...args: any[]): void;
}

class Pool<T extends PoolType> {
    private _pool: T[] = [];
    private _poolSize: number = 0;
    private _type: new () => T;

    constructor(type: new () => T) {
        this._type = type;
    }

    get(...args: any[]): T {
        if (this._poolSize > 0) {
            this._poolSize--;
            let val = this._pool.pop();
            val.set(...args);
            return val;
        }
        // @ts-ignore
        return new this._type(...args);        
    }

    put(v: T): void {
        this._pool.push(v);
        this._poolSize++;
    }

    puts(...vs: T[]): void {
        for (let i = 0; i < vs.length; i++) {
            this.put(vs[i]);
        }   
    }

    clear(): void {
        this._pool.length = 0;
        this._poolSize = 0;
    }
}

export const Vec2Pool = new Pool(Vec2);
export const Vec3Pool = new Pool(Vec3);
export const Vec4Pool = new Pool(Vec4);
export const QuatPool = new Pool(Quat);
export const Mat4Pool = new Pool(Mat4);