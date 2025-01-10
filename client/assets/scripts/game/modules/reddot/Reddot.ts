import { RedDotManager } from "../../../framework/plugins/reddot/RedDotManager";

export class Reddot {
    private static _inst: Reddot;
    public static get inst() {
        if(!this._inst) {
            this._inst = new Reddot();
        }
        return this._inst;
    }

    public static HOME_TASK = "home_task";
    public static HOME_DAILY_GIFT = "home_daily_gift";
    public static HOME_SEVEN_DAY = "home_seven_day";

    public init() {
        RedDotManager.inst.initial();

        RedDotManager.inst.create(Reddot.HOME_TASK);
        RedDotManager.inst.create(Reddot.HOME_DAILY_GIFT);
        RedDotManager.inst.create(Reddot.HOME_SEVEN_DAY);
    }
}