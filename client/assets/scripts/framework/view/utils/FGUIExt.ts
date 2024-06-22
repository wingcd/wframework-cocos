import Skin from "../Skin";
import { UIPackage, GObject, GComponent } from "fairygui-cc";
import { assetManager } from "cc";
import { UIConfig } from "fairygui-cc";

export default class FGUIExt {
    static unloadPackage(name: string) {
        UIPackage.getByName(name)?.dispose();
    }

    static async preloadPackage(abname: string, path: string, progress?: (p: number) => void, delay?: boolean) {
        return new Promise<void>((resolve, reject) => {   
            if(abname) {     
                let defaultDelay = delay ?? UIConfig.enableDelayLoad;   
                abname = abname ?? Skin.defaultAssetBundle;
                let assetbundle = assetManager.getBundle(abname);
                UIPackage.loadPackage(assetbundle, path, (finish, total, item)=>{
                    progress?.call(finish/total, total);
                }, (err, pk)=>{
                    if(err) {
                        reject(err);
                    }else{
                        resolve();
                    }
                }, defaultDelay);
            }else{
                UIPackage.loadPackage(path, (finish, total, item)=>{
                    progress?.call(finish/total, total);
                }, (err, pk)=>{
                    if(err) {
                        reject(err);
                    }else{
                        resolve();
                    }
                });
            }
        });
    }

    static checkPackageLoaded(skin: Skin): UIPackage {
        let pkg = UIPackage.getByName(skin.packageName);
        if (pkg == null) {
            let abname = Skin.defaultAssetBundle ?? skin.assetbundle;
            if(abname) {
                let assetbundle = assetManager.getBundle(abname);
                UIPackage.loadPackage(assetbundle, skin.path, (err, pk)=>{
                    pkg = pk;
                });
                console.log("please preload ui assets in assetbundle mode");
            }
            pkg = UIPackage.addPackage(skin.path);
        }
        return pkg;
    }

    public static createObject(skin: Skin): GObject {
        let pkg = FGUIExt.checkPackageLoaded(skin);
        return pkg.createObject(skin.componentName);
    }

    public static createObjectByType(skin: Skin, type: new () => GObject): GObject {
        let pkg = FGUIExt.checkPackageLoaded(skin);
        return pkg.createObject(skin.componentName, type);
    }

    public static cloneObject(obj: GComponent) {
        return UIPackage.createObjectFromURL(obj.resourceURL) as GComponent;
    }
}