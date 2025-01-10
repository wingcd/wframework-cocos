import { EventCenter } from "../../../framework/common/EventCenter";
import { GameSettings } from "../../../framework/GameSettings";
import { BaseController } from "../../../framework/modules/base/BaseController";
import { SecretController, secretController } from "../../../framework/modules/base/SecretController";
import { systemController } from "../../../framework/modules/system/SystemController";
import { MathUtils } from "../../../framework/utils/MathUtils";
import { TimeUtils } from "../../../framework/utils/TimeUtils";
import { RewardData } from "../../config/ConfigExtension";
import { ConfigManager } from "../../config/ConfigManager";
import { GameConst } from "../../const/GameConst";
import { GameEvent } from "../../const/GameEvent";
import { EGameMode, EItemType, EResourceType, ERewardType } from "../../const/types";
import { userDAO } from "./UserDAO";
import { AnimalInfo } from "./UserModel";

class UserController extends BaseController {
    private _lastAnimalID = 0;

    public get lastAnimalID() {
        return this._lastAnimalID;
    }

    protected get dao() {
        return userDAO;
    }

    protected get model() {
        return this.dao.model;
    }

    get dataKey(): string {
        return "user";
    }

    get isNewUser() {
        return this.dao.isNewUser;
    }

    get saveTime() {
        return this.model.saveTime;
    }

    get nickName() {
        return this.model.nickName;
    }

    set nickName(value: string) {
        if (this.model.nickName != value) {
            this.model.nickName = value;
            this.dao.easySave();
        }
    }

    protected onInitial() {
        if(this.isNewUser || !TimeUtils.isToday(this.model.saveTime)) {
            this.refreshDaily();
        }

        EventCenter.I.on(GameEvent.SYSTEM_CROSS_DAY, this.refreshDaily, this);
        EventCenter.I.on(GameEvent.SYSTEM_CROSS_HOUR, this._onCrossHour, this);
        secretController.on(SecretController.SECRET_DAO_ON_SAVED, this.dao.updateTime, this.dao);
    }

    protected onUpdate(dt: number): void {
        this._checkEnergy();
    }

    private refreshDaily() {
        this.resetOnNewDay();
        this.dao.saveNow();
    }

    private _onCrossHour(h: number) {
        if(h == GameConst.ANIMAL_REFRESH_TIME) {
            this._lastAnimalID = this.model.todayAnimalId;
            this.model.refreshAnimalId = 0;
            this.model.todayAnimalId = 0;
            this.dao.easySave();
            EventCenter.I.emit(GameEvent.USER_DAILY_ANIMAL_CHANGED);
        }
    }

    get removeCount() {
        return this.model.removeCount;
    }

    addItem(type: EItemType, count = 1) {
        switch (type) {
            case EItemType.Remove:
                this.addRemove(count);
                break;
            case EItemType.Collect:
                this.addCollect(count);
                break;
            case EItemType.Shuffle:
                this.addShuffle(count);
                break;
            case EItemType.BigRocket:
                this.addBigRocket(count);
                break;
            case EItemType.BigTimer:
                this.addBigTimer(count);
                break
            default:
                break;
        }
    }

    /**
     * 随机添加一个道具
     */
    addRandomItem() {
        let list = [EItemType.Remove, EItemType.Collect, EItemType.Shuffle];
        let type = list[MathUtils.randomInt(0, list.length)];
        this.addItem(type);
        return type;
    }

    /**
     * 添加所有道具
     */
    addAllItems() {
        this.addRemove(1);
        this.addCollect(1);
        this.addShuffle(1);
    }
    
    addRemove(value: number) {
        if (value > 0) {
            this.model.removeCount += value;
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_REMOVE_COUNT_CHANGE, value);
        }else{
            console.error("addRemove value must be greater than 0");
        }
    }

    subRemove(value: number) {
        if (value > 0) {
            this.model.removeCount = Math.max(0, this.model.removeCount - value);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_REMOVE_COUNT_CHANGE, -value);
        }else{
            console.error("subRemove value must be greater than 0");
        }
    }

    get collectCount() {
        return this.model.collectCount;
    }

    addCollect(value: number) {
        if (value > 0) {
            this.model.collectCount += value;
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_COLLECT_COUNT_CHANGE, value);
        }else{
            console.error("addCollect value must be greater than 0");
        }
    }
    
    subCollect(value: number) {
        if (value > 0) {
            this.model.collectCount = Math.max(0, this.model.collectCount - value);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_COLLECT_COUNT_CHANGE, -value);
        }else{
            console.error("subCollect value must be greater than 0");
        }
    }

    get shuffleCount() {
        return this.model.shuffleCount;
    }

    addShuffle(value: number) {
        if (value > 0) {
            this.model.shuffleCount += value;
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_SHUFFLE_COUNT_CHANGE, value);
        }else{
            console.error("addShuffle value must be greater than 0");
        }
    }

    subShuffle(value: number) {
        if (value > 0) {
            this.model.shuffleCount = Math.max(0, this.model.shuffleCount - value);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_SHUFFLE_COUNT_CHANGE, -value);
        }else{
            console.error("subShuffle value must be greater than 0");
        }
    }

    get bigRocketCount() {
        return this.model.bigRocketCount;
    }

    addBigRocket(value: number) {
        if (value > 0) {
            this.model.bigRocketCount += value;
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_TOOL_COUNT_CHANGE, EItemType.BigRocket);
        }else{
            console.error("addBigRocket value must be greater than 0");
        }
    }

    subBigRocket(value: number) {
        if (value > 0) {
            this.model.bigRocketCount = Math.max(0, this.model.bigRocketCount - value);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_TOOL_COUNT_CHANGE, EItemType.BigRocket);
        }else{
            console.error("subBigRocket value must be greater than 0");
        }
    }

    get bigTimerCount() {
        return this.model.bigTImerCount;
    }

    addBigTimer(value: number) {
        if (value > 0) {
            this.model.bigTImerCount += value;
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_TOOL_COUNT_CHANGE, EItemType.BigTimer);
        }else{
            console.error("addBigTimer value must be greater than 0");
        }
    }

    subBigTimer(value: number) {
        if (value > 0) {
            this.model.bigTImerCount = Math.max(0, this.model.bigTImerCount - value);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_TOOL_COUNT_CHANGE, EItemType.BigTimer);
        }else{
            console.error("subBigTimer value must be greater than 0");
        }
    }

    get animalCount() {
        return this.model.animals.length;
    }

    get animals() {
        return this.model.animals;
    }

    addAnimal(id: number) {
        if (!this.hasAnimal(id)) {
            const info = new AnimalInfo();
            info.id = id;
            info.getTime = systemController.getTime();
            this.model.animals.push(info);
            this.dao.saveNow();

            EventCenter.I.emit(GameEvent.USER_ANIMAL_CHANGE, id);
        }
    }

    getAnimalInfo(id: number) {
        return this.model.animals.find(i=>i.id == id);
    }

    hasAnimal(id: number) {
        return this.model.animals.findIndex(i=>i.id == id) >= 0;
    }

    /**
     * 今日挑战模式免费次数
     */
    get challengeFreeCount() {
        if(!GameConst.ENABLE_AD) {
            return 3;
        }

        return Math.max(0, ConfigManager.settings.FREE_PLAY_COUNT - this.model.todayChallengeCount);
    }

    get levelMaxProgress() {
        return this.model.levelMaxProgress;
    }

    get todayChallengeID() {
        if(this.model.todayChallengeID == 0 || ConfigManager.ChallengeLevelTable.getItem(this.model.todayChallengeID) == null) {
            this.refrshTodayChallengeID();
        }

        return this.model.todayChallengeID;
    }

    private getTodayChallengeIndex() {        
        let day = TimeUtils.getDayTime(0) / 1000;
        let idx = day % ConfigManager.StageTable.items.length;
        return ConfigManager.StageTable.items[idx].ID;
    }

    private refrshTodayChallengeID() {
        this.model.todayChallengeID = this.getTodayChallengeIndex();
        this.dao.saveNow();
    }

    get totalPlayCount() {
        return this.model.totalPlayCount;
    }

    get todayPlayCount() {
        return this.model.todayPlayCount;
    }

    set todayPlayCount(value: number) {
        this.model.todayPlayCount = value;
        this.dao.saveNow();

        EventCenter.I.emit(GameEvent.USER_PLAY_COUNT_CHANGE);
    }

    get todayNormalPlayCount() {
        return this.model.todayNormalPlayCount;
    }

    set todayNormalPlayCount(value: number) {
        this.model.todayNormalPlayCount = value;
        this.dao.saveNow();
    }

    get todayChallengeCount() {
        return this.model.todayChallengeCount;
    }

    set todayChallengeCount(value: number) {
        this.model.todayChallengeCount = value;
        this.dao.saveNow();
    }

    get todaySuccessCount() {
        return this.model.todaySuccessCount;
    }

    get todayCSuccessCount() {
        return this.model.todayCSuccessCount;
    }

    get totalSuccessCount() {
        return this.model.totalSuccessCount;
    }

    get todayShareForEnergyCount() {
        return this.model.todayShareForEnergyCount;
    }

    addShareForEnergyCount() {
        this.model.todayShareForEnergyCount++;
        this.dao.saveNow();
    }

    get todayVideoForEnergyCount() {
        return this.model.todayVideoForEnergyCount;
    }

    addVideoForEnergyCount() {
        this.model.todayVideoForEnergyCount++;
        this.dao.saveNow();
    }

    get dailyGiftGetted() {
        return this.model.dailyGiftState == 1;
    }

    set dailyGiftGetted(value: boolean) {
        this.model.dailyGiftState = value ? 1 : 0;
        this.dao.saveNow();
    }

    get sevenSignProgress() {
        return this.model.sevenSignProgress;
    }

    get sevenSignDay() {
        return this.model.sevenSignProgress + 1;
    }

    get isSignToday() {
        return this.model.sevenSignTodayState == 1;
    }

    canRefreshTodayAnimal() {
        // 今日游戏成功次数小于n次
        if(this.todaySuccessCount < ConfigManager.settings.DAILY_REFRESH_LEVEL_COUNT) {
            return false;
        }

        return this.model.refreshAnimalId == 0;
    }

    get refreshAnimalId() {
        return this.model.refreshAnimalId;
    }

    set refreshAnimalId(value: number) {
        this.model.refreshAnimalId = value;
        this.dao.saveNow();
    }

    get todayAnimalId() {
        return this.model.todayAnimalId;
    }

    set todayAnimalId(value: number) {
        this.model.todayAnimalId = value;
        this.dao.saveNow();
    }

    /**
     * 七日签到
     */
    signTodayInSevenDay() {
        this.model.sevenSignTodayState = 1;
        this.model.sevenSignProgress++;
        this.dao.saveNow();
    }

    /**
     * 是否已经签到
     * @param day 
     * @returns 
     */
    isSignedInSevenDay(day: number) {
        return this.model.sevenSignProgress >= day;
    }

    private resetOnNewDay() {
        this.model.todaySuccessCount = 0;
        this.model.todayCSuccessCount = 0;
        this.model.todayPlayCount = 0;
        this.model.todayNormalPlayCount = 0;
        this.model.todayChallengeCount = 0;
        this.model.todayShareForEnergyCount = 0;
        this.model.todayVideoForEnergyCount = 0;
        this.model.dailyGiftState = 0;
        this.model.sevenSignTodayState = 0;
        this.model.todayGoodBuyCounts = {};    
        if(this.model.sevenSignProgress >= 7) {
            this.model.sevenSignProgress = 0;
        }
        this.refrshTodayChallengeID();
        this.dao.saveNow();

        EventCenter.I.emit(GameEvent.USER_PLAY_COUNT_CHANGE);
    }

    /**
     * 成功进入游戏
     */
    onEnterGame(mode: EGameMode) {
        // if(mode == EGameMode.Normal) {
        //     this.subEnergy(1);
        //     this.todayNormalPlayCount++;
        // }else if(mode == EGameMode.Challenge) {
        //     this.todayChallengeCount++;
        // }
        this.todayChallengeCount++;
        this.model.totalPlayCount++;
        this.todayPlayCount++;
        this.dao.saveNow();

        EventCenter.I.emit(GameEvent.USER_PLAY_COUNT_CHANGE);
    }

    get continuePassCount() {
        return this.model.continuePassCount;
    }

    get continueWinScore() {
        return this.model.continueWinScore;
    }

    set continueWinScore(value: number) {
        this.model.continueWinScore = value;
        this.dao.easySave();
    }

    /**
     * 游戏成功
     */
    onGameSuccess(mode: EGameMode) {
        this.model.successCount++;
        this.model.totalSuccessCount++;
        if(mode == EGameMode.Normal) {
            this.model.todaySuccessCount++;
            this.model.continuePassCount++;
        }else{
            this.model.todayCSuccessCount++;
        }
        this.model.levelMaxProgress = 0;
        this.dao.saveNow();
    }

    onGameFail(mode: EGameMode, progress: number) {
        if(mode == EGameMode.Normal) {
            this.model.levelMaxProgress = Math.max(this.model.levelMaxProgress, progress);
            this.model.continuePassCount = 0;
            this.model.continueWinScore = 0;
            this.dao.saveNow();
        }
    }

    /**
     * 获取今日关卡ID
     * @returns 
     */
    getTodayStageID() {
        let id = this.todayChallengeID;
        let cfg = ConfigManager.ChallengeLevelTable.getItem(id);
        let lvID = cfg.LevelID;
        let lvCfg = ConfigManager.getLevel(lvID);
        return lvCfg.StageID;        
    }

    get guideId() {
        return this.model.guideId;
    }

    set guideId(value: number) {
        this.model.guideId = value;
        this.dao.saveNow();
    }

    get subscribeState() {
        return this.model.subscribeStae;
    }

    set subscribeState(value: number) {
        this.model.subscribeStae = value;
        this.dao.saveNow();
    }

    get favoriteState() {
        return this.model.favoriteState;
    }

    set favoriteState(value: number) {
        this.model.favoriteState = value;
        this.dao.saveNow();
    }

    get addToDesktopState() {
        return this.model.addToDesktopState;
    }

    set addToDesktopState(value: number) {
        this.model.addToDesktopState = value;
        this.dao.saveNow();
    }

    get commentState() {
        return this.model.commentState;
    }   

    get level() {
        return this.model.level;
    }

    get energy() {
        return this.model.energy;
    }

    get gold() {
        return this.model.gold;
    }

    get star() {
        return this.model.star;
    }

    /**
     * 恢复体力的倒计时
     */
    get eneryCDLeftTime() {
        let cd = ConfigManager.settings.ENERGY_RECOVER_TIME * GameSettings.mergeTimeScale;
        let dt = (systemController.getTime() - this.model.energyTimer) % cd;
        return cd - dt;
    }

    get maxEnergy() {
        return ConfigManager.settings.MAX_RECOVER_ENERGY;
    }

    /**
     * 恢复体力
     */
    private _checkEnergy() {
        let dt = systemController.getTime() - this.model.energyTimer;
        let cd = ConfigManager.settings.ENERGY_RECOVER_TIME * GameSettings.mergeTimeScale;
        let count = Math.floor(dt / cd);
        let max = this.maxEnergy;
        count = Math.min(max - this.energy, count);
        if (count > 0) {
            this.addEnergy(count);
            this.model.energyTimer = systemController.getTime();
            this.dao.easySave();
        }
    }

    setLevel(val: number) {
        this.dao.setLevel(val);
    }
    
    // 增加关卡等级
    addLevel(val: number, delay?: boolean): boolean {
        let ret = this.dao.addLevel(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_LEVEL_CHANGED, this.level);
        }
        return ret;
    }

    // 增加金币
    addGold(val: number, delay?: boolean) {
        let ret = this.dao.addGold(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_GOLD_CHANGED, this.gold, delay);
        }
        return ret;
    }

    // 减少金币
    subGold(val: number) {
        let ret = this.dao.subGold(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_GOLD_CHANGED, this.gold);
        }
        return ret;
    }

    // 增加星星
    addStar(val: number, delay?: boolean) {
        let ret = this.dao.addStar(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_STAR_CHANGED, this.star, delay);
        }
        return ret;
    }

    // 减少星星
    subStar(val: number) {
        let ret = this.dao.subStar(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_STAR_CHANGED, this.star);
        }
        return ret;
    }

    // 增加体力
    addEnergy(val: number, delay?: boolean) {
        let ret = this.dao.addEnergy(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_ENERGY_CHANGED, this.energy, delay);
        }
        return ret;
    }

    // 减少体力
    subEnergy(val: number) {
        let ret = this.dao.subEnergy(val);
        if (ret) {
            EventCenter.I.emit(GameEvent.USER_ENERGY_CHANGED, this.energy);
        }
        return ret;
    }

    addRewards(awards: RewardData[]) {
        awards.forEach(award => {
            this.addReward(award);
        });
    }

    addReward(award: RewardData) {
        if (award.type == ERewardType.Resource) {
            this.addResource(award.id, award.count);
        } else if (award.type == ERewardType.Tool) {
            this.addItem(award.id, award.count);
        }
    }

    addTool(type: EItemType, val: number) {
        switch (type) {
            case EItemType.Remove:
                this.addRemove(val);
                break;
            case EItemType.Collect:
                this.addCollect(val);
                break;
            case EItemType.Shuffle:
                this.addShuffle(val);
                break;
            default:
                break;
        }
    }

    addResource(type: EResourceType, val: number) {
        switch (type) {
            case EResourceType.Gold:
                this.addGold(val);
                break;
            case EResourceType.Star:
                this.addStar(val);
                break;
            case EResourceType.Energy:
                this.addEnergy(val);
                break;
            default:
                break;
        }
    }

    getTodayGoodBuyCount(type: number) {
        return this.model.todayGoodBuyCounts[type] || 0;
    }

    onShopVideoBuy(type: number) {
        this.model.todayGoodBuyCounts[type] = (this.model.todayGoodBuyCounts[type] || 0) + 1;
        this.model.totalGoodBuyCounts[type] = (this.model.totalGoodBuyCounts[type] || 0) + 1;
        this.dao.saveNow();
    }

    get isFirstSevenAwardGot() {
        return !!this.model.firstSevenAwardGot;
    }

    get isFirstSevenAwardGotToday() {
        return TimeUtils.isToday(this.model.firstSevenAwardGot * 1000);
    }

    onGetSevenDayAwards() {
        if(this.model.firstSevenAwardGot == 0) {
            this.model.firstSevenAwardGot = systemController.getTime();
            this.dao.easySave();
        }
    }

    get isFirstDayAwardGot() {
        return !!this.model.firstDayAwardGot;
    }

    get isFirstDayAwardGotToday() {
        return TimeUtils.isToday(this.model.firstDayAwardGot * 1000);
    }

    onGetDailyGift() {
        this.dailyGiftGetted = true;
        if(this.model.firstDayAwardGot == 0) {
            this.model.firstDayAwardGot = systemController.getTime();
            this.dao.easySave();
        }
    }
}

export const userController = new UserController();