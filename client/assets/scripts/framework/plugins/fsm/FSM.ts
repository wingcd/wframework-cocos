export namespace FSM{
    export class State<T> {
        private _name: string;
        private _hsm: HierarchicalStateMachine<T>;
        private _owner: T;

        constructor(owner: T, hsm: HierarchicalStateMachine<T>, name: string){
            this._name = name;
            this._hsm = hsm;
            this._owner = owner;
        }

        get isCompositeState(){
           return false;
        }

        init(){

        }

        onEnter(data?: any){

        }

        onExit(){

        }
        
        onStateChange(stateName: string){

        }

        onUpdate(dt: number){

        }

        onLaterUpdate(dt: number){

        }

        onRefresh() {

        }

        get name(){
            return this._name;
        }

        get hierachicalName(){
            return this._name;
        }

        get hsm(){
           return this._hsm;
        }

        get owner(){
           return this._owner;
        }
    }

    export class CompositeState<T> {
        private _name: string;
        private _hsm: HierarchicalStateMachine<T>;
        private _owner: T;
        private _hierachicalName: string = "";
        private _currentState:State<T> = null;
        private _defaultStateName:string = "";
        private _nameDictionary = {};
        private _currentOverwriteFlag = false;

        constructor(owner: any, hsm: HierarchicalStateMachine<T>,name: string){
            this._name = name;
            this._hsm = hsm;
            this._owner = owner;
        }

        isCompositeState(){
           return true;
        }

        init(states: State<T>[], defaultStateName: string){
            if(!(states instanceof Array)){
                console.log("states must be array data!");
                return;
            }

            this._currentOverwriteFlag = false;
            for(var i in states){
                var state = states[i];
                this._nameDictionary[state.name] = state;
            }

            this._defaultStateName = defaultStateName;
        }

        get currentState(){
           return this._currentState;
        }

        onEnter(data?: any){
            //set to default state
            this._currentState = this.getStateByName(this._defaultStateName);
            if(!this._currentState){
                console.log("Invalid state name:" + this._defaultStateName);
                return;
            }

            if(this._hsm.enableDebug){
                console.log("CompositeState::onEnter " + this._currentState.name);
            }

            if(this._currentState && this._currentState.onEnter){
                this._currentState.onEnter(data);
            }
        }

        onExit(){
            if(this._currentState && this._currentState.onExit){
                this._currentState.onExit();
            }

            if(this._hsm.enableDebug){
                console.log("CompositeState::onExit " + this._currentState.name);
            }

            this._currentState = null;
        }

        onStateChange(stateName: string){
            if(this._currentState && this._currentState.onExit){
                //exit current state
                this._currentState.onExit();

            }
            //set new state
            var newState = this.getStateByName(stateName);
            if(!newState){
                console.log("Invalid state name: " + stateName);
                return;
            }

            if(this._hsm.enableDebug){
                console.log("Change sub state from " + (this._currentState?this._currentState.name:"_empty_") + " to " + newState.name);
            }

            this._currentState = newState;

            //enter new state
            if(this._currentState.onEnter){
                this._currentState.onEnter();
            }
        }

        onUpdate(dt: number){
            if(this._currentState && this._currentState.onUpdate){
                this._currentState.onUpdate(dt);
            }
        }

        onLaterUpdate(dt: number){
            if(this._currentState && this._currentState.onLaterUpdate){
                this._currentState.onLaterUpdate(dt);
            }
        }

        get name(){
           return this._name;
        }

        get hierachicalName(){
            if(this._currentState){
                return this.name + "::" + this._currentState.hierachicalName;
            }else{
                return this._name;
            }
        }

        getStateByName(stateName: string){
            return this._nameDictionary[stateName];
        }

        get hsm(){
           return this._hsm;
        }

        get owner(){
           return this._owner;
        }
    }

    class ChangeStateInfo {
        public dirtyFlag: boolean = false;
        public stateName: string;
        public data: any;
        public overwriteFlag: boolean;
    }

    export class HierarchicalStateMachine<T>{
        public onStateChanged:Function = null
        
        private _owner:T;
        private _enableDebug = false;;
        private _currentState: State<T> = null;
        private _previousState: State<T> = null;
        private _nameDictionary:{[key:string]:State<T>} = {};
        private _pendingStateChange: string =null; //string
        private _currentOverwriteFlag = false;
        private _changeStateData: any = null;
        private _states: State<T>[] = [];
        private _pendingStateChangeInfo: ChangeStateInfo = new ChangeStateInfo();

        constructor(owner: any, enableDebug?: boolean){
            this._owner=owner;
            this._enableDebug=enableDebug || false;
        }

        get owner(){
            return this._owner;
        }

        get currentState(){
            return this._currentState;
        }

        get previousState(){
            return this._previousState;
        }

        get enableDebug(){
            return this._enableDebug;
        }

        set enableDebug(value: boolean){
            this._enableDebug = value;
        }

        get states(){
            return this._states;
        }

        init(states: State<T>[], defaultStateName?: string){
            if(!(states instanceof Array)){
                console.log("states must be array data!");
                return;
            }

            this._states = states;
            this._currentOverwriteFlag = false;

            for(var i in states){
                var state = states[i];
                this._nameDictionary[state.name] = state;
            }

            //to default state
            if(defaultStateName) {
                this.doChangeState(defaultStateName);
            }
        }

        update(dt: number){
            if(this._pendingStateChange){
                this.doChangeState(this._pendingStateChange, this._changeStateData);

                //clean state
                this._pendingStateChange = null;
                this._changeStateData = null;
            }

            //reset flag
            this._currentOverwriteFlag = true;

            //update current state
            if(this._currentState && this._currentState.onUpdate){
                this._currentState.onUpdate(dt);
            }

            if(this._pendingStateChangeInfo.dirtyFlag){
                let info = this._pendingStateChangeInfo;
                this._changeState(info.stateName, info.data, info.overwriteFlag);
                this._pendingStateChangeInfo.dirtyFlag = false;
            }
        }

        laterUpdate(dt: number){
            if(this._pendingStateChange){
                this.doChangeState(this._pendingStateChange, this._changeStateData);

                //clean state
                this._pendingStateChange = null;
                this._changeStateData = null;
            }

            //reset flag
            this._currentOverwriteFlag = true;

            //update current state
            if(this._currentState && this._currentState.onLaterUpdate){
                this._currentState.onLaterUpdate(dt);
            }
        }

        cleanPendingState(){
            this._pendingStateChange = null;
            this._currentOverwriteFlag = true;
            this._changeStateData = null;
        }
        
        forceChangeState(stateName, data?: any){
            this.doChangeState(stateName, data);

            //reset flag
            this.cleanPendingState();
        }

        changeState(stateName: string, data?: any, overwriteFlag?: boolean){
            if(this._currentState && this._currentState.name == stateName) {
                return;
            }

            let stateInfo = this._pendingStateChangeInfo;
            stateInfo.stateName = stateName;
            stateInfo.data = data;
            stateInfo.overwriteFlag = overwriteFlag || true;
            stateInfo.dirtyFlag = true;
        }

        private _changeState(stateName: string, data?: any, overwriteFlag?: boolean){
            overwriteFlag = overwriteFlag || true;
            //check current flag
            if(this._currentOverwriteFlag){
                //enable overwrite
                if(this._pendingStateChange && this._enableDebug){
                    console.log("ChangeState will replace state " + this._pendingStateChange + " with " + stateName);
                }

                this._pendingStateChange = stateName;
                this._changeStateData = data;
            }else{
                //disable overwrite
                if(this._pendingStateChange){
                    if(this._enableDebug){
                        console.log("Reject state changing from " + this._pendingStateChange + " to " + stateName);
                    }

                    return;
                }

                this._pendingStateChange = stateName;
                this._changeStateData = data;
            }

            //save flag
            this._currentOverwriteFlag = overwriteFlag;
        }

        hasState(stateName: string){
            return this._nameDictionary[stateName] != null;
        }

        getStateByName(stateName: string){
            return this._nameDictionary[stateName];
        }

        private doChangeState(stateName: string, data?: any){
            //save old state
            this._previousState = this._currentState;
            var names=stateName.split("::");

            if(names.length == 1){
                var name = names[0];
                if(this._currentState && this._currentState.onExit){
                    this._currentState.onExit();
                }
                var newState = this._nameDictionary[stateName];
                if(!newState){
                    console.log("Invalid state name: " + stateName);
                    return;
                }

                if(this.enableDebug){
                    console.log("Change state from: " +
                    (this._currentState?this._currentState.name:"_empty_") +
                    " to: " + newState.name);
                }

                this._currentState = newState;

                if(this._currentState.onEnter)
                    this._currentState.onEnter(data);
            }else if(names.length == 2){
                //composite state
                var parentStateName = names[0];
                //find parent state
                var parentState = this.getStateByName(parentStateName);
                if(!parentState){
                    console.log("Invalid state name: " + parentStateName);
                    return;
                }

                //check if parent state is current state
                if(parentState != this._currentState){
                    if(this._currentState && this._currentState.onExit){
                        //exit current state
                        this._currentState.onExit();

                        //waring
                        if(this.enableDebug){
                            console.log("Transfer to internal state!");
                        }
                    }
                }

                //let state to handle it
                var subStateName = names[1];
                parentState.onStateChange(subStateName);
            }else{
                console.log("Invalid state name: " + stateName);
            }

            if(this.onStateChanged){
                this.onStateChanged(this._previousState.hierachicalName, this._currentState.hierachicalName);
            }
        }
    }
}