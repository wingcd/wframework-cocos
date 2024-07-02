import { Controller, Event, GButton, GComboBox, GSlider, GTextField, GTextInput } from "fairygui-cc";
import { inject } from "../Decorators";
import View from "../View";

export enum EGMItemType {
    Input,
    Slider,
    Button,
    Switch,
    Selector,
}

export enum EGMValueType {
    int,
    float,
    string,
    boolean,
}

export class GMItemInfo {
    category: string;
    name: string;
    type: EGMItemType;
    valueType: EGMValueType;
    callback: Function;
    thisObj: any;
    min: number;
    max: number;
    defaultValue: number | boolean | string;
    defaultValues: string[];
}

export class GMEvent {
    category: string;
    name: string;
    value: string|number|boolean;    
}

export class GMItem extends View{
    @inject(GTextField)
    title: GTextField;

    @inject(GTextInput, "input.input")
    input: GTextInput;

    @inject(GSlider)
    slider: GSlider;

    @inject(GButton)
    button: GButton;

    @inject(GButton)
    switcher: GButton;

    @inject(GComboBox)
    selector: GComboBox;

    @inject(Controller)
    type: Controller;

    private _info: GMItemInfo = null;
    private _event: GMEvent = new GMEvent;
    protected onCreate(data: any) {
        this.input.promptText = "";
        this.input.on(Event.TEXT_CHANGE, this._onTextChanged, this);
        this.slider.on(Event.STATUS_CHANGED, this._onSliderChanged, this);
        this.button.onClick(this._onButtonClick, this);
        this.switcher.onClick(this._onSwitchrClick, this);
        this.selector.on(Event.STATUS_CHANGED, this._onSelectorChanged, this);
    }

    reset(data: GMItemInfo) {
        this._info = data;
        this._event.category = this._info.category;
        this.title.text = this._event.name = this._info.name;
        this.type.selectedIndex = this._info.type;
        this.selector.items = [];

        if(this._info.type == EGMItemType.Slider) {
            this.slider.min = this._info.min;
            this.slider.max = this._info.max;
        }

        switch(data.type) {
            case EGMItemType.Input:
                this.input.text = data.defaultValue.toString();
                this._getValueFromInput();
                break;
            case EGMItemType.Slider:
                this.slider.value = data.defaultValue as number;
                this.input.text = (Math.round(this.slider.value * 1000)/1000).toString();
                this._event.value = this.slider.value;
                break;
            case EGMItemType.Switch:
                this.switcher.selected = data.defaultValue as boolean;
                this._event.value = this.switcher.selected;
                break;
            case EGMItemType.Selector:                
                this.selector.items = data.defaultValues;
                this.selector.selectedIndex = data.defaultValue as number;
                break;
        }
        this._onTextChanged();
    }

    private _getValueFromInput() {
        switch(this._info.valueType) {
            case EGMValueType.int: {
                let val = parseInt(this.input.text);
                if(!Number.isNaN(val)) {
                    this._event.value = val;
                    if(this._info.type == EGMItemType.Slider) {
                        this.slider.value = val;
                        this.input.text = val.toString();
                    }
                }         
                break;
            }       
            case EGMValueType.float: {
                let val = parseFloat(this.input.text);
                if(!Number.isNaN(val)) {
                    this._event.value = val;
                    if(this._info.type == EGMItemType.Slider) {
                        this.slider.value = val;
                        this.input.text = val.toString();
                    }
                }  
                break;
            }
            case EGMValueType.string: {
                this._event.value = this.input.text;
                break;
            }
        }
    }

    private _onTextChanged() {
        this._getValueFromInput();
    }

    private _sendMessage() {
        this._info.defaultValue = this._event.value;
        this._info.callback?.call(this._info.thisObj, this._event);
    }

    private _onSliderChanged(evt: Event) {
        if(this._info.type == EGMItemType.Slider) {
            this.input.text = (Math.round(this.slider.value * 1000)/1000).toString();
            this._event.value = this.slider.value;

            this._sendMessage();
        }
    }

    private _onSelectorChanged(evt: Event) {
        this._event.value = this.selector.selectedIndex;
        this._sendMessage();
    }

    private _onButtonClick(evt: Event) {
        this._sendMessage();
    }

    private _onSwitchrClick(evt: Event) {
        this._event.value = this.switcher.selected;
        this._sendMessage();
    }
}