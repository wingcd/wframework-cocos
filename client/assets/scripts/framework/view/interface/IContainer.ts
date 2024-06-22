import { IComponent } from "./IComponent";
import IView from "./IView";

export default interface IContainer extends IComponent
{
    destoried: boolean;

    children: IView[];

    addView(view: IView);

    removeView(view: IView);

    on(type: string, listener: Function, target?: any): void;

    once(type: string, listener: Function, target?: any): void;

    off(type: string, listener?: Function, target?: any): void;

    emit(type: string, ...data: any): void;
}