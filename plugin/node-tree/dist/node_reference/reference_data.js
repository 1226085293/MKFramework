"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const varname = __importStar(require("varname"));
const variable_name_1 = __importDefault(require("./variable_name"));
const tool_1 = __importDefault(require("../tool"));
const plugin_config_1 = __importDefault(require("../plugin_config"));
class reference_data {
    /** 当前节点树引用数据 */
    node_reference_tab = {};
    /** 节点树引用根节点 uuid */
    target = null;
    /* ------------------------------- segmentation ------------------------------- */
    /** 更新引用节点信息 */
    async update() {
        /** 节点信息表 uuid: 路径, [[组件名，组件路径], ...] */
        let node_info_tab = await tool_1.default.call_scene_script("get_node_info", this.node_reference_tab);
        for (let k_s in this.node_reference_tab) {
            this.node_reference_tab[k_s] = {};
            let info_as = node_info_tab[k_s];
            let node_data = this.node_reference_tab[k_s];
            if (!info_as || !info_as[0].includes(this.target.path)) {
                delete this.node_reference_tab[k_s];
                continue;
            }
            let name_s = (0, variable_name_1.default)(info_as[0].slice(info_as[0].lastIndexOf("/") + 1));
            if (!name_s) {
                delete this.node_reference_tab[k_s];
                continue;
            }
            node_data.name_s = name_s;
            node_data.path_s = info_as[0].slice(this.target.path.length + 1);
            node_data.component_sss = info_as[1];
        }
    }
    parse(target_script_path_s_) {
        let dir_path_s = target_script_path_s_.slice(0, target_script_path_s_.lastIndexOf("/") + 1);
        let file_name_s = target_script_path_s_.slice(dir_path_s.length);
        let class_name_s = `${file_name_s.slice(0, -3)}${plugin_config_1.default.code_style_s === "驼峰" ? "Nodes" : "_nodes"}`;
        let script_path_s = `${dir_path_s}${class_name_s}${file_name_s.slice(-3)}`;
        let script_db_path_s = script_path_s.replaceAll(Editor.Project.path.replaceAll("\\", "/"), "db:/");
        return {
            dir_path_s,
            file_name_s,
            class_name_s,
            script_path_s,
            script_db_path_s,
        };
    }
    async decode(target_script_path_s_) {
        target_script_path_s_ = target_script_path_s_.replaceAll("\\", "/");
        let { dir_path_s, file_name_s, class_name_s, script_path_s } = this.parse(target_script_path_s_);
        if (!fs.existsSync(script_path_s)) {
            this.node_reference_tab = {};
            return false;
        }
        let script_s = fs.readFileSync(script_path_s, "utf-8");
        let start_index_n = script_s.lastIndexOf("// data:");
        if (start_index_n == -1) {
            this.node_reference_tab = {};
            return false;
        }
        start_index_n += 8;
        let json_s = script_s.slice(start_index_n, script_s.indexOf("\n", start_index_n));
        try {
            let encode_data_tab = JSON.parse(json_s);
            let encode_data_key_ss = Object.keys(encode_data_tab);
            let uuid_ss = (await tool_1.default.call_scene_script("get_uuid_by_path", encode_data_key_ss));
            let node_reference_tab = {};
            uuid_ss.forEach((v_s, k_n) => {
                if (!v_s) {
                    return;
                }
                node_reference_tab[v_s] = encode_data_tab[encode_data_key_ss[k_n]];
            });
            this.node_reference_tab = node_reference_tab;
        }
        catch (e) {
            this.node_reference_tab = {};
        }
        return true;
    }
    async encode(target_script_path_s_) {
        target_script_path_s_ = target_script_path_s_.replaceAll("\\", "/");
        let { dir_path_s, file_name_s, class_name_s, script_path_s, script_db_path_s, } = this.parse(target_script_path_s_);
        let host_script_s = fs.readFileSync(target_script_path_s_, "utf-8");
        let import_s = `import ${class_name_s} from "./${class_name_s}";`;
        let member_s = `nodes = new ${class_name_s}(this);`;
        let varname_f = plugin_config_1.default.code_style_s === "驼峰"
            ? varname.camelback
            : varname.underscore;
        // 如果成员为空则删除
        if (!Object.keys(this.node_reference_tab).length &&
            fs.existsSync(script_path_s)) {
            Editor.Message.send("asset-db", "delete-asset", script_db_path_s);
            Editor.Message.send("asset-db", "create-asset", this._convert_to_db_path(target_script_path_s_), host_script_s
                .replace(new RegExp(`${import_s}((\r\n)|(\n))`), "")
                .replace(new RegExp(`((\r\n)|(\n))\t${member_s
                .replace("(", "\\(")
                .replace(")", "\\)")}`), ""), {
                overwrite: true,
            });
            return;
        }
        await this.update();
        let script_s = `/* eslint-disable */
import { js, Node, Component引擎组件导入 } from "cc";
自定义组件导入

export default class 类名 {
	constructor(comp_: Component) {
		let oldLoad = comp_["onLoad"];
		comp_["onLoad"] = () => {
			let node = comp_.node;
构造
			oldLoad?.call(comp_);
			comp_["onLoad"] = oldLoad;
		};
	}

成员
}
// data:编码数据
`;
        /** 组件表 */
        let component_tab = {};
        /** 组件成员后缀 */
        let component_member_tail_s = plugin_config_1.default.code_style_s === "驼峰" ? "Comps" : "_comps";
        // 类名
        script_s = script_s.replaceAll("类名", class_name_s);
        // 构造、成员、编码数据
        {
            /** 构造 */
            let constructor_s = ``;
            /** 成员 */
            let member_s = ``;
            /** 编码数据 */
            let encode_data_tab = {};
            for (let k_s in this.node_reference_tab) {
                let node_data = this.node_reference_tab[k_s];
                // 构造
                {
                    // 节点
                    constructor_s += `${constructor_s.length ? "\n" : ""}			this.${node_data.name_s} = node.${node_data.path_s.includes("/") ? "getChildByPath" : "getChildByName"}("${node_data.path_s}")!;`;
                    // 组件
                    if (node_data.component_sss.length) {
                        constructor_s += `${constructor_s.length ? "\n" : ""}			this.${node_data.name_s}${component_member_tail_s} = js.createMap();`;
                        node_data.component_sss.forEach((v2_ss) => {
                            let component_name_s = v2_ss[0].replace("cc.", "");
                            constructor_s += `${constructor_s.length ? "\n" : ""}			this.${node_data.name_s}${component_member_tail_s}.${varname_f(component_name_s)} = this.${node_data.name_s}.getComponent(${component_name_s})!;`;
                        });
                    }
                }
                // 成员
                {
                    let content_s = `	declare ${node_data.name_s}: Node;`;
                    let content2_s = `	declare ${node_data.name_s}${component_member_tail_s}: {\n		${node_data.component_sss
                        .map((v2_ss) => {
                        let component_name_s = v2_ss[0].replace("cc.", "");
                        component_tab[v2_ss[0]] = v2_ss[1];
                        return `${varname_f(component_name_s)}: ${component_name_s};`;
                    })
                        .join("\n		")}\n	};`;
                    if (node_data.component_sss.length) {
                        member_s += `\n${content_s}\n${content2_s}`;
                    }
                    else {
                        member_s += `\n${content_s}`;
                    }
                }
                // 原始数据
                encode_data_tab[node_data.path_s] = node_data;
            }
            if (!Object.keys(encode_data_tab).length) {
                return;
            }
            script_s = script_s.replaceAll("构造", constructor_s);
            script_s = script_s.replaceAll("成员", member_s.slice(1));
            script_s = script_s.replaceAll("编码数据", JSON.stringify(encode_data_tab));
        }
        // 组件导入
        {
            let cc_component_s = "";
            let user_component_s = "";
            for (let k_s in component_tab) {
                if (k_s.startsWith("cc.")) {
                    let name_s = k_s.slice(3);
                    let point_index_n = name_s.indexOf(".");
                    if (point_index_n !== -1) {
                        name_s = name_s.slice(0, point_index_n);
                    }
                    cc_component_s += `, ${name_s}`;
                }
                else {
                    user_component_s += `\nimport { ${k_s} } from "${this._convert_to_db_path(component_tab[k_s]).slice(0, -3)}";`;
                }
            }
            if (user_component_s) {
                user_component_s = user_component_s.slice(1);
            }
            script_s = script_s.replaceAll("引擎组件导入", cc_component_s);
            script_s = script_s.replaceAll("自定义组件导入", user_component_s);
        }
        // 添加
        {
            Editor.Message.send("asset-db", "create-asset", script_db_path_s, script_s, {
                overwrite: true,
            });
            // 宿主脚本已添加依赖
            if (host_script_s.includes(import_s)) {
                return;
            }
            let match_result = host_script_s.match(new RegExp(`(?<=class )(${file_name_s.slice(0, -3)})(?= extends)`));
            if (!match_result || match_result.index === -1) {
                console.warn("宿主组件添加成员变量失败, 请检查文件名和组件名及类名是否一致");
                return;
            }
            let insert_index_n = host_script_s.indexOf("{", match_result.index) + 1;
            host_script_s =
                `${import_s}\n` +
                    host_script_s.slice(0, insert_index_n) +
                    `\n\t${member_s}` +
                    host_script_s.slice(insert_index_n);
            Editor.Message.send("asset-db", "create-asset", this._convert_to_db_path(target_script_path_s_), host_script_s, {
                overwrite: true,
            });
        }
    }
    _convert_to_db_path(fs_path_s_) {
        fs_path_s_ = fs_path_s_.replaceAll("\\", "/");
        return ("db:/" +
            fs_path_s_.slice(Editor.Project.path.length).replaceAll("\\", "/"));
    }
}
exports.default = new reference_data();
