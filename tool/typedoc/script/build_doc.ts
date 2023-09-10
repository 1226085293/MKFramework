import * as typedoc from "typedoc";
import fs from "fs";
import path from "path";
import * as glob from "glob";

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

	// 防止在主页展示
	{
		const file_ss = glob.globSync(path.join(outputDir, "/**/*.md").replace(/\\/g, "/"));

		file_ss.slice(1).forEach((v_s) => {
			let file_s = fs.readFileSync(v_s, "utf-8");

			file_s = ["---", "article: false", "timeline: false", "---"].join("\n") + "\n" + file_s;
			fs.writeFileSync(v_s, file_s);
		});
	}
}

main().catch(console.error);
