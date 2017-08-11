/**
 * @fileOverview 包
 */

import * as nodes from '../ast/nodes';

/**
 * 表示一个包(即一个项目)。
 */
export class Package {

    // #region 节点

    /**
     * 获取所有模块列表。
     */
    sourceFiles: nodes.NodeList<nodes.SourceFile>;

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
    each(callback: (node: nodes.SourceFile, key: string, target: Package) => boolean | void, scope?: any) {
        return this.sourceFiles.each(callback, scope);
    }

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
    walk(callback: (node: nodes.Node, key: string | number, target: nodes.Node | nodes.NodeList<nodes.Node>) => boolean | void, scope?: any) {
        return this.sourceFiles.walk(callback, scope);
    }

    // #endregion

    // #region 转换

    /**
     * 对当前包进行转换。
     */
    resolve(context = new ResolveContext()) {

    }

    // #endregion

    // #region 生成

    // #endregion

}
