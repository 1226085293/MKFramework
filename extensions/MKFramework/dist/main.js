"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
delete require.cache[__dirname + "\\build_dts.js"];
delete require.cache[__dirname + "\\install.js"];
delete require.cache[__dirname + "\\help.js"];
const build_dts_1 = __importDefault(require("./build_dts"));
const help_1 = __importDefault(require("./help"));
const install_1 = __importDefault(require("./install"));
const local_version_1 = __importDefault(require("./local_version"));
/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
exports.methods = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    async install() {
        console.log(Editor.I18n.t("mk-framework.任务开始"));
        await (0, install_1.default)();
        console.log(Editor.I18n.t("mk-framework.任务结束"));
    },
    local_version() {
        (0, local_version_1.default)();
    },
    async build() {
        console.log(Editor.I18n.t("mk-framework.任务开始"));
        await (0, build_dts_1.default)();
        console.log(Editor.I18n.t("mk-framework.任务结束"));
    },
    help() {
        (0, help_1.default)();
    },
};
/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
function load() {
    // Editor.Message.send('{name}', 'hello');
}
exports.load = load;
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
function unload() {
    // ...
}
exports.unload = unload;
