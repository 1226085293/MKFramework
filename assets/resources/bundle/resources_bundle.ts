import mk from "mk";
import resources_event_protocol from "./resources_event";

class resources_bundle extends mk.bundle_.bundle_manage_base {
	name_s = "resources";
	event = new mk.event_target<resources_event_protocol>();
	/* ------------------------------- segmentation ------------------------------- */
	open(): boolean {
		if (!super.open()) {
			return false;
		}

		return true;
	}
}

export default new resources_bundle();
