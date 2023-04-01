import mk from "mk";
import main_config from "./main_config";
import main_event_protocol from "./main_event";

class main_bundle extends mk.bundle_.bundle_manage_base {
	name_s = "main";
	event = new mk.event_target<main_event_protocol>();
	storage = new mk.storage<main_config.storage_data>({
		name_s: "main_bundle",
		data: {
			bundle_version_tab: {},
		},
	});
}

export default new main_bundle();
