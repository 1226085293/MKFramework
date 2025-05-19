import mk from "mk";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

export class <%UnderscoreCaseClassName%>_m extends mk.mvc_model_base {}

export class <%UnderscoreCaseClassName%> extends mk.mvc_control_base<<%UnderscoreCaseClassName%>_m, <%UnderscoreCaseClassName%>_v> {
	/* ------------------------------- segmentation ------------------------------- */
	async open(): Promise<void> {
		this._model = await <%UnderscoreCaseClassName%>_m.new();
		this._view = (await <%UnderscoreCaseClassName%>_v.new())!;
	}
}

@ccclass("<%UnderscoreCaseClassName%>_v")
class <%UnderscoreCaseClassName%>_v extends mk.mvc_view_base {
	static new<T extends new (...args_as: any[]) => any>(this: T): Promise<InstanceType<T> | null> {
		mk.ui_manage.regis(<%UnderscoreCaseClassName%>_v, "db://xxx.prefab", null);

		return mk.ui_manage.open(<%UnderscoreCaseClassName%>_v);
	}
}

export default <%UnderscoreCaseClassName%>_v;
