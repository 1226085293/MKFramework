"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
delete require.cache[__dirname + "\\build_dts.js"];
delete require.cache[__dirname + "\\install.js"];
delete require.cache[__dirname + "\\help.js"];
const build_dts_1 = __importDefault(require("./build_dts"));
const help_1 = __importDefault(require("./help"));
const install_1 = __importDefault(require("./install"));
/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
exports.methods = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    async install() {
        console.log("安装开始...");
        await (0, install_1.default)();
        console.log("安装完成");
    },
    async build() {
        console.log("构建 d.ts...");
        await (0, build_dts_1.default)();
        console.log("构建 d.ts 完成");
    },
    help() {
        (0, help_1.default)();
    },
};
/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
function load() {
    // Editor.Message.send('{name}', 'hello');
}
exports.load = load;
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
function unload() { }
exports.unload = unload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztBQUNuRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxDQUFDO0FBQ2pELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLENBQUM7QUFDOUMsNERBQW9DO0FBQ3BDLGtEQUEwQjtBQUMxQix3REFBZ0M7QUFFaEM7OztHQUdHO0FBQ1UsUUFBQSxPQUFPLEdBQTRDO0lBQy9EOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkIsTUFBTSxJQUFBLGlCQUFPLEdBQUUsQ0FBQztRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBSztRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUIsTUFBTSxJQUFBLG1CQUFTLEdBQUUsQ0FBQztRQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxJQUFJO1FBQ0gsSUFBQSxjQUFJLEdBQUUsQ0FBQztJQUNSLENBQUM7Q0FDRCxDQUFDO0FBRUY7OztHQUdHO0FBQ0gsU0FBZ0IsSUFBSTtJQUNuQiwwQ0FBMEM7QUFDM0MsQ0FBQztBQUZELG9CQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsTUFBTSxLQUFJLENBQUM7QUFBM0Isd0JBQTJCIiwic291cmNlc0NvbnRlbnQiOlsiZGVsZXRlIHJlcXVpcmUuY2FjaGVbX19kaXJuYW1lICsgXCJcXFxcYnVpbGRfZHRzLmpzXCJdO1xuZGVsZXRlIHJlcXVpcmUuY2FjaGVbX19kaXJuYW1lICsgXCJcXFxcaW5zdGFsbC5qc1wiXTtcbmRlbGV0ZSByZXF1aXJlLmNhY2hlW19fZGlybmFtZSArIFwiXFxcXGhlbHAuanNcIl07XG5pbXBvcnQgYnVpbGRfZHRzIGZyb20gXCIuL2J1aWxkX2R0c1wiO1xuaW1wb3J0IGhlbHAgZnJvbSBcIi4vaGVscFwiO1xuaW1wb3J0IGluc3RhbGwgZnJvbSBcIi4vaW5zdGFsbFwiO1xuXG4vKipcbiAqIEBlbiBNZXRob2RzIHdpdGhpbiB0aGUgZXh0ZW5zaW9uIGNhbiBiZSB0cmlnZ2VyZWQgYnkgbWVzc2FnZVxuICogQHpoIOaJqeWxleWGheeahOaWueazle+8jOWPr+S7pemAmui/hyBtZXNzYWdlIOinpuWPkVxuICovXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xuXHQvKipcblx0ICogQGVuIEEgbWV0aG9kIHRoYXQgY2FuIGJlIHRyaWdnZXJlZCBieSBtZXNzYWdlXG5cdCAqIEB6aCDpgJrov4cgbWVzc2FnZSDop6blj5HnmoTmlrnms5Vcblx0ICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIHRvIGJlIHByaW50ZWRcblx0ICovXG5cdGFzeW5jIGluc3RhbGwoKSB7XG5cdFx0Y29uc29sZS5sb2coXCLlronoo4XlvIDlp4suLi5cIik7XG5cdFx0YXdhaXQgaW5zdGFsbCgpO1xuXHRcdGNvbnNvbGUubG9nKFwi5a6J6KOF5a6M5oiQXCIpO1xuXHR9LFxuXG5cdGFzeW5jIGJ1aWxkKCkge1xuXHRcdGNvbnNvbGUubG9nKFwi5p6E5bu6IGQudHMuLi5cIik7XG5cdFx0YXdhaXQgYnVpbGRfZHRzKCk7XG5cdFx0Y29uc29sZS5sb2coXCLmnoTlu7ogZC50cyDlrozmiJBcIik7XG5cdH0sXG5cblx0aGVscCgpIHtcblx0XHRoZWxwKCk7XG5cdH0sXG59O1xuXG4vKipcbiAqIEBlbiBUaGUgbWV0aG9kIGV4ZWN1dGVkIHdoZW4gdGhlIGV4dGVuc2lvbiBpcyBzdGFydGVkXG4gKiBAemgg5omp5bGV5ZCv5Yqo55qE5pe25YCZ5omn6KGM55qE5pa55rOVXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xuXHQvLyBFZGl0b3IuTWVzc2FnZS5zZW5kKCd7bmFtZX0nLCAnaGVsbG8nKTtcbn1cblxuLyoqXG4gKiBAZW4gTWV0aG9kIHRyaWdnZXJlZCB3aGVuIHVuaW5zdGFsbGluZyB0aGUgZXh0ZW5zaW9uXG4gKiBAemgg5Y246L295omp5bGV6Kem5Y+R55qE5pa55rOVXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7fVxuIl19