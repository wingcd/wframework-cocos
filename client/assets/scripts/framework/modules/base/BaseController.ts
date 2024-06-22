import { EventCenter } from "../../common/EventCenter";
import { IBaseDAO } from "./types";

export class BaseController{
    private _eventCenter: EventCenter = new EventCenter();
    
    get eventCenter() {
        return this._eventCenter;
    }

    get dataKey() {
        return "";
    }

    private processDaos(processor: (dao: IBaseDAO) => void) {
        if (this.daos) {
            this.daos.forEach(processor);
        } else if (this.dao) {
            processor(this.dao);
        }
    }

    private processDaosAndReturn(processor: (dao: IBaseDAO) => boolean): boolean {
        if (this.daos) {
            return this.daos.some(processor);
        } else if (this.dao) {
            return processor(this.dao);
        }
        return false;
    }

    /**
     * 存档至服务器后，清除数据变化标记
     */
    clearServerDirty() {
        this.processDaos(dao => dao.serverDirty = false);
    }

    /**
     * 获取数据是否有变化
     */
    get serverDirty() {
        return this.processDaosAndReturn(dao => dao.serverDirty);
    }

    /**
     * 本地数据验证是否成功
     */
    get isValidate() {
        return !this.processDaosAndReturn(dao => !dao.isValidate);
    }

    set isValidate(val: boolean) {
        this.processDaos(dao => dao.isValidate = val);
    }

    /**
     * 主要数据接口,不为空时将会初始化加载数据，update存储数据
     */
    protected get dao(): IBaseDAO {
        return null;
    }

    protected get daos(): IBaseDAO[] {
        return null;
    }

    public on(eventName: string, handler: Function, target: any) {
        this._eventCenter.on(eventName, handler, target);
    }

    public once(eventName: string, handler: Function, target: any) {
        this._eventCenter.once(eventName, handler, target);
    }

    public off(eventName: string, handler: Function, target: any) {
        this._eventCenter.off(eventName, handler, target);
    }

    public emit(eventName: string, ...args: any[]) {
        this._eventCenter.emit(eventName, ...args);
    }

    public globalEmit(eventName: string, ...args: any[]) {
        EventCenter.I.emit(eventName, ...args);
    }

    update(dt: number) {
        if(this.dao) {
            this.dao.save();
            this.dao.update(dt);
        }
        this.onUpdate(dt);
    }

    /**
     * 每帧刷新
     * @param dt 时间间隔(s) 
     */
    protected onUpdate(dt: number) {
        
    }
    
    load() {
        if(this.daos) {
            for(let i=0;i<this.daos.length;i++) {
                let dao = this.daos[i];
                dao.load();
            }
        }else if(this.dao) {
            this.dao.load();
        }
    }

    initial() {
        if(this.daos) {
            for(let i=0;i<this.daos.length;i++) {
                let dao = this.daos[i];
                dao.initial();
            }
        }else if(this.dao) {
            this.dao.initial();
        }

        this.onInitial();
    }

    protected onInitial() {

    }

    save(focus?: boolean, now?: boolean) {
        if(this.daos) {
            for(let i=0;i<this.daos.length;i++) {
                let dao = this.daos[i];
                dao.save(focus, now);
            }
        }else if(this.dao) {
            this.dao?.save(focus, now);
        }
    }

    reset() {
        if(this.daos) {
            for(let i=0;i<this.daos.length;i++) {
                let dao = this.daos[i];
                dao.reset();
            }
        }else if(this.dao) {
            this.dao.reset();
        }
    }

    getModelData(holder: any, serialize: boolean) {
        if(!this.dataKey) {
            return;
        }

        if(this.daos) {
            let arr = holder[this.dataKey] = [];
            for(let i=0;i<this.daos.length;i++) {
                if(serialize) {
                    arr.push(this.daos[i].serialize());
                }else{
                    arr.push(this.daos[i].model);
                }
            }
        } else if(this.dao) {
            if(serialize) {
                holder[this.dataKey] = this.dao.serialize();
            }else{
                holder[this.dataKey] = this.dao.model;
            }
        }
    }

    setModelData(holder: any, replace: boolean, deserialize: boolean) {
        if(!this.dataKey) {
            return;
        }

        if(this.daos) {
            let arr = holder[this.dataKey];
            for(let i=0;i<this.daos.length;i++) {
                if(deserialize) {
                    this.daos[i].deserialize(arr[i], replace);
                }else{
                    this.daos[i].setData(arr[i], replace);
                }
            }
        }else{
            if(deserialize) {
                this.dao.deserialize(holder[this.dataKey], replace);
            }else{
                this.dao.setData(holder[this.dataKey], replace);
            }
        }
    }
}