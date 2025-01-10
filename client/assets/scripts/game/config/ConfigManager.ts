import { BufferAsset } from "cc";
import { DataAccess } from "../../framework/plugins/config/DataAccess";
import { ResConst } from "../const/ResConst";
import { DataConverter, DataModel, GameConfig, TableDefine } from "./DataModel";
import { ResManager } from "../manager/ResManager";
import { LevelRandomData, Order, RewardData } from "./ConfigExtension";
import { EItemType } from "../const/types";

export class ConfigManager extends TableDefine {
    private static _toolItemMap: { [key: number]: number } = {
        9000: EItemType.SmallRocket,
        9001: EItemType.SmallTimer,
    };
    private static _itemToolMap: { [key: number]: number } = {};

    static _itemTypeMap: { [key: number]: Readonly<GameConfig.Item>[] } = null;
    static get ItemTypeMap() {
        if(!this._itemTypeMap) {
            this._initItemTypeMap();
        }

        return this._itemTypeMap;
    }

    /**
     * 道具转工具
     * @param type 
     * @returns 
     */
    public static getToolType(type: number): EItemType {
        return this._toolItemMap[type];
    }

    /**
     * 工具转道具
     * @param item 
     * @returns 
     */
    public static getToolItem(item: EItemType): number {
        return this._itemToolMap[item];
    }

    private static _modelConverter: { [key: string]: (data: DataModel, fieldName: string, value: string) => void } = {};
    static loadConfig() {
        for(let key in this._toolItemMap) {
            this._itemToolMap[this._toolItemMap[key]] = parseInt(key);
        }

        DataConverter.convertHandler = this.modelConvert.bind(this);

        let loadHandler = (datafile) => {
            let asset = ResManager.get(ResConst.AB_CONFIG, datafile, BufferAsset) as BufferAsset;
            return new Uint8Array(asset.buffer());
        };
        DataAccess.initial("data/", loadHandler);

        this._modelConverter["RewardData"] = this._parseRewardData.bind(this);
        this._modelConverter["RewardData[]"] = this._parseRewardDataList.bind(this);
        this._modelConverter["Order"] = this._parseOrder.bind(this);
        this._modelConverter["Order[]"] = this._parseOrderList.bind(this);
        this._modelConverter["LevelRandomData"] = this._parseLevelRandomData.bind(this);
        this._modelConverter["LevelRandomData[]"] = this._parseLevelRandomDataList.bind(this);
    }

    private static modelConvert(data: DataModel, fieldName: string, value: string, alias?: string): any {
        let convert = this._modelConverter[alias];
        if (!convert) {
            console.error(`can not find alias named ${alias} in field=${fieldName}`);
            return;
        }

        return convert(data, fieldName, value);
    }

    static get settings() {
        return this.SettingsTable.getItem(1);
    }

    private static _initItemTypeMap() {
        this._itemTypeMap = {};
        for (let item of this.ItemTable.items) {
            let type = item.Type;

            // 道具不主动显示
            if(item.ItemType == GameConfig.EGoodItemType.Prop) {
                continue;
            }

            // 动物类型单独处理
            if(item.ItemType == GameConfig.EGoodItemType.Animal) {
                type = 0;
            }

            let list = this._itemTypeMap[type];
            if (!list) {
                list = [];
                this._itemTypeMap[type] = list;
            }

            list.push(item);
        }
    }

    private static _parseRewardData(data: DataModel, fieldName: string, value: string) {
        let reward = new RewardData();
        let [type, id, count] = value.split(",");
        reward.id = parseInt(id);
        reward.count = parseInt(count);
        reward.type = parseInt(type);
        return reward;
    }

    private static _parseRewardDataList(data: DataModel, fieldName: string, value: string) {
        let list: RewardData[] = [];
        let arr = value.split("|");
        for (let str of arr) {
            let reward = this._parseRewardData(data, fieldName, str);
            list.push(reward);
        }
        return list;
    }

    private static _parseOrder(data: DataModel, fieldName: string, value: string) {
        let order = new Order();
        let [color, dir] = value.split(",");
        order.color = parseInt(color);
        order.dir = parseInt(dir);
        return order;
    }

    private static _parseOrderList(data: DataModel, fieldName: string, value: string) {
        let list: Order[] = [];
        let arr = value.split("|");
        for (let str of arr) {
            let order = this._parseOrder(data, fieldName, str);
            list.push(order);
        }
        return list;
    }

    public static getLevel(level: number) {
        if(this.LevelTable.contains(level)) {
            return this.LevelTable.getItem(level);
        }

        let levelItem: Readonly<GameConfig.Level> = this.LevelTable.items[0];
        for(var i = 0; i < this.LevelTable.items.length; i++) {
            let item = this.LevelTable.items[i];
            if(item.ID > level) {
                break;
            }

            if(item.CanShowInNormal) {
                levelItem = item;
            }
        }

        return levelItem;
    }

    private static _parseLevelRandomData(data: DataModel, fieldName: string, value: string) {
        let randomData = new LevelRandomData();
        randomData.parse(value);
        return randomData;
    }

    private static _parseLevelRandomDataList(data: DataModel, fieldName: string, value: string) {
        let list: LevelRandomData[] = [];
        let arr = value.split("|");
        for (let str of arr) {
            let randomData = this._parseLevelRandomData(data, fieldName, str);
            list.push(randomData);
        }
        return list;
    }
}