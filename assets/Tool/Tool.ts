import { DEBUG } from "cc/env";
import * as tool from "./ToolExport";

if (DEBUG) {
	self["tool"] = tool;
}

export default tool;
