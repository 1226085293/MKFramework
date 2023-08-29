import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import { argv } from "process";
import * as typedoc from "typedoc";

async function main() {
	// Application.bootstrap also exists, which will not load plugins
	// Also accepts an array of option readers if you want to disable
	// TypeDoc's tsconfig.json/package.json/typedoc.json option readers
	const app = await typedoc.Application.bootstrapWithPlugins({
		tsconfig: "./tsconfig.json",
		plugin: ["typedoc-plugin-markdown"],
		sort: ["source-order", "visibility"],
	});

	const project = await app.convert();

	if (project) {
		// Project may not have converted correctly
		const outputDir = "docs";

		// Rendered docs
		await app.generateDocs(project, outputDir);
		// Alternatively generate JSON output
		await app.generateJson(project, outputDir + "/documentation.json");
	}
}

main().catch(console.error);
