"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const path_1 = __importDefault(require("path"));
module.paths.push(path_1.default.join(Editor.App.path, "node_modules"));
function load() {
    /** {场景脚本加载} */
}
exports.load = load;
function unload() {
    /** {场景脚本卸载} */
}
exports.unload = unload;
exports.methods = {
/** {场景脚本事件} */
};
