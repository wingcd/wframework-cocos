let WX: WechatMinigame.Wx;
let inMiniGame = typeof wx !== 'undefined';
if(inMiniGame) {
    WX = wx;
}

// 以上是引用的模块
export const PlatformSDK  = {
    inMiniGame,
    ...WX,

    // 以下是自定义的接口
    
}