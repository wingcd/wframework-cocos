import { _decorator, resources, __private, assetManager, Asset, AssetManager } from 'cc';
import { UtilsHelper } from '../utils/UtilsHelper';
import { PackageVersionMap } from '../patch/ccc_patch';
import { UIPackage } from 'fairygui-cc';
import FGUIExt from '../view/utils/FGUIExt';

const RESOURCES = "resources";
export class ResManager {
    static async preload(uuid: string, progress?: Function) {
        return new Promise((resolve, reject) => {
            assetManager.preloadAny(uuid, (p) => {
                progress && progress(p);
            }, (err: any, res: any) => {
                resolve(res);
            });
        })
    }

    static async loadBundle(abName: string) {
        if(abName == RESOURCES || !abName) {
            return true;
        }

        let pkg = PackageVersionMap[abName];
        let version = pkg && typeof pkg == "object" ? pkg.hash : pkg;
        let config = {
            version: version,
        };

        try {
            let bundle: AssetManager.Bundle = await new Promise((resolve, reject) => {
                assetManager.loadBundle(abName, config, (err, bundle) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(bundle);
                    }
                });
            });

            let loaders = bundle.deps.map(dep => this.loadBundle(dep));
            if (loaders.length > 0) {
                await Promise.all(loaders);
            }

            return true;
        } catch (err) {
            console.error("下载失败", abName);
            return false;
        }
    }

    static getBundle(abName?: string, check: boolean = true) {
        if(!abName || abName == RESOURCES) {
            return resources;
        }

        let ab = assetManager.getBundle(abName);
        if(!ab && check) {
            console.error(`can not find asset bundle named ${abName}`);
        }
        return ab;
    }

    static get<T extends Asset>(abName: string, url: string | Array<string>, type: __private._types_globals__Constructor<T>): T | T[] {
        let ab = this.getBundle(abName, true);
        if (!ab) {
            throw new Error(`Cannot find asset bundle named ${abName}`);
        }

        if (typeof url == "string") {
            return ab.get(url, type as any) as any;
        } else {
            return url.map(u => ab.get(u, type as any));
        }
    }

    static async getAsync<T extends Asset>(abName: string, url: string | Array<string>, type: __private._types_globals__Constructor<T>){
        let ab = this.getBundle(abName, false);
        if(!ab) {
            await this.loadBundle(abName);
        }

        let res = this.get(abName, url, type);
        if(res) {
            return res as any;
        }

        try {
            res = await this.load(abName, url, type) as any;
        } catch (e) {
            throw new Error(`load ${abName}:${url} data err:${e}`);
        }

        return res;
    }

    static async load<T extends Asset>(abName: string, url: string | Array<string>, type: __private._types_globals__Constructor<T>, onProgress?: any): Promise<T|T[]> {
        let ab = this.getBundle(abName);
        if (!ab) {
            throw new Error(`Cannot find asset bundle named ${abName}`);
        }

        return new Promise((resolve, reject) => {
            ab.load(url as any, type as any, onProgress, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res as any);
                }
            });
        });
    }

    static async loadDir(abName: string, url: string | Array<string>, onProgress?: any): Promise<Asset[]> {
        url = url || "";

        let ab = this.getBundle(abName);
        if(!ab) {
            throw new Error(`can not find asset bundle named ${abName}`);
        }
        
        return new Promise((resolve, reject) => {
            ab.loadDir(url as any, onProgress, (err, res) => {
                if(err) {
                    reject(err);
                }else{
                    resolve(res);
                }
            });
        });
    }

    static destory(asset: Asset) {
        asset.destroy();
    }

    static async loadFUIBundle(bundle: string, pkg: string,progress?: (p: number) => void, delay?: boolean) {
        if (!this.isValidBundleAndPackage(bundle, pkg)) {
            return false;
        }

        await this.loadBundle(bundle);
        return await FGUIExt.preloadPackage(bundle, pkg, progress, delay);
    }

    static unloadFUIBundle(bundle: string, pkg: string) {
        if (!this.isValidBundleAndPackage(bundle, pkg)) {
            return;
        }

        UIPackage.removePackage(pkg);

        let b = this.getBundle(bundle);
        b.releaseAll();
        assetManager.removeBundle(b);
    }

    static isValidBundleAndPackage(bundle: string, pkg: string) {
        if (!pkg || UIPackage.getByName(pkg)) {
            return false;
        }

        if (!bundle || !this.getBundle(bundle)) {
            return false;
        }

        return true;
    }

    static getById<T extends Asset>(id:number, type: __private._types_globals__Constructor<T>) {
        return null;
    }

    static async getByIdAsync<T extends Asset>(id:number, type: __private._types_globals__Constructor<T>) {
        return null;
    }
}