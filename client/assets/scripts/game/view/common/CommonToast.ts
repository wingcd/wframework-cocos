import { inject } from "../../../framework/view/Decorators";
import { GLabel } from "fairygui-cc";
import { Transition } from "fairygui-cc";
import { UIPackage } from "fairygui-cc";
import { GRoot } from "fairygui-cc";
import View from "../../../framework/view/View";

const ToaslPool: CommonToast[] = [];
export default class CommonToast extends View {

    @inject(GLabel)
    title: GLabel = null;

    @inject(Transition, "show")
    private _animation: Transition = null;

    static toast(tips: string|number, ...args:string[]) {
        let instance = CommonToast.getPopup();
        CommonToast.setTips(instance, tips, args);
        CommonToast.showPopup(instance);
        instance._animation.play(() => {
            ToaslPool.push(instance);
            GRoot.inst.removeChild(instance.gObject);
        });
    }

    private static getPopup() {
        let instance: CommonToast = null;
        if (ToaslPool.length > 0) {
            instance = ToaslPool.pop();
        }else{
            instance = new CommonToast();
            instance.inject(UIPackage.createObject("common", "CommonToast"));
        }
        instance.gObject.alpha = 1;

        return instance;
    }

    private static setTips(instance: CommonToast, tips: string|number, args: string[]) {
        if(typeof tips == "number") {
            instance.title.setText(tips, ...args);
        } else {
            instance.title.text = tips;
        }
    }

    private static showPopup(instance: CommonToast) {
        GRoot.inst.addChild(instance.gObject);
        let x = GRoot.inst.x + GRoot.inst.width / 2 - instance.gObject.width / 2;
        let y = GRoot.inst.y + GRoot.inst.height / 2 - instance.gObject.height / 2;
        instance.gObject.setPosition(
            x, 
            y,
        );
    }
}
