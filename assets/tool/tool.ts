import { DEBUG } from "cc/env";
import * as tool from "./tool_export";

if (DEBUG) {
	self["tool"] = tool;
}
export default tool;
