import { Layers } from "cc";

export const GameConst = {
    ENABLE_AD: true,

    // 数据保存时间
    DATA_SAVE_TIME: 2 * 60,
    // 心跳时间
    BEAT_HEART_TIME: 1 * 60,

    // 动物刷新时间点
    ANIMAL_REFRESH_TIME: 8,

    EDITOR_MODE: false,

    // Cell类型数量
    CELL_TYPE_COUNT: 3,
};

export const UI_2D_LAYER = 1 << Layers.nameToLayer("UI_2D");
export const INDEX_LAYER = 1 << Layers.nameToLayer("INDEX");
export const OUTLINE_LAYER = 1 << Layers.nameToLayer("OUTLINE");