import { GButton } from "fairygui-cc";
import { PlatformHelper } from "./PlatformHelper";
import { view } from "cc";
import { GRoot } from "fairygui-cc";

export class PlatformUIHelper {
    public static addGameGroupButton(clubButton: GButton) {
        if(!PlatformHelper.isEnable || !PlatformHelper.isWechat) {
            return;
        }

        var x = clubButton.x;
        var y = clubButton.y;
        let sysInfo = PlatformHelper.getSystemInfoSync();
        let windowSize = view.getVisibleSize();
        var width = sysInfo.windowWidth * clubButton.width / GRoot.inst.width;
        var height = sysInfo.windowHeight * clubButton.height / GRoot.inst.height;
        var leftRatio = x / windowSize.width;
        var topRatio = y / windowSize.height;
        var leftPos = sysInfo.windowWidth * leftRatio;
        var topPos = sysInfo.windowHeight * topRatio;

        if(clubButton.pivotAsAnchor) {
            leftPos -= width * clubButton.pivotX;
            topPos -= height * clubButton.pivotY;
        }

        return PlatformHelper.createGameClubButton({
            type: "text",
            text: '',  
            // icon: "green",
            // @ts-ignore      
            style: {        
                left: leftPos,
                top: topPos,        
                width: width,        
                height: height,       
            },
        });
    }
}