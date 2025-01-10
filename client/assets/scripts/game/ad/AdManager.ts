import { ALIPAY, PREVIEW } from "cc/env";
import { PlatformHelper } from "../../framework/platform/PlatformHelper";
import { AdConfig, AdItem, EAdType, EWeightMode, ShareInfo, VideoInfo } from "./AdConfig";
import { GameConst } from "../const/GameConst";
import { EventCenter } from "../../framework/common/EventCenter";
import { SoundManager } from "../../framework/common/SoundManager";

const DefaultVideoShareInfo = new VideoInfo();
export class AdManager {
    public static SHARE_OR_VIDEO_DONE = "ad_share_or_video_done";
    private _lastInvokeTime: number = 0;
    private _customAd: WechatMinigame.CustomAd;
    private _interstitialAd: WechatMinigame.InterstitialAd;
    private _bannerAd: WechatMinigame.BannerAd;

    private static _instance: AdManager;
    public static get instance() {
        if (!this._instance) {
            this._instance = new AdManager();
        }
        return this._instance;
    }

    private _adConfig: AdConfig;
    init(config?:AdConfig) {
        if(!config) {
            config = new AdConfig();
        }

        this._adConfig = config;

        const withAD = !!config.rewardVideoAdUnitId;
        for(let item of config.adItems) {
            if(item.weightMode === EWeightMode.Sequence) {
                item.shareInfos = item.shareInfos || [];
                item.shareWeight = item.shareWeight || 0;
        
                if(!withAD) {
                    item.videoWeight = 0;
                }else{                    
                    item.videoWeight = item.videoWeight || 0;   
                }
            }
        }

        PlatformHelper.initial(config)
        PlatformHelper.onShareAppMessage((res) => {
            let info = this.randomAdInfo("on_share") as ShareInfo;
            let title = this.getShareTitle(info);
            let imageInfo = this.getShareImage(info);
            return {
                title: title,
                imageUrlId: imageInfo.imageUrlId,
                imageUrl: imageInfo.imageUrl,
            };
        });
        PlatformHelper.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'],
        });   
        
        this.initCustomAd();
        this.initBannerAd();
        this.initInterstitialAd();
    }

    /**
     * 设置Banner广告是否显示
     * @param visible 
     */
    public setBannerAdVisible(visible: boolean) {
        if(!PlatformHelper.isEnable) {
            return;
        }

        if(this._bannerAd) {
            if(visible) {
                this._bannerAd.show();
            }
            else {
                this._bannerAd.hide();
            }
        }else if(this._customAd) {
            if(visible) {
                this._customAd.show();
            }
            else {
                this._customAd.hide();
            }
        }
    }

    private initBannerAd() {
        if(!PlatformHelper.isEnable) {
            return;
        }

        if(this._adConfig.bannerAdUnitId) { 
            let sysInfo = PlatformHelper.getSystemInfoSync(); 
            if(ALIPAY) {
                let width = sysInfo.windowWidth * 0.8;
                let height = width * 0.6;
                let left = (sysInfo.windowWidth - width) / 2;
                let top = sysInfo.windowHeight - height;
                this._bannerAd = PlatformHelper.createBannerAd({
                    adUnitId: this._adConfig.customAdUnitId,
                    adIntervals: 30,
                    // @ts-ignore
                    style: {
                        left,
                        top,
                        width: width,
                        height: height,
                    },
                });  
            }else{
                let width = sysInfo.windowWidth;
                let height = width * 0.6;
                let left = (sysInfo.windowWidth - width) / 2;
                let top = sysInfo.windowHeight - height;
                this._bannerAd = PlatformHelper.createBannerAd({
                    adUnitId: this._adConfig.customAdUnitId,
                    adIntervals: 30,
                    // @ts-ignore
                    style: {
                        left,
                        top,
                        width: width,
                        height: height,
                    },
                });  
                this._bannerAd.onLoad(()=>{
                    this._bannerAd.style.top = sysInfo.windowHeight - (this._bannerAd.style.realHeight || 120);
                    this._bannerAd.style.left = (sysInfo.windowWidth - this._bannerAd.style.realWidth || 0) / 2;
                });
            }
        }
    }

    private initCustomAd() {
        if(!PlatformHelper.isEnable) {
            return;
        }

        if(this._adConfig.customAdUnitId) {  
            let sysInfo = PlatformHelper.getSystemInfoSync();
            if(ALIPAY) {                
                let width = sysInfo.windowWidth * 0.8;
                let height = width * 0.6;
                let left = (sysInfo.windowWidth - width) / 2;
                let top = sysInfo.windowHeight - height;
                this._bannerAd = PlatformHelper.createBannerAd({
                    adUnitId: this._adConfig.customAdUnitId,
                    adIntervals: 30,
                    // @ts-ignore
                    style: {
                        left,
                        top,
                        // @ts-ignore
                        width: width,
                    },
                });     
            }else{
                let left = (sysInfo.windowWidth - 360) / 2;
                this._customAd = PlatformHelper.createCustomAd({
                    adUnitId: this._adConfig.customAdUnitId,
                    adIntervals: 30,
                    style: {
                        fixed: true,
                        left,
                        top: sysInfo.windowHeight - 110,
                        // @ts-ignore
                        width: sysInfo.windowWidth,
                    },
                });
                this._customAd.onLoad((r) => {
                    // @ts-ignore
                    this._customAd.style.top = sysInfo.windowHeight - (this._customAd.style.realHeight || 120);
                    // @ts-ignore
                    this._customAd.style.left = (sysInfo.windowWidth - this._customAd.style.realWidth || 0) / 2;
                });
                console.log("create banner ad", this._customAd);
            }          
        }
    }

    private initInterstitialAd(show: boolean = false) {
        if(!GameConst.ENABLE_AD) {
            return;
        }

        if(this._adConfig.interstitialAdUnitId) {
            this._interstitialAd = PlatformHelper.createInterstitialAd({
                adUnitId: this._adConfig.interstitialAdUnitId,
            });
            if(this._interstitialAd) {
                this._interstitialAd.onLoad(() => {
                    console.log("interstitial ad load");
                    if(show) {
                        this.showInterstitialAd();
                    }
                });
                this._interstitialAd.onError((err) => {
                    console.error("interstitial ad error:", JSON.stringify(err));
                    this._interstitialAd.destroy();
                    this._interstitialAd = null;
                });
                this._interstitialAd.onClose((t) => {
                    console.log("interstitial ad close", JSON.stringify(t));
                    this._interstitialAd.destroy();
                    this._interstitialAd = null;
                    this.initInterstitialAd();
                });                
                this._interstitialAd.load();
            }
            console.log("create interstitial ad", this._interstitialAd);
        }
    }

    public showInterstitialAd() {
        if(!this._interstitialAd) {
            this.initInterstitialAd(true);
            return;
        }

        if(this._interstitialAd) {
            this._interstitialAd.show()
                .then(() => {
                    console.log("show interstitial ad success");
                    this._interstitialAd.load();
                })
                .catch((err) => {
                    console.error("show interstitial ad error:", JSON.stringify(err));
                    this._interstitialAd.destroy();
                    this._interstitialAd = null;
                    this.initInterstitialAd(true);
                });
        }
    }

    private getShareTitle(info: ShareInfo) {
        return info.title || this._adConfig.shareTitles[Math.floor(Math.random() * this._adConfig.shareTitles.length)];
    }

    private getShareImage(info: ShareInfo): {imageUrl?: string, imageUrlId?: string} {
        let hasImage = info.imageUrl || info.imageUrlId;
        if(hasImage) {
            return info;
        }
        
        let idx = Math.floor(Math.random() * this._adConfig.shareImages.length);
        return this._adConfig.shareImages[idx];
    }

    
    getSharesByType(type: number) {
        return this._adConfig.shareInfos.filter((shareInfo) => shareInfo.type === type);
    }

    getAdItemByKey(key: string) {
        let item = this._adConfig.adItems.find((adItem) => adItem.key === key);
        if(!item) {
            console.error("no ad item, key:", key);
            item = this._adConfig.adItems[0];
        }
        return item;
    }

    randomAdInfo(key: string) {
        let adItem = this.getAdItemByKey(key);
        if(!adItem) {
            return null;
        } 
        const weightMode = adItem.weightMode;
        if(weightMode === EWeightMode.None || !this._adConfig.rewardVideoAdUnitId) {
            if(adItem.shareWeight == 0 || !adItem.shareInfos || adItem.shareInfos.length == 0) {
                if(!this._adConfig.rewardVideoAdUnitId) {
                    return this._adConfig.defaultShareAd;
                }
                return DefaultVideoShareInfo;
            }

            let shareIdx = Math.floor(Math.random() * adItem.shareInfos.length);
            let idx = adItem.shareInfos[shareIdx];
            return this._adConfig.shareInfos[idx];
        } else if(weightMode === EWeightMode.Random) {
            return this.randomAdInfoByRandom(adItem);
        } else if(weightMode === EWeightMode.Sequence) {
            return this.randomAdInfoBySequence(adItem);
        }       
    }

    private randomAdInfoByRandom(adItem: AdItem) {
        const shareWeight = adItem.shareWeight || 0;
        const videoWeight = adItem.videoWeight || 0;
        const totalWeight = shareWeight + videoWeight;        
        let random = Math.random() * totalWeight;
        if(random <= shareWeight) {
            // 分享
            let shareIdx = Math.floor(Math.random() * adItem.shareInfos.length);
            let adInfo = adItem.shareInfos[shareIdx];
            return this._adConfig.shareInfos[adInfo] || this._adConfig.shareInfos[0];
        }
        return DefaultVideoShareInfo;
    }

    private nextSequenceValue(key: string) {
        return this._getSequenceValue(key, false);
    }

    /**
     * 顺序获取下一个广告类型
     * @param key 
     * @param peek  
     * @returns EAdType
     */
    private _getSequenceValue(key: string, peek: boolean = true) {
        const saveKey = "ad_sequence_" + key;

        let needSave = false;
        let storageValue = localStorage.getItem(saveKey);
        let sequence: number[] = JSON.parse(storageValue || "[]");
        if(sequence.length === 0) {
            let item = this._adConfig.adItems.find((item) => item.key === key);
            if(!item) {
                console.error("no ad item, key:", key);
                return null;
            }

            const videoWeight = item.videoWeight || 0;
            const shareWeight = item.shareWeight || 0;

            for(let i = 0; i < shareWeight; i++) {
                sequence.push(EAdType.Share);
            }
            for(let i = 0; i < videoWeight; i++) {
                sequence.push(EAdType.Video);
            }
            for(let i = 0; i < sequence.length; i++) {
                let j = Math.floor(Math.random() * sequence.length);
                let tmp = sequence[i];
                sequence[i] = sequence[j];
                sequence[j] = tmp;
            }
            needSave = true;
        }
        let value = peek ? sequence[0] : sequence.shift();
        if(!peek || needSave) {
            localStorage.setItem(saveKey, JSON.stringify(sequence));
        }
        return value;
    }

    public peekNextAdType(key: string) {
        let type = this._getSequenceValue(key, true) as EAdType;
        return type;        
    }

    private randomAdInfoBySequence(adItem: AdItem) {
        const type = this._getSequenceValue(adItem.key, true) as EAdType;
        if(type === EAdType.Share) {
            let shareIdx = Math.floor(Math.random() * adItem.shareInfos.length);
            let adInfo = adItem.shareInfos[shareIdx];
            return this._adConfig.shareInfos[adInfo];
        }
        return DefaultVideoShareInfo;
    }

    public shareOrVideo(config: {
        key: string, 
        done?: (success: boolean, type: EAdType)=>void, 
        moniterTime?: boolean
    }) {
        if(!GameConst.ENABLE_AD) {
            config.done?.(true, EAdType.None);
            return;
        }

        let now = Date.now();
        if(now - this._lastInvokeTime < 500) {
            console.log("invoke too fast");
            return;
        }
        this._lastInvokeTime = now;

        let adItem = this.getAdItemByKey(config.key);
        let adInfo = this.randomAdInfo(config.key);
        if(adInfo) {
            if(adInfo.adType == EAdType.Video) {
                TD.event({
                    id: "watch_video",
                    params: {
                        key: config.key,
                        result: "start"
                    }
                });

                SoundManager.instance.pauseAll();
                PlatformHelper.showRewardedVideoAd({
                    success: () => {
                        SoundManager.instance.resumeAll();

                        if(adItem.weightMode === EWeightMode.Sequence) {
                            this.nextSequenceValue(config.key);
                        }

                        EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Video, true);
                        config.done?.(true, EAdType.Video);

                        TD.event({
                            id: "watch_video",
                            params: {
                                key: config.key,
                                result: "success"
                            }
                        });
                    },
                    fail: () => {
                        SoundManager.instance.resumeAll();
                        
                        EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Video, false);
                        config.done?.(false, EAdType.Video);                        

                        TD.event({
                            id: "watch_video",
                            params: {
                                key: config.key,
                                result: "fail"
                            }
                        });
                    },
                });
            }else{
                TD.event({
                    id: "share",
                    params: {
                        key: config.key,
                        result: "start"
                    }
                });

                let shareInfo = adInfo as ShareInfo;
                let title = this.getShareTitle(shareInfo);
                let imageInfo = this.getShareImage(shareInfo);
                if(ALIPAY) {
                    config.moniterTime = false;
                }
                PlatformHelper.shareAppMessage({
                    title,
                    imageUrl: imageInfo.imageUrl,
                    imageUrlId: imageInfo.imageUrlId,
                    query: shareInfo.query,
                    enableMonitor: config.moniterTime,
                    success: () => {
                        if(adItem.weightMode === EWeightMode.Sequence) {
                            this.nextSequenceValue(config.key);
                        }

                        EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Share, true);
                        config.done?.(true, EAdType.Share);

                        TD.event({
                            id: "share",
                            params: {
                                key: config.key,
                                result: "success"
                            }
                        });
                    },
                    fail: () => {
                        EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Share, false);
                        config.done?.(false, EAdType.Share);

                        TD.event({
                            id: "share",
                            params: {
                                key: config.key,
                                result: "fail"
                            }
                        });
                    },
                });
            }
        }else{
            console.log("no ad info, key:", config.key);
            if(PREVIEW) {
                if(adItem.weightMode === EWeightMode.Sequence) {
                    this.nextSequenceValue(config.key);
                }
                
                EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Share, true);
                config.done?.(true, EAdType.Share);
            }else{

                EventCenter.I.emit(AdManager.SHARE_OR_VIDEO_DONE, EAdType.Share, false);
                config.done?.(false, EAdType.None);
            }
        }
    }
}