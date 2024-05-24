"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const prettier_1 = __importDefault(require("prettier"));
const cjson_1 = __importDefault(require("cjson"));
async function default_1() {
    /** 插件根目录 */
    const plugin_path_s = path_1.default.join(__dirname, "../");
    /** api-extractor.json */
    const api_extractor = cjson_1.default.load(path_1.default.join(plugin_path_s, "api-extractor.json"));
    /** 编译 tsconfig */
    const build_tsconfig = cjson_1.default.load(path_1.default.join(plugin_path_s, "assets/tsconfig.json"));
    /** 声明文件路径 */
    const dts_path_s = api_extractor.dtsRollup.publicTrimmedFilePath.replace("<projectFolder>", plugin_path_s);
    // 编译 ts
    await new Promise((resolve_f, reject_f) => {
        child_process_1.default.exec(`npx tsc -p ${path_1.default.join(plugin_path_s, "assets/tsconfig.json")}`, (error, stdout, stderr) => {
            if (error) {
                console.error(stdout);
                reject_f(stdout);
            }
            else {
                resolve_f();
            }
        });
    });
    // 删除生成的声明文件，否则会影响生成
    fs_extra_1.default.removeSync(dts_path_s);
    // 生成 d.ts
    child_process_1.default.execSync(`npx api-extractor run --local --diagnostics`, {
        cwd: plugin_path_s,
    });
    /** 声明文件 */
    let dts_file_s = fs_extra_1.default.readFileSync(dts_path_s, "utf-8");
    // 添加顶部命名空间
    {
        const index_n = dts_file_s.indexOf("export");
        dts_file_s =
            dts_file_s
                .slice(0, index_n)
                // 排除引用的绝对路径 cc.d.ts
                .replace(/(\/\/\/ <reference)([^]+?(\/>))/g, "") +
                "declare namespace mk {\n" +
                dts_file_s.slice(index_n) +
                "\n}\n export default mk;";
    }
    // // 添加全局配置引用
    // dts_file_s = '///<reference path="../assets/@config/global_config.ts"/>\n' + dts_file_s;
    // 添加全局配置引用
    dts_file_s = `import global_config from "../../assets/@config/global_config"\n` + dts_file_s;
    // 禁止错误检查
    dts_file_s = "//@ts-nocheck\n" + dts_file_s;
    // @link 链接处理
    dts_file_s = dts_file_s.replace(/@link mk_/g, "@link ");
    // 格式化
    {
        const config_path_s = path_1.default.join(Editor.Project.path, ".prettierrc.json");
        let config = {
            filepath: "*.ts",
            parser: "typescript",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            tabWidth: 4,
        };
        const config_file_s = !fs_extra_1.default.existsSync(config_path_s) ? null : fs_extra_1.default.readFileSync(config_path_s, "utf-8");
        if (config_file_s) {
            config = JSON.parse(config_file_s);
            if (!config.parser) {
                config.parser = "typescript";
            }
        }
        dts_file_s = await prettier_1.default.format(dts_file_s, config);
    }
    // 保存文件
    fs_extra_1.default.writeFileSync(dts_path_s, dts_file_s);
    // 清理临时文件
    fs_extra_1.default.remove(path_1.default.join(plugin_path_s, "assets", build_tsconfig.compilerOptions.outDir));
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRfZHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL2J1aWxkX2R0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4QixrRUFBMEM7QUFDMUMsd0RBQTBCO0FBQzFCLHdEQUFnQztBQUNoQyxrREFBMEI7QUFFWCxLQUFLO0lBQ25CLFlBQVk7SUFDWixNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRCx5QkFBeUI7SUFDekIsTUFBTSxhQUFhLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDakYsa0JBQWtCO0lBQ2xCLE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLGFBQWE7SUFDYixNQUFNLFVBQVUsR0FBSSxhQUFhLENBQUMsU0FBUyxDQUFDLHFCQUFnQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUV2SCxRQUFRO0lBQ1IsTUFBTSxJQUFJLE9BQU8sQ0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMvQyx1QkFBYSxDQUFDLElBQUksQ0FDakIsY0FBYyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLEVBQ2hFLENBQUMsS0FBeUMsRUFBRSxNQUFjLEVBQUUsTUFBYyxFQUFFLEVBQUU7WUFDN0UsSUFBSSxLQUFLLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2pCO2lCQUFNO2dCQUNOLFNBQVMsRUFBRSxDQUFDO2FBQ1o7UUFDRixDQUFDLENBQ0QsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsb0JBQW9CO0lBQ3BCLGtCQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFCLFVBQVU7SUFDVix1QkFBYSxDQUFDLFFBQVEsQ0FBQyw2Q0FBNkMsRUFBRTtRQUNyRSxHQUFHLEVBQUUsYUFBYTtLQUNsQixDQUFDLENBQUM7SUFFSCxXQUFXO0lBQ1gsSUFBSSxVQUFVLEdBQUcsa0JBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXRELFdBQVc7SUFDWDtRQUNDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFN0MsVUFBVTtZQUNULFVBQVU7aUJBQ1IsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUM7Z0JBQ2xCLG9CQUFvQjtpQkFDbkIsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsMEJBQTBCO2dCQUMxQixVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDekIsMEJBQTBCLENBQUM7S0FDNUI7SUFFRCxjQUFjO0lBQ2QsMkZBQTJGO0lBRTNGLFdBQVc7SUFDWCxVQUFVLEdBQUcsa0VBQWtFLEdBQUcsVUFBVSxDQUFDO0lBRTdGLFNBQVM7SUFDVCxVQUFVLEdBQUcsaUJBQWlCLEdBQUcsVUFBVSxDQUFDO0lBQzVDLGFBQWE7SUFDYixVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFeEQsTUFBTTtJQUNOO1FBQ0MsTUFBTSxhQUFhLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBRXpFLElBQUksTUFBTSxHQUFxQjtZQUM5QixRQUFRLEVBQUUsTUFBTTtZQUNoQixNQUFNLEVBQUUsWUFBWTtZQUNwQixnRUFBZ0U7WUFDaEUsUUFBUSxFQUFFLENBQUM7U0FDWCxDQUFDO1FBRUYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxrQkFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFckcsSUFBSSxhQUFhLEVBQUU7WUFDbEIsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ25CLE1BQU0sQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO2FBQzdCO1NBQ0Q7UUFFRCxVQUFVLEdBQUcsTUFBTSxrQkFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDdkQ7SUFFRCxPQUFPO0lBQ1Asa0JBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3pDLFNBQVM7SUFDVCxrQkFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsY0FBYyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3RGLENBQUM7QUF4RkQsNEJBd0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBjaGlsZF9wcm9jZXNzIGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgcHJldHRpZXIgZnJvbSBcInByZXR0aWVyXCI7XG5pbXBvcnQgY2pzb24gZnJvbSBcImNqc29uXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uICgpOiBQcm9taXNlPHZvaWQ+IHtcblx0LyoqIOaPkuS7tuagueebruW9lSAqL1xuXHRjb25zdCBwbHVnaW5fcGF0aF9zID0gcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi9cIik7XG5cdC8qKiBhcGktZXh0cmFjdG9yLmpzb24gKi9cblx0Y29uc3QgYXBpX2V4dHJhY3RvciA9IGNqc29uLmxvYWQocGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXBpLWV4dHJhY3Rvci5qc29uXCIpKTtcblx0LyoqIOe8luivkSB0c2NvbmZpZyAqL1xuXHRjb25zdCBidWlsZF90c2NvbmZpZyA9IGNqc29uLmxvYWQocGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXNzZXRzL3RzY29uZmlnLmpzb25cIikpO1xuXHQvKiog5aOw5piO5paH5Lu26Lev5b6EICovXG5cdGNvbnN0IGR0c19wYXRoX3MgPSAoYXBpX2V4dHJhY3Rvci5kdHNSb2xsdXAucHVibGljVHJpbW1lZEZpbGVQYXRoIGFzIHN0cmluZykucmVwbGFjZShcIjxwcm9qZWN0Rm9sZGVyPlwiLCBwbHVnaW5fcGF0aF9zKTtcblxuXHQvLyDnvJbor5EgdHNcblx0YXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmVfZiwgcmVqZWN0X2YpID0+IHtcblx0XHRjaGlsZF9wcm9jZXNzLmV4ZWMoXG5cdFx0XHRgbnB4IHRzYyAtcCAke3BhdGguam9pbihwbHVnaW5fcGF0aF9zLCBcImFzc2V0cy90c2NvbmZpZy5qc29uXCIpfWAsXG5cdFx0XHQoZXJyb3I6IGNoaWxkX3Byb2Nlc3MuRXhlY0V4Y2VwdGlvbiB8IG51bGwsIHN0ZG91dDogc3RyaW5nLCBzdGRlcnI6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKHN0ZG91dCk7XG5cdFx0XHRcdFx0cmVqZWN0X2Yoc3Rkb3V0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXNvbHZlX2YoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdCk7XG5cdH0pO1xuXG5cdC8vIOWIoOmZpOeUn+aIkOeahOWjsOaYjuaWh+S7tu+8jOWQpuWImeS8muW9seWTjeeUn+aIkFxuXHRmcy5yZW1vdmVTeW5jKGR0c19wYXRoX3MpO1xuXHQvLyDnlJ/miJAgZC50c1xuXHRjaGlsZF9wcm9jZXNzLmV4ZWNTeW5jKGBucHggYXBpLWV4dHJhY3RvciBydW4gLS1sb2NhbCAtLWRpYWdub3N0aWNzYCwge1xuXHRcdGN3ZDogcGx1Z2luX3BhdGhfcyxcblx0fSk7XG5cblx0LyoqIOWjsOaYjuaWh+S7tiAqL1xuXHRsZXQgZHRzX2ZpbGVfcyA9IGZzLnJlYWRGaWxlU3luYyhkdHNfcGF0aF9zLCBcInV0Zi04XCIpO1xuXG5cdC8vIOa3u+WKoOmhtumDqOWRveWQjeepuumXtFxuXHR7XG5cdFx0Y29uc3QgaW5kZXhfbiA9IGR0c19maWxlX3MuaW5kZXhPZihcImV4cG9ydFwiKTtcblxuXHRcdGR0c19maWxlX3MgPVxuXHRcdFx0ZHRzX2ZpbGVfc1xuXHRcdFx0XHQuc2xpY2UoMCwgaW5kZXhfbilcblx0XHRcdFx0Ly8g5o6S6Zmk5byV55So55qE57ud5a+56Lev5b6EIGNjLmQudHNcblx0XHRcdFx0LnJlcGxhY2UoLyhcXC9cXC9cXC8gPHJlZmVyZW5jZSkoW15dKz8oXFwvPikpL2csIFwiXCIpICtcblx0XHRcdFwiZGVjbGFyZSBuYW1lc3BhY2UgbWsge1xcblwiICtcblx0XHRcdGR0c19maWxlX3Muc2xpY2UoaW5kZXhfbikgK1xuXHRcdFx0XCJcXG59XFxuIGV4cG9ydCBkZWZhdWx0IG1rO1wiO1xuXHR9XG5cblx0Ly8gLy8g5re75Yqg5YWo5bGA6YWN572u5byV55SoXG5cdC8vIGR0c19maWxlX3MgPSAnLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi4vYXNzZXRzL0Bjb25maWcvZ2xvYmFsX2NvbmZpZy50c1wiLz5cXG4nICsgZHRzX2ZpbGVfcztcblxuXHQvLyDmt7vliqDlhajlsYDphY3nva7lvJXnlKhcblx0ZHRzX2ZpbGVfcyA9IGBpbXBvcnQgZ2xvYmFsX2NvbmZpZyBmcm9tIFwiLi4vLi4vYXNzZXRzL0Bjb25maWcvZ2xvYmFsX2NvbmZpZ1wiXFxuYCArIGR0c19maWxlX3M7XG5cblx0Ly8g56aB5q2i6ZSZ6K+v5qOA5p+lXG5cdGR0c19maWxlX3MgPSBcIi8vQHRzLW5vY2hlY2tcXG5cIiArIGR0c19maWxlX3M7XG5cdC8vIEBsaW5rIOmTvuaOpeWkhOeQhlxuXHRkdHNfZmlsZV9zID0gZHRzX2ZpbGVfcy5yZXBsYWNlKC9AbGluayBta18vZywgXCJAbGluayBcIik7XG5cblx0Ly8g5qC85byP5YyWXG5cdHtcblx0XHRjb25zdCBjb25maWdfcGF0aF9zID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiLnByZXR0aWVycmMuanNvblwiKTtcblxuXHRcdGxldCBjb25maWc6IHByZXR0aWVyLk9wdGlvbnMgPSB7XG5cdFx0XHRmaWxlcGF0aDogXCIqLnRzXCIsXG5cdFx0XHRwYXJzZXI6IFwidHlwZXNjcmlwdFwiLFxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuXHRcdFx0dGFiV2lkdGg6IDQsXG5cdFx0fTtcblxuXHRcdGNvbnN0IGNvbmZpZ19maWxlX3MgPSAhZnMuZXhpc3RzU3luYyhjb25maWdfcGF0aF9zKSA/IG51bGwgOiBmcy5yZWFkRmlsZVN5bmMoY29uZmlnX3BhdGhfcywgXCJ1dGYtOFwiKTtcblxuXHRcdGlmIChjb25maWdfZmlsZV9zKSB7XG5cdFx0XHRjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ19maWxlX3MpO1xuXG5cdFx0XHRpZiAoIWNvbmZpZy5wYXJzZXIpIHtcblx0XHRcdFx0Y29uZmlnLnBhcnNlciA9IFwidHlwZXNjcmlwdFwiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGR0c19maWxlX3MgPSBhd2FpdCBwcmV0dGllci5mb3JtYXQoZHRzX2ZpbGVfcywgY29uZmlnKTtcblx0fVxuXG5cdC8vIOS/neWtmOaWh+S7tlxuXHRmcy53cml0ZUZpbGVTeW5jKGR0c19wYXRoX3MsIGR0c19maWxlX3MpO1xuXHQvLyDmuIXnkIbkuLTml7bmlofku7Zcblx0ZnMucmVtb3ZlKHBhdGguam9pbihwbHVnaW5fcGF0aF9zLCBcImFzc2V0c1wiLCBidWlsZF90c2NvbmZpZy5jb21waWxlck9wdGlvbnMub3V0RGlyKSk7XG59XG4iXX0=