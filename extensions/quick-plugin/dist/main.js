"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
const plugin_config_1 = __importDefault(require("./plugin_config"));
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    /** 安装插件 */
    async install_extension(name_s_) {
        console.log("安装插件", name_s_);
        if (!name_s_) {
            return;
        }
        Editor.Message.broadcast(`${plugin_config_1.default.package_name_s}-install_extension`, name_s_);
    },
    log(type_s_, ...args_as) {
        console[type_s_](...args_as);
    },
};
// /**
//  * @en Hooks triggered after extension loading is complete
//  * @zh 扩展加载完成后触发的钩子
//  */
// export async function load() {}
// /**
//  * @en Hooks triggered after extension uninstallation is complete
//  * @zh 扩展卸载完成后触发的钩子
//  */
// export function unload() {}
