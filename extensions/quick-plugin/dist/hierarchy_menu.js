"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCreateMenu = onCreateMenu;
exports.onNodeMenu = onNodeMenu;
exports.onRootMenu = onRootMenu;
function onCreateMenu(assetInfo) {
    console.log("节点树 onCreateMenu", assetInfo);
    return [];
}
function onNodeMenu(assetInfo) {
    console.log("节点树 onNodeMenu", assetInfo);
    return [];
}
function onRootMenu(assetInfo) {
    console.log("节点树 onRootMenu", assetInfo);
    return [];
}
