import { Vec3 } from "cc";
import { Vec3Pool } from "../common/Pool";

export class MathUtils {   

    /**
     * 返回一个随机整数
     * @param min 最小数，左闭
     * @param max 最大数，右闭
     */
    static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /** 随机返回一个数组成员 */
    static randOneList<T>(list: T[]): T {
        let results: T;
        results = list[this.randomInt(0, list.length - 1)];
        return results;
    }

    /**
     * 判定是否满足随机条件
     * @param weight 权重
     * @param totalWeight 总权重 
     * @returns 
     */
    static randRequest(weight: number, totalWeight: number): boolean {
        return Math.random() * totalWeight <= weight;
    }

    /**
     * 通过权重随机一个
     * @param weightList 
     * @returns 
     */
    static randomByWeight(weightList: number[]) {
        let totalWeight = 0;
        for (let i = 0; i < weightList.length; i++) {
            totalWeight += weightList[i];
        }
        let rand = Math.random() * totalWeight;
        let index = 0;
        for (let i = 0; i < weightList.length; i++) {
            if (rand <= weightList[i]) {
                index = i;
                break;
            }
            rand -= weightList[i];
        }
        return index;
    }

    public static listWeightSelect<T>(source: readonly T[], key: string = "weight"): T {
        let sum = 0;
        for (const itr of source) {
            sum += itr[key];
        }

        let random = Math.random() * sum;
        for (const itr of source) {
            if (random <= itr[key]) {
                return itr;
            }

            random = random - itr[key];
        }
        return source[0];
    }

    public static randomArray<T>(source: T[], count: number) {
        let temp = source.slice();
        const result: T[] = [];
        while (count > 0) {
            const index = Math.floor(Math.random() * temp.length);
            result.push(temp[index]);
            temp.splice(index, 1);
            count--;
        }
        return result;
    }

    public static shuffle<T>(arr: T[]) {
        const result: T[] = [];
        while (arr.length > 0) {
            const rdm = Math.floor(Math.random() * arr.length);
            result.push(arr[rdm]);
            arr.splice(rdm, 1);
        }
        return result;
    }
    
    static seededRandom = function(min:number, max:number, seed: number) {
        max = max || 1;
        min = min || 0;
        
        seed = (seed * 9301 + 49297) % 233280;
        let rnd = seed / 233280.0;

        return min + rnd * (max - min);
    }

    public static seededRandomInt(min: number, max: number, seed: number) {
        return Math.floor(this.seededRandom(min, max, seed));
    }    

    public static remap(x: number, t1: number, t2: number, s1: number, s2: number) {
        return (s2 - s1) / (t2 - t1) * (x - t1) + s1;
    }

    public static bezier3(p0:Vec3, p1: Vec3, p2: Vec3, t: number, out?: Vec3)
    {
        p0 = Vec3Pool.get(p0.x, p0.y, p0.z);
        p1 = Vec3Pool.get(p1.x, p1.y, p1.z);

        let result = Vec3Pool.get(0, 0, 0);
        result.x = Math.pow(1 - t, 2) * p0.x + 2 * t * (1 - t) * p1.x + Math.pow(t, 2) * p2.x;
        result.y = Math.pow(1 - t, 2) * p0.y + 2 * t * (1 - t) * p1.y + Math.pow(t, 2) * p2.y;
        result.z = Math.pow(1 - t, 2) * p0.z + 2 * t * (1 - t) * p1.z + Math.pow(t, 2) * p2.z;

        Vec3Pool.put(p0);
        Vec3Pool.put(p1);
        Vec3Pool.put(result);

        if(out) {
            out.set(result);
        }
        return result;
    }

    // 三阶曲线
    public static bezier4(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number, out?: Vec3)
    {
        p0 = Vec3Pool.get(p0.x, p0.y, p0.z);
        p1 = Vec3Pool.get(p1.x, p1.y, p1.z);
        p2 = Vec3Pool.get(p2.x, p2.y, p2.z);
        p3 = Vec3Pool.get(p3.x, p3.y, p3.z);

        let result = Vec3Pool.get(0, 0, 0);
        result.x = Math.pow(1 - t, 3) * p0.x + 3 * t * Math.pow(1 - t, 2) * p1.x + 3 * Math.pow(t, 2) * (1 - t) * p2.x + Math.pow(t, 3) * p3.x;
        result.y = Math.pow(1 - t, 3) * p0.y + 3 * t * Math.pow(1 - t, 2) * p1.y + 3 * Math.pow(t, 2) * (1 - t) * p2.y + Math.pow(t, 3) * p3.y;
        result.z = Math.pow(1 - t, 3) * p0.z + 3 * t * Math.pow(1 - t, 2) * p1.z + 3 * Math.pow(t, 2) * (1 - t) * p2.z + Math.pow(t, 3) * p3.z;

        Vec3Pool.put(p0);
        Vec3Pool.put(p1);
        Vec3Pool.put(p2);
        Vec3Pool.put(p3);
        Vec3Pool.put(result);

        if(out) {
            out.set(result);
        }
        return result;
    }
}