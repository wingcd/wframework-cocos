import { AudioClip, AudioSource, game, native, Node } from 'cc';
import { JSB } from 'cc/env';
import { GRoot } from 'fairygui-cc';

/**
 * 音频管理器
 */
export class SoundManager {
    private static _instance: SoundManager | null = null;
    static get instance() {
        if (!this._instance) {
            this._instance = new SoundManager();
        }
        return this._instance;
    }

    audioFinder: (name: string|number) => Promise<AudioClip> = null;

    private _persistRootNode: Node;
    musicVolume: number = 1;
    soundVolume: number = 1;
    music: AudioSource;
    sound: AudioSource;
    loopSound: AudioSource;
    isPlayAudio: boolean;

    private _currentLoopSound: string | number;
    private _loopSoundCount: number = 0;

    private constructor() {
        this._persistRootNode = new Node('SoundManager');
        game.addPersistRootNode(this._persistRootNode);

        let isPlayAudio = true;
        if (JSB) {
            //获取安卓是否可以播放音乐，例如打电话时候音乐关闭
            isPlayAudio = native.reflection.callStaticMethod('com/cocos/game/AppActivity', 'isPlayAudio', '()Z');
        }
        this.isPlayAudio = isPlayAudio;
    }

    private async playAudio(name: string|number, loop: boolean, source: AudioSource) {
        if(!source) return;

        let clip: any = await this.audioFinder(name);
        if(!clip) {
            console.error(`音频文件${name}不存在`);
            return;
        }

        if(loop && source.clip === clip && source.playing) {
            return;
        }

        source.stop();
        source.volume = loop ? this.musicVolume : this.soundVolume;
        source.clip = clip;
        source.loop = loop;

        if(source.volume > 0) {
            source.play();
        }
    }

    /**
     * 播放音乐
     * @param name 
     * @param loop 
     */
    async playMusic(name: string|number, loop: boolean = true) {
        this.music = this.music || this._persistRootNode.addComponent(AudioSource);
        await this.playAudio(name, loop, this.music);
    }

    /**
     * 播放音效
     * @param name 
     * @returns 
     */
    async playSound(name: string|number) {
        if (!this.soundVolume) {
            return;
        }
        this.sound = this.sound || this._persistRootNode.addComponent(AudioSource);
        await this.playAudio(name, false, this.sound);
    }

    async playLoopSound(name: string|number) {
        if (!this.soundVolume) {
            return;
        }

        if(this._currentLoopSound == name) {
            this._loopSoundCount++;
            return;
        }
        this._currentLoopSound = name;
        this._loopSoundCount = 1;

        this.loopSound = this.loopSound || this._persistRootNode.addComponent(AudioSource);
        await this.playAudio(name, true, this.loopSound);
    }

    stopLoopSound(force: boolean = false) {
        if(this.loopSound) {
            if(!force && this._loopSoundCount > 1) {
                this._loopSoundCount--;
                return;
            }
            this._currentLoopSound = null;
            this._loopSoundCount = 0;
            
            this.loopSound.stop();
        }
    }

    /**
     * 播放音效
     * @param clip 
     * @returns 
     */
    playSoundByClip(clip: AudioClip) {
        if (!this.soundVolume) {
            return;
        }
        this.sound = this.sound || this._persistRootNode.addComponent(AudioSource);
        this.sound.volume = this.soundVolume;
        this.sound.loop = false;
        this.sound.playOneShot(clip);
    }

    private setVolume(volume: number, source: AudioSource) {
        if(!source) return;

        source.volume = volume;
        if(volume > 0) {
            if(source && !source.playing) {
                source.play();
            }
        }else{
            if(source && source.playing) {
                source.pause();
            }
        }
    }

    setMusicVolume(volume: number) {
        this.musicVolume = volume;
        this.music && this.setVolume(volume, this.music);

        console.log('setMusicVolume', volume);
    }

    setSoundVolume(volume: number) {
        this.soundVolume = volume;
    }
    
    //看广告时先将音乐暂停
    pauseAll() {
        this.setVolume(0, this.music);
    }

    resumeAll() {
        if(this.musicVolume == 0) {
            return;
        }

        this.setVolume(this.musicVolume, this.music);
    }
}

GRoot.prototype.playOneShotSound = function (clip: AudioClip, volumeScale: number) {
    if (SoundManager.instance.soundVolume) {
        SoundManager.instance.playSoundByClip(clip);
    }
};