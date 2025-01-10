export class AdConfig {
    rewardVideoAdUnitId: string = "";
    customAdUnitId: string = "";
    bannerAdUnitId: string = "";
    interstitialAdUnitId: string = "";

    shareTitles: string[] = [
    ];
    shareImages: {
        imageUrl?: string,
        imageUrlId?: string,
    }[] = [
    ];
    defaultShareAd: ShareInfo;
    shareInfos: ShareInfo[] = [
    ];
    adItems: AdItem[] = [
    ];
}

export enum EAdType {
    None,
    Share,
    Video,
    ShareOrVideo,
}

export enum EWeightMode {
    None,
    Random,
    Sequence,
}

export class ShareInfo {
    adType: EAdType = EAdType.Share;
    
    type?: number = 0;
    title?: string;
    imageUrl?: string;
    imageUrlId?: string;
    query?: string;
}

export class VideoInfo {
    adType: EAdType = EAdType.Video;
}

export class AdItem {
    public key: string;
    public weightMode?: EWeightMode = EWeightMode.None;
    // 分享权重
    public shareWeight: number = 1;
    // 视频权重
    public videoWeight: number = 1;
    // 如果为分享，支持的分享或视频id组合
    public shareInfos?: number[] = [];
}