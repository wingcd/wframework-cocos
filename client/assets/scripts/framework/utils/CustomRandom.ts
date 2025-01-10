/**
 * 自定义随机
 * 输入seed,输出随机数，保证种子一样输出一样
 */
export class CustomRandom {
    private _seed: number = 0;

    constructor(seed: number = 0) {
        this._seed = seed;
    }

    public reset(seed: number = 0) {
        this._seed = seed;
    }

    public random(): number {
        // 利用seed生成下一个随机数
        this._seed = (this._seed * 9301 + 49297) % 233280;
        return this._seed / 233280.0;
    }

    public randomInt(min: number, max: number) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    public randomFloat(min: number, max: number) {
        return this.random() * (max - min) + min;
    }

    public randomList(list: any[], count: number) {
        let results: any[] = [];
        for (let i = 0; i < count; i++) {
            results.push(this.randomInt(0, list.length - 1));
        }
        return results;
    }
}
    

