/**
 * 优先级1将会在首次加载，优先级2为后台加载，其他优先级不自动加载
 */

import { HTML5, PREVIEW } from "cc/env";
import { JsonAsset, assetManager } from "cc";
import { ResManager } from "./common/ResManager";


interface PackageInfo {
    name: string,
    priority: number,
    weight: number,
    debug?: boolean,
    preloads?: string[],
    preloadFiles?: any[][];
};

interface UIPackageInfo extends PackageInfo {
    bundle: string,
    path?: string,
};

export class GameSettings {
    static rawData: any = {};
    static useid: string = "";
    static channel: string = "wx";
    static version: string = "1.0.0";
    static isDebug = false;
    static realVersion = "1.0.0";
    static mergeTimeScale = 1;
    static packages: PackageInfo[] = [];
    static uiPackages: UIPackageInfo[] = [];
    static datas: any = {};

    static debug = {
    }

    static time = "";
    static gitInfo = {
        version: "",
        shortVersion: "",
        author: "",
        time: "",
    };

    static getValue(key: string) {
        return this.datas[key];
    }

    static setValue(key: string, value: any) {
        this.datas[key] = value;
    }
    
    static async initial() {        
        let configAsset = await ResManager.getAsync(null, "config", JsonAsset) as JsonAsset;
        this._initial(configAsset.json);
    }

    private static _initial(config: any) {
        this.rawData = config;

        let keys = Object.keys(config);
        for (let key of keys) {
            // if (key == "isDebug") {
            //     continue;
            // }

            this[key] = config[key];
        }

        if (window["configVersion"]) {
            this.realVersion = window["configVersion"];
        }

        console.log("Build Time: " + this.time);
        console.log("GitInfo: ", this.gitInfo);
    }
    
    /**
     * 重置远程服务器地址，用于通过版本号或者配置版本号来重置远程服务器地址
     * @param configVersion 配置版本号
     * @returns 
     */
    static resetRemoveServer(configVersion?: any) {
        if (HTML5 && PREVIEW) {
            console.log("HTML5不需要重置远程服务器地址");
            return;
        }

        let downloader = assetManager.downloader;

        if (!PREVIEW) {
            // 程序版本号优先
            if (!window["configVersion"] && configVersion) {
                // 设置为线上配置版本号
                const versionCfg = configVersion;
                if (versionCfg && versionCfg.configVersion) {
                    GameSettings.realVersion = versionCfg.configVersion;
                }
            }
        }
        let newUrl = downloader.remoteServerAddress;
        let version = GameSettings.realVersion;

        newUrl = `${newUrl.replace(/\/$/g, "")}/${GameSettings.channel}/${version}/`;
        //@ts-ignore
        downloader.init(newUrl, downloader.bundleVers, downloader.remoteBundles);
    }
}