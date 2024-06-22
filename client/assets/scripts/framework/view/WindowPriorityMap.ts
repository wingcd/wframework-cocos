import Skin from "./Skin";

/** 
 * 窗口优先级管理, 用于控制自动弹出窗口的显示顺序
 * waitPriority: 等待优先级，值越大越先显示
 * group: 组别，同组别的窗口会按照groupLevel的值进行排序，不同组不会显示
 * groupLevel: 组中级别，值超大越先显示, 超过当前组别的窗口会直接显示
 */
export type WindowPriority = {
    // 是否阻塞后续窗口
    needBeWait?: boolean;
    // 等待优先级
    waitPriority?: number;
    // 组别
    group?: number;
    // 组中级别
    groupLevel?: number;
}

const defaultPriority: WindowPriority = {
    needBeWait: false,
    waitPriority: 0,
    group: 0,
    groupLevel: 0,
}

/**
 * WindowPriorityMap.add(ViewNames.PanelLevelUP, {
 *      waitPriority: 0,
 *  })
 * .add(ViewNames.PanelSeasonBP, {
 *      waitPriority: WindowPriority.Activity,
 *      group: WindowGroup.SeasonBP,
 *  }).add(ViewNames.PanelSeasonBPResult, {            
 *      waitPriority: WindowPriority.ActivityEnd,
 *      group: WindowGroup.SeasonBP,
 *      groupLevel: 1
 *  })
 */
export class WindowPriorityMap {
    private static _priorityMap: { [key: string]: WindowPriority} = {};

    public static add(key: string, info: WindowPriority) {
        info.groupLevel = info.groupLevel || 0;
        info.group = info.group || 0;
        info.waitPriority = info.waitPriority || 0;
        info.needBeWait = info.needBeWait != null ? info.needBeWait : true;
        this._priorityMap[key] = info;
        return this;
    }

    public static set(key: string, info: WindowPriority) {
        this.add(key, info);
        return this;
    }

    public static get(key: string): Readonly<WindowPriority> {
        return this._priorityMap[key] || defaultPriority;
    }

    public static getBySkin(skin: Skin): Readonly<WindowPriority> {
        return this.get(skin.componentName);
    }

    public static remove(key: string) {
        delete this._priorityMap[key];
    }

    public static clear() {
        this._priorityMap = {};
    }
}