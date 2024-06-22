type KeyType = string | number;

export interface IPoolable {
    createFromPool?(data: any);
    fromPool?();
    toPool?();
    __pool_type__?: KeyType;
    __pool_key__?: KeyType;
}

export class PoolManager<T extends IPoolable> {
    private _defaultKey = "default";

    private _types: Map<KeyType, new () => T> = new Map();
    private _items: Map<string, T[]> = new Map();

    constructor(defaultType?: new () => T) {
        if (defaultType) {
            this.register(this._defaultKey, defaultType);
        }
    }

    private getKey(type: KeyType, key?: KeyType) {
        return key != undefined ? `${type}|${key}` : `${type}`;
    }

    register(type: KeyType, classType: new () => T, count: number = 0, data?: KeyType) {
        this._types.set(type, classType);
        // @ts-ignore
        classType.__pool_type__ = type;

        let keyStr = this.getKey(type, data);
        if (!this._items.has(keyStr)) {
            this._items.set(keyStr, this.createItems(classType, count, keyStr, data));
        }
    }

    private createItems(classType: new () => T, count: number, keyStr: string, data?: KeyType): T[] {
        let items = [];
        while (count > 0) {
            let item = new classType();
            if (item.createFromPool) {
                item.createFromPool(data);
            }
            item.__pool_key__ = keyStr;
            items.push(item);
            count--;
        }
        return items;
    }

    getFreeCount(cls?: any, data?: KeyType) {
        let type = cls.__pool_type__;
        let keyStr = this.getKey(type, data);
        let pool = this._items[keyStr];
        if(!pool) {
            return 0;
        }
        return pool.length;
    }

    get(cls?: new () => T, data?: KeyType): T {
        cls = cls || this._types.get(this._defaultKey);
        // @ts-ignore
        let type = cls.__pool_type__;
        return this.getByType(type, data) as T;
    }

    async getAsync(cls?: new ()=>T, data?: KeyType) {
        cls = cls || this._types.get(this._defaultKey);
        // @ts-ignore
        let type = cls.__pool_type__;
        return await this.getByTypeAsync(type, data) as T;
    }

    async getByKeyAsync(key: KeyType) {
        return await this.getAsync(null, key);
    }

    getByKey(key: KeyType) {
        return this.get(null, key);
    }

    async getByTypeAsync(type: KeyType, data?: KeyType) {
        if(type == null) {
            console.warn(`缓存错误：尝试缓存非池化数据`);
            return;
        } 

        let keyStr = this.getKey(type, data);
        let pool = this._items[keyStr];
        if(!pool) {
            pool = this._items[keyStr] = [];
        }

        if(pool.length > 0) {
            let item = pool.pop();
            item.fromPool && item.fromPool();
            return item;
        }

        let cls = this._types.get(type);
        let item = new cls() as T;
        if(item.createFromPool) {
            await item.createFromPool(data);
        }
        item.__pool_key__ = data;
        item.fromPool && item.fromPool();
        return item;
    }

    getByType(type: KeyType, data?: KeyType): T{
        if(type == null) {
            console.warn(`缓存错误：缓存非池化数据`);
            return;
        } 

        let keyStr = this.getKey(type, data);
        let pool = this._items[keyStr];
        if(!pool) {
            pool = this._items[keyStr] = [];
        }

        if(pool.length > 0) {
            let item = pool.pop();
            item.fromPool && item.fromPool();
            return item;
        }

        let cls = this._types.get(type);
        let item = new cls() as T;
        if(item.createFromPool) {
            item.createFromPool(data);
        }        
        item.__pool_key__ = data;
        item.fromPool && item.fromPool();
        return item;
    }

    put(item: T) {
        if(!item) {
            console.warn(`缓存错误：缓存空数据`);
            return;
        }

        //@ts-ignore
        let type = item.constructor.__pool_type__;
        if(type == null) {
            console.warn(`缓存错误：缓存非池化数据`);
            return;
        } 

        //@ts-ignore
        let keyStr = this.getKey(type, item.__pool_key__);
        let pool = this._items[keyStr];
        if(!pool) {
            console.error(`缓存错误：未注册缓存类型${keyStr}`);
            return;
        }

        item.toPool && item.toPool();
        pool.push(item);
    }

    registDefault(cls: new()=>T, count: number = 0, data?: KeyType) {
        this.register(this._defaultKey, cls, count, data);
    }
}