import { macro,cclegacy } from "cc";

export interface ISharedLabelData {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
}

let _canvasPool: CanvasPool;

export class CanvasPool {
    static getInstance (): CanvasPool {
        if (!_canvasPool) {
            _canvasPool = new CanvasPool();
        }
        return _canvasPool;
    }
    public pool: ISharedLabelData[] = [];
    public get () {
        let data = this.pool.pop();

        if (!data) {
            const canvas = cclegacy._global.window.document.createElement('canvas');
            const context = canvas.getContext('2d');
            data = {
                canvas,
                context,
            };
        }

        return data;
    }

    public put (canvas: ISharedLabelData) {
        if (this.pool.length >= macro.MAX_LABEL_CANVAS_POOL_SIZE) {
            return;
        }
        this.pool.push(canvas);
    }
}