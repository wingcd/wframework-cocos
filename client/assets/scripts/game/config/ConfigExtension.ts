import { EDirection, EOrderColor, ERewardType } from "../const/types";

export class Order {
    public color: EOrderColor = EOrderColor.Red;
    public dir: EDirection = EDirection.LEFT;
    public exitGridIndex: number = 0;
}

export class LevelRandomData {
    // 随机种子
    seed: number = 0;
    // 出口数量
    exitCount: number = 0;
    // 颜色数量
    colorCount: number = 0;
    // 预定数量
    itemCount: number = 0;
    // 障碍数量
    stackCount: number = 0;

    public toString() {
        return `${this.seed},${this.exitCount},${this.colorCount},${this.itemCount},${this.stackCount}`;
    }

    public parse(str: string) {
        let arr = str.split(',');
        this.seed = parseInt(arr[0]);
        this.exitCount = parseInt(arr[1]);
        this.colorCount = parseInt(arr[2]);
        this.itemCount = parseInt(arr[3]);
        this.stackCount = parseInt(arr[4]);
    }
}

export class RewardData {
    public type: ERewardType;
    public id: number;
    public count: number;

    static create(type: ERewardType, id: number, count: number) {
        let data = new RewardData();
        data.type = type;
        data.id = id;
        data.count = count;
        return data;
    }
}