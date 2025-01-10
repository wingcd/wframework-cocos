import { ALIPAY } from "cc/env";
import { MEITUAN } from "../macro";

let WX: WechatMinigame.Wx;
let API: WechatMinigame.Wx = WX;
let inMiniGame = typeof wx !== 'undefined';
if(ALIPAY) {
    // @ts-ignore
    globalThis.wx = my;
    // @ts-ignore
    API = my;
    console.warn("支付宝小游戏平台");
    inMiniGame = true;
}else if(MEITUAN) {
    // @ts-ignore
    globalThis.wx = mt;
    // @ts-ignore
    API = mt;
    inMiniGame = true;
}else if(typeof wx !== 'undefined') {
    API = wx;
    inMiniGame = true;
}

// 以上是引用的模块
export const PlatformSDK  = {
    inMiniGame,
    ...API,

    // 以下是自定义的接口    
};