"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const package_json_1 = __importDefault(require("../package.json"));
var plugin_config;
(function (plugin_config) {
    /** 包名 */
    plugin_config.package_name_s = package_json_1.default.name;
    /** 插件路径 */
    plugin_config.plugin_path_s = path_1.default.join(__dirname, "..");
    /** 插件文件夹 */
    plugin_config.plugin_dir_s = path_1.default.basename(plugin_config.plugin_path_s);
    /** 用户插件目录名 */
    plugin_config.user_plugin_dir_s = "plugin";
    /** 用户插件路径 */
    plugin_config.user_plugin_path_s = path_1.default.join(Editor.Project.path, plugin_config.user_plugin_dir_s);
})(plugin_config || (plugin_config = {}));
exports.default = plugin_config;
