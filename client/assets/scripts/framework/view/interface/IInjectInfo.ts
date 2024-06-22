export type InjectData = {
    type: Function;
    path?: string;
    data?: any;
    optional?: boolean;
}

export type InjectObject = {
    [key:string]:InjectData;
}

export interface IInjectInfo{    
    injectInfos: InjectObject;
    registInfos():void;
}