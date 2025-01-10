import { Pool, Vec2, math } from "cc";
import { GComponent } from "fairygui-cc";

export type AnimationStatus = {
    /**
     * 存储动画开始时的剩余数量
     */ 
    currentLeftCount: number; 
};

export type AnimationConfig = {
    target: GComponent;
    endPos: Vec2;
    duration: number;
    waitFlags?: number[];
    enableX?: boolean;
    enableY?: boolean;
    onStarted?: Function;
    onUpdated?: (t:number)=>void;
    onComplete?: (cfg:AnimationConfig)=>void;
    onGroupComplete?: (cfg:AnimationConfig)=>void;
    status?: AnimationStatus, // 存储动画开始时候的状态
}

class Command {
    public flag: number = 0;
    public startPos: Vec2 = new Vec2();
    public endPos: Vec2 = new Vec2();
    public timer: number = 0;
    public config: AnimationConfig = null;
}
const CommandPool: Pool<Command> = new Pool(() => new Command(), 10);

class CommandHandler {
    public target: GComponent = null;
    public currentCommand: Command = null;
    public commands: Command[] = [];
}
const CommandHandlerPool: Pool<CommandHandler> = new Pool(() => new CommandHandler(), 5);

export class UITimeline {
    private static _inst: UITimeline;
    private _handlers: CommandHandler[] = [];
    private _flagCountMap: Map<number, number> = new Map();
    private _flagCounter = 0;
    private _inGroup = false;
    private _groupFlag = -1;

    public static get inst() {
        if (!this._inst) {
            this._inst = new UITimeline();
        }
        return this._inst;
    }

    private getFlag() {
        return ++this._flagCounter;
    }

    /**
     * 开始一个组
     * @returns 
     */
    public beginGroup() {
        this._inGroup = true;
        this._groupFlag = this.getFlag();
        return this._groupFlag;
    }

    public endGroup() {
        this._inGroup = false;
    }

    public moveTo(config: AnimationConfig) {
        const command = CommandPool.alloc();    
        command.timer = 0;
        command.config = config;
        command.endPos.set(config.endPos.x, config.endPos.y);
        
        config.enableX = config.enableX == null ? true : config.enableX;
        config.enableY = config.enableY == null ? true : config.enableY;

        // 生成标记
        let flag = -1;
        if(this._inGroup) {
            flag = this._groupFlag;
        }else{
            flag = this.getFlag();
        }
        command.flag = flag;
        this._flagCountMap.set(flag, (this._flagCountMap.get(flag) || 0) + 1);

        let handler = this._handlers.find(h => h.target == config.target);
        this.addHandler(handler, command, config, flag);

        return flag;
    }    

    private addHandler(handler: CommandHandler, command: Command, config: AnimationConfig, flag: number = -1) {
        if(!handler) {
            handler = CommandHandlerPool.alloc();
            handler.target = config.target;
            this._handlers.push(handler);
        }
        handler.commands.push(command);
    }

    public update(dt: number) {
        for(let handler of this._handlers) {
            if(handler.target.isDisposed) {
                this.removeHandler(handler);
                continue;
            }

            this.doMove(handler, dt);
        }
    }

    private doMove(handler: CommandHandler, dt: number) {
        let commands = handler.commands;
        if(commands.length == 0 && handler.currentCommand == null) {
            return;
        }

        let config: AnimationConfig = null;
        let command = handler.currentCommand;
        if(command == null) {
            config = commands[0].config;
            
            // 等待标记还未完成
            if(config.waitFlags) {
                for(let flag of config.waitFlags) {
                    if(this._flagCountMap.has(flag) && this._flagCountMap.get(flag) > 0) {
                        handler.currentCommand = null;
                        return;
                    }
                }
            }

            command = commands.shift();
            handler.currentCommand = command;

            if(config.onStarted) {
                config.onStarted();
            }
            command.startPos.set(handler.target.x, handler.target.y);
        }else{
            config = command.config;
        }

        let t = command.timer / config.duration;
        t = Math.min(1, t);
        command.timer += dt;

        const setValue = (t: number)=>{
            if(config.enableX && config.enableY) {
                Vec2.lerp(tempVec2, command.startPos, command.endPos, t);
            }else if(config.enableX) {
                tempVec2.x = math.lerp(command.startPos.x, command.endPos.x, t);
                tempVec2.y = command.startPos.y;
            }else{
                tempVec2.y = math.lerp(command.startPos.y, command.endPos.y, t);
                tempVec2.x = command.startPos.x;
            }
            handler.target.setPosition(tempVec2.x, tempVec2.y);
            
            if(config.onUpdated) {
                config.onUpdated(t);
            }
        };

        if(t >= 1) {
            t = 1;
            setValue(t);
            
            let flag = command.flag;
            let count = 0;
            if(flag != null && flag != -1) {
                count = this._flagCountMap.get(flag) || 0;
                count--;
                this._flagCountMap.set(flag, count);
            }
            
            if(config.onComplete) {
                config.onComplete(config);
            }
            
            if(count <= 0) {
                this._flagCountMap.delete(flag);
                if(config.onGroupComplete) {
                    config.onGroupComplete(config);
                }
            }

            if(commands.length == 0) {
                this.removeHandler(handler);
            }
            if(handler.currentCommand) {
                handler.currentCommand.config = null;
                CommandPool.free(handler.currentCommand);
                handler.currentCommand = null;
            }
            return;
        }else{
            setValue(t);
        }
    }

    private removeHandler(handler: CommandHandler) {
        for(let i = 0; i < this._handlers.length; i++) {
            if(this._handlers[i] == handler) {
                let handlers = this._handlers.splice(i, 1);
                let handler = handlers[0];
                for(let command of handler.commands) {
                    CommandPool.free(command);
                }
                handler.commands.length = 0;
                if(handler.currentCommand) {
                    handler.currentCommand.config = null;
                    CommandPool.free(handler.currentCommand);
                    handler.currentCommand = null;
                }
                CommandHandlerPool.free(handler);
                return;
            }
        }
    }

    public clear() {
        for(let handler of this._handlers) {
            for(let command of handler.commands) {
                CommandPool.free(command);
            }
            handler.commands.length = 0;
            if(handler.currentCommand) {
                handler.currentCommand.config = null;
                CommandPool.free(handler.currentCommand);
                handler.currentCommand = null;
            }
        }
        this._handlers.length = 0;    
    }
}
const tempVec2 = new Vec2();