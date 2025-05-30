"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.panel = exports.methods = exports.data = exports.self = exports.info = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const vue_1 = require("vue");
const electron_1 = __importDefault(require("electron"));
const tool_1 = __importDefault(require("../tool"));
const xlsx_1 = __importDefault(require("xlsx"));
// export const info: InspectorInfo = {
// 	type_s: "asset",
// 	target_s: "effect",
// };
exports.info = {
    title_s: "配置表",
    width_n: 500,
    height_n: 250,
    top_level_b: true,
};
exports.data = {
    /** 输入路径 */
    input_path_s: "",
    /** 输入路径建议 */
    input_path_suggestion_b: false,
    /** 输入路径建议 */
    input_path_suggestion_ss: [],
    /** 输出路径 */
    output_path_s: "",
    /** 输入路径建议 */
    output_path_suggestion_b: false,
    /** 输入路径建议 */
    output_path_suggestion_ss: [],
    /** 更新配置进度(-1:未开始，0-100:更新进度) */
    update_progress_n: -1,
};
exports.methods = {
    /** 点击更新配置 */
    async click_update_config() {
        if (!exports.data.input_path_s || !fs_1.default.existsSync(exports.data.input_path_s)) {
            Editor.Dialog.error("输入路径错误");
            return;
        }
        if (!exports.data.output_path_s || !fs_1.default.existsSync(exports.data.output_path_s)) {
            Editor.Dialog.error("输出路径错误");
            return;
        }
        // 更新进度
        exports.data.update_progress_n = 0;
        /** xlsx 文件 */
        let xlsx_file_ss = fs_1.default.readdirSync(exports.data.input_path_s).filter((v_s) => !v_s.startsWith("~$") && v_s.endsWith(".xlsx"));
        /** 输出文件表 */
        let output_file_tab = {};
        /** 输出文件注释 */
        let output_file_attractor_desc_tab = {};
        /** 输出文件属性名 */
        let output_file_attractor_name_tab = {};
        /** 输出文件类型 */
        let output_file_attractor_type_tab = {};
        /** 输出文件名对应路径表 */
        let output_file_to_path_tab = {};
        // 读取配置文件
        {
            let read_data_f = (type_s, value_s) => {
                if (type_s === "number") {
                    return Number(value_s);
                }
                else if (type_s === "string") {
                    value_s = String(value_s);
                    if (value_s[0] === value_s.slice(-1)[0] && '"' === value_s[0]) {
                        value_s = `${value_s.slice(1, -1)}`;
                    }
                    return value_s;
                }
                else if (type_s === "boolean") {
                    return ["true", "TRUE"].includes(value_s) ? true : ["false", "FALSE"].includes(value_s) ? false : Boolean(value_s);
                }
                else if (type_s.endsWith("[]")) {
                    try {
                        let data_as = [];
                        let raw_data_as = JSON.parse(value_s);
                        type_s = type_s.slice(0, -2);
                        raw_data_as.forEach((v) => {
                            data_as.push(read_data_f(type_s, typeof v === "string" ? v : JSON.stringify(v)));
                        });
                        return data_as;
                    }
                    catch (e) {
                        return e;
                    }
                }
                else if (type_s.startsWith("[") && type_s.endsWith("]")) {
                    try {
                        let data_as = [];
                        let type_ss = type_s
                            .slice(1, -1)
                            .split(",")
                            .map((v_s) => v_s.trim());
                        let value_as = JSON.parse(value_s);
                        value_as.forEach((v, k_n) => {
                            data_as.push(read_data_f(type_ss[k_n], typeof v === "string" ? v : JSON.stringify(v)));
                        });
                        return data_as;
                    }
                    catch (e) {
                        return e;
                    }
                }
                return "";
            };
            let default_value_f = (type_s) => {
                if (type_s === "number") {
                    return 0;
                }
                else if (type_s === "string") {
                    return "";
                }
                else if (type_s === "boolean") {
                    return false;
                }
                else if (type_s.endsWith("[]")) {
                    return [];
                }
                else if (type_s.startsWith("[") && type_s.endsWith("]")) {
                    return [];
                }
                return "";
            };
            for (let v_s of xlsx_file_ss) {
                await new Promise((resolve_f) => {
                    setTimeout(resolve_f, 100);
                });
                let path_s = path_1.default.join(exports.data.input_path_s, v_s);
                let workbook = xlsx_1.default.readFile(path_s);
                workbook.SheetNames.forEach((v2_s) => {
                    // 指定开头表名
                    if (!v2_s || !v2_s.startsWith("t_")) {
                        return;
                    }
                    let sheet = workbook.Sheets[v2_s];
                    /** 按行读取的数据 */
                    let data_as = xlsx_1.default.utils.sheet_to_json(sheet, { header: 1 });
                    /** 输出数据 */
                    let output = {};
                    /** 注释 */
                    let attractor_desc_ss = data_as[0].slice(1).map((v3) => String(v3 ?? ""));
                    /** 属性名 */
                    let attractor_name_ss = data_as[1].slice(1).map((v3) => String(v3 ?? ""));
                    /** 类型 */
                    let attractor_type_ss = data_as[2].slice(1).map((v3) => String(v3 ?? ""));
                    data_as.slice(3).forEach((v3_as, k3_n) => {
                        if (!v3_as.length) {
                            return;
                        }
                        let data = {};
                        attractor_name_ss.forEach((v4_s, k4_n) => {
                            if (!v4_s) {
                                return;
                            }
                            let index_n = k4_n + 1;
                            let type_s = attractor_type_ss[k4_n];
                            let value_s = v3_as[index_n];
                            // undefined，适配之前的生成结果
                            if (value_s !== undefined) {
                                let parse_result = read_data_f(type_s, value_s);
                                if (parse_result instanceof Error) {
                                    console.error(`${path_1.default.basename(v_s, path_1.default.extname(v_s))}/${v2_s} 解析错误(行${k3_n + 4}列${String.fromCharCode(65 + k4_n + 1)}) ：`, parse_result);
                                }
                                else {
                                    data[v4_s] = read_data_f(type_s, value_s);
                                }
                            }
                            else {
                                data[v4_s] = default_value_f(type_s);
                            }
                        });
                        if ((data.id_n ?? "") !== "") {
                            output[data.id_n] = data;
                        }
                    });
                    try {
                        output_file_to_path_tab[v2_s] = path_s;
                        output_file_attractor_desc_tab[v2_s] = attractor_desc_ss;
                        output_file_attractor_name_tab[v2_s] = attractor_name_ss;
                        output_file_attractor_type_tab[v2_s] = attractor_type_ss;
                        output_file_tab[v2_s] = output;
                    }
                    catch (e) {
                        delete output_file_tab[v2_s];
                        console.error("解析错误", `${v_s}-${v2_s}`, e);
                    }
                });
                exports.data.update_progress_n += Math.floor(80 / xlsx_file_ss.length);
            }
            exports.data.update_progress_n = 80;
        }
        // 生成文件
        {
            let file_ss = Object.keys(output_file_tab);
            let finish_n = 0;
            file_ss.forEach((v_s) => {
                let path_s = path_1.default.join(exports.data.output_path_s, `${v_s}.ts`);
                let properties_s = "";
                let type_s = "";
                let config = output_file_tab[v_s];
                let attractor_desc_ss = output_file_attractor_desc_tab[v_s];
                let attractor_name_ss = output_file_attractor_name_tab[v_s];
                let attractor_type_ss = output_file_attractor_type_tab[v_s];
                type_s = `Record<number, {${attractor_name_ss
                    .map((v2_s, k2_n) => `\n	/** ${attractor_desc_ss[k2_n]} */\n	${v2_s}: ${attractor_type_ss[k2_n]}`)
                    .join(";")}\n}>`;
                for (let v2_s in config) {
                    properties_s += `\n	[${v2_s}]: ${JSON.stringify(config[v2_s])},`;
                }
                properties_s = properties_s.slice(1);
                let template_s = `/* eslint-disable */
/** ${path_1.default.basename(output_file_to_path_tab[v_s], path_1.default.extname(output_file_to_path_tab[v_s]))} */
export const ${v_s}: type_config = {
${properties_s}
};

export type type_config<T = ${type_s}> = {
	readonly [P in keyof T]: T[P] extends Function ? T[P] : type_config<T[P]>;
};`;
                fs_1.default.writeFile(path_s, template_s, (...args) => {
                    ++finish_n;
                    // 更新进度
                    exports.data.update_progress_n += (finish_n / file_ss.length) * 20;
                    if (finish_n === file_ss.length) {
                        exports.data.update_progress_n = 100;
                        setTimeout(() => {
                            exports.data.update_progress_n = -1;
                        }, 300);
                    }
                });
            });
        }
        if (exports.data.output_path_s.startsWith(path_1.default.resolve(Editor.Project.path))) {
            let db_path_s = exports.data.output_path_s.replace(path_1.default.join(Editor.Project.path, path_1.default.sep), "db://").replaceAll("\\", "/");
            Editor.Message.send("asset-db", "refresh-asset", db_path_s);
        }
        console.log("完成");
    },
    /** 点击输入路径框 */
    click_input_path_box() {
        if (!exports.data.input_path_suggestion_ss.length) {
            return;
        }
        exports.data.input_path_suggestion_b = !exports.data.input_path_suggestion_b;
    },
    /** 点击输入路径建议 */
    click_input_path_suggestion(index_n_) {
        exports.data.input_path_s = exports.data.input_path_suggestion_ss[index_n_] || exports.data.input_path_suggestion_ss[0];
        exports.data.input_path_suggestion_b = false;
        this._update_config();
    },
    /** 点击删除输入路径建议 */
    click_remove_input_path_suggestion(index_n_) {
        let deleted_value_s = exports.data.input_path_suggestion_ss[index_n_];
        exports.data.input_path_suggestion_ss.splice(index_n_, 1);
        exports.data.input_path_suggestion_b = false;
        // 如果删除选中的路径
        if (exports.data.input_path_s === deleted_value_s) {
            exports.data.input_path_s = exports.data.input_path_suggestion_ss[0];
        }
        this._update_config();
    },
    /** 点击选择输入路径 */
    async click_select_input_path() {
        let result = await Editor.Dialog.select({
            type: "directory",
            title: "选择输入路径",
            multi: false,
            path: exports.data.input_path_s,
        });
        if (result.canceled) {
            return;
        }
        let path_s = path_1.default.resolve(result.filePaths[0]);
        exports.data.input_path_s = path_s;
        if (!exports.data.input_path_suggestion_ss.includes(path_s)) {
            exports.data.input_path_suggestion_ss.unshift(path_s);
        }
        this._update_config();
    },
    /** 点击输出路径框 */
    click_output_path_box() {
        if (!exports.data.output_path_suggestion_ss.length) {
            return;
        }
        exports.data.output_path_suggestion_b = !exports.data.output_path_suggestion_b;
    },
    /** 点击输出路径建议 */
    click_output_path_suggestion(index_n_) {
        exports.data.output_path_s = exports.data.output_path_suggestion_ss[index_n_];
        exports.data.output_path_suggestion_b = false;
        this._update_config();
    },
    /** 点击删除输出路径建议 */
    click_remove_output_path_suggestion(index_n_) {
        let deleted_value_s = exports.data.output_path_suggestion_ss[index_n_];
        exports.data.output_path_suggestion_ss.splice(index_n_, 1);
        exports.data.output_path_suggestion_b = false;
        // 如果删除选中的路径
        if (exports.data.output_path_s === deleted_value_s) {
            exports.data.output_path_s = exports.data.output_path_suggestion_ss[0];
        }
        this._update_config();
    },
    /** 点击选择输出路径 */
    async click_select_output_path() {
        let result = await Editor.Dialog.select({
            type: "directory",
            title: "选择输出路径",
            multi: false,
            path: exports.data.output_path_s,
        });
        if (result.canceled) {
            return;
        }
        let path_s = path_1.default.resolve(result.filePaths[0]);
        exports.data.output_path_s = path_s;
        if (!exports.data.output_path_suggestion_ss.includes(path_s)) {
            exports.data.output_path_suggestion_ss.unshift(path_s);
        }
        this._update_config();
    },
    /** 初始化 */
    async _init() {
        exports.data.input_path_s = (await Editor.Profile.getConfig(config_1.default.plugin_name_s, "input_path_s")) ?? "";
        exports.data.output_path_s = (await Editor.Profile.getConfig(config_1.default.plugin_name_s, "output_path_s")) ?? "";
        exports.data.input_path_suggestion_ss = JSON.parse((await Editor.Profile.getConfig(config_1.default.plugin_name_s, "input_path_suggestion_ss")) ?? "[]");
        exports.data.output_path_suggestion_ss = JSON.parse((await Editor.Profile.getConfig(config_1.default.plugin_name_s, "output_path_suggestion_ss")) ?? "[]");
    },
    /** 更新配置 */
    _update_config() {
        Editor.Profile.setConfig(config_1.default.plugin_name_s, "input_path_s", exports.data.input_path_s);
        Editor.Profile.setConfig(config_1.default.plugin_name_s, "input_path_suggestion_ss", JSON.stringify(exports.data.input_path_suggestion_ss));
        Editor.Profile.setConfig(config_1.default.plugin_name_s, "output_path_s", exports.data.output_path_s);
        Editor.Profile.setConfig(config_1.default.plugin_name_s, "output_path_suggestion_ss", JSON.stringify(exports.data.output_path_suggestion_ss));
    },
};
exports.panel = Editor.Panel.define({
    template: `<div id="app" class="w-full h-full"><panel></panel></div>`,
    get style() {
        return tool_1.default.get_panel_content(__filename).style_s;
    },
    $: {
        app: "#app",
    },
    methods: {},
    ready() {
        if (this.$.app) {
            const app = (0, vue_1.createApp)({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith("ui-");
            app.component("panel", {
                template: tool_1.default.get_panel_content(__filename).html_s,
                data() {
                    return exports.data;
                },
                methods: exports.methods,
                mounted() {
                    exports.self = this;
                    exports.data = this.$data;
                    exports.methods._init();
                },
            });
            app.mount(this.$.app);
        }
        // 非 inspector 面板 F5 刷新
        if (!exports.info.target_s) {
            let webFrame = electron_1.default.webFrame;
            let window = webFrame.context;
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
    beforeClose() { },
    close() { },
});
