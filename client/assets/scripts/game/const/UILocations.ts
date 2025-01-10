import { RewardData } from "../config/ConfigExtension";
import { EItemType, ERewardType } from "./types";

export enum UILocations {
    ResEnergy,
    ResGold,
}

const ResLocMap = {
    [ERewardType.Resource]: UILocations.ResGold,
};

export function GetLocationByReward(reward: RewardData) {
    let locType = -1;
    if(reward.type == ERewardType.Resource) {
        locType = ResLocMap[reward.id];
    }
    return locType;
}