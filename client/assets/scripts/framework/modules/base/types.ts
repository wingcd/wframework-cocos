export interface IController {
    on(eventName: string, handler: Function, target: any);

    once(eventName: string, handler: Function, target: any);

    off(eventName: string, handler: Function, target: any);

    emit(eventName: string, ...args: any[]);

    globalEmit(eventName: string, ...args: any[]);
}

export interface ISecretController extends IController {
    update(dt: number);

    getMd5(data: any, token: string);

    removeKey(key: string);

    setValidKey(target: any, key: string, ...fields: string[]);

    checkValue(target: any, key: string, field?: string): boolean;

    checkAndUpdateValue(target: any, key: string, field: string, value: any): boolean;

    fireOnItemSaved(storageKey: string);
}

export interface ISecretDAO {
    removeSecret(key: string);

    getSecret(key: string);

    setSecret(key: string, token: string, md5: string);
}

export interface IBaseDAO {
    serverDirty: boolean;
    isValidate: boolean;
    model: any;
    load(): void;
    initial(): void;
    checkSave(): void;
    save(focus?: boolean, now?:boolean, fireEvent?: boolean): void;
    easySave(): void;
    update(dt: number): void;
    setData(data: any, fromServer?: boolean); 
    reset(): void;
    serialize(): any;
    deserialize(data: any, fromServer: boolean): void;
}