import { argv, cwd } from "process";
import buildDTS from "./BuildDTS";
import treeShaking from "./TreeShaking";

(global.Editor as any) = {
	Project: {
		path: cwd(),
	},
};

switch (argv.slice(2)[0]) {
	case "build-dts": {
		buildDTS();
		break;
	}
	case "tree-shaking": {
		treeShaking().then((isChanged) => {
			if (isChanged) {
				return buildDTS();
			}
		});
		break;
	}
}
