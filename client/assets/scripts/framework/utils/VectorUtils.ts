import { Vec2 } from "cc";

export class VectorUtils {
    public static project(a: Vec2, b: Vec2, out?: Vec2) : Vec2 {
        if (!out) out = new Vec2;
        out.set(a.x * b.x + a.y * b.y, a.x * b.y - a.y * b.x);
        return out;
    }
}