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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const lib_node_tree_1 = __importStar(require("../@lib/lib_node_tree"));
class right_component {
    /** 菜单触发器（渲染进程） */
    menu = [
        {
            trigger_ss: ["node/关闭脚本名展示"],
            priority_n: 999,
            run_f: (node) => {
                return (node.depth === 0 &&
                    lib_node_tree_1.default.has(lib_node_tree_1.lib_node_tree_.extension_type.tail_right, "class-name"));
            },
            callback_f: () => {
                lib_node_tree_1.default.style_tab["class-name-style"] = "";
                lib_node_tree_1.default.del(lib_node_tree_1.lib_node_tree_.extension_type.tail_right, "class-name");
            },
        },
        {
            trigger_ss: ["node/开启脚本名展示"],
            priority_n: 999,
            run_f: (node) => {
                return (node.depth === 0 &&
                    !lib_node_tree_1.default.has(lib_node_tree_1.lib_node_tree_.extension_type.tail_right, "class-name"));
            },
            callback_f: () => {
                lib_node_tree_1.default.add(lib_node_tree_1.lib_node_tree_.extension_type.tail_right, "class-name", (data) => {
                    /** 用户组件 */
                    let user_component_as = data.node.components.filter((v) => !v.type.startsWith("cc"));
                    return user_component_as.length > 0;
                }, (data) => {
                    let icon_div = document.createElement("ui-icon");
                    let button_div = document.createElement("div");
                    icon_div.setAttribute("color", "");
                    icon_div.setAttribute("value", "typescript");
                    button_div.appendChild(icon_div);
                    return button_div;
                });
            },
        },
    ];
}
exports.default = new right_component();
