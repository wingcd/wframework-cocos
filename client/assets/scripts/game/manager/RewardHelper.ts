import { RewardData } from "../config/ConfigExtension";
import { EItemType, ERewardType } from "../const/types";
import { userController } from "../modules/user/UserController";

export class RewardHelper {
    static addResByReward(rewardData: RewardData) {
        switch (rewardData.type) {
            case ERewardType.Resource:
                userController.addResource(rewardData.id, rewardData.count);
                break;
            case ERewardType.Animal:
                userController.addAnimal(rewardData.id);
                break;
            case ERewardType.Tool:
                userController.addItem(rewardData.id, rewardData.count);
                break;
        }
    }

    static addResByRewardList(rewardList: RewardData[]) {
        for (let reward of rewardList) {
            this.addResByReward(reward);
        }
    }
}