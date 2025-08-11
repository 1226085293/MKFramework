import { argv, cwd } from "process";
import build_dts from "./build_dts";
import TreeShaking from "./TreeShaking";

(global.Editor as any) = {
	Project: {
		path: cwd(),
	},
};

switch (argv.slice(2)[0]) {
	case "build-dts": {
		build_dts();
		break;
	}
	case "tree-shaking": {
		TreeShaking().then((isChanged) => {
			if (isChanged) {
				return build_dts();
			}
		});
		break;
	}
}
