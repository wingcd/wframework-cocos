import { systemController } from "../modules/system/SystemController";

export class TimeUtils {
    

    static isSameDay(time: number) {
        let nextDay = new Date(systemController.getTimeMS());
        let createTime = new Date(time);
        if (nextDay.getFullYear() != createTime.getFullYear() ||
            nextDay.getMonth() != createTime.getMonth() ||
            nextDay.getDate() != createTime.getDate()) {
            return false;
        }

        return true;
    }

    // 第一天为周一 而非周日
    static isSameWeek(time: number) {
        const today = new Date(systemController.getTimeMS());

        const day = today.getDay();

        const firstOfWeek = new Date(today.getTime() - ((day || 7) - 1) * 86400000);
        firstOfWeek.setHours(0, 0, 0, 0);

        const lastOfWeek = new Date(today.getTime() + (7 - (day || 7)) * 86400000);
        lastOfWeek.setHours(23, 59, 59, 999);

        return time >= firstOfWeek.getTime() && time <= lastOfWeek.getTime();
    }

    // 获取本周一0点的时间戳
    public static getStartOfWeek() {
        const now = systemController.getServerDate();
        now.setDate(now.getDate() - ((now.getDay() || 7) - 1));
        now.setHours(0, 0, 0, 0);
        return Math.floor(now.getTime() / 1000)
    }

    // 获取距离本周一0点的秒数
    public static getPassedTimeByWeek() {
        return systemController.getTime() - this.getStartOfWeek();
    }

    /**
     * 判断是否是新的一天
     * @param {Object|Number} dateValue 时间（ms)
     * @returns {boolean}
     */
    static isNewDay(dateValue: Date | number) {
        var oldDate: any = new Date(dateValue);
        var curDate: any = systemController.getServerDate();

        var oldYear = oldDate.getYear();
        var oldMonth = oldDate.getMonth();
        var oldDay = oldDate.getDate();
        var curYear = curDate.getYear();
        var curMonth = curDate.getMonth();
        var curDay = curDate.getDate();

        if (curYear > oldYear) {
            return true;
        } else {
            if (curMonth > oldMonth) {
                return true;
            } else {
                if (curDay > oldDay) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 获取任意一天,任意时间点
     * @param day 天
     * @param hour 小时
     * @returns ms
     */
    static getDayTime(day = 0, hour = 0) {
        return new Date(new Date(systemController.getServerDate()).setDate(new Date(systemController.getServerDate()).getDate() + day)).setHours(hour, 0, 0, 0)
    }
    /**
     * 获取指定日期任意时间点
     * @param date 时间戳(s)
     * @param hour 小时
     * @returns ms
     */
    static getTargetDayTime(date: number, hour = 0) {
        let ret = new Date(date * 1000).setHours(hour, 0, 0, 0);
        return ret;
    }

    /**
     * 把一天通过h划分n个等分,获取上一个整点位置
     * @param h 小时 必须24/h 必须为整数
     */
    static getLastBisectionTime(h: number) {
        let hour = new Date(systemController.getServerDate()).getHours();
        let num = Math.floor(hour / h);
        return this.getDayTime(0) + num * h * 60 * 60 * 1000;
    }

    /**
     * 时间戳转换年月日时分秒
     * @param t 时间戳（秒）
     * @param type 1 年月日时分秒 2 年月日时分 3年月日
     * @returns 
     */
    public static getYMDhms(t: number, type = 1) {
        var time = new Date(t * 1000);
        var y = time.getFullYear();
        var m = time.getMonth() + 1;
        var d = time.getDate();
        if (type == 3) {
            return y + '.' + this.add(m) + '.' + this.add(d)
        }
        var h = time.getHours();
        var mm = time.getMinutes();
        var s = time.getSeconds();
        return y + '.' + this.add(m) + '.' + this.add(d) + ' ' + this.add(h) + ':' + this.add(mm) + (type == 2 ? '' : ':' + this.add(s));
    }

    //当前距离下周一0点的毫秒数
    public static getWeekTime() {
        let now = systemController.getServerDate();
        let day = now.getDay();
        day = day == 0 ? 7 : day;
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();
        let millisecond = now.getMilliseconds();
        let weekTime = 86400000 * (7 - day + 1) - (hour * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000 + millisecond);
        return weekTime;
    }

    /**
     * 返回 
     * @param t 秒
     * @param type 1： 00:00:00  2：1h2m  3 00:00:00(h为0也要) 4 hm 5h
     * @returns 
     */
    public static getHMS(t: number, type = 1) {
        let h = Math.floor(t / (3600));
        let m = Math.floor((t % 3600) / 60);
        let s = Math.floor(t % 60);
        switch (type) {
            case 5:
                return h + "h";
            case 4:
                return this.add(h) + ":" + this.add(m);
            case 3:
                return this.add(h) + ":" + this.add(m) + ":" + this.add(s)
            case 2:
                return h > 0 ? (h + "h" + (m > 0 ? m + "m" : "")) : (m + "m" + (s > 0 ? s + "s" : ""));
            case 1:
            default:
                return h > 0 ? (h + ":" + this.add(m) + ":" + this.add(s)) : (this.add(m) + ":" + this.add(s))
        }
    }

    /**
     * 返回 
     * @param t 秒
     * @returns 几天 不足1天返回0;
     */
    public static getDay(t: number) {
        let d = Math.floor(t / (3600 * 24));
        return d;
    }

    public static add(num) {
        return num < 10 ? '0' + num : num;
    }

    static dateFormat(time: number, fmt: string = "yyyy-MM-dd hh:mm:ss") {
        let date = new Date(time);
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds() //毫秒
        };
        return this.formatDateOrTime(fmt, o, date.getFullYear());
    }

    static timeFormat(t: number, format: string = "hh:mm:ss") {
        const day = Math.floor(t / 86400);
        const hour = Math.floor((t % 86400) / 3600);
        const minute = Math.floor((t % 3600) / 60);
        const second = Math.floor(t % 60);
        
        var o = {
            "D+": day,
            "h+": hour,
            "m+": minute,
            "s+": second
        };
        return this.formatDateOrTime(format, o);
    }

    private static formatDateOrTime(fmt: string, o: any, year?: number) {
        if (year && /(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (year + "").substr(4 - RegExp.$1.length));
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }    
}