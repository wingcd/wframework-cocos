import Skin from "./Skin";

export default class ViewMap {
    private _views: { [key: string]: Function } = {};
    private _skins: { [key: string]: Skin } = {};
    private _skinNames: { [key: string]: Skin } = {};
    private static readonly sTypeName = "__type_name__";

    private static _instance: ViewMap;
    public static get instance(): ViewMap {
        if (!this._instance) {
            this._instance = new ViewMap();
        }
        return this._instance;
    }

    public add(skin: Skin, viewClass: Function): void {
        let key = skin.getKey();
        this._views[key] = viewClass;
        viewClass[ViewMap.sTypeName] = key;
        this._skins[key] = skin;
        this._skinNames[skin.componentName] = skin;
    }

    public remove(skin: Skin): void {
        let key = skin.getKey();
        if (this._views[key]) {
            delete this._views[key][ViewMap.sTypeName];
        }
        delete this._views[key];
        delete this._skins[key];
        delete this._skinNames[skin.componentName];
    }

    public get(skin: Skin): ObjectConstructor {
        return <ObjectConstructor>this._views[skin.getKey()];
    }

    public getByName(name: string): ObjectConstructor {
        let skin = this.getSkinByName(name);
        if (skin) {
            return this.get(skin);
        }
        console.error("ViewMap getByName error: " + name);
        return null;
    }

    public getSkin(key: string): Skin {
        return this._skins[key];
    }

    public getSkinByName(name: string): Skin {
        return this._skinNames[name];
    }

    public getSkinByType(type: Function) {
        let key = type[ViewMap.sTypeName];
        return this.getSkin(key);
    }

    public get allViews(): Object {
        return this._views;
    }
}