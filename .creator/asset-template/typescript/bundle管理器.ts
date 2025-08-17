import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

class <%CamelCaseClassName%> extends mk.Bundle_.BundleManageBase {
	name_s = "这里填写 bundle 名";
}

export default new <%CamelCaseClassName%>();
