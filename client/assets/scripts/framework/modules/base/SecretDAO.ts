import { SecretModel } from "./SecretModel";
import { BaseDAO } from "./BaseDAO";
import { StorageManager } from "../../common/StorageManager";
import { Bridge } from "../Bridge";

class SecretDAO extends BaseDAO<SecretModel> {
    private _innerSave = false;

    get storageKey(): string {
        return "secret";
    }

    constructor(model: new()=>SecretModel) {
        super(model);

        StorageManager.anyItemSaved.add(this._onAnyItemSaved, this);
    }

    private _onAnyItemSaved(storageKey: string) {
        if(!this._innerSave) {
            this._innerSave = true;

            Bridge.secertCtrl.fireOnItemSaved(storageKey);

            // 强制保存token
            this.saveNow();

            this._innerSave = false;
        }
    }

    removeSecret(key: string) {
        delete this.model[key];
        this.easySave();
    }

    getSecret(key: string) {
        return this.model[key];
    }

    setSecret(key: string, token: string, md5: string) {
        this.model[key] = {
            token,
            md5,
        };
        this.easySave();
    }

    protected beforeInitial() {
        
    }
}

export const secretDAO = new SecretDAO(SecretModel);