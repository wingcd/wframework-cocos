import { BaseModel } from "../../../framework/modules/base/BaseModel";

export class UserModel extends BaseModel {
    refreshTime: number = 0;
    saveTime: number = 0;               // 上次存储时间
    version: string = '';
    nickName: string = '';   

    // 移除道具数量
    removeCount: number = 0;
    // 凑齐道具数量
    collectCount: number = 0;
    // 洗牌道具数量
    shuffleCount: number = 0;
    // 大火箭数量
    bigRocketCount: number = 0;
    // 大沙漏数量
    bigTImerCount: number = 0;

    // 成功次数
    successCount: number = 0;
    // 今日成功次数
    todaySuccessCount: number = 0;
    // 今日关卡成功次数
    todayCSuccessCount: number = 0;
    // 总成功次数
    totalSuccessCount: number = 0;         
    // 获取的动物id
    animals: AnimalInfo[] = [];
    // 今日挑战关卡ID
    todayChallengeID: number = 0;
    
    // 今日游戏次数
    todayPlayCount: number = 0;

    totalPlayCount: number = 0;
    // 今日普通关卡次数
    todayNormalPlayCount: number = 0;
    // 今日挑战次数
    todayChallengeCount: number = 0;
    // 连续通关次数
    continuePassCount: number = 0;
    // 今日分享能量次数
    todayShareForEnergyCount: number = 0;
    // 今日看视频能量次数
    todayVideoForEnergyCount: number = 0;
    // 每日礼包状态
    dailyGiftState: number = 0;
    // 七日签到进度
    sevenSignProgress: number = 0;
    // 七日签到状态
    sevenSignTodayState: number = 0;
    // 刷新动物ID，0-表示未使用刷新
    refreshAnimalId: number = 0;
    // 当日动物ID
    todayAnimalId: number = 0;
    // 当前关卡最大进度
    levelMaxProgress: number = 0;

    guideId: number = 0;

    // 订阅游戏圈状态
    subscribeStae: number = 0;
    // 收藏游戏状态
    favoriteState: number = 0;
    // 添加到桌面状态
    addToDesktopState: number = 0;
    // 给好评状态
    commentState: number = 0;

    // 关卡
    level: number = 1;
    // 体力
    energy: number = 0;
    // 体力回复时间戳s
    energyTimer: number = 0;                            
    // 金币
    gold: number = 0;
    // 星星
    star: number = 0;

    // 总购买次数
    totalGoodBuyCounts: {[key: number]: number} = {};
    // 今日购买次数
    todayGoodBuyCounts: {[key: number]: number} = {};
    // 首周奖励获取状态
    firstSevenAwardGot: number = 0;
    // 首日奖励获取状态
    firstDayAwardGot: number = 0;
    // 连胜分数
    continueWinScore: number = 0;
}

export class AnimalInfo {
    id: number = 0;
    getTime: number = 0;
}
