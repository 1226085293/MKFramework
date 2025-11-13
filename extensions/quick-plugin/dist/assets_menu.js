"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-restricted-imports */
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = __importDefault(require("child_process"));
const plugin_data_1 = __importDefault(require("./plugin_data"));
const plugin_config_1 = __importDefault(require("./plugin_config"));
//@ts-ignore
const super_menu_1 = __importDefault(require("./super_menu"));
const plugin_tool_1 = __importDefault(require("./plugin_tool"));
// 安装插件
Editor.Message.addBroadcastListener(`${plugin_config_1.default.package_name_s}-install_extension`, async (name_s_) => {
    const plugin = new plugin_data_1.default(name_s_);
    if (!fs_extra_1.default.existsSync(plugin.user_plugin_path_s)) {
        return;
    }
    await plugin.clear();
    plugin.show();
    await plugin.update();
});
// 快捷插件资源数据库
super_menu_1.default.delete(super_menu_1.default.type.asset, "", {
    run_f(asset) {
        return asset.url === `db://${plugin_config_1.default.package_name_s}`;
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "创建插件/单文件模板", {
    run_f(asset) {
        return asset.url === `db://${plugin_config_1.default.package_name_s}`;
    },
    async callback_f() {
        let name_s = "new-plugin";
        // 如果插件名被占用则更新
        if (fs_extra_1.default.existsSync(path_1.default.join(plugin_config_1.default.user_plugin_path_s, name_s))) {
            for (let k_n = 2;; ++k_n) {
                if (!fs_extra_1.default.existsSync(path_1.default.join(plugin_config_1.default.user_plugin_path_s, `${name_s}-${k_n}`))) {
                    name_s = `${name_s}-${k_n}`;
                    break;
                }
            }
        }
        // 解压插件模板
        plugin_tool_1.default.log("解压中...");
        await Editor.Utils.File.unzip(path_1.default.join(plugin_config_1.default.plugin_path_s, `res/quick-plugin-user-template-single-file.zip`), path_1.default.join(plugin_config_1.default.user_plugin_path_s, `${name_s}`));
        const plugin = new plugin_data_1.default(name_s);
        plugin.show();
        plugin.update();
        plugin_tool_1.default.log("创建完成");
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "创建插件/Vue 模板", {
    run_f(asset) {
        return asset.url === `db://${plugin_config_1.default.package_name_s}`;
    },
    async callback_f() {
        let name_s = "new-plugin";
        // 如果插件名被占用则更新
        if (fs_extra_1.default.existsSync(path_1.default.join(plugin_config_1.default.user_plugin_path_s, name_s))) {
            for (let k_n = 2;; ++k_n) {
                if (!fs_extra_1.default.existsSync(path_1.default.join(plugin_config_1.default.user_plugin_path_s, `${name_s}-${k_n}`))) {
                    name_s = `${name_s}-${k_n}`;
                    break;
                }
            }
        }
        // 解压插件模板
        plugin_tool_1.default.log("解压中...");
        await Editor.Utils.File.unzip(path_1.default.join(plugin_config_1.default.plugin_path_s, `res/quick-plugin-user-template.zip`), path_1.default.join(plugin_config_1.default.user_plugin_path_s, `${name_s}`));
        const plugin = new plugin_data_1.default(name_s);
        plugin.show();
        plugin.update();
        plugin_tool_1.default.log("创建完成");
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "更新列表", {
    run_f(asset) {
        return asset.url === `db://${plugin_config_1.default.package_name_s}`;
    },
    async callback_f() {
        const plugin_ss = fs_extra_1.default.readdirSync(plugin_config_1.default.user_plugin_path_s);
        // 清空插件列表
        fs_extra_1.default.emptyDirSync(path_1.default.join(plugin_config_1.default.plugin_path_s, "plugin"));
        // 创建插件列表文件
        plugin_ss.forEach((v_s) => {
            new plugin_data_1.default(v_s).show();
        });
        plugin_tool_1.default.log("更新完成");
    },
}, false);
let store_installing_b = false;
super_menu_1.default.update(super_menu_1.default.type.asset, "安装商店", {
    run_f(asset) {
        return (asset.url === `db://${plugin_config_1.default.package_name_s}` &&
            // 安装中
            !store_installing_b &&
            // 已安装
            !fs_extra_1.default.existsSync(new plugin_data_1.default("quick-store").user_plugin_path_s));
    },
    async callback_f() {
        store_installing_b = true;
        try {
            const plugin = new plugin_data_1.default("quick-store");
            await Editor.Utils.File.unzip(path_1.default.join(plugin_config_1.default.plugin_path_s, `res/${plugin.name_s}.zip`), plugin.user_plugin_path_s);
            await plugin.clear();
            await plugin.update();
            plugin.show();
            plugin_tool_1.default.log("安装完成");
        }
        catch (e) {
            plugin_tool_1.default.log("安装失败");
        }
        store_installing_b = false;
    },
}, false);
// 快捷插件右键菜单
super_menu_1.default.delete(super_menu_1.default.type.asset, "", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`);
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "编辑", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`);
    },
    async callback_f(asset) {
        child_process_1.default.exec(`code ${Editor.Project.path} -g ${path_1.default.join(new plugin_data_1.default(asset.name).user_plugin_path_s, "main.ts")}`);
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "加载", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`) && !new plugin_data_1.default(asset.name).loaded_b;
    },
    async callback_f(asset) {
        const success_b = await new plugin_data_1.default(asset.name).update();
        if (success_b) {
            plugin_tool_1.default.log("加载完成");
        }
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "更新", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`) && new plugin_data_1.default(asset.name).loaded_b;
    },
    async callback_f(asset) {
        const success_b = await new plugin_data_1.default(asset.name).update();
        if (success_b) {
            plugin_tool_1.default.log("更新完成");
        }
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "卸载", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`) && new plugin_data_1.default(asset.name).loaded_b;
    },
    callback_f(asset) {
        new plugin_data_1.default(asset.name).clear();
        plugin_tool_1.default.log("卸载完成");
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "删除", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`);
    },
    async callback_f(asset) {
        const asset_as = await Promise.all(Editor.Selection.getSelected("asset").map((v_s) => Editor.Message.request("asset-db", "query-asset-info", v_s)));
        const result = await Editor.Dialog.warn(`确定删除插件吗？\n${asset_as.map((v) => v.name).join("\n")}`, {
            buttons: ["确认", "取消"],
        });
        if (result.response !== 0) {
            plugin_tool_1.default.log("取消删除");
            return;
        }
        // 删除插件源码
        asset_as.forEach((v) => {
            new plugin_data_1.default(v.name).delete();
            plugin_tool_1.default.log(`删除插件 ${v.name} 成功`);
        });
    },
}, false);
super_menu_1.default.update(super_menu_1.default.type.asset, "输出独立包", {
    run_f(asset) {
        return asset.url.startsWith(`db://${plugin_config_1.default.package_name_s}/`);
    },
    async callback_f(asset) {
        const success_b = await new plugin_data_1.default(asset.name).build();
        if (success_b) {
            plugin_tool_1.default.log("输出独立包完成，插件位于 extensions 下");
        }
    },
}, false);
