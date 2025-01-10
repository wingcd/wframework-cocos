import { ALIPAY } from "../macro";
import { PlatformSDK } from "./PlatformSDK";

declare var my: any;
if(ALIPAY && typeof my !== 'undefined') {
    if(my.env.iOSHighPerformance) {
        console.log('iOSHighPerformance Enabled');
    }else{
        console.log('iOSHighPerformance Disabled');
    }

    interface AlipayShareAppMessageOption extends WechatMinigame.ShareAppMessageOption {
        bgImgUrl: string;        
        success?: () => void,
        fail?: () => void,
    }

    PlatformSDK.createRewardedVideoAd = function(options: WechatMinigame.CreateRewardedVideoAdOption) {
        return my.createRewardedAd(options);
    }
    
    PlatformSDK.createBannerAd = function(options: WechatMinigame.CreateBannerAdOption) {
        return my.createGameBanner(options);
    }

    PlatformSDK.onShareAppMessage = function(option: WechatMinigame.OnShareAppMessageCallback) {
        my.onShareAppMessage = function () {
            return option;
        };
    }

    PlatformSDK.shareAppMessage = function(option: AlipayShareAppMessageOption) {
        my.onShareAppMessage = function () {
            return option;
        };

        return my.showSharePanel({
            success: () => {
                option.success?.();

            },
            fail: () => {
                option.fail?.();
            },
            complete: (e) => {
                console.log(e);
            },
        });            
    }

    PlatformSDK.showShareMenu = function(option: WechatMinigame.ShowShareMenuOption) {
        return my.onShareAppMessage(() => option);
    }

    PlatformSDK.login = function(option: WechatMinigame.LoginOption) {
        return my.getAuthCode({
            scopes: 'auth_base',
            success: (res) => {
                option.success?.(res);
            },
            fail: (err: any) => {
                option.fail?.(err);
            }
        });
    }

    PlatformSDK.createCustomAd = function(options: WechatMinigame.CreateCustomAdOption) {
        return my.createBannerAd(options);
    }

    PlatformSDK.createBannerAd = function(options: WechatMinigame.CreateBannerAdOption) {
        return my.createBannerAd(options);
    }
}