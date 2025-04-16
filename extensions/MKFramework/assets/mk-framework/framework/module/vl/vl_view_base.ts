import mk_event_target from "../../mk_event_target";
import mk_view_base from "../mk_view_base";

abstract class vl_view_base extends mk_view_base {
	/** 用户输入事件 */
	abstract event_protocol: {};
	// eslint-disable-next-line prettier/prettier
	event = new mk_event_target<(typeof this)["event_protocol"]>();
	/* ------------------------------- segmentation ------------------------------- */
	protected late_close(): void {
		this.event.clear();
	}
}

export default vl_view_base;
