import { EaseType, GRoot, GTween, Transition } from "fairygui-cc";
import Window from "./Window";
import { CoroutineUtils } from "../utils/CoroutineUtils";

export class TweenWindow extends Window {
    static enterTransition: Transition;
    static exitTransition: Transition;

    inDuration = 0.375;
    outDuration = 0.25;
    inEase = EaseType.BackOut;
    outEase = EaseType.BackIn;

    protected inAnimation: string;
    protected outAnimation: string;

    protected onAfterInitial() {
        this.addTransitionIfNeeded(TweenWindow.enterTransition, (name) => this.inAnimation = name);
        this.addTransitionIfNeeded(TweenWindow.exitTransition, (name) => this.outAnimation = name);
    }

    private addTransitionIfNeeded(transition, assignName) {
        if (transition && !this[assignName]) {
            this[assignName] = transition.name;
            this.window.contentPane.addTransition(transition);
        }
    }

    protected async playShowAnimation() {
        this.component.touchable = false;

        if (this.inAnimation) {
            await this.playTransition(this.inAnimation);
        } else {
            this.playDefaultShowAnimation();
            await CoroutineUtils.wait(this.inDuration);
        }

        this.component.touchable = true;
    }

    private async playTransition(animationName) {
        let next = false;
        let tr = this.component.getTransition(animationName);
        tr.play(() => {
            next = true;
        });
        await CoroutineUtils.until(() => next);
    }

    private playDefaultShowAnimation() {
        GTween.kill(this.component, true, this.component.setScale);
        GTween.to2(0, 0, 1, 1, this.inDuration)
            .setEase(this.inEase)
            .setTarget(this.component, this.component.setScale);
    }

    protected async playHideAnimation() {
        this.component.touchable = false;

        if (this.outAnimation) {
            await this.playTransitionWithHide(this.outAnimation);
        } else {
            this.playDefaultHideAnimation();
            await CoroutineUtils.wait(this.outDuration);
        }

        this.component.touchable = true;
    }

    private async playTransitionWithHide(animationName) {
        let next = false;
        let tr = this.component.getTransition(animationName);
        tr.play(() => {
            this.hideImmediately();
            next = true;
        });
        await CoroutineUtils.until(() => next);
    }

    private playDefaultHideAnimation() {
        GTween.kill(this.component, true, this.component.setScale);
        GTween.to2(1, 1, 0, 0, this.outDuration)
            .setEase(this.outEase)
            .setTarget(this.component, this.component.setScale)
            .onComplete(() => {
                this.hideImmediately();
            });
    }

    hideNow(code?: number) {
        this.internalHide(true, code);
    }

    hide(code?: number): void {
        this.internalHide(false, code);
    }

    protected async registTap() {
        if (!this.waitAnimation) {
            await CoroutineUtils.until(() => !this.isShowing);
        }
        super.registTap();
    }
}