class Handler {
    caller: any;
    once: boolean;
    runner: Function;
}

/**
 * 事件处理器
 */
export class EventHandler {
    private _handlers:Handler[] = [];

    private _add(runner: Function, thisObj?: any, once?: boolean) {
        if(!runner) {
            console.warn("add none runner to event handler");
            return;
        }

        let handler = new Handler();
        handler.caller = thisObj;
        handler.runner = runner;
        handler.once = once;
        this._handlers.push(handler);
    }

    add(runner: Function, thisObj?: any) {
        this._add(runner, thisObj);
    }
    
    set(runner: Function, thisObj?: any) {
        this.remove(runner, thisObj)
        this.add(runner, thisObj);
    }

    once(runner: Function, thisObj?: any) {
        this._add(runner, thisObj, true);
    }

    remove(runner: Function, thisObj?: any) {
        let temp: Handler[] = this._handlers.slice();

        for (let i = 0; i < this._handlers.length; i++) {
            let handler = this._handlers[i];
            let sameRunner = handler.runner == runner;
            if (sameRunner) {
                if (!thisObj || handler.caller == thisObj) {
                    let idx = temp.indexOf(handler);
                    if (idx >= 0) {
                        temp.splice(idx, 1);
                    }
                }
            }
        }

        this._handlers = temp;
    }

    clear() {
        this._handlers.length = 0;
    }

    fire(...args: any) {
        let handlers = this._handlers.slice();
        
        for(let i=0;i<handlers.length;i++) {
            let handler = handlers[i];
            if(handler.once) {
                let idx = this._handlers.indexOf(handler);
                this._handlers.splice(idx, 1);
            }
            
            handler.runner.call(handler.caller, ...args);
        }
    }
}