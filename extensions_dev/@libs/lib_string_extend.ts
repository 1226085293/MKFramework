import path from "path";

class lib_string_extend {
	/** 获取字符块 */
	get_block(label_s_: string, head_s_ = "{", tail_s_ = "}"): string[] {
		/** 返回数据 */
		const result_ss: string[] = [];
		/** 前缀下标 */
		let head_index_n = 0;
		/** 后缀下标 */
		let tail_index_n = 0;
		/** 下一个前缀下标 */
		let next_head_index_n = 0;
		/** 前缀计数 */
		let head_count_n: number;
		/** 查找起始位置 */
		let find_index_n: number;

		while (head_index_n !== -1 && tail_index_n !== -1) {
			if (tail_index_n) {
				result_ss.push(label_s_.slice(head_index_n + head_s_.length, tail_index_n));
			}
			head_index_n = label_s_.indexOf(head_s_, tail_index_n + (tail_index_n ? tail_s_.length : 0));
			head_count_n = head_index_n !== -1 ? 1 : 0;
			find_index_n = head_index_n + head_s_.length;
			while (head_count_n > 0) {
				next_head_index_n = label_s_.indexOf(head_s_, find_index_n);
				tail_index_n = label_s_.indexOf(tail_s_, find_index_n);
				if (next_head_index_n === -1 && tail_index_n === -1) {
					break;
				}
				// 更新前缀计数
				{
					if ((next_head_index_n !== -1 && next_head_index_n < tail_index_n) || (tail_index_n === -1 && next_head_index_n !== -1)) {
						++head_count_n;
						find_index_n = next_head_index_n + head_s_.length;
					} else if ((tail_index_n !== -1 && tail_index_n < next_head_index_n) || (tail_index_n !== -1 && next_head_index_n === -1)) {
						--head_count_n;
						find_index_n = tail_index_n + tail_s_.length;
					}
				}
			}
			if (head_count_n) {
				return result_ss;
			}
		}
		return result_ss;
	}

	/** 项目路径转换为绝对路径 */
	project_path_to_fs_path(path_s_: string): string {
		if (path_s_.length <= "project://".length) {
			return "";
		}
		return path.normalize(path_s_.replace("project:/", Editor.Project.path));
	}

	/** 绝对路径转换为项目路径 */
	fs_path_to_project_path(path_s_: string): string {
		return path.normalize(path.normalize(path_s_).replace(Editor.Project.path, "project:"));
	}

	/** db 路径转换为绝对路径 */
	db_path_to_fs_path(path_s_: string): string {
		if (path_s_.length <= "db://".length) {
			return "";
		}
		return path.normalize(path_s_.replace("db:/", Editor.Project.path));
	}

	/** 绝对路径转换为 db 路径 */
	fs_path_to_db_path(path_s_: string): string {
		return path.normalize(path_s_).replace(Editor.Project.path, "db:/").replace(/\\/g, "/");
	}
}

export default new lib_string_extend();
