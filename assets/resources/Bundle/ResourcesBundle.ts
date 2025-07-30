import mk from "mk";
import ResourcesEventProtocol from "./ResourcesEvent";

class ResourcesBundle extends mk.Bundle_.BundleManageBase {
	nameStr = "resources";
	event = new mk.EventTarget<ResourcesEventProtocol>();
}

export default new ResourcesBundle();
