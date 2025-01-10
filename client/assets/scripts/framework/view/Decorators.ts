import IContainer from "./interface/IContainer";
import SkinHelper from "./SkinHelper";

export function inject(type: Function, path?: string, data?: any, optional?: boolean) {
    return function (target, key: string) {
        target.__injectInfos = Object.assign({}, target.__injectInfos);

        if (!type) {
            console.error("inject type is null");
        }
        target.__injectInfos[key] = { type, path, data, optional };
    }
}

export function registSkin(uiPackage: string, componentName: string, data?: any, isWindow?: boolean, autoWarpper?: boolean, registNow = false, optional = false) {
    return function (target: new () => IContainer) {
        if(registNow) {
            SkinHelper.bindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper, optional);
        }else{
            SkinHelper.preBindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper, optional);
        }
    }
}

export function registSkinEx(target: any, uiPackage: string, componentName: string, data?: any, isWindow?: boolean, autoWarpper?: boolean, registNow = false, optional = false) {
    if(registNow) {
        SkinHelper.bindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper, optional);
    }else{
        SkinHelper.preBindingSkin(target, uiPackage, componentName, data, isWindow, autoWarpper, optional);
    }
}