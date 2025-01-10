import { BaseController } from "../../../framework/modules/base/BaseController";
import { guideDAO } from "./GuideDAO";

class GuideController extends BaseController {
    private _lastAnimalID = 0;

    public get lastAnimalID() {
        return this._lastAnimalID;
    }

    protected get dao() {
        return guideDAO;
    }

    protected get model() {
        return this.dao.model;
    }

    get dataKey(): string {
        return "guide";
    }

    public isBlockTiped(blockID: number) {
        return this.model.blockTips.indexOf(blockID) >= 0;
    }

    public setBlockTiped(blockID: number) {
        if (!this.isBlockTiped(blockID)) {
            this.model.blockTips.push(blockID);
            this.dao.easySave();
        }
    }
}

export const guideController = new GuideController();