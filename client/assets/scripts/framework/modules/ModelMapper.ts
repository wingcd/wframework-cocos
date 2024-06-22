const ModelMapperInfo = null;

export class ModelMapper {
    static modelMapperInfo : {
        [key: string]: {
            type: any,
            fields?: {
                [key: string]: {
                    alias?: string,
                    mapper?: string,
                    type?: any,
                }
            },
            arrArrayFields?: string[],
        }
    } = ModelMapperInfo;

    static toData(data: any, type: string) {
        if(!this.modelMapperInfo) {
            return data;
        }

        if (Array.isArray(data)) {
            let array = [];
            for (let i = 0; i < data.length; i++) {
                let item = this.toData(data[i], type);
                array.push(item);
            }
            return array;
        } else if (typeof data != "object") {
            return data;
        }

        let info = this.modelMapperInfo[type];
        if (info) {
            if (info.arrArrayFields) {
                if (data) {
                    let keys = info.arrArrayFields;//Object.keys(data);
                    let array = [];
                    for (let key of keys) {
                        let item = this.toData(data[key], type);
                        array.push(item);
                    }
                    return array;
                } else {
                    return null;
                }
            }

            let model = new info.type();
            let keys = Object.keys(model);
            for (let key of keys) {
                if (info.fields) {
                    let field = info.fields[key];
                    if (field) {
                        if (field.mapper) {
                            model[field.alias || key] = this.toData(data[key], field.mapper);
                        } else {
                            if (field.type == Boolean) {
                                model[field.alias || key] = data[key] ? 1 : 0;
                            } else {
                                model[field.alias || key] = data[key];
                            }
                        }
                    } else {
                        model[key] = data[key];
                    }
                } else {
                    model[key] = data[key];
                }
            }
            return model;
        } else {
            return data;
        }
    }

    static fromData(data: any, type: string, toObject = false) {
        if(!this.modelMapperInfo) {
            return data;
        }

        let info = this.modelMapperInfo[type];
        if (Array.isArray(data) && !toObject) {
            let array = [];
            for (let i = 0; i < data.length; i++) {
                let item = this.fromData(data[i], type, true);
                array.push(item);
            }
            return array;
        } else if (typeof data != "object") {
            return data;
        }

        if (info) {
            if (info.arrArrayFields) {
                if (data) {
                    let keys = Object.keys(data);
                    let obj = new info.type();
                    for (let key of keys) {
                        let field = info.arrArrayFields[key];
                        obj[field] = this.fromData(data[key], type);
                    }
                    return obj;
                } else {
                    return null;
                }
            }

            let model = {};
            let keys = Object.keys(data);
            for (let key of keys) {
                if (info.fields) {
                    let field = info.fields[key];
                    if (field) {
                        if (field.mapper) {
                            model[key] = this.fromData(data[field.alias || key], field.mapper);
                        } else {
                            if (field.type == Boolean) {
                                model[key] = data[field.alias || key] ? 1 : 0;
                            } else {
                                model[key] = data[field.alias || key];
                            }
                        }
                    } else {
                        model[key] = data[key];
                    }
                } else {
                    model[key] = data[key];
                }
            }
            return model;
        } else {
            return data;
        }
    }
}