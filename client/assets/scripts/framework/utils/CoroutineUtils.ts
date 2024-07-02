import { Director, director } from "cc";
import { Timer } from "../common/Timer";

export class CoroutineUtils {   

    /** 等待一帧 */
    public static oneframe(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.frameOnce(1, resolve, this);
        });
    }
    
    /** 等待帧结束 */
    public static endframe(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            director.once(Director.EVENT_END_FRAME, resolve, this);
        });
    }

    /** 等待num帧 */
    public static waitframe(num: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.frameOnce(num, resolve, this);
        });
    }

    /** 等待成功 */
    public static until(condition: () => boolean, timeout = 0): Promise<void> {
        let timer = 0;
        return new Promise<void>((resolve, reject) => {
            let func = () => {
                if (condition() || (timeout > 0 && timer >= timeout)) {
                    Timer.inst.clear(func, this);
                    resolve();
                }
                timer += Timer.inst.delta / 1000;
            };
            Timer.inst.frameLoop(1, func, this);
        });
    }

    /** 延迟指定时间（秒） */
    public static wait(time: number = 1): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Timer.inst.once(time * 1000, resolve, this);
        });
    }
}