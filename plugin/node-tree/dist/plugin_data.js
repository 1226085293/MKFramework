"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** 插件数据 */
class _plugin_data {
    /* ------------------------------- segmentation ------------------------------- */
    /** 重置 */
    reset() {
        Object.assign(this, new _plugin_data());
    }
}
const plugin_data = new _plugin_data();
exports.default = plugin_data;
