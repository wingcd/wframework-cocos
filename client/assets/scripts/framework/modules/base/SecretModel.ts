import { BaseModel } from "./BaseModel";

export class SecretModel extends BaseModel {
    [key: string] : {
        token: string,
        md5: string,
    } | any;
}