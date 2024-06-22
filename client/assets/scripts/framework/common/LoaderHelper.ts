import { ResManager } from "./ResManager";

export class LoaderHelper {
    public static MAX_LOAD_COUNT = 2;
    private static _loadingCount = 0;
    private static _loaders: LoaderHelper[] = [];

    public abName: string;
    public pkgName: string;

    private _loaded = false;
    private _loading = false;
    private _callback: { callback: () => void, thisObj: any } = null;
    constructor(abName: string, pkgName: string, callback?: () => void, thisObj?: any) {
        this.abName = abName;
        this.pkgName = pkgName;
        if (callback) {
            this._callback = { callback: callback, thisObj: thisObj };
        }
    }

    public static tick() {
        if (LoaderHelper._loaders.length == 0 || LoaderHelper._loadingCount >= LoaderHelper.MAX_LOAD_COUNT) {
            return;
        }

        let loader = LoaderHelper._loaders.shift();
        if (loader && !loader._loading) {
            loader.doLoad();
        }        
    }

    public async load() {
        if (this._loaded) {
            this.onResReady();
            return;
        }
        
        if(this._loading) {
            return;
        }

        if (LoaderHelper._loadingCount >= LoaderHelper.MAX_LOAD_COUNT) {
            LoaderHelper._loaders.push(this);
            return;
        }
        
        this.doLoad();
    }

    private doLoad() {
        if (this._loading) return;
        this._loading = true;
        LoaderHelper._loadingCount++;
        // 由于涉及资源加载，有open，保证资源加载完成
        ResManager.loadFUIBundle(this.abName, this.pkgName, null, true).then(() => {
            this._loading = false;
            LoaderHelper._loadingCount--;
            this.onResReady();
        });
    }

    public loadRes(callback?: () => void, thisObj?: any) {
        if(this._loaded) {
            if(callback) {
                callback.call(thisObj);
            }
            return;
        }

        // 由于涉及资源加载，有open，保证资源加载完成
        ResManager.loadFUIBundle(this.abName, this.pkgName, null, true).then(() => {
            if(callback) {
                callback.call(thisObj);
            }
        });
    }

    protected onResReady() {
        this._loaded = true;
        if (this._callback) {
            this._callback.callback.call(this._callback.thisObj);
        }
    }

    public get loaded() {
        return this._loaded;
    }

    public get loading() {
        return this._loading;
    }

    public dispose() {
        this._callback = null;
        ResManager.unloadFUIBundle(this.abName, this.pkgName);
    }
}