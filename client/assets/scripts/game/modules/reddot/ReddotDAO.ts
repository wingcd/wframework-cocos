import { BaseDAO } from "../../../framework/modules/base/BaseDAO";
import { ReddotModel } from "./ReddotMode";

export class TaskDAO extends BaseDAO<ReddotModel> {
    
}
export const reddotDAO = new TaskDAO(ReddotModel);