"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = __importDefault(require("electron"));
const config_1 = __importDefault(require("./config"));
const fs_1 = __importDefault(require("fs"));
/** 插件工具集 */
class tool {
    _panel_tab = {};
    /* ------------------------------- segmentation ------------------------------- */
    /**
     * 发送场景事件
     * @param method_s_ 方法名
     * @param args_as_ 参数
     */
    call_scene_script(method_s_, ...args_as_) {
        return Editor.Message.request("scene", "execute-scene-script", {
            name: config_1.default.plugin_name_s,
            method: method_s_,
            args: args_as_,
        });
    }
    /**
     * 打开面板
     * @param panel_s_ 面板名
     * @param args_as_ 传递到面板的参数
     * @returns
     */
    async open_panel(panel_s_, ...args_as_) {
        let panel_name_s = `${config_1.default.plugin_name_s}.${panel_s_}`;
        if (await Editor.Panel.has(panel_name_s)) {
            Editor.Panel.focus(panel_name_s);
            return this._panel_tab[panel_name_s];
        }
        else {
            let old_warn_f = console.warn;
            console.warn = function () { };
            const browser_window = electron_1.default.BrowserWindow ?? (electron_1.default.remote ?? require("@electron/remote")).BrowserWindow;
            const window_id_ns = browser_window.getAllWindows().map((v) => v.id);
            await Editor.Panel.open(`${config_1.default.plugin_name_s}.${panel_s_}`, ...(args_as_ ?? []));
            setTimeout(() => {
                console.warn = old_warn_f;
            }, 500);
            const window = browser_window.getAllWindows().find((v) => !window_id_ns.includes(v.id));
            if (!window) {
                console.error(`打开 ${panel_s_} 面板失败`);
                return null;
            }
            this._panel_tab[panel_name_s] = window;
            // // 打开调试
            // window.webContents.openDevTools();
            return window;
        }
    }
    /**
     * 关闭面板
     * @param panel_s_ 面板名
     * @returns
     */
    close_panel(panel_s_) {
        let panel_name_s = `${config_1.default.plugin_name_s}.${panel_s_}`;
        return Editor.Panel.close(panel_name_s);
    }
    /**
     * 清理模块缓存
     * @param path_s_ 模块路径
     */
    clear_module(path_s_) {
        let path_s = path_s_.replace(/\\/g, "/");
        delete require.cache[path_s.replace(/\//g, "\\")];
        delete require.cache[path_s];
    }
    /**
     * 获取面板内容
     * @param dir_path_s_ __direname
     * @returns
     */
    get_panel_content(dir_path_s_) {
        let file_s = fs_1.default.readFileSync(path_1.default.join(config_1.default.plugin_path_s, `panel/${path_1.default.basename(dir_path_s_, ".js")}.html`), "utf-8");
        return {
            html_s: file_s.match(/<div([\s\S]*)?<\/div>/g)[0],
            style_s: [
                file_s.match(/(?<=<style>)([^]*)(?=<\/style>)/g)?.[0] ?? "",
                fs_1.default.readFileSync(path_1.default.join(config_1.default.plugin_path_s, `dist/tailwind.css`), "utf-8"),
            ].join("\n"),
        };
    }
}
exports.default = new tool();
