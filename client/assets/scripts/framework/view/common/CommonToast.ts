import { inject } from "../../../framework/view/Decorators";
import { GLabel } from "fairygui-cc";
import { Transition } from "fairygui-cc";
import View from "../../../framework/view/View";
import { UIPackage } from "fairygui-cc";
import { GRoot } from "fairygui-cc";

export default class CommonToast extends View {

    @inject(GLabel)
    title: GLabel = null;

    @inject(Transition, "show")
    private _animation: Transition = null;

    private static I: CommonToast;

    static toast(tips: string|number, ...args:string[]) {
        if (!CommonToast.I) {
            CommonToast.initializeInstance();
        }
        let instance = CommonToast.I;
        CommonToast.setTips(instance, tips, args);
        CommonToast.showPopup(instance);
        instance._animation.play(() => {
            GRoot.inst.hidePopup(instance.gObject);
        });
    }

    private static initializeInstance() {
        let instance = new CommonToast();
        instance.inject(UIPackage.createObject("common", "CommonToast"));
        CommonToast.I = instance;
    }

    private static setTips(instance: CommonToast, tips: string|number, args: string[]) {
        if(typeof tips == "number") {
            instance.title.setText(tips, ...args);
        } else {
            instance.title.text = tips;
        }
    }

    private static showPopup(instance: CommonToast) {
        GRoot.inst.showPopup(instance.gObject);
        instance.gObject.setPosition(
            GRoot.inst.x + GRoot.inst.width / 2 - instance.gObject.width / 2, 
            GRoot.inst.y + GRoot.inst.height / 2 - instance.gObject.height / 2
        );
    }
}
