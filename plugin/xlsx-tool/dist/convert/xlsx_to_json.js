"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const prettier_1 = __importDefault(require("prettier"));
function default_1(
/** 配置数据 */
config_tab_, 
/** 注释 */
attractor_desc_ss_, 
/** 属性名 */
attractor_name_ss_, 
/** 类型 */
attractor_type_ss_, 
/** 输出文件路径 */
output_path_s_, 
/** 输入文件路径 */
input_path_s_, 
/** 表名 */
table_name_s_) {
    return prettier_1.default.format(JSON.stringify(config_tab_), {
        useTabs: true,
        filepath: "*.json",
    });
}
