import { UtilsHelper } from "../utils/UtilsHelper";
import { UIManager } from "./UIManager";
import Skin from "./Skin";
import { Activity } from "./Activity";
import Window from "./Window"
import { ELayer } from "./ViewHelper";
import View from "./View";
import SkinHelper from "./SkinHelper";
import PinchGesture from "../plugins/gesture/PinchGesture";
import SwipeGesture from "../plugins/gesture/SwipeGesture";
import { inject } from './Decorators';
import { TweenWindow } from "./TweenWindow";

export default {
    UtilsHelper: UtilsHelper,
    UIManager: UIManager,
    Skin,
    Window,
    TweenWindow,
    Activity,
    ELayer,    
    View,
    SkinHelper,
    PinchGesture,
    SwipeGesture,
    inject,
};