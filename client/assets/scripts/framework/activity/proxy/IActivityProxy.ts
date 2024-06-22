export interface IActivityProxy {
    name: string;
    enable: boolean;
    regist(): IActivityProxy;
    unregist(destoryEnterView?: boolean): void;
    update(dt: number, secondTick: boolean): void;
    setEnable(enable: boolean);
}