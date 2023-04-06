import fs from "fs";
import path from "path";
import lib_byte from "./lib_byte";
import lib_log from "./lib_log";
import lib_string_extend from "./lib_string_extend";

class lib_file {
	private _log = new lib_log("lib_file");
	/* ------------------------------- 功能 ------------------------------- */
	/** 保证目录存在 */
	private _ensure_path_exists(path_s_: string): void {
		const path_ss = path.resolve(path_s_).split(path.sep);
		let curr_path_s = "";

		path_ss.forEach((v_s) => {
			curr_path_s += v_s + path.sep;
			if (!fs.existsSync(curr_path_s)) {
				fs.mkdirSync(curr_path_s);
			}
		});
	}

	/** 搜索文件/目录 */
	private _search(path_s_: string, match_: RegExp, config_: lib_file_.search_config, result_ss_: string[]): string[] {
		if (!fs.existsSync(path_s_)) {
			return result_ss_;
		}
		if (fs.statSync(path_s_).isDirectory()) {
			// 排除路径
			if (config_.exclude_ss!.includes(path_s_)) {
				return result_ss_;
			}
			// 匹配规则
			if (lib_byte.get_bit(config_.type_n!, lib_file_.file_type.dir)) {
				if (path_s_.match(match_)) {
					result_ss_.push(path_s_);
				}
			}
			// 遍历文件夹
			fs.readdirSync(path_s_).forEach((v_s) => {
				this._search(path.resolve(path_s_, v_s), match_, config_, result_ss_);
			});
		} else if (lib_byte.get_bit(config_.type_n!, lib_file_.file_type.file)) {
			// 排除路径
			if (config_.exclude_ss!.includes(path_s_)) {
				return result_ss_;
			}
			// 匹配规则
			if (path_s_.match(match_)) {
				result_ss_.push(path_s_);
			}
		}
		return result_ss_;
	}

	/** 删除文件/目录 */
	private _del(path_s_: string, config_: lib_file_.del_config): void {
		// 如果是排除目录和不存在的目录则退出
		if (config_.exclude_ss!.includes(path_s_) || !fs.existsSync(path_s_)) {
			return;
		}
		if (fs.statSync(path_s_).isDirectory()) {
			/** 当前路径 */
			let curr_path_s: string;

			// 遍历文件夹
			fs.readdirSync(path_s_).forEach((v_s) => {
				curr_path_s = path.resolve(path_s_, v_s);
				this._del(curr_path_s, config_);
			});
			// 删除空文件夹
			if (!config_.exclude_ss!.filter((v_s) => v_s.startsWith(path_s_)).length) {
				fs.rmdirSync(path_s_);
			}
		} else {
			fs.unlinkSync(path_s_);
		}
	}

	/** 搜索文件/目录 */
	search(root_s_: string, match_: RegExp, config_ = new lib_file_.search_config()): string[] {
		const config = new lib_file_.search_config(config_);

		config.exclude_ss = config.exclude_ss!.map((v_s) => path.resolve(v_s));
		return this._search(path.resolve(root_s_), match_, config, []);
	}

	/** 拷贝文件/目录 */
	copy(input_s_: string, output_s_: string): void {
		// 安检
		if (!fs.existsSync(input_s_)) {
			return;
		}
		if (fs.statSync(input_s_).isDirectory()) {
			if (!fs.existsSync(output_s_)) {
				this._ensure_path_exists(output_s_);
			}
			fs.readdirSync(input_s_).forEach((v_s) => {
				this.copy(path.resolve(input_s_, v_s), path.resolve(output_s_, v_s));
			});
		} else {
			const output_dir_s = output_s_.slice(0, output_s_.lastIndexOf(path.sep));

			if (!fs.existsSync(output_dir_s)) {
				this._ensure_path_exists(output_dir_s);
			}
			fs.copyFileSync(input_s_, output_s_);
		}
	}

	/** 删除文件/目录 */
	del(path_s_: string, config_ = new lib_file_.del_config()): void {
		const config = new lib_file_.del_config(config_);

		config.exclude_ss = config.exclude_ss!.map((v_s) => path.resolve(v_s));
		return this._del(path.resolve(path_s_), config);
	}

	/** 添加文件/目录 */
	add(path_s_: string, content_s_: string): Promise<NodeJS.ErrnoException | null> {
		const path_s = path.normalize(path_s_);

		this._ensure_path_exists(path.dirname(path_s));
		return new Promise<NodeJS.ErrnoException | null>((resolve_f) => {
			fs.writeFile(path_s, content_s_, (err) => {
				resolve_f(err);
				if (err) {
					return;
				}
				if (!path_s.startsWith(Editor.Project.path)) {
					return;
				}
				// 刷新文件
				Editor.Message.send("asset-db", "refresh-asset", lib_string_extend.fs_path_to_db_path(path_s));
			});
		});
	}

	/**
	 * 计算导入路径
	 * @param export_s_ 导入路径
	 * @param current_s 当前路径
	 * @returns
	 */
	export_path(export_s_: string, current_s: string): string {
		// 格式转换
		export_s_ = export_s_.replace(/\\/g, "/").slice(0, export_s_.lastIndexOf("."));
		current_s = current_s.replace(/\\/g, "/");
		// 准备参数
		let temp_s = "./";
		let temp_n: number, temp2_n: number;
		const temp_ss = export_s_.split("/");
		const temp2_ss = current_s.split("/");

		// 路径转换
		for (temp2_n = 0; temp2_n < temp_ss.length; ++temp2_n) {
			if (temp_ss[temp2_n] != temp2_ss[temp2_n]) {
				break;
			}
		}
		for (temp_n = temp2_n + 1; temp_n < temp2_ss.length; ++temp_n) {
			temp_s += "../";
		}
		for (temp_n = temp2_n; temp_n < temp_ss.length; ++temp_n) {
			temp_s += `${temp_ss[temp_n]}/`;
		}
		temp_s = temp_s.slice(0, temp_s.length - 1);
		return temp_s;
	}
}

export namespace lib_file_ {
	export enum file_type {
		dir = 0x01,
		file = 0x02,
	}
	export class search_config {
		constructor(init_?: search_config) {
			Object.assign(this, init_);
		}

		/** 搜索类型 */
		type_n? = lib_file_.file_type.dir | lib_file_.file_type.file;
		/** 排除路径 */
		exclude_ss?: string[] = [];
	}
	export class del_config {
		constructor(init_?: del_config) {
			Object.assign(this, init_);
		}

		/** 排除路径 */
		exclude_ss?: string[] = [];
	}
}

export default new lib_file();
