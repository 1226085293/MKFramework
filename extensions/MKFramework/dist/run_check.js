"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function default_1() {
    if (fs_1.default.existsSync(path_1.default.join(__dirname, "..", "node_modules"))) {
        return true;
    }
    console.error(Editor.I18n.t("MKFramework.未初始化", { plugin_path_s: path_1.default.join(__dirname, "..") }));
    return false;
}
exports.default = default_1;
