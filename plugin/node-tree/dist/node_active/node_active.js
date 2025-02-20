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
class node_active {
    /** 菜单触发器（渲染进程） */
    menu = [
        {
            trigger_ss: ["node/关闭 active 勾选"],
            priority_n: 999,
            run_f: (node) => {
                return (node.depth === 0 &&
                    lib_node_tree_1.default.has(lib_node_tree_1.lib_node_tree_.extension_type.head, "node-active"));
            },
            callback_f: () => {
                lib_node_tree_1.default.del(lib_node_tree_1.lib_node_tree_.extension_type.head, "node-active");
            },
        },
        {
            trigger_ss: ["node/开启 active 勾选"],
            priority_n: 999,
            run_f: (node) => {
                return (node.depth === 0 &&
                    !lib_node_tree_1.default.has(lib_node_tree_1.lib_node_tree_.extension_type.head, "node-active"));
            },
            callback_f: () => {
                lib_node_tree_1.default.add(lib_node_tree_1.lib_node_tree_.extension_type.head, "node-active", (data) => {
                    return lib_node_tree_1.default.node_as[0].uuid !== data.node.uuid;
                }, (data) => {
                    let class_name_div = document.createElement("ui-checkbox");
                    class_name_div.innerHTML = "";
                    class_name_div.addEventListener("confirm", (event) => {
                        Editor.Message.send("scene", "set-property", {
                            uuid: data.node.uuid,
                            path: "active",
                            dump: {
                                type: "Boolean",
                                value: !data.node.active,
                            },
                        });
                    });
                    return class_name_div;
                }, (data, element) => {
                    let active_b = data.node.active;
                    if (active_b) {
                        if (element.getAttribute("checked") === null) {
                            element.setAttribute("checked", "");
                        }
                    }
                    else if (!active_b) {
                        element.removeAttribute("checked");
                    }
                });
            },
        },
    ];
}
exports.default = new node_active();
