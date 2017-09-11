/**
 * @fileOverview 语法树节点
 * @generated 此文件部分使用 `$ tpack gen-nodes` 命令生成。
 */

import {TokenType, tokenToString} from './tokenType';
import {TextRange} from './textRange';
import {NodeVisitor} from './nodeVisitor';
import {intern} from '../compiler/compiler';

// #region 节点

/**
 * 表示一个语法树节点。
 */
abstract class Node implements TextRange {

    /**
     * 获取当前节点的开始位置。
     */
    start: number;

    /**
     * 获取当前节点的结束位置。
     */
    end: number;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    abstract accept(vistior: NodeVisitor);

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return true;
    }

    /**
     * 遍历当前节点的所有直接和间接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    walk(callback: EachCallback, scope?: any) {
        return this.each(function (childNode: Node) {
            return callback.apply(this, arguments) !== false &&
                childNode.walk(callback, scope);
        }, scope);
    }

}

/**
 * 表示遍历子节点时的回调函数。
 * @param node 当前节点。
 * @param key 当前节点的索引或键。
 * @param target 当前正在遍历的目标节点或所在列表。
 * @returns 函数如果返回 false 则表示终止遍历。
 */
type EachCallback = (node: Node, key: string | number, target: Node | NodeList<Node>) => boolean | void;

/**
 * 表示一个节点列表(<..., ...>。
 */
class NodeList<T extends Node> extends Array<T> implements TextRange {

    /**
     * 获取当前节点列表开始标记的位置(可能不存在)。
     */
    start: number;

    /**
     * 获取当前节点列表结束标记的位置(可能不存在)。
     */
    end: number;

    /**
     * 获取当前节点列表所有分割符(如逗号)的位置(可能不存在)。
     */
    commaTokens: number[];

    /**
     * 判断当前列表是否包含尾随的分隔符（如判断数组定义中的最后一项是否是逗号）。
     */
    get hasTrailingSeperator() { return this.commaTokens.length === this.length; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNodeList(this);
    }

    /**
     * 遍历当前节点列表，并对每一项执行 *callback*。
     * @param callback 对每个节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: (node: T, key, target) => boolean | void, scope?: any) {
        for (let i = 0; i < this.length; i++) {
            if (callback.call(scope, this[i], i, this) === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * 遍历当前节点列表及节点的直接和间接子节点，并对每一项执行 *callback*。
     * @param callback 对每个节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    walk(callback: EachCallback, scope?: any) {
        return this.each(function (childNode: Node) {
            return callback.apply(this, arguments) !== false &&
                childNode.walk(callback, scope);
        }, scope);
    }

}

// #endregion

// #region 语句

/**
 * 表示一个语句块(`{...}`)。
 */
class BlockStatement extends Statement {

    /**
     * 获取当前语句块内的所有语句。
     */
    statements: NodeList<Statement>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitBlockStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.statements.each(callback, scope);
    }

}

/**
 * 表示一个变量声明语句(`var xx、let xx、const xx`)。
 */
class VariableStatement extends Statement {

    /**
     * 获取当前变量声明的类型。合法的值有：var、let、const。
     */
    type: TokenType;

    /**
     * 获取当前变量声明语句的所有变量。
     */
    variables: NodeList<VariableDeclaration>;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.variables[this.variables.length - 1].end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitVariableStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.variables.each(callback, scope);
    }

}

/**
 * 表示一个变量声明(`x = 1、[x] = [1]、{a: x} = {a: 1}`)。
 */
class VariableDeclaration extends Node {

    /**
     * 获取当前声明的名字部分。
     */
    name: BindingName;

    /**
     * 获取当前名字后冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前变量定义的类型(可能不存在)。
     */
    type: Expression;

    /**
     * 获取当前变量名后等号的位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前变量的初始值(可能不存在)。
     */
    initializer: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.name.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.initializer ? this.initializer.end : this.type ? this.type.end : this.name.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitVariableDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    }

}

/**
 * 表示一个标签语句(`xx: ...`)。
 */
class LabeledStatement extends Statement {

    /**
     * 获取当前标签语句的标签部分。
     */
    label: Identifier;

    /**
     * 获取当前标签名后冒号的位置。
     */
    colonToken: number;

    /**
     * 获取当前标签语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.label.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitLabeledStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.label, "label", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个表达式语句(x(`);`)。
 */
class ExpressionStatement extends Statement {

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.body.start; }

    /**
     * 获取当前表达式语句的主体部分。
     */
    body: Expression;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitExpressionStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 if 语句(if(`xx) ...`)。
 */
class IfStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 if 语句的条件部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 if 语句的则部分。
     */
    then: Statement;

    /**
     * 获取关键字 else 语句的位置(可能不存在)。
     */
    elseToken: number;

    /**
     * 获取当前 if 语句的否则部分(可能不存在)。
     */
    else: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.else || this.then).end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitIfStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.then, "then", this) !== false &&
            (!this.else || callback.call(scope, this.else, "else", this) !== false);
    }

}

/**
 * 表示一个 switch 语句(switch(`xx){...}`)。
 */
class SwitchStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 switch 语句的条件部分(可能不存在)。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 switch 语句的所有分支。
     */
    cases: NodeList<CaseClause>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.cases.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitSwitchStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.condition || callback.call(scope, this.condition, "condition", this) !== false) &&
            this.cases.each(callback, scope);
    }

}

/**
 * 表示一个 case 分支(`case ...:{...}`)。
 */
class CaseClause extends Node {

    /**
     * 获取当前分支的标签部分(可能不存在)。
     */
    label: Expression;

    /**
     * 获取当前标签名后 else 的位置。
     */
    elseToken: number;

    /**
     * 获取当前标签名后冒号的位置。
     */
    colonToken: number;

    /**
     * 获取当前分支的所有语句。
     */
    statements: NodeList<Statement>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.statements.length ? this.statements[this.statements.length - 1].end : this.colonToken; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitCaseClause(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false) &&
            this.statements.each(callback, scope);
    }

}

/**
 * 表示一个 for 语句(for(`var i = 0; i < 9; i++) ...`)。
 */
class ForStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 for 语句的初始化部分(可能不存在)。
     */
    initializer: VariableStatement | Expression;

    /**
     * 获取条件部分中首个分号的位置。
     */
    firstSemicolonToken: number;

    /**
     * 获取当前 for 语句的条件部分(可能不存在)。
     */
    condition: Expression;

    /**
     * 获取条件部分中第二个分号的位置。
     */
    secondSemicolonToken: number;

    /**
     * 获取当前 for 语句的迭代器部分(可能不存在)。
     */
    iterator: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanTokenToken: number;

    /**
     * 获取当前 for 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitForStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false) &&
            (!this.condition || callback.call(scope, this.condition, "condition", this) !== false) &&
            (!this.iterator || callback.call(scope, this.iterator, "iterator", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 for..in 语句(for(`var x in y) ...`)。
 */
class ForInStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 for..in 语句的初始化部分。
     */
    initializer: VariableStatement | Expression;

    /**
     * 获取关键字 in 的位置。
     */
    inToken: number;

    /**
     * 获取当前 for..in 语句的迭代部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 for..in 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitForInStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.initializer, "initializer", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 for..of 语句(for(`var x of y) ...`)。
 */
class ForOfStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 for..of 语句的初始化部分。
     */
    initializer: VariableStatement | Expression;

    /**
     * 获取关键字 of 的位置。
     */
    ofToken: number;

    /**
     * 获取当前 for..of 语句的迭代部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 for..of 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitForOfStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.initializer, "initializer", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 for..to 语句(for(`var x = 0 to 10) ...`)。
 */
class ForToStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 for..to 语句的初始化部分(可能不存在)。
     */
    initializer: VariableStatement | Expression;

    /**
     * 获取关键字 to 的位置。
     */
    toToken: number;

    /**
     * 获取当前 for..to 语句的迭代部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 for..of 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitForToStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false) &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 while 语句(while(`...) ...`)。
 */
class WhileStatement extends Statement {

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 while 语句的条件部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 获取当前 while 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitWhileStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 do..while 语句(do ... while(`xx);`)。
 */
class DoWhileStatement extends Statement {

    /**
     * 获取当前 do..while 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取 while 关键字的位置。
     */
    whileToken: number;

    /**
     * 获取当前开括号位置(可能不存在)。
     */
    openParanToken: number;

    /**
     * 获取当前 do..while 语句的条件部分。
     */
    condition: Expression;

    /**
     * 获取当前闭括号位置(可能不存在)。
     */
    closeParanToken: number;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.condition.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitDoWhileStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false;
    }

}

/**
 * 表示一个 continue 语句(`continue xx;`)。
 */
class ContinueStatement extends Statement {

    /**
     * 获取当前 continue 语句的标签部分(可能不存在)。
     */
    label: Identifier;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.start + 8/*'continue'.length*/; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitContinueStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false);
    }

}

/**
 * 表示一个 break 语句(`break xx;`)。
 */
class BreakStatement extends Statement {

    /**
     * 获取当前 break 语句的标签部分(可能不存在)。
     */
    label: Identifier;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.start + 5/*'break'.length*/; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitBreakStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false);
    }

}

/**
 * 表示一个 return 语句(`return xx;`)。
 */
class ReturnStatement extends Statement {

    /**
     * 获取当前 return 语句的返回值部分(可能不存在)。
     */
    value: Expression;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > (this.value ? this.value.end : this.start + 6/*'return'.length*/); }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitReturnStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.value || callback.call(scope, this.value, "value", this) !== false);
    }

}

/**
 * 表示一个 throw 语句(`throw xx;`)。
 */
class ThrowStatement extends Statement {

    /**
     * 获取当前 throw 语句的参数部分。
     */
    value: Expression;

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.value.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitThrowStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.value, "value", this) !== false;
    }

}

/**
 * 表示一个 try 语句(try {...} catch(`e) {...}`)。
 */
class TryStatement extends Statement {

    /**
     * 获取当前 try 语句的 try 部分。
     */
    try: Statement;

    /**
     * 获取当前 try 语句的 catch 部分(可能不存在)。
     */
    catch: CatchClause;

    /**
     * 获取当前 try 语句的 finally 部分(可能不存在)。
     */
    finally: FinallyClause;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.finally || this.catch).end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTryStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.try, "try", this) !== false &&
            (!this.catch || callback.call(scope, this.catch, "catch", this) !== false) &&
            (!this.finally || callback.call(scope, this.finally, "finally", this) !== false);
    }

}

/**
 * 表示一个 catch 分句(catch(`e) {...}`)。
 */
class CatchClause extends Node {

    /**
     * 获取异常变量的开括号的位置。
     */
    openParanToken: number;

    /**
     * 获取当前 catch 分句的变量名(可能不存在)。
     */
    variable: BindingName;

    /**
     * 获取异常变量的闭括号的位置。
     */
    closeParanToken: number;

    /**
     * 获取当前 catch 分句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitCatchClause(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 finally 分句(`finally {...}`)。
 */
class FinallyClause extends Node {

    /**
     * 获取当前 finally 分句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitFinallyClause(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个 debugger 语句(`debugger;`)。
 */
class DebuggerStatement extends Statement {

    /**
     * 判断当前语句末尾是否包含分号。
     */
    get hasSemicolon() { return this.end > this.start + 8/*'debugger'.length*/; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitDebuggerStatement(this);
    }

}

/**
 * 表示一个 with 语句(with(`xx) ...`)。
 */
class WithStatement extends Statement {

    /**
     * 获取异常变量的开括号的位置。
     */
    openParanToken: number;

    /**
     * 获取当前的 with 语句的值部分。
     */
    value: Expression | VariableStatement;

    /**
     * 获取异常变量的闭括号的位置。
     */
    closeParanToken: number;

    /**
     * 获取当前的 with 语句的主体部分。
     */
    body: Statement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitWithStatement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.value, "value", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

// #endregion

// #region 声明

/**
 * 表示一个声明(function fn(`) {...}、class T { ... }、...`)。
 */
abstract class Declaration extends Statement {

    /**
     * 获取当前声明的所有修饰器(可能不存在)。
     */
    decorators: NodeList<Decorator>;

    /**
     * 获取当前声明的所有修饰符(可能不存在)。
     */
    modifiers: NodeList<Modifier>;

    /**
     * 获取当前声明的名字部分。
     */
    name: Identifier;

    /**
     * 获取当前声明的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

}

/**
 * 表示一个修饰器(`@xx`)。
 */
class Decorator extends Node {

    /**
     * 获取当前修饰器的主体部分。
     */
    body: Expression;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitDecorator(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个修饰符(`static、private、...`)。
 */
class Modifier extends Node {

    /**
     * 获取当前修饰符的类型。合法的值有：static、abstract、public、protected、private、...。
     */
    type: TokenType;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.start + tokenToString(this.type).length; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitModifier(this);
    }

}

/**
 * 表示一个类型参数声明(`T、T extends R`)。
 */
class TypeParametersDeclaration extends Node {

    /**
     * 获取当前类型参数的名字部分。
     */
    name: Identifier;

    /**
     * 获取 extends 关键字的位置(可能不存在)。
     */
    extendsToken: number;

    /**
     * 获取当前类型参数的继承部分(可能不存在)。
     */
    extends: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTypeParametersDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.name, "name", this) !== false &&
            (!this.extends || callback.call(scope, this.extends, "extends", this) !== false);
    }

}

/**
 * 表示一个函数声明(function fn() {...}、function * fn(`){...}`)。
 */
class FunctionDeclaration extends Declaration {

    /**
     * 获取 function 关键字的位置。
     */
    functionToken: number;

    /**
     * 获取当前函数名前星号的位置(可能不存在)。
     */
    asteriskToken: number;

    /**
     * 获取当前函数的所有参数。
     */
    parameters: NodeList<ParameterDeclaration>;

    /**
     * 获取当前函数返回类型前冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前函数的返回类型(可能不存在)。
     */
    returnType: Expression;

    /**
     * 获取当前函数的主体(可能不存在)。
     */
    body: ArrowExpression | BlockStatement;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.decorators && this.decorators.length ? this.decorators[0].start : this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.functionToken; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitFunctionDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            this.parameters.each(callback, scope) &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            (!this.body || callback.call(scope, this.body, "body", this) !== false);
    }

}

/**
 * 表示一个函数表达式(function (`) {}`)。
 */
class FunctionExpression extends Expression {

    /**
     * 获取当前星号的位置(可能不存在)。
     */
    asteriskToken: number;

    /**
     * 获取当前函数的名字(可能不存在)。
     */
    name: Identifier;

    /**
     * 获取成员的类型参数。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取当前函数定义的参数列表。
     */
    parameters: NodeList<ParameterDeclaration>;

    /**
     * 获取当前返回类型前冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前函数声明的返回类型(可能不存在)。
     */
    returnType: TypeNode;

    /**
     * 获取当前函数定义的主体。
     */
    body: ArrowExpression | BlockStatement;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitFunctionExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            this.typeParameters.each(callback, scope) &&
            this.parameters.each(callback, scope) &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个箭头函数表达式(`x => y`)。
 */
class ArrowFunctionExpression extends Expression {

    /**
     * 获取当前箭头函数的所有修饰符(可能不存在)。
     */
    modifiers: NodeList<Modifier>;

    /**
     * 获取当前箭头函数的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取当前箭头函数的所有参数(可能不存在)。
     */
    parameters: NodeList<ParameterDeclaration> | Identifier;

    /**
     * 获取当前返回类型前冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前函数声明的返回类型(可能不存在)。
     */
    returnType: TypeNode;

    /**
     * 获取当前表达式的箭头位置。
     */
    arrowToken: number;

    /**
     * 获取当前箭头函数的主体部分。
     */
    body: BlockStatement | Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.modifiers ? this.modifiers.start : this.parameters ? this.parameters.start : this.arrowToken; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.body.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrowFunctionExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.typeParameters.each(callback, scope) &&
            this.parameters.each(callback, scope) &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个参数声明(`x、x = 1、...x`)。
 */
class ParameterDeclaration extends Node {

    /**
     * 获取当前参数声明的所有修饰符(可能不存在)。
     */
    modifiers: NodeList<Modifier>;

    /**
     * 获取当前参数声明的名字部分。
     */
    name: BindingName;

    /**
     * 获取当前变量名后问号的位置(可能不存在)。
     */
    questionToken: number;

    /**
     * 获取当前名字后冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前声明的类型(可能不存在)。
     */
    type: Expression;

    /**
     * 获取当前变量名后等号的位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前声明的默认值(可能不存在)。
     */
    initializer: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.name.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.initializer ? this.initializer.end : this.type ? this.type.end : this.questionToken != undefined ? this.questionToken : this.name.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitParameterDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    }

}

/**
 * 表示一个类声明(`class T {...}`)。
 */
class ClassDeclaration extends Declaration {

    /**
     * 获取 class 关键字的位置。
     */
    classToken: number;

    /**
     * 获取 extends 关键字的位置(可能不存在)。
     */
    extendsToken: number;

    /**
     * 获取当前类的基类(可能不存在)。
     */
    extends: Expression;

    /**
     * 获取 implements 关键字的位置(可能不存在)。
     */
    implementsToken: number;

    /**
     * 获取当前类的所有实现接口(可能不存在)。
     */
    implements: NodeList<Expression>;

    /**
     * 获取当前类的所有成员(可能不存在)。
     */
    members: NodeList<TypeMemberDeclaration>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.decorators && this.decorators.length ? this.decorators[0].start : this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.classToken; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitClassDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.extends || callback.call(scope, this.extends, "extends", this) !== false) &&
            (!this.implements || this.implements.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个类表达式(`class xx {}`)。
 */
class ClassExpression extends Expression {

    /**
     * 获取当前类的名字部分(可能不存在)。
     */
    name: Identifier;

    /**
     * 获取当前类表达式的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取 extends 关键字的位置(可能不存在)。
     */
    extendsToken: number;

    /**
     * 获取当前类的基类(可能不存在)。
     */
    extends: Expression;

    /**
     * 获取 implements 关键字的位置(可能不存在)。
     */
    implementsToken: number;

    /**
     * 获取当前类的所有实现接口(可能不存在)。
     */
    implements: NodeList<Expression>;

    /**
     * 获取当前容器内的所有成员(可能不存在)。
     */
    members: NodeList<TypeMemberDeclaration>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.members.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitClassExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.extends || callback.call(scope, this.extends, "extends", this) !== false) &&
            (!this.implements || this.implements.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个类型成员声明(x: 1、x() {}、get x(){}、set x(`value){}`)。
 */
abstract class TypeMemberDeclaration extends Node {

    /**
     * 获取当前声明的所有修饰器(可能不存在)。
     */
    decorators: NodeList<Decorator>;

    /**
     * 获取当前声明的所有修饰符(可能不存在)。
     */
    modifiers: NodeList<Modifier>;

}

/**
 * 表示一个属性声明(`x: 1`)。
 */
class PropertyDeclaration extends TypeMemberDeclaration {

    /**
     * 获取当前属性的名字部分。
     */
    name: PropertyName;

    /**
     * 获取当前名字后冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前属性的类型部分(可能不存在)。
     */
    type: Expression;

    /**
     * 获取当前名字后等号的位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前属性的值部分(可能不存在)。
     */
    value: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.decorators ? this.decorators.start : this.modifiers ? this.modifiers.start : this.name.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.value || this.type || this.name).end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitPropertyDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.value || callback.call(scope, this.value, "value", this) !== false);
    }

}

/**
 * 表示一个访问器声明(get fn() {...}、set fn(`) {...}`)。
 */
class AccessorDeclaration extends MethodDeclaration {

    /**
     * 获取 get 关键字的位置(可能不存在)。
     */
    getToken: number;

    /**
     * 获取 set 关键字的位置(可能不存在)。
     */
    setToken: number;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.getToken != undefined ? this.getToken : this.setToken; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitAccessorDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            this.parameters.each(callback, scope) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个接口声明(`interface T {...}`)。
 */
class InterfaceDeclaration extends Declaration {

    /**
     * 获取当前接口的所有基接口(可能不存在)。
     */
    extends: NodeList<Expression>;

    /**
     * 获取当前接口的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取当前接口的所有成员(可能不存在)。
     */
    members: NodeList<TypeMemberDeclaration>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.members.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitInterfaceDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.extends || this.extends.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个接口表达式(`interface xx {}`)。
 */
class InterfaceExpression extends Expression {

    /**
     * 获取当前接口的名字(可能不存在)。
     */
    name: Identifier;

    /**
     * 获取当前类型的继承列表(可能不存在)。
     */
    extends: NodeList<Expression>;

    /**
     * 获取当前类型定义的类型参数列表(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取当前容器内的所有成员(可能不存在)。
     */
    members: NodeList<TypeMemberDeclaration>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitInterfaceExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this.extends || this.extends.each(callback, scope)) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个枚举声明(`enum T {}`)。
 */
class EnumDeclaration extends Declaration {

    /**
     * 获取当前枚举的所有成员(可能不存在)。
     */
    members: NodeList<EnumMemberDeclaration>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.members.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitEnumDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个枚举表达式(`enum xx {}`)。
 */
class EnumExpression extends Expression {

    /**
     * 获取当前枚举的名字(可能不存在)。
     */
    name: Identifier;

    /**
     * 获取当前容器内的所有成员(可能不存在)。
     */
    members: NodeList<EnumMemberDeclaration>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitEnumExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this.members || this.members.each(callback, scope));
    }

}

/**
 * 表示一个枚举成员声明(`xx = 1`)。
 */
class EnumMemberDeclaration extends Declaration {

    /**
     * 获取当前枚举成员名后的等号位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前枚举成员的初始值(可能不存在)。
     */
    initializer: Expression;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.initializer || this.name).end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitEnumMemberDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    }

}

/**
 * 表示一个命名空间声明(`namespace abc {...}、module abc {...}`)。
 */
class NamespaceDeclaration extends Node {

    /**
     * 获取当前命名空间定义的类型。合法的值有：namespace、module。
     */
    type: TokenType;

    /**
     * 获取当前命名空间的所有名称。
     */
    names: NodeList<Identifier>;

    /**
     * 获取当前命名空间内的所有语句。
     */
    members: NodeList<Statement>;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.members.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNamespaceDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.names.each(callback, scope) &&
            this.members.each(callback, scope);
    }

}

/**
 * 表示一个 import 声明(`import xx from '...';`)。
 */
class ImportDeclaration extends Statement {

    /**
     * 获取当前导入的元素列表。
     */
    elements: NodeList<NameImportClause | NamespaceImportClause>;

    /**
     * 获取当前导入声明的 from 位置(可能不存在)。
     */
    fromToken: number;

    /**
     * 获取当前导入项的值部分。
     */
    target: StringLiteral;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitImportDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope) &&
            callback.call(scope, this.target, "target", this) !== false;
    }

}

/**
 * 表示一个 import = 指令(import xx = require(`"");`)。
 */
class ImportAliasDeclaration extends Statement {

    /**
     * 获取当前导入的元素列表。
     */
    variable: BindingName;

    /**
     * 获取当前导入声明的等号位置。
     */
    equalToken: number;

    /**
     * 获取当前导入项的值部分。
     */
    value: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitImportAliasDeclaration(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.value, "value", this) !== false;
    }

}

/**
 * 表示一个名字导入声明项(`a as b`)。
 */
class NameImportClause extends Node {

    /**
     * 获取当前导入的名称(可能不存在)。
     */
    name: Identifier;

    /**
     * 获取当前导入声明的 as 位置(可能不存在)。
     */
    asToken: number;

    /**
     * 获取当前导入的别名。
     */
    alias: Identifier;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            callback.call(scope, this.alias, "alias", this) !== false;
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNameImportClause(this);
    }
}

/**
 * 表示一个命名空间导入声明项(`{a as b}`)。
 */
class NamespaceImportClause extends Node {

    /**
     * 获取当前的所有导入项。
     */
    elements: NodeList<NameImportClause>;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope);
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNamespaceImportClause(this);
    }

}

/**
 * 表示一个 指令(`xx from '...';`)。
 */
class ExportDirective extends Statement {

    /**
     * 获取当前导入的元素列表。
     */
    elements: NodeList<NameImportClause | NamespaceImportClause>;

    /**
     * 支持多个对象组成一个单链表。
     */
    target: StringLiteral;

    /**
     * 获取当前导入声明的 from 位置(可能不存在)。
     */
    fromToken: number;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitExportDirective(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope) &&
            callback.call(scope, this.target, "target", this) !== false;
    }

}

/**
 * 表示一个 = 指令(`= 1;`)。
 */
class ExportEqualsDirective extends Statement {

    /**
     * 获取当前导入声明的等号位置。
     */
    equalToken: number;

    /**
     * 获取当前导出项的值部分。
     */
    value: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitExportEqualsDirective(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.value, "value", this) !== false;
    }

}

// #endregion

// #region 表达式

/**
 * 表示一个空表达式。
 */
class EmptyExpression extends Expression {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) { }

}

/**
 * 表示一个错误表达式。
 */
class ErrorExpression extends Expression {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitErrorExpression(this);
    }

}

/**
 * 表示一个泛型表达式(`foo<number>`)。
 */
class GenericExpression extends Expression {

    /**
     * 获取当前泛型表达式的元素部分。
     */
    element: Identifier;

    /**
     * 获取当前泛型表达式的所有参数。
     */
    typeArguments: NodeList<TypeNode>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.element.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.typeArguments.end; }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.element, "element", this) !== false &&
            this.typeArguments.each(callback, scope);
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitGenericExpression(this);
    }

}

/**
 * 表示一个数字字面量(`1`)。
 */
class NumericLiteral extends Expression {

    /**
     * 获取当前数字的值。
     */
    value: number;

    /**
     * 存储当前节点的结束位置。
     */
    private _end: number;

    /**
     * 获取当前节点的结束位置。
     */
    get end() {
        return this._end != undefined ? this._end : this.start + this.value.toString().length + 2;
    }

    /**
     * 设置当前节点的结束位置。
     */
    set end(value) {
        if (this.start + this.value.toString().length + 2 !== value) {
            this._end = value;
        }
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNumericLiteral(this);
    }

}

/**
 * 表示一个字符串字面量(`'abc'`、`"abc"`、`\`abc\``)。
 */
class StringLiteral extends Expression {

    /**
     * 获取当前字符串字面量的引号类型。合法的值有：'、"、`。
     */
    type: TokenType;

    /**
     * 获取当前字符串的值。
     */
    value: string;

    /**
     * 存储当前节点的结束位置。
     */
    private _end: number;

    /**
     * 获取当前节点的结束位置。
     */
    get end() {
        return this._end != undefined ? this._end : this.start + this.value.length + 2;
    }

    /**
     * 设置当前节点的结束位置。
     */
    set end(value) {
        if (this.start + this.value.length + 2 !== value) {
            this._end = value;
        }
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitStringLiteral(this);
    }

}

/**
 * 表示一个模板字面量(``abc${x + y}def``)。
 */
class TemplateLiteral extends Expression {

    /**
     * 获取当前模板字符串的所有组成部分。
     */
    spans: NodeList<TemplateSpan | Expression>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.spans[0].start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.spans[this.spans.length - 1].end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTemplateLiteral(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.spans.each(callback, scope);
    }

}

/**
 * 表示一个模板字面量的一个文本区域(`\`abc${、}abc${、}abc\``)。
 */
class TemplateSpan extends Node {

    /**
     * 获取当前区块的值。
     */
    value: string;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTemplateSpan(this);
    }

}

/**
 * 表示一个正则表达式字面量(`/abc/`)。
 */
class RegularExpressionLiteral extends Expression {

    /**
     * 获取当前正则表达式的值。
     */
    value: string;

    /**
     * 获取当前正则表达式的标志部分(可能不存在)。
     */
    flags: string;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitRegularExpressionLiteral(this);
    }

}

/**
 * 表示一个数组字面量(`[x, y]`)。
 */
class ArrayLiteral extends Expression {

    /**
     * 获取当前数组字面量的所有项。
     */
    elements: NodeList<Expression>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.elements.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.elements.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrayLiteral(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope);
    }

}

/**
 * 表示一个对象字面量(`{x: y}`)。
 */
class ObjectLiteral extends Expression {

    /**
     * 获取当前对象字面量的所有项。
     */
    elements: NodeList<TypeMemberDeclaration>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.elements.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.elements.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitObjectLiteral(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope);
    }

}

/**
 * 表示一个箭头函数表达式(`=> xx`)。
 */
class ArrowExpression extends Expression {

    /**
     *获取当前表达式的主体部分。
     */
    body: Expression;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrowExpression(this);
    }

}

/**
 * 表示一个括号表达式((`x)`)。
 */
class ParenthesizedExpression extends Expression {

    /**
     * 获取当前括号表达式的主体部分。
     */
    body: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitParenthesizedExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个成员调用表达式(`x.y`)。
 */
class MemberCallExpression extends Expression {

    /**
     * 获取当前调用的目标部分。
     */
    target: Expression;

    /**
     * 获取点的位置。
     */
    dotToken: number;

    /**
     * 获取当前调用的参数部分。
     */
    argument: Identifier;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.target.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.argument.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitMemberCallExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.target, "target", this) !== false &&
            callback.call(scope, this.argument, "argument", this) !== false;
    }

}

/**
 * 表示一个函数调用表达式(x(`)`)。
 */
class FunctionCallExpression extends Expression {

    /**
     * 获取当前调用的目标部分。
     */
    target: Expression;

    /**
     * 获取当前表达式的所有参数(可能不存在)。
     */
    arguments: NodeList<Expression>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.target.start; }

    /**
     * 获取当前节点的开始位置。
     */
    get end() { return this.arguments.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitFunctionCallExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    }

}

/**
 * 表示一个索引调用表达式(`x[y]`)。
 */
class IndexCallExpression extends Expression {

    /**
     * 获取当前调用的目标部分。
     */
    target: Expression;

    /**
     * 获取当前表达式的所有参数(可能不存在)。
     */
    arguments: NodeList<Expression>;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.target.start; }

    /**
     * 获取当前节点的开始位置。
     */
    get end() { return this.arguments.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitIndexCallExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    }

}

/**
 * 表示一个模板调用表达式(`x\`abc\``)。
 */
class TemplateCallExpression extends Expression {

    /**
     * 获取当前调用的目标部分。
     */
    target: Expression;

    /**
     * 获取当前表达式的参数。
     */
    argument: TemplateLiteral;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.target.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.argument.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTemplateCallExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.target, "target", this) !== false &&
            callback.call(scope, this.argument, "argument", this) !== false;
    }

}

/**
 * 表示一个 new 表达式(`new x()`)。
 */
class NewExpression extends Expression {

    /**
     * 获取当前调用的目标部分。
     */
    target: Expression;

    /**
     * 获取当前表达式的所有参数(可能不存在)。
     */
    arguments: NodeList<Expression>;

    /**
     * 获取当前节点的开始位置。
     */
    get end() { return this.arguments.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNewExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    }

}

/**
 * 表示一个 new.target 表达式(`new.target`)。
 */
class NewTargetExpression extends Expression {

    /**
     * 获取点的位置。
     */
    dotToken: number;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitNewTargetExpression(this);
    }

}

/**
 * 表示一个一元运算表达式(`+x、typeof x、...`)。
 */
class UnaryExpression extends Expression {

    /**
     * 获取当前运算的类型。合法的值有：`...`、`+`、`-`、`delete`、`void`、`typeof`、`~`、`!`、`++`、`--`。
     */
    type: TokenType;

    /**
     * 获取当前表达式的运算数。
     */
    operand: Expression;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.operand.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitUnaryExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.operand, "operand", this) !== false;
    }

}

/**
 * 表示一个后缀增量运算表达式(`x++`、`x--`)。
 */
class PostfixIncrementExpression extends Expression {

    /**
     * 获取当前运算的类型。合法的值有：`++`、`--`。
     */
    type: TokenType;

    /**
     * 获取当前表达式的运算数。
     */
    operand: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.operand.start; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitIncrementExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.operand, "operand", this) !== false;
    }

}

/**
 * 表示一个二元运算表达式(`x + y、x = y、...`)。
 */
class BinaryExpression extends Expression {

    /**
     * 获取当前表达式的左值部分。
     */
    leftOperand: Expression;

    /**
     * 获取当前运算的类型。合法的值有：,、*=、/=、%=、+=、‐=、<<=、>>=、>>>=、&=、^=、|=、**=、||、&&、|、^、&、==、!=、===、!==、<、>、<=、>=、instanceof、in、<<、>>、>>>、+、-、*、/、%、**。
     */
    type: TokenType;

    /**
     * 获取运算符的位置。
     */
    operatorToken: number;

    /**
     * 获取当前表达式的右值部分。
     */
    rightOperand: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.leftOperand.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.rightOperand.end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitBinaryExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.leftOperand, "leftOperand", this) !== false &&
            callback.call(scope, this.rightOperand, "rightOperand", this) !== false;
    }

}

/**
 * 表示一个 yield 表达式(`yield x、yield * x`)。
 */
class YieldExpression extends Expression {

    /**
     * 获取当前表达式的 * 的位置(可能不存在)。
     */
    asteriskToken: number;

    /**
     * 获取 yield 表达式的运算数部分(可能不存在)。
     */
    operand: Expression;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.operand ? this.operand.end : this.start + 5/*'yield'.length*/; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitYieldExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.operand || callback.call(scope, this.operand, "operand", this) !== false);
    }

}

/**
 * 表示一个条件表达式(`x ? y : z`)。
 */
class ConditionalExpression extends Expression {

    /**
     * 获取当前条件表达式的条件部分。
     */
    condition: Expression;

    /**
     * 获取当前条件表达式问号的位置。
     */
    questionToken: number;

    /**
     * 获取当前条件表达式的则部分。
     */
    thenExpression: Expression;

    /**
     * 获取当前条件表达式冒号的位置。
     */
    colonToken: number;

    /**
     * 获取当前条件表达式的否则部分。
     */
    elseExpression: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitConditionalExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.thenExpression, "thenExpression", this) !== false &&
            callback.call(scope, this.elseExpression, "elseExpression", this) !== false;
    }

}

/**
 * 表示一个类型确认表达式(`<T>xx`)。
 */
class TypeAssertionExpression extends Expression {

    /**
     * 获取当前类型转换表达式的类型部分。
     */
    type: Expression;

    /**
     * 获取当前表达式的 > 的位置。
     */
    greaterThanToken: number;

    /**
     * 获取当前类型转换表达式的运算数部分。
     */
    operand: Expression;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTypeCastExpression(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.type, "type", this) !== false &&
            callback.call(scope, this.operand, "operand", this) !== false;
    }

}

// #endregion

// #region Jsx 节点

/**
 * 表示一个 Jsx 节点(`<div>...</div>`)。
 */
abstract class JsxNode extends Expression {

}

/**
 * 表示一个 JSX 标签(`<div>...</div>`)。
 */
class JsxElement extends JsxNode {

    /**
     * 获取当前标签的名字。
     */
    tagName: Expression;

    /**
     * 获取当前标签的属性。
     */
    attributes: NodeList<JsxAttribute>;

    /**
     * 获取当前标签的子节点。
     */
    children: NodeList<JsxNode>;

    /**
     * 获取斜杠的位置(可能不存在)。
     */
    slashToken: number;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitJsxElement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.tagName, "tagName", this) !== false &&
            this.attributes.each(callback, scope) &&
            this.children.each(callback, scope);
    }

}

/**
 * 表示一个 JSX 标签属性(`id="a"`)。
 */
class JsxAttribute extends JsxNode {

    /**
     * 获取当前属性的名字。
     */
    name: Identifier;

    /**
     * 获取等号的位置。
     */
    equalToken: number;

    /**
     * 获取当前属性的值(可能不存在)。
     */
    value: JsxExpression | JsxText;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.name, "name", this) !== false &&
            (!this.value || callback.call(scope, this.value, "value", this) !== false);
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitJsxAttribute(this);
    }

}

/**
 * 表示一个 JSX 文本(`{...}`)。
 */
class JsxText extends JsxNode {

    /**
     * 获取当前文本的值。
     */
    value: string;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitJsxText(this);
    }
}

/**
 * 表示一个 JSX 表达式(`{...}`)。
 */
class JsxExpression extends JsxNode {

    /**
     * 获取当前表达式的主体。
     */
    body: Expression;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitJsxExpression(this);
    }
}

/**
 * 表示一个 JSX 关闭元素(`{...}`)。
 */
class JsxClosingElement extends JsxNode {

    /**
     * 获取当前标签的名字。
     */
    tagName: Expression;

    /**
     * 获取斜杠的位置。
     */
    slashStartToken: number;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.tagName, "tagName", this) !== false;
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitJsxClosingElement(this);
    }

}

// #endregion

// #region 类型

/**
 * 表示一个类型节点(`number`、`string[]`、...)。
 */
abstract class TypeNode extends Node {

}

/**
 * 表示一个简单类型节点(`number`、`string`、...)。
 */
class SimpleTypeNode extends TypeNode {

    /**
     * 获取当前简单类型节点的类型。合法的值有：this、any、number、string、boolean、symbol、void、never、*、?。
     */
    type: TokenType;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return this.start + tokenToString(this.type).length; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitSimpleTypeNode(this);
    }

}

/**
 * 表示一个泛型节点(`Array<T>`)。
 */
class GenericTypeNode extends TypeNode {

    /**
     * 获取当前类型表达式的元素部分。
     */
    element: TypeNode;

    /**
     * 获取当前类型表达式的所有参数。
     */
    typeArguments: NodeList<TypeNode>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitGenericTypeNode(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.element, "element", this) !== false &&
            this.typeArguments.each(callback, scope);
    }

}

/**
 * 表示一个数组类型节点(`T[]`)。
 */
class ArrayTypeNode extends TypeNode {

    /**
     * 获取当前数组类型的基础类型。
     */
    element: TypeNode;

    /**
     * 获取当前表达式的 [ 的位置。
     */
    openBracketToken: number;

    /**
     * 获取当前表达式的 ] 的位置。
     */
    closeBracketToken: number;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrayTypeNode(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.element, "element", this) !== false;
    }

}

/**
 * 表示一个函数类型节点(`()=>void`)。
 */
class FunctionTypeNode extends TypeNode {

    /**
     * 获取当前声明的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitFunctionTypeNode(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return (!this.typeParameters || this.typeParameters.each(callback, scope));
    }

}

/**
 * 表示一个构造函数类型节点(`new ()=>void`)。
 */
class ConstructorTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitConstructorTypeNode(this);
    }

}

/**
 * 表示一个元祖类型节点(`[string, number]`)。
 */
class TupleTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTupleTypeNode(this);
    }

}

/**
 * 表示一个联合类型节点(`number | string`)。
 */
class UnionTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitUnionTypeNode(this);
    }

}

/**
 * 表示一个交错类型节点(`number & string`)。
 */
class IntersectionTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitIntersectionTypeNode(this);
    }

}

/**
 * 表示一个对象类型节点(`{x: string}`)。
 */
class ObjectTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitObjectTypeNode(this);
    }

}

/**
 * 表示一个类型查询节点(`typeof x`)。
 */
class TypeQueryNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTypeQueryNode(this);
    }

}

/**
 * 表示一个括号类型节点(`(number)`)。
 */
class ParenthesizedTypeNode extends TypeNode {

    /**
     * 获取当前括号类型节点的主体部分。
     */
    body: TypeNode;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitParenthesizedTypeNode(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

}

/**
 * 表示一个表达式类型节点(`"abc"`、`true`)。
 */
class ExpressionTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitExpressionTypeNode(this);
    }

}

/**
 * 表示一个限定名称类型节点(`"abc"`、`true`)。
 */
class QualifiedNameTypeNode extends TypeNode {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitQualifiedNameTypeNode(this);
    }

}

/**
 * 表示一个类型别名声明(`type A = number`)。
 */
class TypeAliasDeclaration extends Statement {

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitTypeAliasDeclaration(this);
    }

}

// #endregion

// #region 绑定名称

/**
 * 表示一个绑定名称(`xx、[xx]、{x:x}`)。
 */
type BindingName = Identifier | ArrayBindingPattern | ObjectBindingPattern;

/**
 * 表示一个属性名称(`xx、"xx"、[xx]`)。
 */
type PropertyName = Identifier | NumericLiteral | StringLiteral | ComputedPropertyName;

/**
 * 表示一个数组绑定模式项(`[xx]`)。
 */
class ArrayBindingPattern extends Node {

    /**
     * 获取当前数组绑定模式项的所有元素。
     */
    elements: NodeList<ArrayBindingElement>;

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrayBindingPattern(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope);
    }

}

/**
 * 表示一个数组绑定模式项(xx、..)
 */
class ArrayBindingElement extends Node {

    /**
     * 获取当前声明的名字部分。
     */
    name: BindingName;

    /**
     * 获取当前绑定模式项的点点点位置(可能不存在)。
     */
    get dotDotDot() { return this.name.start > this.start; }

    /**
     * 获取当前绑定模式项的等号位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前绑定模式项的初始值。
     */
    initializer: Expression;

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.initializer || this.name).end; }

    /**
     * 获取空绑定。
     */
    static empty = Object.freeze(new ArrayBindingElement());

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitArrayBindingElement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.initializer, "initializer", this) !== false;
    }

}

/**
 * 表示一个对象绑定模式项(`{xx: xx}`)。
 */
class ObjectBindingPattern extends Node {

    /**
     * 获取当前对象绑定模式项的所有元素。
     */
    elements: NodeList<ObjectBindingElement>;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return this.elements.each(callback, scope);
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitObjectBindingPattern(this);
    }

}

/**
 * 表示一个对象绑定模式项(xx: y)
 */
class ObjectBindingElement extends Node {

    /**
     * 获取对象绑定模式项的属性名。
     */
    property: PropertyName;

    /**
     * 获取当前属性名后冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前声明的名字部分(可能不存在)。
     */
    name: BindingName;

    /**
     * 获取当前绑定模式项的等号位置(可能不存在)。
     */
    equalToken: number;

    /**
     * 获取当前绑定模式项的初始值。
     */
    initializer: Expression;

    /**
     * 获取当前节点的开始位置。
     */
    get start() { return this.propertyName.start; }

    /**
     * 获取当前节点的结束位置。
     */
    get end() { return (this.initializer || this.name || this.propertyName).end; }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitObjectBindingElement(this);
    }

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.initializer, "initializer", this) !== false;
    }

}

/**
 * 表示一个已计算的属性名。
 */
class ComputedPropertyName extends Node {

    /**
     * 获取当前属性名的主体部分。
     */
    body: Expression;

    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    each(callback: EachCallback, scope?: any) {
        return callback.call(scope, this.body, "body", this) !== false;
    }

    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    accept(vistior: NodeVisitor) {
        return vistior.visitComputedPropertyName(this);
    }

}

// #endregion
