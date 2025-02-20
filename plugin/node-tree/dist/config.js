"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
var config;
(function (config) {
    config.plugin_path_s = path_1.default.join(__dirname, "..");
    config.plugin_name_s = path_1.default.basename(path_1.default.join(__dirname, ".."));
})(config || (config = {}));
exports.default = config;
