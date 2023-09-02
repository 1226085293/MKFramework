import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import { argv } from "process";

(async () => {
	/** 输出路径 */
	const ouput_path_s = path.resolve("./docs");
	/** 临时路径 */
	const temp_path_s = path.resolve("./temp/docs");
	// 更新声明文件
	child_process.execSync(`npx ts-node ./script/build_dts.ts`);
	// 删除输出文件夹
	fs.removeSync(path.join("./temp", "md"));
	// 生成 md 文件
	child_process.execSync(`npx api-documenter markdown -i ./temp -o ${ouput_path_s}`);
	// 清理缓存文件
	fs.removeSync(temp_path_s);

	// 修改文件名，放入文件夹
	{
		let file_as = fs.readdirSync(ouput_path_s);

		file_as.forEach((v_s) => {
			/** 文件夹路径 */
			let dir_path_s = v_s
				.slice(0, Math.min(0, -v_s.lastIndexOf(".", 3)))
				.replace(/\./g, "/")
				// 下划线文件夹处理
				.replace(/\/_/g, "/@_");
			/** 临时文件夹路径 */
			let temp_dir_path_s = path.join(temp_path_s, dir_path_s);
			/** 文件名 */
			let file_name_s = v_s.slice(v_s.lastIndexOf(".", v_s.length - 4) + 1);
			/** 输出文件名 */
			let output_file_name_s = file_name_s[0] === "_" ? `@${file_name_s}` : file_name_s;

			/** 文件内容 */
			let file_s = fs.readFileSync(path.join(ouput_path_s, v_s), "utf-8");
			/** 元数据 */
			let meta_ss: string[] = [`title: ${file_name_s.slice(0, -3)}`];

			// 重命名为 README.md
			if (temp_dir_path_s.endsWith(path.join(file_name_s.slice(0, -3), path.sep))) {
				// 多个属性
				if (file_as.filter((v2_s) => v2_s.startsWith(v_s.slice(0, -3))).length > 1) {
					output_file_name_s = "README.md";
					// 添加索引
					meta_ss.push("index: true");
				} else {
					// 例：root/aaa/aaa.md -> root/aaa.md
					temp_dir_path_s = temp_dir_path_s.slice(0, -(output_file_name_s.slice(0, -3).length + path.sep.length));
				}
			}

			// 重置索引路径
			file_s = file_s
				// 根路径
				.replace(/\[Home\]\(\.\/index\.md\)/g, "[Home](/MK框架/docs/index.md)")
				.replace(/\[mk\]\(\.\/mk\.md\)/g, "[mk](/MK框架/docs/mk/README.md)")
				// 文档路径
				.replace(/\.\/mk\.([\w_\.]+)\.md/g, function (...args_as: any[]) {
					return `/MK框架/docs/mk/${args_as[1].replace(/\./g, "/").replace(/\/_/g, "/@_")}`;
				});

			// 添加元数据
			file_s = ["---", ...meta_ss, "---"].join("\n") + "\n" + file_s;
			// 保证路径存在
			fs.ensureDirSync(temp_dir_path_s);
			// 拷贝至文件夹，vuePress 不支持下划线前缀和无下划线前缀同名文件同时存在
			fs.writeFileSync(path.join(temp_dir_path_s, output_file_name_s), file_s);
		});
	}

	// 移动到输出路径
	{
		fs.removeSync(ouput_path_s);
		fs.copySync(temp_path_s, ouput_path_s);
	}
})();
