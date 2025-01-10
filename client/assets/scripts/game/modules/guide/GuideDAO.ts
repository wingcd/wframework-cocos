import { BaseDAO } from "../../../framework/modules/base/BaseDAO";
import { GuideModel } from "./GuideModel";

export class GuideDAO extends BaseDAO<GuideModel> {
    get storageKey() {
        return "guide";
    }

    get modelName() {
        return "GuideModel";
    }
}

export const guideDAO = new GuideDAO(GuideModel);