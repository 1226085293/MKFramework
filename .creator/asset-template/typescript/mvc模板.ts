import mk from "mk";
import { _decorator } from "cc";
import global_config from "global_config";
const { ccclass, property } = _decorator;

export class <%UnderscoreCaseClassName%>_m extends mk.mvc_model_base {}

export class <%UnderscoreCaseClassName%> extends mk.mvc_control_base {
    protected _model = new <%UnderscoreCaseClassName%>_m();
    protected _view!: <%UnderscoreCaseClassName%>_v;
    /* ------------------------------- segmentation ------------------------------- */
    async open(): Promise<void> {
        mk.ui_manage.regis(<%UnderscoreCaseClassName%>_v, "db://xxx.prefab", null)
        this._view = (await mk.ui_manage.open(<%UnderscoreCaseClassName%>_v))!;
    }
}

@ccclass("<%UnderscoreCaseClassName%>_v")
class <%UnderscoreCaseClassName%>_v extends mk.mvc_view_base {}

export default <%UnderscoreCaseClassName%>_v;