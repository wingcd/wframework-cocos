import { BaseModel } from "../../../framework/modules/base/BaseModel";

export class GuideModel extends BaseModel {
    // 已经完成的特殊块类型
    blockTips: Array<number> = [];
}