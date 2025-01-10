import { EOrderColor } from "./types";

export class ResConst {
    // 资源包名
    static readonly AB_STAGE = "stage";
    static readonly AB_RESOURCES = "resources";
    static readonly AB_COMMON = "common";
    static readonly AB_CONFIG = "config";
    static readonly AB_MAP = "maps";

    // ui资源包名
    static readonly FGUI_PKG_COMMON = "common";
    static readonly FGUI_PKG_LOADING = "loading";
    static readonly FGUI_PKG_GAME = "game";

    static readonly AB_EDITOR = "level-editor-pkg";
    static readonly FGUI_PKG_EDITOR = "level-editor";
    static readonly FGUI_PKG_BASE = "Basic";
}

export enum AnimalAnimation {
    None = -1,
    Idle,
    Walk,
    Jump,
    Damage,
    Eat,
    Attack,
    Run,
}

export const VFXNames = {
    MergeEffect : "effects/vfx_merge",    
    AwardEffect : "effects/vfx_hecheng",
    
    ShuffleEffect : "vfx/blackHole/vfx_blackhole",
    TrailEffect: "vfx/trail_fx",
    ExplodeEffect: "vfx/vfx_explode",

    BigRocket : "items/big_rocket",
    SmallRocket : "items/small_rocket_fx",
    BigTimer : "items/big_hourglass",
    SmallTimer : "items/small_hourglass",
};

export const EffectNames = {
    PureColor : "worldRes/shader/pure-color",
    Id2Texture : "worldRes/shader/id-2-texture",
    MeshOnUI : "worldRes/shader/mesh-on-ui",
    FloatBG : "worldRes/shader/float-bg",
};

export const ColorIconRES = {
    [EOrderColor.Red]: [
        "ui://x6189meml096em",
    ],
    [EOrderColor.Yellow]: [
        "ui://x6189meml096eo",
    ],
    [EOrderColor.Blue]: [
        "ui://x6189meml096en",
    ],
    [EOrderColor.Green]: [
        "ui://x6189meml096eq",
    ],
    [EOrderColor.Pink]: [
        "ui://x6189meml096ep",
    ],
}