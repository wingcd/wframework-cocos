import { Color, Vec2 } from "cc";
import {  GComponent, GObject, GPath, GRoot, GTween, UIPackage } from "fairygui-cc";
import { V2_RIGHT, V2_UP, Vec2Pool } from "../../framework/common/Pool";
import { ResConst } from "../const/ResConst";
import { GComponentPool, GPathPointPool, PoolableGComponent} from "../../framework/common/Pools";
import { CoroutineUtils } from "../../framework/utils/CoroutineUtils";
import { MathUtils } from "../../framework/utils/MathUtils";
import { RewardData } from "../config/ConfigExtension";
import { EResourceType, ERewardType, EItemType } from "../const/types";
import { ConfigManager } from "../config/ConfigManager";
import { LocationManager } from "../../framework/view/common/LocationManager";
import { GetLocationByReward as getLocationByReward, UILocations } from "../const/UILocations";
import { GameConfig } from "../config/DataModel";
import { SoundManager } from "../../framework/common/SoundManager";

type AnimOptions = {
    delay?: number;
    curve?: boolean;
    fromScale?: number,
    toScale?: number,
    resUrl?: { [key: number]: string };
    data?: any;
    sourceComp?: GObject;
    waitTime?: number;
    waitStartScale?: number;
    isScale?: boolean;
    batchCompleteCallback?: Function;
    completeCallback?: Function;
    randomAnyway?: boolean;
};

const RES_CONTAINER_NAME = "ResContainer";
const TempVec2 = new Vec2();

export class UIHelper {
    public static async curveAnimTo(comp: GComponent, 
        from: Vec2, to: Vec2, duration = 1, fromScale = 1, toScale = 0.5, 
        isScale: boolean, delay: number = 0, 
        ctrl?: Vec2, waitTime?: number, callback?: Function) {
        if (!ctrl) {
            let dist = Vec2.distance(from, to) * 0.2;

            let dir = new Vec2(to).subtract(from).normalize();
            let cross = dir.cross(V2_UP);
            let offset = -dist * Math.sign(cross) * 0.5;
            dir.multiplyScalar(dist);

            ctrl = new Vec2(V2_RIGHT).multiplyScalar(offset).add(dir).add(from);
        }

        let cpt1 = GPathPointPool.get();
        cpt1.x = from.x;
        cpt1.y = from.y;
        cpt1.control1_x = ctrl.x;
        cpt1.control1_y = ctrl.y;

        let cpt2 = GPathPointPool.get();
        cpt2.x = to.x;
        cpt2.y = to.y;
        cpt2.control1_x = ctrl.x;
        cpt2.control1_y = ctrl.y;

        let path = new GPath;
        path.create2(cpt1, cpt2);

        let next = false;
        // console.log('comp.scaleX', comp.scaleX, comp.scaleY)
        comp.setPosition(from.x, from.y);
        if (isScale) {
            GTween.to2(fromScale * 0.8, fromScale * 0.8, fromScale * 1.2, fromScale * 1.2, 0.2)
                .setTarget(comp, comp.setScale)
                .onComplete(() => {
                    next = true;
                }, this);
            await CoroutineUtils.until(() => next);
            duration -= 0.2;
            next = false;
            if (delay > 0) {
                await CoroutineUtils.wait(delay);
                duration -= delay;
            }
        }

        if (waitTime) {
            await CoroutineUtils.wait(waitTime)
        }
        GTween.to2(from.x, from.y, to.x, to.y, duration)
            .setPath(path)
            .setTarget(comp, comp.setPosition)
            .onUpdate((twenner) => {
                let t = twenner.normalizedTime;
                let scale = (toScale - fromScale) * t + fromScale;
                comp.setScale(scale, scale);
            })
            .onComplete(() => {
                next = true;
            }, this);

        await CoroutineUtils.until(() => next);

        GPathPointPool.put(cpt1);
        GPathPointPool.put(cpt2);

        if (callback) {
            callback();
        }
    }

    public static async rewardAnimTo(reward: RewardData, from: Vec2, duration = 1, options?: AnimOptions) {
        let resUrl = this.getAwardIcon(reward, 0, true);
        let locType = getLocationByReward(reward);
        let loc = LocationManager.inst.getLocation(locType);
        if(!loc) {
            SoundManager.instance.playSound(60106);
            return;
        }

        options = options || {};
        let oldComplete = options.batchCompleteCallback;
        options.batchCompleteCallback = () => {
            oldComplete && oldComplete(options);

            if(reward.type == ERewardType.Resource) {
                if(reward.id == EResourceType.Gold) {
                    SoundManager.instance.playSound(61002);
                }else if(reward.id == EResourceType.Energy) {
                    SoundManager.instance.playSound(61003);
                }else if(reward.id == EResourceType.Star) {
                    SoundManager.instance.playSound(61001);
                }
            }
        };
        
        let to = loc.target.localToGlobal(0, 0, TempVec2);
        await this.resAnimTo(resUrl, reward.count, from, to, duration, options);
    }
        
    public static async resAnimToByResType(type: EResourceType, num: number, from: Vec2, to: Vec2, duration = 1, options?: AnimOptions) {
        let resUrl = this.getResouceIcon(type, true);
        await this.resAnimTo(resUrl, num, from, to, duration, options);
    }

    /**
     * 
     * @param resUrl 
     * @param num 
     * @param from 
     * @param to 
     * @param duration s
     */
    public static async resAnimTo(resUrl: string, num: number, from: Vec2, to: Vec2, duration = 1, options?: AnimOptions) {
        options = options || {};

        num = num > 5 ? 5 : num;
        if (num == 0) {
            return;
        }
        from = GRoot.inst.globalToLocal(from.x, from.y);
        to = GRoot.inst.globalToLocal(to.x, to.y);

        if(options.delay) {
            await CoroutineUtils.wait(options.delay);
        }

        let comps: PoolableGComponent[] = [];
        let poses: Vec2[] = [];

        // spine特效
        let isScale: boolean = !!options.isScale; //是否在当前放大后再飞到目的地
        
        for (let i = 0; i < num; i++) {
            let containerUrl = UIPackage.getItemURL(ResConst.FGUI_PKG_COMMON, RES_CONTAINER_NAME);
            let container = GComponentPool.getByKey(containerUrl);
            GRoot.inst.addChild(container.component);
            container.component.setPivot(0.5, 0.5, true);
            container.component.icon = resUrl;
            comps.push(container);

            let pos = Vec2Pool.get(from);
            if (num != 1 || options.randomAnyway) {
                pos.x += MathUtils.randomInt(-80, 80);
                pos.y += MathUtils.randomInt(-80, 80);
            }

            container.component.setPosition(pos.x, pos.y);
            poses.push(pos);
        }

        let fromScale = 1;
        let toScale = 0.5;
        let curve = true;
        if (options && (options.fromScale || options.sourceComp)) {
            fromScale = 1;
            if (options.fromScale != null) {
                fromScale = options.fromScale;
            } else {
                fromScale = options.sourceComp.width / comps[0].component.width;
            }

            toScale = options.toScale != null ? options.toScale : 0.5;
            curve = options.curve != null ? options.curve : true;
        }

        if (options?.waitTime > 0) {
            // 等待时间的缩放动画
            if (options.waitStartScale) {
                let next = false;
                GTween.to(0, 1, options.waitTime)
                    .onUpdate((twenner) => {
                        let t = twenner.value.x;
                        let scale = (fromScale - options.waitStartScale) * t + options.waitStartScale;
                        for (let i = 0; i < num; i++) {
                            let container = comps[i];
                            container.component.setScale(scale, scale);
                        }
                    })
                    .onComplete(() => {
                        next = true;
                    });

                await CoroutineUtils.until(() => next);
            } else {
                await CoroutineUtils.wait(options.waitTime);
            }
        }

        if (curve) {
            let anims: Promise<void>[] = [];
            for (let i = 0; i < num; i++) {
                let container = comps[i];
                let pos = poses[i];
                // anims.push(this.curveAnimTo(container.component, pos, to, duration, fromScale, toScale, isScale, 0.1 * i));
                // await CoroutineUtils.wait(0.05);
                anims.push(this.curveAnimTo(container.component, pos, to, duration, fromScale, toScale, isScale, 0, null, isScale ? 0.1 * i : 0, options.batchCompleteCallback));
            }
            await Promise.all(anims);
        } else {
            let next = false;
            GTween.to(0, 1, duration)
                .onUpdate((twenner) => {
                    let t = twenner.value.x;
                    let scale = (toScale - fromScale) * t + fromScale;
                    for (let i = 0; i < num; i++) {
                        let container = comps[i];
                        let pos = poses[i];
                        container.component.setPosition((to.x - pos.x) * t + pos.x, (to.y - pos.y) * t + pos.y);
                        container.component.setScale(scale, scale);
                    }
                })
                .onComplete(() => {
                    options.batchCompleteCallback && options.batchCompleteCallback(options);
                    next = true;
                });

            await CoroutineUtils.until(() => next);
        }

        for (let i = 0; i < num; i++) {
            GComponentPool.put(comps[i]);
        }
        Vec2Pool.puts(...poses);

        options.completeCallback && options.completeCallback(options);
    }

    private static ITEM_ICONS = [
        "ui://x6189memm1pqa", 
        "ui://x6189memm1pqb", 
        "ui://x6189memm1pqc",
        "ui://x6189memepvp7q",
        "ui://x6189memepvp7s",
        "ui://x6189memepvp7p",
        "ui://x6189memepvp7r",
    ];
    private static RES_ICONS = ["ui://x6189memphmf6m", "ui://x6189memn1lh4g", "ui://x6189memn1lh4h"];
    private static RES_FLY_ICONS = ["ui://x6189memn1lh4k", "ui://x6189memn1lh4g", "ui://x6189memn1lh4h"];

    public static getResouceIcon(type: EResourceType, forFly: boolean = false) {
        if (forFly) {
            return this.RES_FLY_ICONS[type-1];
        }
        return this.RES_ICONS[type-1];
    }

    public static getToolIcon(type: EItemType) {
        return this.ITEM_ICONS[type-1];
    }

    public static getTaskIcon(type: GameConfig.ETaskType, id: number = 0) {
        switch (type) {
            case GameConfig.ETaskType.Login: {
                return "ui://x6189memhvmj6v";
            }
            case GameConfig.ETaskType.VideoCount: {
                return "ui://x6189memn08t1l";
            }
            case GameConfig.ETaskType.MergeCount:
            case GameConfig.ETaskType.LevelSucess: 
            case GameConfig.ETaskType.ChallengeSucess: {
                return "ui://x6189memphmf6m";
            };
            case GameConfig.ETaskType.UseTool: {
                return this.getToolIcon(id);
            }
            case GameConfig.ETaskType.MaxCombo: {
                return "ui://x6189memhvmj6w";
            }
            case GameConfig.ETaskType.GetStar: {
                return "ui://x6189memn1lh4h";
            } 
        }
        return "";
    }

    public static getAwardIcon(reward: RewardData, todayAnimalID: number = 0, forFly: boolean = false) {
        switch (reward.type) {
            case ERewardType.Resource: {
                return this.getResouceIcon(reward.id, forFly);
            }
            case ERewardType.Tool: {
                return this.ITEM_ICONS[reward.id-1];
            }
        }

        return "";
    }

    private static ITEM_NAMES = [
        "移除", "凑齐", "打乱", 
        "大火箭", "小火箭", "大沙漏", "小沙漏",
    ];
    private static RES_NAMES = ["金币", "体力", "星星"];
    public static getAwardName(reward: RewardData, todayAnimalID: number = 0, forFly: boolean = false) {
        switch (reward.type) {
            case ERewardType.Resource: {
                return this.RES_NAMES[reward.id-1];
            }
            case ERewardType.Tool: {
                return this.ITEM_NAMES[reward.id-1];
            }
        }

        return "";
    }
}