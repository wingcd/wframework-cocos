import { native, sys } from "cc";
import { EncryptHelper } from "./EncryptHelper";
import { EventHandler } from "./EventHandler";

class Storage {
    private _file: string;
    private _path: string;
    private _jsonData: any;

    constructor(file: string) {
        this._file = file;
        this._path = this._getConfigPath();
        this._loadData();
    }

    get file() {
        return this._file;
    }

    /**
     * 获取配置文件路径
     * @returns 获取配置文件路径
     */
    private _getConfigPath() {
        let platform: any = sys.platform;

        let path: string = "";

        if (platform === sys.OS.WINDOWS) {
            path = "src/conf";
        } else if (platform === sys.OS.LINUX) {
            path = "./conf";
        } else {
            if (sys.isNative) {
                path = native.fileUtils.getWritablePath();
                path = path + "conf";
            } else {
                path = "src/conf";
            }
        }

        return `${path}/${this._file}`;
    }

    private _loadData() {
        var content;
        if (sys.isNative) {
            if (native.fileUtils.isFileExist(this._path)) {
                content = native.fileUtils.getStringFromFile(this._path);
            }
        } else {
            content = sys.localStorage.getItem(this._file);
        }

        // 解密
        if (content && content.length) {
            if (content.startsWith('@')) {
                content = content.substring(1);
                content = EncryptHelper.decrypt(content);
            }

            try {
                if(!content || content == "Ԁ\x00") {
                    content = "{}";
                }

                //初始化操作
                var jsonData = JSON.parse(content);
                this._jsonData = jsonData;
            } catch (excepaiton) {
                console.error(`${this._file}解析失败`);
            }
        }
    }

    getData() {
        return this._jsonData;
    }

    getValue(key: string) {
        return this._jsonData[key];
    }

    setData(data: any) {
        this._jsonData = data;
    }

    setKV(key: string, value: any) {
        this._jsonData[key] = value;
    }    

    /**
     * 保存配置文件
     * @returns 
     */
    public save(fireEvent = true) {
        if (!StorageManager.enableSave) {
            return false;
        }

        // 写入文件
        var str = JSON.stringify(this._jsonData) || "";

        let zipStr = '@' + EncryptHelper.encrypt(str);

        // console.log(`${this._file} save to storage`);

        if (fireEvent) {
            StorageManager.anyItemSaved.fire(this._file);
        }

        if (!sys.isNative) {
            var ls = sys.localStorage;
            ls.setItem(this._file, zipStr);
            return true;
        }

        native.fileUtils.writeStringToFile(this._file, zipStr);

        return true;
    }
}

export class StorageManager {
    static anyItemSaved: EventHandler = new EventHandler;
    static enableSave = true;

    private _saveInterval: number = 5; //s
    private _timer: number = 0;
    private _storage: Storage;
    private _dirty = false;
    private _fireEvent = true;

    initial(file: string, saveInterval = 5) {
        this._saveInterval = saveInterval;
        this._storage = new Storage(file);
    }

    update(dt: number) {
        this._timer += dt;
        if (this._timer >= this._saveInterval) {
            this._timer = 0;

            if (this._dirty) {
                let saved = this._storage.save(this._fireEvent);

                if(saved) {
                    this._dirty = false;
                    this._fireEvent = true;
                }
            }
        }
    }

    saveNow(fireEvent = true) {
        this._timer = this._saveInterval;
        this._fireEvent = fireEvent;
    }

    getData() {
        return this._storage.getData();
    }

    getValue(key: string) {
        return this._storage.getValue(key);
    }

    easySave() {
        this._dirty = true;
    }

    setData(data: any, fireEvent = true) {
        this._storage.setData(data);
        this._dirty = true;
        this._fireEvent = fireEvent;
    }

    setKV(key: string, value: any) {
        this._storage.setKV(key, value);
        this._dirty = true;
    }
}