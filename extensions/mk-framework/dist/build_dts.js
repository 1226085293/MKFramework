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
    dts_file_s =
        `import global_config from "../../assets/@config/global_config"\n` +
            dts_file_s;
    // 禁止错误检查
    dts_file_s = "//@ts-nocheck\n" + dts_file_s;
    // @link 链接处理
    dts_file_s = dts_file_s.replace(/@link mk_/g, "@link ");
    // 格式化
    {
        let config_path_s = path_1.default.join(Editor.Project.path, ".prettierrc.json");
        let config = {
            filepath: "*.ts",
            parser: "typescript",
            tabWidth: 4,
        };
        const config_file_s = !fs_extra_1.default.existsSync(config_path_s)
            ? null
            : fs_extra_1.default.readFileSync(config_path_s, "utf-8");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRfZHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL2J1aWxkX2R0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4QixrRUFBMEM7QUFDMUMsd0RBQTBCO0FBQzFCLHdEQUFnQztBQUNoQyxrREFBMEI7QUFFWCxLQUFLO0lBQ25CLFlBQVk7SUFDWixNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRCx5QkFBeUI7SUFDekIsTUFBTSxhQUFhLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FDL0IsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FDOUMsQ0FBQztJQUNGLGtCQUFrQjtJQUNsQixNQUFNLGNBQWMsR0FBRyxlQUFLLENBQUMsSUFBSSxDQUNoQyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxzQkFBc0IsQ0FBQyxDQUNoRCxDQUFDO0lBQ0YsYUFBYTtJQUNiLE1BQU0sVUFBVSxHQUNmLGFBQWEsQ0FBQyxTQUFTLENBQUMscUJBQ3hCLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTVDLFFBQVE7SUFDUixNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxFQUFFO1FBQy9DLHVCQUFhLENBQUMsSUFBSSxDQUNqQixjQUFjLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLHNCQUFzQixDQUFDLEVBQUUsRUFDaEUsQ0FDQyxLQUF5QyxFQUN6QyxNQUFjLEVBQ2QsTUFBYyxFQUNiLEVBQUU7WUFDSCxJQUFJLEtBQUssRUFBRTtnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakI7aUJBQU07Z0JBQ04sU0FBUyxFQUFFLENBQUM7YUFDWjtRQUNGLENBQUMsQ0FDRCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxvQkFBb0I7SUFDcEIsa0JBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUIsVUFBVTtJQUNWLHVCQUFhLENBQUMsUUFBUSxDQUFDLDZDQUE2QyxFQUFFO1FBQ3JFLEdBQUcsRUFBRSxhQUFhO0tBQ2xCLENBQUMsQ0FBQztJQUVILFdBQVc7SUFDWCxJQUFJLFVBQVUsR0FBRyxrQkFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFdEQsV0FBVztJQUNYO1FBQ0MsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU3QyxVQUFVO1lBQ1QsVUFBVTtpQkFDUixLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztnQkFDbEIsb0JBQW9CO2lCQUNuQixPQUFPLENBQUMsa0NBQWtDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCwwQkFBMEI7Z0JBQzFCLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUN6QiwwQkFBMEIsQ0FBQztLQUM1QjtJQUVELGNBQWM7SUFDZCwyRkFBMkY7SUFFM0YsV0FBVztJQUNYLFVBQVU7UUFDVCxrRUFBa0U7WUFDbEUsVUFBVSxDQUFDO0lBQ1osU0FBUztJQUNULFVBQVUsR0FBRyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7SUFDNUMsYUFBYTtJQUNiLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV4RCxNQUFNO0lBQ047UUFDQyxJQUFJLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkUsSUFBSSxNQUFNLEdBQXFCO1lBQzlCLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLFFBQVEsRUFBRSxDQUFDO1NBQ1gsQ0FBQztRQUNGLE1BQU0sYUFBYSxHQUFHLENBQUMsa0JBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1lBQ2xELENBQUMsQ0FBQyxJQUFJO1lBQ04sQ0FBQyxDQUFDLGtCQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUzQyxJQUFJLGFBQWEsRUFBRTtZQUNsQixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsTUFBTSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7YUFDN0I7U0FDRDtRQUVELFVBQVUsR0FBRyxNQUFNLGtCQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN2RDtJQUVELE9BQU87SUFDUCxrQkFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDekMsU0FBUztJQUNULGtCQUFFLENBQUMsTUFBTSxDQUNSLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUN6RSxDQUFDO0FBQ0gsQ0FBQztBQW5HRCw0QkFtR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGNoaWxkX3Byb2Nlc3MgZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcbmltcG9ydCBwcmV0dGllciBmcm9tIFwicHJldHRpZXJcIjtcbmltcG9ydCBjanNvbiBmcm9tIFwiY2pzb25cIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKCk6IFByb21pc2U8dm9pZD4ge1xuXHQvKiog5o+S5Lu25qC555uu5b2VICovXG5cdGNvbnN0IHBsdWdpbl9wYXRoX3MgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uL1wiKTtcblx0LyoqIGFwaS1leHRyYWN0b3IuanNvbiAqL1xuXHRjb25zdCBhcGlfZXh0cmFjdG9yID0gY2pzb24ubG9hZChcblx0XHRwYXRoLmpvaW4ocGx1Z2luX3BhdGhfcywgXCJhcGktZXh0cmFjdG9yLmpzb25cIilcblx0KTtcblx0LyoqIOe8luivkSB0c2NvbmZpZyAqL1xuXHRjb25zdCBidWlsZF90c2NvbmZpZyA9IGNqc29uLmxvYWQoXG5cdFx0cGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXNzZXRzL3RzY29uZmlnLmpzb25cIilcblx0KTtcblx0LyoqIOWjsOaYjuaWh+S7tui3r+W+hCAqL1xuXHRjb25zdCBkdHNfcGF0aF9zID0gKFxuXHRcdGFwaV9leHRyYWN0b3IuZHRzUm9sbHVwLnB1YmxpY1RyaW1tZWRGaWxlUGF0aCBhcyBzdHJpbmdcblx0KS5yZXBsYWNlKFwiPHByb2plY3RGb2xkZXI+XCIsIHBsdWdpbl9wYXRoX3MpO1xuXG5cdC8vIOe8luivkSB0c1xuXHRhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZV9mLCByZWplY3RfZikgPT4ge1xuXHRcdGNoaWxkX3Byb2Nlc3MuZXhlYyhcblx0XHRcdGBucHggdHNjIC1wICR7cGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXNzZXRzL3RzY29uZmlnLmpzb25cIil9YCxcblx0XHRcdChcblx0XHRcdFx0ZXJyb3I6IGNoaWxkX3Byb2Nlc3MuRXhlY0V4Y2VwdGlvbiB8IG51bGwsXG5cdFx0XHRcdHN0ZG91dDogc3RyaW5nLFxuXHRcdFx0XHRzdGRlcnI6IHN0cmluZ1xuXHRcdFx0KSA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHJlamVjdF9mKHN0ZG91dCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZV9mKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHQpO1xuXHR9KTtcblxuXHQvLyDliKDpmaTnlJ/miJDnmoTlo7DmmI7mlofku7bvvIzlkKbliJnkvJrlvbHlk43nlJ/miJBcblx0ZnMucmVtb3ZlU3luYyhkdHNfcGF0aF9zKTtcblx0Ly8g55Sf5oiQIGQudHNcblx0Y2hpbGRfcHJvY2Vzcy5leGVjU3luYyhgbnB4IGFwaS1leHRyYWN0b3IgcnVuIC0tbG9jYWwgLS1kaWFnbm9zdGljc2AsIHtcblx0XHRjd2Q6IHBsdWdpbl9wYXRoX3MsXG5cdH0pO1xuXG5cdC8qKiDlo7DmmI7mlofku7YgKi9cblx0bGV0IGR0c19maWxlX3MgPSBmcy5yZWFkRmlsZVN5bmMoZHRzX3BhdGhfcywgXCJ1dGYtOFwiKTtcblxuXHQvLyDmt7vliqDpobbpg6jlkb3lkI3nqbrpl7Rcblx0e1xuXHRcdGNvbnN0IGluZGV4X24gPSBkdHNfZmlsZV9zLmluZGV4T2YoXCJleHBvcnRcIik7XG5cblx0XHRkdHNfZmlsZV9zID1cblx0XHRcdGR0c19maWxlX3Ncblx0XHRcdFx0LnNsaWNlKDAsIGluZGV4X24pXG5cdFx0XHRcdC8vIOaOkumZpOW8leeUqOeahOe7neWvuei3r+W+hCBjYy5kLnRzXG5cdFx0XHRcdC5yZXBsYWNlKC8oXFwvXFwvXFwvIDxyZWZlcmVuY2UpKFteXSs/KFxcLz4pKS9nLCBcIlwiKSArXG5cdFx0XHRcImRlY2xhcmUgbmFtZXNwYWNlIG1rIHtcXG5cIiArXG5cdFx0XHRkdHNfZmlsZV9zLnNsaWNlKGluZGV4X24pICtcblx0XHRcdFwiXFxufVxcbiBleHBvcnQgZGVmYXVsdCBtaztcIjtcblx0fVxuXG5cdC8vIC8vIOa3u+WKoOWFqOWxgOmFjee9ruW8leeUqFxuXHQvLyBkdHNfZmlsZV9zID0gJy8vLzxyZWZlcmVuY2UgcGF0aD1cIi4uL2Fzc2V0cy9AY29uZmlnL2dsb2JhbF9jb25maWcudHNcIi8+XFxuJyArIGR0c19maWxlX3M7XG5cblx0Ly8g5re75Yqg5YWo5bGA6YWN572u5byV55SoXG5cdGR0c19maWxlX3MgPVxuXHRcdGBpbXBvcnQgZ2xvYmFsX2NvbmZpZyBmcm9tIFwiLi4vLi4vYXNzZXRzL0Bjb25maWcvZ2xvYmFsX2NvbmZpZ1wiXFxuYCArXG5cdFx0ZHRzX2ZpbGVfcztcblx0Ly8g56aB5q2i6ZSZ6K+v5qOA5p+lXG5cdGR0c19maWxlX3MgPSBcIi8vQHRzLW5vY2hlY2tcXG5cIiArIGR0c19maWxlX3M7XG5cdC8vIEBsaW5rIOmTvuaOpeWkhOeQhlxuXHRkdHNfZmlsZV9zID0gZHRzX2ZpbGVfcy5yZXBsYWNlKC9AbGluayBta18vZywgXCJAbGluayBcIik7XG5cblx0Ly8g5qC85byP5YyWXG5cdHtcblx0XHRsZXQgY29uZmlnX3BhdGhfcyA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcIi5wcmV0dGllcnJjLmpzb25cIik7XG5cdFx0bGV0IGNvbmZpZzogcHJldHRpZXIuT3B0aW9ucyA9IHtcblx0XHRcdGZpbGVwYXRoOiBcIioudHNcIixcblx0XHRcdHBhcnNlcjogXCJ0eXBlc2NyaXB0XCIsXG5cdFx0XHR0YWJXaWR0aDogNCxcblx0XHR9O1xuXHRcdGNvbnN0IGNvbmZpZ19maWxlX3MgPSAhZnMuZXhpc3RzU3luYyhjb25maWdfcGF0aF9zKVxuXHRcdFx0PyBudWxsXG5cdFx0XHQ6IGZzLnJlYWRGaWxlU3luYyhjb25maWdfcGF0aF9zLCBcInV0Zi04XCIpO1xuXG5cdFx0aWYgKGNvbmZpZ19maWxlX3MpIHtcblx0XHRcdGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnX2ZpbGVfcyk7XG5cblx0XHRcdGlmICghY29uZmlnLnBhcnNlcikge1xuXHRcdFx0XHRjb25maWcucGFyc2VyID0gXCJ0eXBlc2NyaXB0XCI7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZHRzX2ZpbGVfcyA9IGF3YWl0IHByZXR0aWVyLmZvcm1hdChkdHNfZmlsZV9zLCBjb25maWcpO1xuXHR9XG5cblx0Ly8g5L+d5a2Y5paH5Lu2XG5cdGZzLndyaXRlRmlsZVN5bmMoZHRzX3BhdGhfcywgZHRzX2ZpbGVfcyk7XG5cdC8vIOa4heeQhuS4tOaXtuaWh+S7tlxuXHRmcy5yZW1vdmUoXG5cdFx0cGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXNzZXRzXCIsIGJ1aWxkX3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5vdXREaXIpXG5cdCk7XG59XG4iXX0=