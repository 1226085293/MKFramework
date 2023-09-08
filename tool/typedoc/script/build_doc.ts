import * as typedoc from "typedoc";
import fs from "fs";
import path from "path";

async function main() {
	// Application.bootstrap also exists, which will not load plugins
	// Also accepts an array of option readers if you want to disable
	// TypeDoc's tsconfig.json/package.json/typedoc.json option readers
	const app = await typedoc.Application.bootstrapWithPlugins({
		tsconfig: "./tsconfig.json",
		// 项目名
		name: "index",
		// 输入
		entryPoints: ["../../assets/@framework/mk_export_docs.ts"],
		// 输出
		// out: "docs",
		// 插件
		plugin: ["typedoc-plugin-no-inherit", "typedoc-plugin-markdown"],
		// 排序（markdown 无效）
		sort: ["source-order", "visibility"],
		// 排除私有属性
		excludePrivate: true,
		// 排除 @internal
		excludeInternal: true,
		// README
		readme: "none",
	});

	const project = await app.convert();

	if (!project) {
		return;
	}

	// Project may not have converted correctly
	const outputDir = "./docs";

	// Rendered docs
	await app.generateDocs(project, outputDir);
	// Alternatively generate JSON output
	await app.generateJson(project, outputDir + "/documentation.json");

	// 添加 README 元数据
	fs.writeFileSync(
		path.join(outputDir, "README.md"),
		fs.readFileSync("./README.md", "utf-8") + "\n" + fs.readFileSync(path.join(outputDir, "README.md"), "utf-8")
	);
}

main().catch(console.error);
