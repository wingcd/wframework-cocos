import { EventCenter } from "../../common/EventCenter";
import { BaseController } from "../base/BaseController";

class SystemController extends BaseController {
    static SYSTEM_CROSS_DAY = "SYSTEM_CROSS_DAY";
    static SYSTEM_CROSS_HOUR = "SYSTEM_CROSS_HOUR";

    private _nextDayZeroTime: number = 0;
    // 服务器毫秒时间
    private _serverTime: number = Date.now();
    // 上一次设置服务器时间后的运行时间
    private _timeTicker: number = 0;

    private _checkH: number = 0;

    /**
     * 设置服务器时间(秒/毫秒)
     * @param servertime 
     */
    setTime(servertime: number) {
        if (servertime < 10000000000) {
            servertime *= 1000;
        }

        this._serverTime = servertime;
        this._timeTicker = 0;
    }

    protected onInitial() {
        this._checkH = this.getH();
        setInterval(() => {
            this._timeTicker += 1000;
        }, 1000);
    }

    /**
     * 获取当前时间戳(毫秒)，与服务器时间同步
     * @returns {number} 毫秒
     */
    getTimeMS() {
        return Math.floor(this._serverTime + this._timeTicker);
    }

    /**
     * 获取当前时间戳(秒)，与服务器时间同步
     * @returns {number} 秒
     */
    getTime() {
        return Math.floor((this._serverTime + this._timeTicker) * 0.001);
    }

    /**
     * 获取当前是本年第几周
     * @returns 
     */
    getWeek() {
        let date = this.getTime();
        let query_date = new Date(date * 1000 + 1);
        // 年的第一天
        const fist_day_of_year = new Date(query_date.getFullYear(), 0, 1);
        // 年的第一天是周几
        let week = fist_day_of_year.getDay();//0-6 0是周末
        // 毫秒差
        const ms_count = query_date.getTime() - fist_day_of_year.getTime();
        // 今天是今年的第几天
        let days_count = Math.ceil(ms_count / 86400000);
        days_count += (week - 1);//凑齐一周
        return Math.ceil(days_count / 7);
    }

    // 当前周几 1-7
    getWeekDay() {
        const day = this.getServerDate().getDay();
        return day == 0 ? 7 : day;
    }

    getServerDate() {
        return new Date(this.getTimeMS());
    }

    getH() {
        let t = this.getTimeMS();
        let h = new Date(t).getHours();
        return h;
    }

    /**
     * 获取任意一天,任意时间点
     * @param day 天
     * @param hour 小时
     * @returns ms
     */
    getDayTime(day = 0, hour = 0) {
        return new Date(new Date(this.getServerDate()).setDate(new Date(this.getServerDate()).getDate() + day)).setHours(hour, 0, 0, 0)
    }


    // 判断是否跨天
    private _checkCrossDay() {
        if (this._nextDayZeroTime == 0) {
            this._nextDayZeroTime = this.getDayTime(1);
        }

        // 跨天了
        if (this.getTimeMS() >= this._nextDayZeroTime) {
            console.log("跨天了", this.getTimeMS(), this._nextDayZeroTime, this.getTimeMS() - this._nextDayZeroTime, this.getDayTime(1), this.getTimeMS() - this.getDayTime(1))
            EventCenter.I.emit(SystemController.SYSTEM_CROSS_DAY);
            this._nextDayZeroTime = this.getDayTime(1);
        }
    }
    // 整点报时
    private _checkHouse() {
        let h = this.getH();
        if (this._checkH != h) {
            this._checkH = h;
            EventCenter.I.emit(SystemController.SYSTEM_CROSS_HOUR);
        }
    }

    protected onUpdate(dt: number): void {
        this._checkCrossDay();
        this._checkHouse();
    }
}

export const systemController = new SystemController();