export enum WindowType {
    GMDocker = "GMDocker",
    GMMananger = "GMMananger",
    CommonToast = "CommonToast",

    CreateMapWindow = "CreateMapWindow",

    SettingsWindow = "SettingsWindow",
    PauseWindow = "PauseWindow",
    FailWindow = "FailWindow",
    SuccessWindow = "SuccessWindow",
    GameProgressWindow = "GameProgressWindow",
    ReliveWindow = "ReliveWindow",

    GuideWindow = "GuideWindow",
    NormalReliveWindow = "NormalReliveWindow",
    ChallengeReliveWindow = "ChallengeReliveWindow",
    CollectionWindow = "CollectionWindow",
    AnimalRewardWindow = "AnimalRewardWindow",
    AnimalWindow = "AnimalWindow",
    GetItemWindow = "GetItemWindow",
    StartGameWindow = "StartGameWindow",
    CStartGameWindow = "CStartGameWindow",
    GameAwardWindow = "GameAwardWindow",
    ShopWindow = "ShopWindow",
    TaskWindow = "TaskWindow",
    DailyGiftWindow = "DailyGiftWindow",
    SevenDaySignWindow = "SevenDaySignWindow",
    TipsWindow = "TipsWindow",

    AdAddEnergyWindow = "AdAddEnergyWindow",

    SubscribeWindow = "SubscribeWindow",
}

export enum ActivityType {
    LoadingActivity = "LoadingActivity",
    HomeActivity = "HomeActivity",
    GameActivity = "GameActivity",
    LevelEditorActivity = "LevelEditorActivity",
}

export enum EItemType {
    None = 0,
    Remove, // 移除
    Collect, // 收集
    Shuffle, // 重排
    BigRocket, // 大火箭
    SmallRocket, // 小火箭
    BigTimer, // 大时钟
    SmallTimer, // 小时钟
}

export enum PhysicLayers {
    Default = 1 << 0,
    Ground = 1 << 1,
}

export enum ERewardType {
    None,
    Resource = 1, // 资源
    Tool = 2, // 道具
}

export enum EResourceType {
    Gold = 1, // 金币
    Energy = 2, // 能量
    Star = 3, // 星星
}

export enum EWXTaskStatus {
    None, // 无
    Awarding, // 领取中
    Finish, // 完成
}

export enum EGameMode {
    Normal,
    Challenge,
}

export enum EOrderColor {
    Red = 0,
    Yellow = 1,
    Blue = 2,
    Green = 3,
    Pink = 4,
}

export enum EDirection {
    DOWN = 0,
    LEFT = 1,
    RIGHT = 2,
    UP = 3,
}

export enum ECellType {
    Empty = 0,
    Entry = 1,
    Exit = 2,
    Item = 3,
    Stone = 4,

    Bomb = 5, // 炸弹(3x3)
    HBomb = 6, // 水平炸弹
    VBomb = 7, // 垂直炸弹
    Fill = 8, // 填充(3x3)
    HFill = 9, // 水平填充
    VFill = 10, // 垂直填充
    Ticker = 11, // 倒计时消除
    Counter = 12, // 可消除计数
}

export enum EGameGuideType {
    BlockTips = 10,
}

export declare type StartGameInfo = {
    level: number;
    mode: EGameMode;
    challengeLevel?: number;
};

export declare type MapCellEffectInfo = {
    url: string;
    val?: number;
    res?: string;
    anim?: string;
    loop?: boolean;
    local?: boolean;
    complete?: Function;
    duration?: number;
    type: any,
};

export enum EPlaygroundMode {
    None,
    Bomb,
}

export enum ECellEffectType {
    // 放入
    PutIn,
    // 消除
    Remove,
    // 爆炸
    Explode,
    // 可放入提示
    CanPutInTips,
    // 可炸提示
    CanExplodeTips,
    // buff生效预提示
    BuffEffectTips,
    // 连通提示
    ConnectTips,
}