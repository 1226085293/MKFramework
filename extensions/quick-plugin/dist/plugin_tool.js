"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_config_1 = __importDefault(require("./plugin_config"));
class plugin_tool {
    log(...args_as_) {
        Editor.Message.send(plugin_config_1.default.package_name_s, "log", "log", ...args_as_);
    }
    warn(...args_as_) {
        Editor.Message.send(plugin_config_1.default.package_name_s, "log", "warn", ...args_as_);
    }
    error(...args_as_) {
        Editor.Message.send(plugin_config_1.default.package_name_s, "log", "warn", ...args_as_);
    }
}
exports.default = new plugin_tool();
