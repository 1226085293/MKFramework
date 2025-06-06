"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
class plugin_config {
    /** 插件名 */
    static plugin_name_s = path_1.default.basename(path_1.default.dirname(__dirname));
    /** 插件路径 */
    static plugin_path_s = path_1.default.join(__dirname, "..");
    /** 代码风格 */
    static code_style_s = "蛇形";
}
exports.default = plugin_config;
