import { UtilsHelper } from "../../common/UtilsHelper";
import { Md5 } from "../../libs/md5";
import { Bridge } from "../Bridge";
import { BaseController } from "./BaseController";
import { secretDAO } from "./SecretDAO";
import { ISecretController } from "./types";

export class SecretController extends BaseController implements ISecretController {
    public static SECRET_DAO_ON_SAVED = "SECRET_DAO_ON_SAVED";
    
    protected get dao() {
        return  secretDAO;
    }

    getMd5(data: any, token: string) {
        if(typeof data == "object") {
            return Md5.hashStr(JSON.stringify(data) + "|" + token);
        }
        return `${data.toString()}|${token}`
    }

    private getTarget(target: any, field: string) {
        if(field) {
            return target[field];
        }
        // field为空时，表示target备份，且需要移除token和md5属性
        let obj = {};
        UtilsHelper.copyTo(target, obj);
        delete obj["_token_"];
        delete obj["_md5_"];
        return obj;
    }

    removeKey(key: string) {
        secretDAO.removeSecret(key);
    }

    setValidKey(target: any, key: string, ...fields: string[]) {
        // null 表示target自身
        fields = (!fields || fields.length == 0) ? [null] : fields;

        for(let i=0;i<fields.length;i++) {
            let field = fields[i];
            let token = UtilsHelper.randomString(6);
            let obj = this.getTarget(target, field);
            let md5 = this.getMd5(obj, token);
            if(field == null) {
                // target自身时，在target上添加属性
                target["_token_"] = token;
                target["_md5_"] = md5;
            }
            secretDAO.setSecret(key, token, md5);

            // console.log(`MD5: ${key}-${token}-${md5}`);
        }
    }

    checkValue(target: any, key: string, field?: string): boolean {
        let item = secretDAO.getSecret(key);
        if(item) {            
            let obj = this.getTarget(target, field);
            if(field == null) {
                // target自身时，优先判定target上的属性
                if(target["_md5_"] == this.getMd5(obj, target["_token_"])) {
                    return true;
                }
            }
            let ret = item.md5 == this.getMd5(obj, item.token);
            if(!ret) {
                console.error(`key=${key}， 数据验证失败`);
            }
            return ret;
        }else{
            console.error(`未注册相关key：${key}`);
        }
        return false;
    }

    checkAndUpdateValue(target: any, key: string, field: string, value: any): boolean {
        let ret = this.checkValue(target, key, field);
        if(ret) {
            target[field] = value;
            this.setValidKey(target, key, field);
        }
        return ret;
    }

    fireOnItemSaved(storageKey: string) {
        Bridge.secertCtrl.emit(SecretController.SECRET_DAO_ON_SAVED, storageKey);
    }
}

export const secretController = new SecretController();
Bridge.secertCtrl = secretController;