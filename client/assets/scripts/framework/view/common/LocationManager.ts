import { Node, Size, Vec2 } from "cc";
import { GObject } from "fairygui-cc";
import { SpaceUtils } from "../../utils/SpaceUtils";

export class LocationResult {
    pos = new Vec2();
    size = new Size;
    target: GObject;
    mapTarget: Node;
    auto: boolean = true; // 自动转为全局坐标
};

const result_t = new LocationResult();

/**
 * 获取全局坐标系下的中心坐标
 */
export interface ILocation {
    getLocations(): number[];
    getLocation(loc: number, result: LocationResult, data?: any): LocationResult;
}

export class LocationManager {
    private static _inst = new LocationManager();
    static get inst() {
        return this._inst;
    }

    private _locations: { [pos: number]: ILocation[] } = {};

    regist(target: ILocation) {
        target.getLocations().forEach(loc => {
            this._locations[loc] = [target, ...(this._locations[loc] || [])];
        });
    }

    unregist(target: ILocation) {
        target.getLocations().forEach(loc => {
            if (this._locations[loc]) {
                const index = this._locations[loc].indexOf(target);
                if (index !== -1) {
                    this._locations[loc].splice(index, 1);
                }
            }
        });
    }

    getLocation(loc: number, data?: any, result: LocationResult = result_t) {
        if (!this._locations[loc] || this._locations[loc].length == 0) {
            console.error(`未注册点位：${loc}`);
            return null;
        }

        result.target = null;
        result.auto = true;

        this._locations[loc][0].getLocation(loc, result, data);

        if (result.target && result.auto) {
            SpaceUtils.getGObjectCenterPos(result.target, result.pos);
            result.target.localToGlobal(result.pos.x, result.pos.y, result.pos);

            result.size.set(result.target.width, result.target.height);
        }

        return result;
    }
}