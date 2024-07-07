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
exports.unload = exports.load = exports.methods = void 0;
const run_check_1 = __importDefault(require("./run_check"));
delete require.cache[__dirname + "\\build_dts.js"];
delete require.cache[__dirname + "\\install.js"];
delete require.cache[__dirname + "\\help.js"];
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
        if ((0, run_check_1.default)()) {
            (await Promise.resolve().then(() => __importStar(require("./install")))).default();
        }
        console.log(Editor.I18n.t("mk-framework.任务结束"));
    },
    async local_version() {
        if ((0, run_check_1.default)()) {
            (await Promise.resolve().then(() => __importStar(require("./local_version")))).default();
        }
    },
    async build() {
        console.log(Editor.I18n.t("mk-framework.任务开始"));
        if ((0, run_check_1.default)()) {
            (await Promise.resolve().then(() => __importStar(require("./build_dts")))).default();
        }
        console.log(Editor.I18n.t("mk-framework.任务结束"));
    },
    async help() {
        if ((0, run_check_1.default)()) {
            (await Promise.resolve().then(() => __importStar(require("./help")))).default();
        }
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
