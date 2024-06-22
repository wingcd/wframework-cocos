import ViewMap from "./ViewMap";

export default class Skin {
    static defaultAssetBundle: string;

    public path: string;
    public assetbundle: string;
    public packageName: string;
    public componentName: string;
    public data:any;
    public suffix = "";
    public isWindow = false;

    // activity是否自动被loader包含
    public autoWarpper = false;

    private _key: string = null;  
    
    public constructor(_path:string, _pkgName:string, _cmpName:string, _data?:any, _isWindow?:boolean, _autoWarpper?: boolean, _assetbundle?: string){
        this.path = _path;
        this.packageName = _pkgName;
        this.componentName = _cmpName;
        this.data = _data;
        this.isWindow = _isWindow;
        this.autoWarpper = _autoWarpper;
        this.assetbundle = _assetbundle;
    }
    
    public getKey():string{
        if(this._key) {
            return this._key;
        }

        let key = this.path + "|" + this.packageName+ "|"  + this.componentName + this.suffix;
        if(this.data){
            key += "|" + this.data;
        }
        this._key = key.toLowerCase();
        return this._key;
    }    

    public static bindSkin(viewType:Function, skin: Skin) {
        ViewMap.instance.add(skin, viewType);
    }

    public static getSkin(viewType:Function): Skin {
        return ViewMap.instance.getSkinByType(viewType);
    }
}