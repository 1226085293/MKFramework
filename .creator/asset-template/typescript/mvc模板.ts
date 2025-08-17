import mk from "mk";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

export class <%CamelCaseClassName%>Model extends mk.MVCModelBase {}

export class <%CamelCaseClassName%> extends mk.MVCControlBase<<%CamelCaseClassName%>Model, <%CamelCaseClassName%>View> {
	/* ------------------------------- segmentation ------------------------------- */
	async open(): Promise<void> {
		this._model = await <%CamelCaseClassName%>Model.new();
		this._view = (await <%CamelCaseClassName%>View.new())!;
	}
}

@ccclass("<%CamelCaseClassName%>View")
class <%CamelCaseClassName%>View extends mk.MVCViewBase {
	static new<T extends new (...argsList_: any[]) => any>(this: T): Promise<InstanceType<T> | null> {
		mk.uiManage.regis(<%CamelCaseClassName%>View, "db://xxx.prefab", null);

		return mk.uiManage.open(<%CamelCaseClassName%>View);
	}
}

export default <%CamelCaseClassName%>View;
