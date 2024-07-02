import { UtilsHelper } from "../../utils/UtilsHelper";
import { StorageManager } from "../../common/StorageManager";
import { Bridge } from "../Bridge";
import { ModelMapper } from "../ModelMapper";
import { BaseModel } from "./BaseModel";
import { IBaseDAO } from "./types";
import { GameSettings } from "../../GameSettings";
import { StringUtils } from "../../utils/StringUtils";

export class BaseDAO<T extends BaseModel> implements IBaseDAO {
    public serverDirty: boolean = false;

    private _type: new () => T;
    private _model: T;
    private _owner?: any;
    private _keys?: string[];
    private _storage: StorageManager;
    protected _isNewer = false;
    private _realStorageKey = "";

    isValidate = true;

    private _needValidKeys: {
        [key: string]: {
            token: string,
            md5: string,
        }
    } = {};

    protected get readStorageKey() {
        return this._realStorageKey;
    }

    get storage() {
        return this._storage;
    }

    /**
     * 模块名称，用于通过ModelMapper获取配置数据
     */
    get modelName() {
        return "";
    }

    /**
     * 本地存储的key，为空表示不存储
     */
    get storageKey(): string {
        return null;
    }

    /**
     * md5验证存储的key，为空表示不校验
     */
    get storageValidKey() {
        return null;
    }

    private _dirty = false;
    get dirty() {
        return this._dirty;
    }

    set dirty(value) {
        this._dirty = value;
    }

    get model(): T {
        return this._model;
    }

    constructor(model: new () => T) {
        this._type = model;
    }

    update(dt: number) {
        if (this.storage) {
            this.storage.update(dt);
        }
    }

    load() {
        if (this.storageKey) {
            this._storage = new StorageManager();
            this._realStorageKey = `${GameSettings.useid || 0}:${this.storageKey}`;
            this._storage.initial(this._realStorageKey);
        }

        this.beforeLoad();
        this.loadData();
        this.afterLoad();
    }

    initial() {
        this.beforeInitial();
        this.refreshValidKeys();
    }

    protected beforeLoad() {

    }

    protected afterLoad() {

    }

    protected beforeInitial() {

    }

    protected setValidKey(...keys: string[]) {
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (!key) {
                continue;
            }

            let token = StringUtils.randomString(6);
            this._needValidKeys[key] = {
                token,
                md5: Bridge.secertCtrl.getMd5(this.model[key], token),
            };
        }
    }

    private refreshValidKeys() {
        let keys = Object.keys(this._needValidKeys);
        this.setValidKey(...keys);
    }

    protected checkAndUpdateValue(field: string, value: any): boolean {
        let item = this._needValidKeys[field];
        if (item) {
            let ret = item.md5 == Bridge.secertCtrl.getMd5(this.model[field], item.token);
            if (ret) {
                this.model[field] = value;
                item.md5 = Bridge.secertCtrl.getMd5(value, item.token);
                this.easySave();
            } else {
                console.error(`key=${field}， 数据验证失败`);
            }
            return ret;
        } else {
            console.error(`未注册相关key：${field}`);
        }
        return false;
    }

    protected loadData() {
        if (this.storageKey) {
            this._model = this._storage.getData() as T;
            this.validateAndCreateModel();
        }
    }

    /**
     * 直接覆盖数据，此数据无需验证
     * @param data 
     */
    setData(data: T, replace = false) {
        UtilsHelper.copyTo(data, this._model);
        // this._model = data;
        // 
        if (this.storageValidKey) {
            Bridge.secertCtrl.setValidKey(this._model, this.storageValidKey);
        }

        if (replace) {
            this._isNewer = false;
        }

        if (this.storage) {
            this.storage.setData(this._model);
        }

        this.easySave();
    }

    private copyData(source: any, target: any, keys: string[]) {
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (source[key]) {
                target[key] = source[key];
            }
        }
    }

    private validateAndCreateModel() {
         // 从本地读取时，如果需要验证，将对整个对象进行一次验证，验证不通过时，直接复制为空对象
        if (this._model && this.storageValidKey) {
            if (!Bridge.secertCtrl.checkValue(this._model, this.storageValidKey)) {
                this._model = null;
                Bridge.secertCtrl.removeKey(this.storageValidKey);
                console.error("merge_storage_error", { from: this.storageKey });

                this.isValidate = false;
            } else {
                this.isValidate = true;
            }
        } else {
            this.isValidate = true;
        }

        let isNewer = false;
        if (!this._model) {
            this._model = new this._type();
            isNewer = true;
        } else {
            let model = this._model;
            this._model = new this._type();
            UtilsHelper.copyTo(model, this._model);
        }

        this.setData(this._model, true);
        this._isNewer = isNewer;
    }

    private saveData(focus?: boolean, now = false, fireEvent = true) {
        if (this.dirty || focus) {
            if (this.storageValidKey) {
                Bridge.secertCtrl.setValidKey(this._model, this.storageValidKey);
            }

            this._storage.setData(this._model);
            if (now) {
                this._storage.saveNow(fireEvent);
            }
        }
    }

    protected copyFrom(data: any, keys?: string[]) {
        this._owner = data;
        this._keys = keys;

        keys = keys || Object.keys(this._model);
        this.copyData(data, this._model, keys);
    }

    protected saveTo(data: any, keys?: string[]) {
        keys = keys || Object.keys(this._model);
        this.copyData(this._model, data, keys);
    }

    reset() {
        this._model = new this._type() as T;
        this.saveNow(false);
    }

    easySave() {
        this.dirty = true;
        this.serverDirty = true;
    }

    saveNow(fireEvent = true) {
        this.save(true, true, fireEvent);
    }

    save(focus?: boolean, now = false, fireEvent = true) {
        if (this.storageKey) {
            this.saveData(focus, now, fireEvent);
        } else if (this._owner) {
            this.saveTo(this._owner, this._keys);
        }

        this.dirty = false;
    }

    serialize(): any {
        if (this.modelName) {
            let data = ModelMapper.toData(this.model, this.modelName);
            delete data["_md5_"];
            delete data["_token_"];
            return data;
        }
        return this.model;
    }

    deserialize(data: any, replace: boolean) {
        if (this.modelName) {
            let model = ModelMapper.fromData(data, this.modelName);
            this.setData(model, replace);
        } else {
            this.setData(data, replace);
        }
    }
}