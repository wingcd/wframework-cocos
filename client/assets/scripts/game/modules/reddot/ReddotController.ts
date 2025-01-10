import { EventCenter } from "../../../framework/common/EventCenter";
import { BaseController } from "../../../framework/modules/base/BaseController";
import { RedDotManager } from "../../../framework/plugins/reddot/RedDotManager";
import { GameEvent } from "../../const/GameEvent";
import { userController } from "../user/UserController";
import { Reddot } from "./Reddot";
import { reddotDAO } from "./ReddotDAO";

export class ReddotController extends BaseController {
    protected get dao() {
        return reddotDAO;
    }

    protected get model() {
        return this.dao.model;
    }

    protected onInitial(): void {        
        Reddot.inst.init();

        EventCenter.I.on(GameEvent.SYSTEM_CROSS_DAY, this.onNewDay, this);
        this._checkReddot();
    }

    private onNewDay() {
        this._clearReddot();
        this._checkReddot();
    }

    private _clearReddot() {
        RedDotManager.inst.clearMessage(Reddot.HOME_DAILY_GIFT);
        RedDotManager.inst.clearMessage(Reddot.HOME_SEVEN_DAY);
    }

    private _checkReddot() {
        if(!userController.dailyGiftGetted) {
            RedDotManager.inst.addMessage(Reddot.HOME_DAILY_GIFT);
        }

        if(!userController.isSignToday) {
            RedDotManager.inst.addMessage(Reddot.HOME_SEVEN_DAY);
        }
    }
}
export const reddotController = new ReddotController();