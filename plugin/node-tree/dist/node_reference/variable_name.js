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
exports.default = default_1;
const pinyin_pro_1 = require("pinyin-pro");
const varname = __importStar(require("varname"));
const plugin_config_1 = __importDefault(require("../plugin_config"));
function default_1(node_name_s_) {
    if (node_name_s_.includes("@")) {
        node_name_s_ = node_name_s_.slice(node_name_s_.indexOf("@") + 1);
        return node_name_s_;
    }
    node_name_s_ =
        node_name_s_.match(/(?!\d)([\w\u4e00-\u9fa5]+)/g)?.join("") ?? "";
    // 引用
    if (node_name_s_.length) {
        // 包含中文字符转拼音
        if (node_name_s_.match(/[\u4e00-\u9fa5]/g)?.[0]) {
            let pinyin_ss = (0, pinyin_pro_1.pinyin)(node_name_s_, {
                toneType: "none",
                type: "array",
            });
            node_name_s_ = pinyin_ss
                .map((v_s, k_n) => (!k_n ? v_s : v_s[0].toUpperCase() + v_s.slice(1)))
                .join("");
        }
        else {
            node_name_s_ = node_name_s_[0].toLowerCase() + node_name_s_.slice(1);
        }
    }
    // 不引用
    else {
        node_name_s_ = "";
    }
    return plugin_config_1.default.code_style_s === "驼峰"
        ? varname.camelback(node_name_s_)
        : varname.underscore(node_name_s_);
}
