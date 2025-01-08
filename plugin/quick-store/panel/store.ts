import fs from "fs";
import path from "path";
import config from "../config";
import { createApp, App } from "vue";
import { InspectorInfo, PanelInfo, Self } from "../types";
import electron, { BrowserWindow } from "electron";
import tool from "../tool";
import axios from "axios";
import file from "../file";
import open from "open";

interface version_data {
	/** 版本 */
	version_s: string;
	/** 贴子地址 */
	post_url_s: string;
}

class list_data {
	constructor(init_: list_data) {
		Object.assign(this, init_);
	}
	/** 作者 */
	author_s!: string;
	/** 标题 */
	title_s!: string;
	/** 插件名 */
	name_s!: string;
	/** 描述 */
	description_s!: string;
	/** 链接 */
	url_s!: string;
	/** 喜欢数量 */
	like_n!: number;
	/** 下载中 */
	download_b = false;
	/** 展开状态 */
	expanded_b? = false;
	/** 版本信息 */
	version_as?: version_data[] = [];
}

// export const info: InspectorInfo = {
// 	type_s: "asset",
// 	target_s: "effect",
// };
export const info: PanelInfo = {
	title_s: "Quick商店",
	min_width_n: 200,
	min_height_n: 300,
	width_n: 350,
	height_n: 500,
	top_level_b: false,
};

export let self: Self;

export let data = {
	/** 搜索字符串 */
	search_s: "",
	/** 内容类型 (0:插件, 1:源码) */
	content_type: 0,
	/** 排序类型 (0:最受欢迎, 1:新品榜单) */
	sort_type: 0,
	/** 列表内容 */
	list_as: [] as list_data[],
	/** 没有更多内容 */
	not_more_b: false,
	/** 加载中 */
	loading_b: false,
	/** 当前页数 */
	page_n: 1,
	/** 下载表 */
	download_tab: {} as Record<string, boolean>,
	/** 下载版本 */
	download_version_s: "",
};

export const messages = {
	on_download(version_s_: string): void {
		data.download_version_s = version_s_;
	},
};

export let methods = {
	/** 点击切换类型 */
	click_switch_type(index_n_: number): void {
		data.content_type = index_n_;
		data.page_n = 1;
		data.list_as = [];
		this._request_list_data();
	},

	/** 点击切换排序 */
	click_switch_sort(index_n_: number): void {
		data.sort_type = index_n_;
		data.page_n = 1;
		data.list_as = [];
		this._request_list_data();
	},

	/** 点击 item 名 */
	async click_item_name(index_n_: number): Promise<void> {
		let item_data = data.list_as[index_n_];
		let version_as = await this._get_all_version(item_data);

		open(version_as[0].post_url_s);
	},

	/** 点击下载 */
	async click_download(index_n_: number): Promise<void> {
		let item_data = data.list_as[index_n_];

		if (item_data.download_b) {
			return;
		}

		// 更新下载状态
		this._set_download_status(item_data, true);

		/** 标题信息 */
		let title_info = this._get_title_info(item_data.title_s);
		/** 安装位置 */
		let install_path_s = "";

		/** 选择源码安装位置 */
		if (title_info.type_s === "源码") {
			let result = await Editor.Dialog.select({
				type: "directory",
				multi: false,
				title: "选择安装位置",
				path: path.join(Editor.Project.path, "assets"),
			});

			if (result.canceled) {
				// 更新下载状态
				this._set_download_status(item_data, false);
				return;
			}

			install_path_s = result.filePaths[0];
		}

		/** 版本列表 */
		let version_as = await this._get_all_version(item_data);

		// 单版本
		if (version_as.length === 1) {
			// 安装扩展
			this._install_extension(version_as[0].post_url_s, item_data, {
				install_path_s,
			});
		}
		// 选择版本
		else {
			await tool.close_panel("select-version");
			let panel = await tool.open_panel(
				"select-version",
				item_data.name_s,
				version_as.map((v) => v.version_s)
			);

			if (!panel) {
				// 更新下载状态
				this._set_download_status(item_data, false);
				return;
			}

			panel.once("closed", () => {
				// 更新下载状态
				this._set_download_status(item_data, data.download_version_s !== "");
				// 安装扩展
				this._install_extension(
					version_as.find((v) => v.version_s === data.download_version_s)
						?.post_url_s ?? "",
					item_data,
					{
						install_path_s,
					}
				);
			});
		}
	},

	/** 监听列表滚动 */
	on_list_scroll(): void {
		const { scrollTop, scrollHeight, clientHeight } = self.$refs.list;

		// 到达底部
		if (scrollTop + clientHeight >= scrollHeight) {
			if (data.not_more_b) {
				return;
			}

			++data.page_n;
			this._request_list_data();
		}
	},

	/** 监听搜索 */
	on_search(): void {
		// console.log("搜索", data.search_s);
		if (!data.search_s) {
			return;
		}

		data.page_n = 1;
		data.list_as = [];
		this._request_list_data();
	},

	/** 设置下载状态 */
	_set_download_status(item_data_: list_data, status_b_: boolean): void {
		if (!item_data_) {
			return;
		}

		data.download_tab[`${item_data_.author_s}-${item_data_.name_s}`] =
			item_data_.download_b = status_b_;
	},

	/** 获取下载状态 */
	_get_download_status(item_data_: list_data): boolean {
		if (!item_data_) {
			return false;
		}

		return Boolean(
			data.download_tab[`${item_data_.author_s}-${item_data_.name_s}`]
		);
	},

	/**
	 * 安装扩展
	 * @param post_url_s_ 帖子链接
	 * @param item_data_ 帖子数据
	 * @param param2
	 * @returns
	 */
	async _install_extension(
		post_url_s_: string,
		item_data_: list_data,
		{
			/** 安装位置 */
			install_path_s = "",
		}
	): Promise<void> {
		// 安检
		if (!post_url_s_ || !item_data_) {
			return;
		}

		let result: any = (
			await axios.get(post_url_s_, {
				headers: {
					"X-Requested-With": "XMLHttpRequest",
				},
			})
		)?.data;

		if (!result) {
			// 更新下载状态
			this._set_download_status(item_data_, false);
			return;
		}

		let title_info = this._get_title_info(item_data_.title_s);
		/** 帖子内容 */
		let content_s = result.post_stream.posts[0].cooked;
		/** 下载链接 */
		let download_url_s: string =
			result.post_stream.posts[0].link_counts.find((v: any) =>
				(v.url ?? "").endsWith(".zip")
			)?.url ?? "";
		/** 文件名 */
		let file_name_s =
			content_s.match(
				new RegExp(`(?<=(${download_url_s}\\">))([^]+?)(?=\.zip)`, "g")
			)?.[0] ?? "";

		if (file_name_s === "") {
			file_name_s = path.basename(download_url_s, path.extname(download_url_s));
		}

		// 删除无效插件
		if (
			// 无下载链接
			download_url_s === "" ||
			// 无效类型
			title_info.type_s === "" ||
			// 无文件名
			file_name_s === "" ||
			// 包含商店链接
			this._check_store_link(content_s)
		) {
			let index_n = data.list_as.findIndex(
				(v) =>
					v.author_s === item_data_.author_s && v.name_s === item_data_.name_s
			);

			if (index_n !== -1) {
				data.list_as.splice(index_n, 1);
			}

			console.error(
				"安装失败-无效下载地址",
				download_url_s === "",
				this._check_store_link(content_s)
			);
			// 更新下载状态
			this._set_download_status(item_data_, false);
			return;
		}

		// 补全论坛下载链接
		if (download_url_s.startsWith("/uploads/")) {
			download_url_s = `https://forum.cocos.org${download_url_s}`;
		}

		/** 文件地址 */
		let file_path_s = path.join(
			Editor.Project.tmpDir,
			path.basename(download_url_s)
		);

		// 删除同名文件
		if (fs.existsSync(file_path_s)) {
			fs.rmSync(file_path_s);
		}

		/** 成功状态 */
		let success_b = await file.download_zip(download_url_s, file_path_s);

		if (!success_b) {
			console.error("安装失败-下载 zip 失败");
			// 更新下载状态
			this._set_download_status(item_data_, false);
			return;
		}

		// 安装
		switch (title_info.type_s) {
			case "源码": {
				install_path_s = path.join(install_path_s, file_name_s);
				// 解压到安装路径
				await Editor.Utils.File.unzip(file_path_s, install_path_s);

				// 刷新目录
				if (install_path_s.startsWith(path.resolve(Editor.Project.path))) {
					let db_path = install_path_s
						.replace(path.resolve(Editor.Project.path) + path.sep, "db://")
						.replaceAll("\\", "/");

					Editor.Message.send("asset-db", "refresh-asset", db_path);
				}
				break;
			}
			case "插件": {
				// 解压到 plugin 文件夹
				await Editor.Utils.File.unzip(
					file_path_s,
					path.join(Editor.Project.path, "plugin", file_name_s)
				);
				// 安装插件
				await Editor.Message.request(
					"quick-plugin",
					"install_extension",
					file_name_s
				);
				break;
			}
		}

		// 删除压缩包
		fs.rmSync(file_path_s);
		// 更新下载状态
		this._set_download_status(item_data_, false);

		console.log("成功");
	},

	/**
	 * 获取链接所有版本
	 * @param item_data_
	 * @returns 返回以发布时间降序排序的数据
	 */
	async _get_all_version(item_data_: list_data): Promise<version_data[]> {
		if (item_data_.version_as!.length) {
			return item_data_.version_as!;
		}

		let title_info = this._get_title_info(item_data_.title_s);
		let version_data_as: version_data[] = item_data_.version_as!;
		let url_s = encodeURI(
			`https://forum.cocos.org/search?q=${title_info.title_head_s}${title_info.name_s} in:first status:open order:latest&page=${data.page_n}`
		);
		let result: any = (
			await axios.get(url_s, {
				headers: {
					"X-Requested-With": "XMLHttpRequest",
				},
			})
		)?.data;

		if (!result) {
			return version_data_as;
		}

		if (!result.topics) {
			version_data_as.push({
				version_s: title_info.version_s,
				post_url_s: item_data_.url_s,
			});
		} else {
			(result.topics as any[]).forEach((v) => {
				// 标题不匹配
				if (
					!(v.fancy_title as string).startsWith(
						`${title_info.title_head_s}${title_info.name_s}`
					)
				) {
					return;
				}

				let current_title_info = this._get_title_info(v.fancy_title);

				// 添加版本信息
				if (current_title_info.version_s) {
					version_data_as.push({
						version_s: current_title_info.version_s,
						post_url_s: `https://forum.cocos.org/t/topic/${v.id}`,
					});
				}
			});
		}

		return version_data_as;
	},

	/** 是否包含商店链接 */
	_check_store_link(text_s_: string): boolean {
		return (
			text_s_
				// MK 框架
				.replaceAll("store.cocos.com/app/detail/6426", "")
				.includes("store.cocos.com")
		);
	},

	/** 获取帖子标题头 */
	_get_post_title_head(content_type_: number): string {
		return `[QuickPlugin${["插件", "源码"][content_type_]}]：`;
	},

	/** 获取标题信息 */
	_get_title_info(name_s_: string): {
		title_head_s: string;
		name_s: string;
		version_s: string;
		type_s: string;
	} {
		let name_s = "";
		let version_s = "";
		let title_head_s = name_s_.match(/(\[QuickPlugin([^\]]+)\]：)/g)?.[0] ?? "";
		let type_s =
			name_s_.match(/(?<=\[QuickPlugin)(([^\]]+)(?=\]))/g)?.[0] ?? "";

		// 去掉版本号
		{
			name_s_ =
				name_s_.match(/(?<=(\[QuickPlugin([^\]]+)\]：))([^]*)/g)?.[0] ??
				name_s_;

			let end_index_n = name_s_.lastIndexOf("-");

			if (end_index_n !== -1) {
				name_s = name_s_.slice(0, end_index_n);
				version_s = name_s_.slice(end_index_n + 1, name_s_.length);
			}
		}

		// 补充版本号
		if (version_s === "") {
			version_s = "default";
		}

		return {
			title_head_s,
			name_s,
			version_s,
			type_s,
		};
	},

	/** 请求列表数据 */
	async _request_list_data(): Promise<void> {
		data.loading_b = true;
		data.not_more_b = false;
		// console.log("刷新列表", data.search_s, data.content_type, data.sort_type);

		let args_as = [
			data.search_s,
			data.content_type,
			data.sort_type,
			data.page_n,
		];
		let search_head_s = this._get_post_title_head(data.content_type);
		// 格式 [QuickPlugin插件]：名字-1.0.0
		let search_content_s = `${search_head_s}${data.search_s}`;

		let url_s = encodeURI(
			`https://forum.cocos.org/search?q=${search_content_s} in:title in:first status:open order:${
				data.sort_type === 0 ? "likes" : "latest"
			}&page=${data.page_n}`
		);
		let result: any = (
			await axios.get(url_s, {
				headers: {
					"X-Requested-With": "XMLHttpRequest",
				},
			})
		)?.data;

		// 请求失败
		if (!result) {
			return;
		}

		// 安检
		{
			let index_n = [
				data.search_s,
				data.content_type,
				data.sort_type,
				data.page_n,
			].findIndex((v, k_n) => v !== args_as[k_n]);

			// 搜索内容已经改变，数据无效
			if (index_n !== -1) {
				return;
			}
		}

		/** 新数据 */
		let new_list_as: any[] = result.topics ?? [];

		// 添加插件信息
		new_list_as.forEach((v) => {
			let post_data = result.posts.find((v2: any) => v2.topic_id === v.id);
			/** 名字 */
			let name_s = this._get_title_info(v.title).name_s;

			if (
				// // 测试插件
				// name_s === "测试插件" ||
				// 没有找到帖子数据
				!post_data ||
				// 标题不符
				!(v.title as string).startsWith(search_head_s) ||
				// 包含商店链接
				this._check_store_link(post_data.blurb)
			) {
				return null!;
			}

			/** 简介 */
			let description_s = "";

			// 简介
			{
				description_s = post_data.blurb;

				let key_s = "# 简介";
				let start_n = description_s.indexOf(key_s);
				let end_n = description_s.indexOf("# ", start_n + 1);

				description_s =
					start_n === -1
						? ""
						: description_s.slice(
								start_n + key_s.length,
								end_n === -1 ? description_s.length : end_n
						  );
			}

			let item_data = new list_data({
				author_s: post_data.username,
				title_s: v.title,
				name_s,
				description_s,
				url_s: `https://forum.cocos.org/t/topic/${v.id}`,
				like_n: post_data.like_count ?? 0,
				download_b: false,
			});

			// 初始化下载状态
			item_data.download_b = this._get_download_status(item_data);

			// 筛除不同版本的帖子
			if (
				data.list_as.findIndex(
					(v2) =>
						v2.author_s === item_data.author_s && v2.name_s === item_data.name_s
				) !== -1
			) {
				return;
			}

			data.list_as.push(item_data);
		});

		// 结束加载
		data.loading_b = false;
		// 更新状态
		data.not_more_b = new_list_as.length < 50;
	},
};

export const panel = Editor.Panel.define({
	template: `<div id="app" class="w-full h-full"><panel></panel></div>`,
	get style() {
		return tool.get_panel_content(__filename).style_s;
	},
	$: {
		app: "#app",
	},
	methods: {
		...messages,
	},
	ready() {
		if (this.$.app) {
			const app = createApp({});
			app.config.compilerOptions.isCustomElement = (tag: string) =>
				tag.startsWith("ui-");
			app.component("panel", {
				template: tool.get_panel_content(__filename).html_s,
				data() {
					return data;
				},
				methods: methods,
				mounted() {
					self = this as any;
					data = (this as any).$data;
					methods._request_list_data();
				},
			});
			app.mount(this.$.app);
		}

		// 非 inspector 面板 F5 刷新
		if (!(info as any).target_s) {
			let webFrame = electron.webFrame;
			let window = (webFrame as any).context as typeof globalThis;

			window.addEventListener("keydown", function (event) {
				if (event.key === "F5") {
					window.location.reload();
				}
			});
		}
	},
	// update(dump: any) {
	// 	self.dump = dump;
	// },
	beforeClose() {},
	close() {},
});
