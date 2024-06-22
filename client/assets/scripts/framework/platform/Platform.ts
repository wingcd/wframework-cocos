import { ALIPAY, WECHAT } from "cc/env";
import { MEITUAN } from "../macro";
import { PlatformSDK } from "./PlatformSDK";

export enum EPlatform {
    WECHAT = "WECHAT",
    MEITUAN = "MEITUAN",
    ALIPAY = "ALIPAY",
}

export class PlatformHelper {
    static platform = EPlatform.WECHAT;
    static shareMonitorTime = 2;

    private static _isEnable = false;
    static get isEnable() {
        return this._isEnable;
    }

    private static _rewardVideoAd: any;

    static get isWechat() {
        return this.platform === EPlatform.WECHAT;    
    } 
    
    static get isMeituan() {
        return this.platform === EPlatform.MEITUAN;
    }

    static get isAlipay() {
        return this.platform === EPlatform.ALIPAY;
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
            return;
        }
        
        this._rewardVideoAd = PlatformSDK.createRewardedVideoAd({
            adUnitId: config.rewardVideoAdUnitId,
        });

        this._rewardVideoAd.load();
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
            query: options.query,
        });

        const moniterTime = options.enableMonitor === false ? 0 : PlatformHelper.shareMonitorTime;
        if(moniterTime > 0) {
            setTimeout(() => {
                if(options.success) {
                    options.success();
                }
            }, moniterTime * 1000);
        }else{
            if(options.success) {
                options.success();
            }       
        }
    }

    static showRewardedVideoAd(options: {
        success: () => void,
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
                if(options.success) {
                    options.success();
                }
            }).catch(() => {
                console.log('激励视频 广告显示失败');
                if(options.fail) {
                    options.fail();
                }
            });
        }).catch(() => {
            console.log('激励视频 广告加载失败');
            if(options.fail) {
                options.fail();
            }
        });
    }
};

if(MEITUAN) {
    PlatformHelper.platform = EPlatform.MEITUAN;
}else if(WECHAT) {
    PlatformHelper.platform = EPlatform.WECHAT;
}else if(ALIPAY) {
    PlatformHelper.platform = EPlatform.ALIPAY;
} 