import { BaseModel } from "../../../framework/modules/base/BaseModel";

export class SettingsModel extends BaseModel {
    // 每日刷新时间
    daliyTime: number = 0;
    soundEnable: boolean = true;
    musicEnable: boolean = true;
    vibrateEnable: boolean = true;
    // 视频观看计数
    videoCount: number = 0;
}