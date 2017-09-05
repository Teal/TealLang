"use strict";
/**
 * @fileOverview 包
 */
exports.__esModule = true;
/**
 * 表示一个包(即一个项目)。
 */
var Package = (function () {
    function Package() {
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每一项执行的回调函数。
     * * param value 当前项的值。
     * * param key 当前项的索引或键。
     * * param target 当前正在遍历的目标对象。
     * * returns 函数可以返回 false 以终止循环。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果循环是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    Package.prototype.each = function (callback, scope) {
        return this.sourceFiles.each(callback, scope);
    };
    /**
     * 遍历当前节点的所有直接和间接子节点，并对每一项执行 *callback*。
     * @param callback 对每一项执行的回调函数。
     * * param value 当前项的值。
     * * param key 当前项的索引或键。
     * * param target 当前正在遍历的目标对象。
     * * returns 函数可以返回 false 以终止循环。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果循环是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    Package.prototype.walk = function (callback, scope) {
        return this.sourceFiles.walk(callback, scope);
    };
    // #endregion
    // #region 转换
    /**
     * 对当前包进行转换。
     */
    Package.prototype.resolve = function (context) {
        if (context === void 0) { context = new ResolveContext(); }
    };
    return Package;
}());
exports.Package = Package;
