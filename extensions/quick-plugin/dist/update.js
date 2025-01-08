"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const plugin_config_1 = __importDefault(require("./plugin_config"));
async function default_1() {
    let path_s = path_1.default.join(Editor.Project.path, "plugin");
    let file_ss = fs_1.default.readdirSync(path_s);
    let package_json = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "package.json")));
    /** 主进程事件代码 */
    let main_event_code_s = "";
    /** 菜单代码 */
    let menu_code_tab = {
        "/** {创建菜单} */": "",
        "/** {资源或目录菜单} */": "",
        "/** {数据库菜单} */": "",
        "/** {空白处菜单} */": "",
    };
    // 删除 menu
    package_json.contributions.menu = [];
    // 删除 messages
    package_json.contributions.messages = {};
    for (let v_s of file_ss) {
        if (!v_s.endsWith(".ts")) {
            break;
        }
        // 编译 ts
        try {
            await new Promise((resolve_f, reject_f) => {
                child_process_1.default.exec(`npx tsc -p ${path_1.default.join(path_s, v_s)} --outDir ${Editor.Project.tmpDir}`, {
                    cwd: path_1.default.join(__dirname, ".."),
                }, (error, stdout, stderr) => {
                    if (error) {
                        // console.error(stdout);
                        reject_f(stdout);
                    }
                    else {
                        resolve_f();
                    }
                });
            });
        }
        catch (e) { }
        let module_path_s = path_1.default
            .join(Editor.Project.tmpDir, v_s.slice(0, -3) + ".js")
            .replace("/", "\\");
        // 加载模块
        delete require.cache[module_path_s];
        let module = require(module_path_s);
        // 注册菜单
        module.menu.forEach((v, k_n) => {
            switch (v.trigger_ss[0]) {
                case "top": {
                    let label_s = path_1.default.basename(v.trigger_ss[1]);
                    let event_s = label_s;
                    // 菜单
                    package_json.contributions.menu.push({
                        path: v.trigger_ss[1].slice(0, -label_s.length),
                        label: label_s,
                        message: event_s,
                    });
                    // 事件
                    package_json.contributions.messages[event_s] = {
                        methods: [event_s],
                    };
                    // 回调
                    main_event_code_s += `
					${main_event_code_s.length ? "," : ""}
					${event_s}() {
						let module = require(\"${module_path_s.replace(/\\/g, "\\\\")}\");
						Object.assign(module.m_global, global);
						module.menu[${k_n}].callback_f();
					}
					`;
                    break;
                }
                case "asset": {
                    let label_s = path_1.default.basename(v.trigger_ss[1]);
                    let event_s = label_s;
                    // 菜单
                    package_json.contributions.menu.push({
                        path: v.trigger_ss[1].slice(0, -label_s.length),
                        label: label_s,
                        message: event_s,
                    });
                    // 事件
                    package_json.contributions.messages[event_s] = {
                        methods: [event_s],
                    };
                    // 回调
                    main_event_code_s += `
					${main_event_code_s.length ? "," : ""}
					${event_s}() {
						let module = require(\"${module_path_s.replace(/\\/g, "\\\\")}\");
						Object.assign(module.m_global, global);
						module.menu[${k_n}].callback_f();
					}
					`;
                    break;
                }
            }
        });
        // 删除
        fs_1.default.rm(module_path_s, () => { });
    }
    // 写入 package.json
    // console.log("写入", package_json);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "..", "package.json"), JSON.stringify(package_json));
    // 写入 main.ts
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "../dist/main.js"), fs_1.default
        .readFileSync(path_1.default.join(__dirname, "../dist/main-template.js"), "utf-8")
        .replace("/** {主进程事件} */", main_event_code_s));
    // 重启插件
    {
        let path_s = Editor.Package.getPath(plugin_config_1.default.package_name_s);
        await Editor.Package.unregister(path_s);
        await Editor.Package.register(path_s);
        await Editor.Package.enable(path_s);
    }
}
