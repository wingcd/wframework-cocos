import { EDITOR } from "cc/env";
import { IActivityProxy } from "./IActivityProxy";

export class ActivityProxyManager {
    private static _inst = new ActivityProxyManager();
    static get inst() {
        return this._inst;
    }

    private _proxyList: IActivityProxy[] = [];
    private _proxyMap: { [key: string]: IActivityProxy } = {};

    regist(proxy: IActivityProxy) {
        if (this._proxyMap[proxy.name]) {
            this.unregist(proxy.name);
        }

        this._proxyMap[proxy.name] = proxy;
        this._proxyList.push(proxy);
        proxy.regist();
    }

    unregist(name: string, destoryEnterView?: boolean) {
        let proxy = this._proxyMap[name];
        if (!proxy) {
            console.error(`卸载未注册proxy=${proxy.name}`);
            return;
        }
        
        proxy.unregist(destoryEnterView);
        delete this._proxyMap[name];
        let idx = this._proxyList.indexOf(proxy);
        if (idx >= 0) {
            this._proxyList.splice(idx, 1);
        }
    }

    update(dt: number, secondTick: boolean) {
        for (let i = this._proxyList.length - 1; i >= 0; i--) {
            let proxy = this._proxyList[i];
            if(proxy.enable) {
                proxy.update(dt, secondTick);
            }
        }
    }

    setEnable(name: string, enable: boolean) {
        let proxy = this._proxyMap[name];
        if (!proxy) {
            if(EDITOR) {
                console.error(`未注册proxy=${name}`);
            }
            return;
        }
        
        proxy.setEnable(enable);
    }
}