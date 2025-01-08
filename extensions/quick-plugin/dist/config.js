"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin_dir_s = exports.plugin_path_s = exports.package_name_s = void 0;
const path_1 = __importDefault(require("path"));
const package_json_1 = __importDefault(require("../package.json"));
/** 包名 */
exports.package_name_s = package_json_1.default.name;
/** 插件路径 */
exports.plugin_path_s = path_1.default.join(__dirname, "..");
/** 插件文件夹 */
exports.plugin_dir_s = path_1.default.basename(exports.plugin_path_s);
