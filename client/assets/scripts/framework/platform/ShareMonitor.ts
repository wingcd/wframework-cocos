export class ShareMonitor {
    static shareMonitorTime = 1000;
    private static _isEnable = false;
    static get isEnable() {
        return this._isEnable;
    }

    private static _initialized = false;

    private static _startTime: number = 0;
    private static _endTime: number = 0;
    private static _options: {
        success?: () => void,
        fail?: () => void,
    };
    
    private static _initial() {
        if(this._initialized) {
            return;
        }
        this._initialized = true;

        this._isEnable = typeof wx !== 'undefined';

        if(!this._isEnable) {
            return;
        }

        wx.onShow(() => {
            this._endTime = Date.now();
            let time = (this._endTime - this._startTime);
            if(time >= this.shareMonitorTime) {
                this._options.success && this._options.success();
            } else {
                this._options.fail && this._options.fail();
            }
        });

        wx.onHide(() => {
            this._startTime = Date.now();
        });
    }
    
    static bind(options: {
        success?: () => void,
        fail?: () => void,
    }) {
        this._initial();
        this._options = options;
    }
}