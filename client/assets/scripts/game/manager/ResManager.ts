
import { _decorator, __private, Asset } from 'cc';
import { ConfigManager } from '../../game/config/ConfigManager';
import { GameConfig } from '../../game/config/DataModel';
import { ResManager as RM } from '../../framework/common/ResManager';

export class ResManager extends RM {
    static getPath(resCfg: Readonly<GameConfig.Resources>) {
        let path = "";
        if(resCfg.Route) {
            path = resCfg.Route + (resCfg.Route.endsWith("/") ? "" : "/") + resCfg.ResName;
        }else{
            path = resCfg.ResName;
        }
        return path;
    }

    static getById<T extends Asset>(id:number, type: __private.__types_globals__Constructor<T>) {
        let resCfg = ConfigManager.ResourcesTable.getItem(id);
        if(!resCfg) {
            console.error(`no resource id=${id}`);
            return null;
        }

        let path = this.getPath(resCfg);
        return this.get(resCfg.PackName, path, type) as T;
    }

    static async getByIdAsync<T extends Asset>(id:number, type: __private.__types_globals__Constructor<T>) {
        let resCfg = ConfigManager.ResourcesTable.getItem(id);
        if(!resCfg) {
            console.error(`no resource id=${id}`);
            return null;
        }
        
        let path = this.getPath(resCfg);
        return await this.getAsync(resCfg.PackName, path, type) as T;
    }
}

RM.getById = ResManager.getById;
RM.getByIdAsync = ResManager.getByIdAsync;