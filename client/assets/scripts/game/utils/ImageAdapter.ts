import { _decorator, Canvas, Component, Sprite, UIComponent } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('ImageAdapter')
@requireComponent(Sprite)
export class ImageAdapter extends Component {
    @property(Canvas)
    canvas: Canvas = null;

    private _sprite: Sprite = null;
    
    public onLoad() {
        this._sprite = this.getComponent(Sprite);

        // 按设计分辨率适配
        const constentSize = this.canvas.node._uiProps.uiTransformComp.contentSize;
        const spriteSize = this._sprite.node._uiProps.uiTransformComp.contentSize;
        const scale = Math.max(constentSize.width / spriteSize.width, constentSize.height / spriteSize.height);
        this._sprite.node._uiProps.uiTransformComp.setContentSize(spriteSize.width * scale, spriteSize.height * scale);
    }
}