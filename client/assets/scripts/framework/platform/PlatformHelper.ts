import { WECHAT } from "cc/env";
import { ALIPAY, MEITUAN } from "../macro";
import { PlatformSDK } from "./PlatformSDK";
import { ShareMonitor } from "./ShareMonitor";

export enum EPlatform {
    WECHAT = "WECHAT",
    MEITUAN = "MEITUAN",
    ALIPAY = "ALIPAY",
}

export class PlatformHelper {
    static platform = EPlatform.WECHAT;
    static shareMonitorTime = 2;

    private static _adVideoOptions: {
        success?: () => void,
        fail?: () => void,
    };

    private static _isEnable = false;
    static get isEnable() {
        return this._isEnable;
    }

    private static _rewardVideoAd: WechatMinigame.RewardedVideoAd;

    static get isWechat() {
        return this.platform === EPlatform.WECHAT;    
    } 
    
    static get isMeituan() {
        return this.platform === EPlatform.MEITUAN;
    }

    static get isAlipay() {
        return this.platform === EPlatform.ALIPAY;
    }

    static get rewardVideoAd(): WechatMinigame.RewardedVideoAd {
        return this._rewardVideoAd;
    }

    static isMiniGame() {
        return this.platform === EPlatform.WECHAT || 
               this.platform === EPlatform.MEITUAN || 
                this.platform === EPlatform.ALIPAY;
    }

    static initial(config: {
        rewardVideoAdUnitId: string,
    }) {
        this._isEnable = typeof wx !== 'undefined';   

        if(!this._isEnable) {
            console.log('小游戏SDK未初始化');
            return;
        }
        console.log('小游戏SDK初始化');
        
        this._rewardVideoAd = PlatformSDK.createRewardedVideoAd({
            adUnitId: config.rewardVideoAdUnitId,
        });

        this._rewardVideoAd.onError(this._onVideoAdError.bind(this));
        this._rewardVideoAd.onClose(this._onVideoClose.bind(this));

        //支付宝同时调用create 和load  需要间隔时间
        setTimeout(() => {
            this._rewardVideoAd.load();
        }, 300);
    }

    static login(options: {
        success: (res: any) => void,
        fail?: (err: any) => void,
    }) {
        if(this._isEnable) {
            PlatformSDK.login({
                success: options.success,
                fail: options.fail,
            });
        }else{
            options.success?.(null);
        }
    }

    static shareAppMessage(options: {
        title?: string,
        imageUrl?: string,
        imageUrlId?: string,
        query?: string,
        enableMonitor?: boolean,
        success?: () => void,
        fail?: () => void,
    }){
        if(!this.isEnable) {
            if(options.success) {
                options.success();
            }
            return;
        }

        PlatformSDK.shareAppMessage({
            title: options.title,
            imageUrl: options.imageUrl,
            imageUrlId: options.imageUrlId,
            query: options.query,
            // @ts-ignore
            success: options.success,
            fail: options.fail,
        });

        if(!ALIPAY) {
            if(options.enableMonitor !== false) {
                ShareMonitor.bind(options);
            }else{
                if(options.success) {
                    options.success();
                }      
            }
        }
    }

    static showRewardedVideoAd(options: {
        success?: () => void,
        fail?: () => void,
    }) {
        if(!this.isEnable) {
            if(options.success) {
                options.success();
            }
            return;
        }

        this._rewardVideoAd.load().then(() => {
            this._rewardVideoAd.show().then(() => {
                console.log('激励视频 广告显示');
                this._adVideoOptions = options;
            }).catch(() => {
                console.log('激励视频 广告显示失败');
                if(options.fail) {
                    options.fail();
                }
            });
        }).catch((err) => {
            console.log('激励视频 广告加载失败,', err);
            if(options.fail) {
                options.fail();
            }
        });
    }

    private static _onVideoAdError() {
        console.log('激励视频 广告加载失败');

        this._adVideoOptions = null;
    }

    private static _onVideoClose(res: any) {
        const options = this._adVideoOptions;
        if(res && res.isEnded) {
            options.success && options.success();
        }else {
            options.fail && options.fail();
        }
        
        this._adVideoOptions = null;
    }

    static onShareAppMessage(callback: (res: any) => void): {
        title?: string,
        imageUrl?: string,
        imageUrlId?: string,
    } {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.onShareAppMessage(callback);
    }

    static offShareAppMessage(callback: (res: any) => void) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.offShareAppMessage(callback);
    }

    static showShareMenu(opt: WechatMinigame.ShowShareMenuOption) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.showShareMenu(opt);
    }

    static getSetting(options: {
        success?: (res: WechatMinigame.GetSettingSuccessCallbackResult) => void,
        fail?: (err: any) => void,
    }) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.getSetting(options);
    }

    static authorize(options: {
        scope: string,
        success?: () => void,
        fail?: () => void,
    }) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.authorize(options);
    }

    static createUserInfoButton(options: WechatMinigame.CreateUserInfoButtonOption) {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.createUserInfoButton(options);
    }

    static getUserInfo(options: WechatMinigame.GetUserInfoOption) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.getUserInfo(options);
    }

    static getGameClubData(options: WechatMinigame.GetGameClubDataOption) {
        if(!this.isEnable) {
            return;
        }

        PlatformSDK.getGameClubData(options);
    }

    static createGameClubButton(options: WechatMinigame.CreateGameClubButtonOption) {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.createGameClubButton(options);
    }

    static getSystemInfoSync() {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.getSystemInfoSync();
    }

    static createCustomAd(options: WechatMinigame.CreateCustomAdOption) {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.createCustomAd(options);
    }

    static createBannerAd(options: WechatMinigame.CreateBannerAdOption) {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.createBannerAd(options);
    }

    static createInterstitialAd(options: WechatMinigame.CreateInterstitialAdOption) {
        if(!this.isEnable) {
            return;
        }

        return PlatformSDK.createInterstitialAd(options);
    }
};

if(MEITUAN) {
    PlatformHelper.platform = EPlatform.MEITUAN;
}else if(WECHAT) {
    PlatformHelper.platform = EPlatform.WECHAT;
}else if(ALIPAY) {
    PlatformHelper.platform = EPlatform.ALIPAY;
} 