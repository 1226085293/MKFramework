"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-restricted-imports */
/* eslint-disable @typescript-eslint/naming-convention */
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const plugin_config_1 = __importDefault(require("./plugin_config"));
const typescript_1 = __importDefault(require("typescript"));
const plugin_tool_1 = __importDefault(require("./plugin_tool"));
class plugin_data {
    constructor(name_s_) {
        /** 代码表 */
        this._code_tab = {
            "/** {主进程事件} */": "",
            "/** {主进程加载} */": "",
            "/** {主进程卸载} */": "",
            "/** {场景脚本事件} */": "",
            "/** {场景脚本加载} */": "",
            "/** {场景脚本卸载} */": "",
            "/** {菜单} */": "",
        };
        name_s_ = this._get_real_plugin_name(name_s_);
        this.name_s = name_s_;
        this.editor_plugin_path_s = path_1.default.join(Editor.Project.path, "extensions", name_s_);
        this.user_plugin_path_s = path_1.default.join(plugin_config_1.default.user_plugin_path_s, name_s_);
        this._main_js_path_s = path_1.default.join(this.user_plugin_path_s, "dist/main.js");
    }
    /** 加载状态 */
    get loaded_b() {
        return this._get_loaded_b();
    }
    /** 用户 package.json */
    get user_package_json() {
        return this._get_user_package_json();
    }
    /* ------------------------------- segmentation ------------------------------- */
    /** 更新 */
    async update() {
        var _a;
        /** 插件根目录 */
        const plugin_root_path_s = path_1.default.join(__dirname, "..");
        // 插件目录不存在
        if (!fs_extra_1.default.existsSync(this.editor_plugin_path_s)) {
            fs_extra_1.default.copySync(path_1.default.join(plugin_root_path_s, "res/quick-plugin-template"), this.editor_plugin_path_s);
        }
        // 插件目录存在
        else {
            fs_extra_1.default.copySync(path_1.default.join(plugin_root_path_s, "res/quick-plugin-template/dist"), path_1.default.join(this.editor_plugin_path_s, "dist"));
            fs_extra_1.default.copySync(path_1.default.join(plugin_root_path_s, "res/quick-plugin-template/package.json"), path_1.default.join(this.editor_plugin_path_s, "package.json"));
        }
        // 更新插件信息
        {
            this._editor_package_json = fs_extra_1.default.readJSONSync(path_1.default.join(this.editor_plugin_path_s, "package.json"));
            // 同步插件数据
            ["version", "description", "author", "editor"].forEach((v_s) => {
                this._editor_package_json[v_s] = this.user_package_json[v_s];
            });
            // 插件名
            this._editor_package_json.name = this.name_s;
        }
        // 获取插件数据
        {
            // 编译插件
            try {
                const package_json = fs_extra_1.default.readJSONSync(path_1.default.join(this.user_plugin_path_s, "package.json"));
                // 检查是否安装了依赖
                if (Object.keys(package_json.dependencies).length > 0 && !fs_extra_1.default.existsSync(path_1.default.join(this.user_plugin_path_s, "node_modules"))) {
                    plugin_tool_1.default.error(`插件依赖未安装，请在 ${this.user_plugin_path_s} 目录下执行 npm i`);
                    return false;
                }
                fs_extra_1.default.removeSync(path_1.default.join(this.user_plugin_path_s, "dist"));
                // 自定义构建
                if ((_a = package_json.scripts) === null || _a === void 0 ? void 0 : _a.build) {
                    child_process_1.default.execSync(`npm run build`, {
                        cwd: this.user_plugin_path_s,
                    });
                }
                // tsc 构建
                else {
                    const ts_config_path_s = path_1.default.join(this.user_plugin_path_s, "tsconfig.json");
                    const dist_dir_s = path_1.default.join(this.user_plugin_path_s, "dist"); // 输出目录
                    // 确保 dist 目录存在
                    if (!fs_extra_1.default.existsSync(dist_dir_s)) {
                        fs_extra_1.default.mkdirSync(dist_dir_s, { recursive: true });
                    }
                    // 读取 tsconfig.json
                    const config_file = typescript_1.default.readConfigFile(ts_config_path_s, typescript_1.default.sys.readFile);
                    if (config_file.error) {
                        plugin_tool_1.default.error("Error reading tsconfig.json:", config_file.error);
                        return false;
                    }
                    // 使用 ts.parseJsonConfigFileContent 来解析 tsconfig 文件
                    const parsed_command_line = typescript_1.default.parseJsonConfigFileContent(config_file.config, typescript_1.default.sys, this.user_plugin_path_s);
                    // 创建 TypeScript 编译器的 `Program`
                    const program = typescript_1.default.createProgram(parsed_command_line.fileNames, parsed_command_line.options);
                    // 发出编译命令
                    const emit_result = program.emit();
                    // 检查是否有编译错误
                    const all_diagnostics_as = typescript_1.default.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
                    if (all_diagnostics_as.length > 0) {
                        all_diagnostics_as.forEach((diag) => {
                            const message_s = typescript_1.default.flattenDiagnosticMessageText(diag.messageText, "\n");
                            const file = diag.file;
                            const location_s = file ? `${file.fileName} (${diag.start})` : "Unknown file";
                            plugin_tool_1.default.error(`${location_s}: ${message_s}`);
                        });
                        plugin_tool_1.default.error("构建失败");
                        return false;
                    }
                }
            }
            catch (e) {
                plugin_tool_1.default.error("编译插件错误", e);
                return false;
            }
            // 清理模块缓存
            const find_path_s = this.user_plugin_path_s.replaceAll(path_1.default.sep, "\\");
            Object.keys(require.cache).forEach((v_s) => {
                if (v_s.includes(find_path_s)) {
                    delete require.cache[v_s];
                }
            });
            // 加载模块
            this._data = require(this._main_js_path_s.replaceAll(path_1.default.sep, "\\"));
        }
        // 面板数据
        {
            const panel_dir_path_s = path_1.default.join(this.user_plugin_path_s, "dist/panel");
            // 存在面板文件
            if (fs_extra_1.default.existsSync(panel_dir_path_s)) {
                fs_extra_1.default.readdirSync(panel_dir_path_s).forEach((v_s) => {
                    var _a, _b, _c, _d, _e;
                    const name_s = path_1.default.basename(v_s, ".js");
                    const path_s = path_1.default.join(panel_dir_path_s, v_s);
                    // 不是脚本文件
                    if (!path_s.endsWith(".js")) {
                        return;
                    }
                    const require_path_s = path_s.replaceAll(path_1.default.sep, "\\");
                    delete require.cache[require_path_s];
                    const panel_module = require(require_path_s);
                    const panel_info = panel_module.info;
                    /** 插件内面板文件夹路径 */
                    const plugin_panel_dir_path_s = path_1.default.join(this.editor_plugin_path_s, `dist/${name_s}`);
                    const inspector = panel_info;
                    const panel = panel_info;
                    // inspector
                    if (inspector.target_s) {
                        // 添加到 package.json
                        this._editor_package_json.contributions.inspector.section[inspector.type_s === "asset" ? "asset" : "node"][inspector.target_s] = path_1.default.join(plugin_panel_dir_path_s, "index.js");
                    }
                    // 面板
                    else {
                        // 添加到 package.json
                        this._editor_package_json.panels[name_s] = {
                            title: (_a = panel.title_s) !== null && _a !== void 0 ? _a : name_s,
                            type: (_b = panel.type_s) !== null && _b !== void 0 ? _b : "dockable",
                            main: `dist/${name_s}`,
                            size: {
                                "min-width": (_c = panel.min_width_n) !== null && _c !== void 0 ? _c : panel.width_n,
                                "min-height": (_d = panel.min_height_n) !== null && _d !== void 0 ? _d : panel.height_n,
                                width: panel.width_n,
                                height: panel.height_n,
                            },
                            flags: {
                                resizable: (_e = panel.resizable_b) !== null && _e !== void 0 ? _e : true,
                                save: false,
                                alwaysOnTop: Boolean(panel.top_level_b),
                            },
                        };
                    }
                    // 事件
                    if (panel_module.messages) {
                        for (const k_s in panel_module.messages) {
                            this._editor_package_json.contributions.messages[`${name_s}.${k_s}`] = {
                                methods: [`${name_s}.${k_s}`],
                            };
                        }
                    }
                    // 添加面板文件
                    fs_extra_1.default.ensureDirSync(plugin_panel_dir_path_s);
                    fs_extra_1.default.writeFileSync(path_1.default.join(plugin_panel_dir_path_s, "index.js"), `delete require.cache["${require_path_s.replaceAll("\\", "\\\\")}"];
						module.exports = require("${require_path_s.replaceAll("\\", "\\\\")}").panel;`);
                });
            }
        }
        // 获取脚本内容
        {
            const super_menu_path_s = path_1.default.join(__dirname, "super_menu.js").replaceAll(path_1.default.sep, "\\\\");
            this._code_tab["/** {场景脚本加载} */"] =
                this._code_tab["/** {场景脚本卸载} */"] =
                    this._code_tab["/** {主进程加载} */"] =
                        this._code_tab["/** {主进程卸载} */"] =
                            this._code_tab["/** {菜单} */"] =
                                this._get_module_script("plugin");
            this._code_tab["/** {菜单} */"] += `
				delete require.cache["${super_menu_path_s}"];
				let super_menu = require("${super_menu_path_s}").default;
				super_menu.event.targetOff("${this.name_s}");`;
            this._code_tab["/** {主进程卸载} */"] += `delete require.cache["${path_1.default
                .join(this.editor_plugin_path_s, "dist/main.js")
                .replaceAll(path_1.default.sep, "\\\\")}"];`;
            this._update_menu_data();
            this._update_event_data();
            this._update_scene_data();
        }
        // 替换脚本内容
        fs_extra_1.default.readdirSync(path_1.default.join(this.editor_plugin_path_s, "dist")).forEach((v_s) => {
            const path_s = path_1.default.join(this.editor_plugin_path_s, "dist", v_s);
            if (fs_extra_1.default.statSync(path_s).isDirectory()) {
                return;
            }
            let file_s = fs_extra_1.default.readFileSync(path_s, "utf-8");
            for (const k_s in this._code_tab) {
                file_s = file_s.replaceAll(k_s, this._code_tab[k_s]);
            }
            fs_extra_1.default.writeFileSync(path_s, file_s);
        });
        // 更新包信息
        fs_extra_1.default.writeJSONSync(path_1.default.join(this.editor_plugin_path_s, "package.json"), this._editor_package_json);
        // 重启插件
        {
            const path_s = this.editor_plugin_path_s.replaceAll(path_1.default.sep, "\\");
            await Editor.Package.unregister(path_s);
            await Editor.Package.register(path_s);
            await Editor.Package.enable(path_s);
        }
        return true;
    }
    /** 清理缓存 */
    async clear() {
        if (!fs_extra_1.default.existsSync(this.editor_plugin_path_s)) {
            return;
        }
        await Editor.Package.unregister(this.editor_plugin_path_s.replaceAll(path_1.default.sep, "\\"));
        fs_extra_1.default.removeSync(this.editor_plugin_path_s);
    }
    /** 删除插件 */
    async delete() {
        await Editor.Package.unregister(this.editor_plugin_path_s.replaceAll(path_1.default.sep, "\\"));
        this.hide();
        fs_extra_1.default.removeSync(this.editor_plugin_path_s);
        fs_extra_1.default.removeSync(this.user_plugin_path_s);
    }
    /** 展示插件列表 */
    async show() {
        // 插件不存在
        if (!fs_extra_1.default.existsSync(this.user_plugin_path_s)) {
            return;
        }
        const file_name_s = this._get_user_plugin_name();
        const path_s = path_1.default.join(plugin_config_1.default.plugin_path_s, `plugin/${file_name_s}`);
        if (fs_extra_1.default.existsSync(path_s)) {
            return;
        }
        fs_extra_1.default.writeFileSync(path_s, "");
        await Editor.Message.request("asset-db", "reimport-asset", `db://${plugin_config_1.default.package_name_s}/${file_name_s}`);
        Editor.Message.send("asset-db", "refresh-asset", `db://${plugin_config_1.default.package_name_s}/${file_name_s}`);
    }
    /** 隐藏 */
    hide() {
        const user_plugin_name_s = this._get_user_plugin_name();
        const file_path_s = path_1.default.join(plugin_config_1.default.plugin_path_s, "plugin");
        const file_name_s = fs_extra_1.default.readdirSync(file_path_s).find((v_s) => {
            if (v_s === this.name_s) {
                return true;
            }
            if (user_plugin_name_s !== "" ? v_s === this._get_user_plugin_name() : v_s.endsWith(` - ${this.name_s}`)) {
                return true;
            }
            return false;
        });
        if (!file_name_s) {
            return;
        }
        // 删除底部菜单
        this._clear_bottom_menu();
        // 删除资源插件文件
        {
            const path_s = path_1.default.join(plugin_config_1.default.plugin_path_s, `plugin/${file_name_s}`);
            fs_extra_1.default.removeSync(path_s);
            Editor.Message.send("asset-db", "refresh-asset", `db://${plugin_config_1.default.package_name_s}`);
        }
    }
    /** 获取用户插件名 */
    _get_user_plugin_name() {
        return !this.user_package_json ? "" : !this.user_package_json.title ? this.name_s : `${this.user_package_json.title} - ${this.name_s}`;
    }
    /** 获取插件真实文件名 */
    _get_real_plugin_name(name_s_) {
        const index_n = name_s_.indexOf(" - ");
        return index_n === -1 ? name_s_ : name_s_.slice(index_n + 3);
    }
    /** 获取模块代码 */
    _get_module_script(name_s_) {
        return `
		Object.keys(require.cache).forEach((v_s) => {
			if (v_s.includes("${this.user_plugin_path_s.replaceAll(path_1.default.sep, "\\\\")}")) {
				delete require.cache[v_s];
			}
		});
		let ${name_s_} = require("${this._main_js_path_s.replaceAll(path_1.default.sep, "\\\\")}");
		for (let k_s in global) {
			if (!(k_s in ${name_s_}.m_global) && Object.getOwnPropertyDescriptor(plugin.m_global, k_s)?.writable) {
				${name_s_}.m_global[k_s] = global[k_s];
			}
		};
			`;
    }
    /** 更新菜单数据 */
    _update_menu_data() {
        this._clear_bottom_menu();
        this._data.menu.forEach((v, k_n) => {
            // plugin_tool.log("解码菜单 - ", v.trigger_ss[0], v.trigger_ss[1]);
            v.trigger_ss.forEach((v2_s) => {
                // 资源加载菜单
                if (v2_s === "load") {
                    this._code_tab["/** {菜单} */"] += `
						plugin.menu[${k_n}].callback_f();
					`;
                    return;
                }
                const index_n = v2_s.indexOf("/");
                if (index_n === -1) {
                    return;
                }
                const type_s = v2_s.slice(0, index_n);
                const path_s = v2_s.slice(index_n + 1);
                switch (type_s) {
                    // 顶部菜单
                    case "top": {
                        const label_s = path_1.default.basename(path_s);
                        const event_s = label_s;
                        // 菜单
                        this._editor_package_json.contributions.menu.push({
                            path: path_s.slice(0, -label_s.length),
                            label: label_s,
                            message: event_s,
                        });
                        // 事件
                        this._editor_package_json.contributions.messages[event_s] = {
                            methods: [event_s],
                        };
                        // 回调
                        this._code_tab["/** {主进程事件} */"] += `
						"${event_s}"() {
							${this._get_module_script("plugin")}
							plugin.menu[${k_n}].callback_f();
						},
						`;
                        break;
                    }
                    // 底部菜单
                    case "footer": {
                        const label_ss = path_s.split("/");
                        const direction_s = label_ss.splice(0, 1)[0];
                        let parent_div = globalThis.document.querySelector("#footer").querySelector(`.${direction_s}`);
                        if (!parent_div) {
                            break;
                        }
                        if (direction_s === "right") {
                            parent_div = parent_div.querySelector(`span`);
                        }
                        /** 标签名 */
                        const element_name_s = label_ss[0];
                        /** 标签 id */
                        const element_id_s = element_name_s;
                        /** 标签元素 */
                        const element = globalThis.document.createElement("div");
                        element.className = this.name_s;
                        element.id = element_id_s;
                        element.innerText = element_name_s;
                        element.onclick = new Function(`
							${this._get_module_script("plugin")}
							plugin.menu[${k_n}].callback_f();`);
                        parent_div.appendChild(element);
                        break;
                    }
                    // 其他菜单
                    default: {
                        this._code_tab["/** {菜单} */"] += `
						super_menu.event.on(super_menu.type.${type_s}, ()=> {
							let exits_b = Editor.Package.getPackages({
								path: "${this.editor_plugin_path_s.replaceAll(path_1.default.sep, "\\\\")}",
							}).length !== 0;

							if (!exits_b) {
								return;
							}

							super_menu.update(super_menu.type.${type_s}, "${path_s}", {
								...plugin.menu[${k_n}]
							});
						}, "${this.name_s}");
						`;
                        break;
                    }
                }
            });
        });
    }
    /** 更新事件数据 */
    _update_event_data() {
        this._data.event.forEach((v, k_n) => {
            v.trigger_ss.forEach((v2_s) => {
                switch (v2_s) {
                    case "load": {
                        // 回调
                        this._code_tab["/** {主进程加载} */"] += `plugin.event[${k_n}].callback_f();`;
                        break;
                    }
                    case "unload": {
                        this._code_tab["/** {主进程卸载} */"] += `plugin.event[${k_n}].callback_f();`;
                        break;
                    }
                    default: {
                        // 事件
                        this._editor_package_json.contributions.messages[v2_s] = {
                            methods: [v2_s],
                        };
                        // 回调
                        this._code_tab["/** {主进程事件} */"] += `
							"${v2_s}"() {
							${this._get_module_script("plugin")}
								plugin.event[${k_n}].callback_f(...arguments);
							},
						`;
                    }
                }
            });
        });
    }
    /** 更新场景数据 */
    _update_scene_data() {
        this._data.scene.forEach((v, k_n) => {
            v.trigger_ss.forEach((v2_s) => {
                switch (v2_s) {
                    case "load": {
                        // 回调
                        this._code_tab["/** {场景脚本加载} */"] += `plugin.scene[${k_n}].callback_f();`;
                        break;
                    }
                    case "unload": {
                        this._code_tab["/** {场景脚本卸载} */"] += `plugin.scene[${k_n}].callback_f();`;
                        break;
                    }
                    default: {
                        this._code_tab["/** {场景脚本事件} */"] += `
							"${v2_s}"() {
							${this._get_module_script("plugin")}
								plugin.scene[${k_n}].callback_f(...arguments);
							},
						`;
                    }
                }
            });
        });
    }
    /** 加载状态 */
    _get_loaded_b() {
        return (Editor.Package.getPackages({
            path: this.editor_plugin_path_s.replaceAll(path_1.default.sep, "\\"),
        }).length !== 0);
    }
    /** 用户 package.json */
    _get_user_package_json() {
        if (this._user_package_json) {
            return this._user_package_json;
        }
        if (fs_extra_1.default.existsSync(this.user_plugin_path_s)) {
            this._user_package_json = fs_extra_1.default.readJSONSync(path_1.default.join(this.user_plugin_path_s, "package.json"));
        }
        return this._user_package_json;
    }
    /** 清空底部菜单 */
    _clear_bottom_menu() {
        const left = globalThis.document.querySelector("#footer").querySelector(`.left`);
        const right = globalThis.document.querySelector("#footer").querySelector(`.right`).querySelector(`span`);
        [left, right].forEach((v) => {
            const remove_as = [];
            for (let k2_n = 0, len2_n = v.childElementCount; k2_n < len2_n; ++k2_n) {
                const element = v.children[k2_n];
                if (element.className === this.name_s) {
                    remove_as.push(v.children[k2_n]);
                }
            }
            while (remove_as.length) {
                remove_as.pop().remove();
            }
        });
    }
}
exports.default = plugin_data;
