import { GGraph } from "fairygui-cc";
import { GObject } from "fairygui-cc";
import View from "../../view/View";
import { Node, sp } from "cc";
import { IPoolable } from "../../common/PoolManager";
import { CoroutineUtils } from "../../utils/CoroutineUtils";

interface IEffectEntity extends IPoolable {
    skeleton: sp.Skeleton;
    node: Node;

    createFromPool(data: string | number): Promise<void>;
    setVisible(value: boolean);
    fromPool();
    toPool();
}

interface IEffectManager {
    loadEffect(res: string | number): Promise<IEffectEntity>;
    removeEffect(ske: IEffectEntity);
}

type SpineInfo = {
    res: string | number,
    ani?: string | number,
    loop?: boolean,
    trackIndex?: number,
    play?: boolean,
    replayOnShow?: boolean;
    load?: boolean;
    stayLast?: boolean;
};

export class SpineView extends View {
    static EffectManager: IEffectManager;

    spEntity: IEffectEntity;
    graph: GObject;
    replayOnShow = true;

    private _initData: SpineInfo;
    private _loading: boolean = false;
    private _lastKey: string;
    private _playing = false;
    private _currentAnimation: string | number = "";

    get loading() {
        return this._loading;
    }

    registInfos() {
        super.registInfos();
        this.injectInfos = {
        };
    }

    get currentAnimation() {
        return this._currentAnimation;
    }

    protected onCreate(data?: SpineInfo) {
        this.graph = this.gObject;
        this.graph.touchable = false;
        this.component.visible = false;
        this.reset(data);
    }

    private getKey(data: SpineInfo) {
        if (!data) {
            return "";
        }
        return `${data.res}|${data.ani}|${data.trackIndex}`;
    }

    loadAndPlay(res: string | number, ani: string | number = 1, loop = false, trackIndex = 0) {
        let data = this._initData || { res };
        data.res = res;
        data.ani = ani;
        data.loop = loop;
        data.trackIndex = trackIndex;

        this.reset(data, true);
    }

    reset(data: SpineInfo, play?: boolean) {
        if (!data || !data.res) {
            return;
        }

        this._initData = data;
        this._initData.load = this._initData.load ?? false;
        this._initData.play = play ?? this._initData.play ?? false;
        this._initData.trackIndex = this._initData.trackIndex ?? 0;

        if (this._lastKey == this.getKey(this._initData)) {
            if (this.spEntity) {
                //@ts-ignore
                this.spEntity.skeleton._renderDataFlag = false;
            }
            return;
        }

        this.stop();

        this.replayOnShow = this._initData.replayOnShow ?? this.replayOnShow;

        if (this._initData.load || this._initData.play) {
            this.load();
        }

        if (this._initData.play) {
            this._play();
        }
    }

    private async load() {
        if (this.spEntity || !this._initData || !this._initData.res) {
            return;
        }

        if (this._loading) {
            await CoroutineUtils.until(() => !!this.spEntity);
            return;
        }

        this._loading = true;
        let data = this._initData;
        let res = data.res;

        try {
            this.spEntity = await SpineView.EffectManager.loadEffect(res);
            if (this.spEntity?.node?.isValid && this.graph?.node?.isValid) {
                if(this.graph instanceof GGraph){
                    this.graph.clearGraphics();
                }
                this.graph.node.addChild(this.spEntity.node);
            } else {
                throw new Error("加载spine失败");
            }
        } catch (error) {
            console.error(error, this._initData);
        } finally {
            this._loading = false;
        }
    }

    private async _play() {
        if (!this._initData || !this._initData.res) {
            return;
        }

        let dt = this._initData;
        await this.play(dt.ani || this._currentAnimation, !!dt.loop, dt.trackIndex ?? 0);
    }

    protected onShown(data: any, changeVisiable?: boolean): void {
        if (this._playing) {
            if (this.replayOnShow && this.component.visible) {
                this._play();
            }
        }
    }

    async replay(restart = false) {
        if (restart || !this._playing) {
            this.stop();
            this.show();
            this.visible = true;
            await this._play();
        }
    }

    async stop() {
        // if(this._loading) {
        //     await CoroutineUtils.until(() => !this._loading);
        // }

        if (this.spEntity) {
            if (!this.spEntity.skeleton?.isAnimationCached()) {
                this.spEntity.skeleton.clearTracks();
            }
            SpineView.EffectManager.removeEffect(this.spEntity);

            this.spEntity = null;
            this._loading = false;
        }

        this._lastKey = null;
        this._playing = false;
        this.component.visible = false;
        this._currentAnimation = "";
    }

    async play(key: string | number, loop: boolean = false, trackIndex: number = 0, replaceInitData = false, replay = false) {
        replay = replay || this._currentAnimation !== key;

        if (!replay && this._playing) {
            return;
        }

        if (!this.spEntity) {
            await this.load();
        }

        if (!this.spEntity) {
            this.stop();
            return;
        }

        this._lastKey = this.getKey(this._initData);
        this._playing = true;

        key = key || this._initData.ani;

        let name = typeof key === "string" ? key : "";
        let idx = typeof key === "number" ? key : 1;

        if (!name && this.spEntity.skeleton.skeletonData) {
            let anims = this.spEntity.skeleton.skeletonData.getAnimsEnum();
            let keys = Object.keys(anims);
            if (idx < 0 || idx >= keys.length) {
                idx = 1;
                console.error("spine动画索引越界", this._initData);
            }
            name = keys[idx];
        }

        if (!name) {
            console.error("spine动画不存在", this._initData);
            return;
        }

        if (replaceInitData) {
            this._initData.ani = name;
            this._initData.trackIndex = trackIndex;
            this._initData.loop = loop;
        }

        this._currentAnimation = name;
        this.component.visible = true;

        await CoroutineUtils.until(() => this.spEntity && this.spEntity.node.activeInHierarchy);
        
        this.spEntity.skeleton.setAnimation(trackIndex, name, loop);
        if (!loop) {
            let next = false;
            this.spEntity.skeleton.setCompleteListener(() => next = true);
            await CoroutineUtils.until(() => next);
            if (!this._initData.stayLast && this.spEntity && name == this.spEntity.skeleton.animation) {
                this.stop();
            }
        }
    }
}