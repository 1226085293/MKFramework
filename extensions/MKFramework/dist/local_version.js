"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cjson_1 = __importDefault(require("cjson"));
function default_1() {
    var _a;
    /** 包配置 */
    const project_package = cjson_1.default.load(path_1.default.join(Editor.Project.path, "package.json"));
    if (!((_a = project_package["MKFramework"]) === null || _a === void 0 ? void 0 : _a.version)) {
        console.log(Editor.I18n.t("mk-framework.当前项目未安装框架"));
        return;
    }
    console.log(Editor.I18n.t("mk-framework.当前项目框架版本为") + project_package["MKFramework"].version);
}
exports.default = default_1;
