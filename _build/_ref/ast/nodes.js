"use strict";
/**
 * @fileOverview 语法树节点
 * @generated 此文件部分使用 `$ tpack gen-nodes` 命令生成。
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var tokenType_1 = require("./tokenType");
var compiler_1 = require("../compiler/compiler");
// #region 节点
/**
 * 表示一个语法树节点。
 */
var Node = (function () {
    function Node() {
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    Node.prototype.each = function (callback, scope) {
        return true;
    };
    /**
     * 遍历当前节点的所有直接和间接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    Node.prototype.walk = function (callback, scope) {
        return this.each(function (childNode) {
            return callback.apply(this, arguments) !== false &&
                childNode.walk(callback, scope);
        }, scope);
    };
    return Node;
}());
exports.Node = Node;
/**
 * 表示一个源文件。
 */
var SourceFile = (function (_super) {
    __extends(SourceFile, _super);
    function SourceFile() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    SourceFile.prototype.accept = function (vistior) {
        return vistior.visitSourceFile(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    SourceFile.prototype.each = function (callback, scope) {
        return this.statements.each(callback, scope);
    };
    return SourceFile;
}(Node));
exports.SourceFile = SourceFile;
/**
 * 表示一个节点列表(<..., ...>。
 */
var NodeList = (function (_super) {
    __extends(NodeList, _super);
    function NodeList() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NodeList.prototype, "hasTrailingSeperator", {
        /**
         * 判断当前列表是否包含尾随的分隔符（如判断数组定义中的最后一项是否是逗号）。
         */
        get: function () { return this.commaTokens.length === this.length; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     */
    NodeList.prototype.accept = function (vistior) {
        return vistior.visitNodeList(this);
    };
    /**
     * 遍历当前节点列表，并对每一项执行 *callback*。
     * @param callback 对每个节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NodeList.prototype.each = function (callback, scope) {
        for (var i = 0; i < this.length; i++) {
            if (callback.call(scope, this[i], i, this) === false) {
                return false;
            }
        }
        return true;
    };
    /**
     * 遍历当前节点列表及节点的直接和间接子节点，并对每一项执行 *callback*。
     * @param callback 对每个节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NodeList.prototype.walk = function (callback, scope) {
        return this.each(function (childNode) {
            return callback.apply(this, arguments) !== false &&
                childNode.walk(callback, scope);
        }, scope);
    };
    return NodeList;
}(Array));
exports.NodeList = NodeList;
// #endregion
// #region 语句
/**
 * 表示一个语句。
 */
var Statement = (function (_super) {
    __extends(Statement, _super);
    function Statement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Statement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return false; },
        enumerable: true,
        configurable: true
    });
    return Statement;
}(Node));
exports.Statement = Statement;
/**
 * 表示一个语句块(`{...}`)。
 */
var BlockStatement = (function (_super) {
    __extends(BlockStatement, _super);
    function BlockStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    BlockStatement.prototype.accept = function (vistior) {
        return vistior.visitBlockStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    BlockStatement.prototype.each = function (callback, scope) {
        return this.statements.each(callback, scope);
    };
    return BlockStatement;
}(Statement));
exports.BlockStatement = BlockStatement;
/**
 * 表示一个变量声明语句(`var xx、let xx、const xx`)。
 */
var VariableStatement = (function (_super) {
    __extends(VariableStatement, _super);
    function VariableStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(VariableStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.variables[this.variables.length - 1].end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    VariableStatement.prototype.accept = function (vistior) {
        return vistior.visitVariableStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    VariableStatement.prototype.each = function (callback, scope) {
        return this.variables.each(callback, scope);
    };
    return VariableStatement;
}(Statement));
exports.VariableStatement = VariableStatement;
/**
 * 表示一个变量声明(`x = 1、[x] = [1]、{a: x} = {a: 1}`)。
 */
var VariableDeclaration = (function (_super) {
    __extends(VariableDeclaration, _super);
    function VariableDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(VariableDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.name.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VariableDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.initializer ? this.initializer.end : this.type ? this.type.end : this.name.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    VariableDeclaration.prototype.accept = function (vistior) {
        return vistior.visitVariableDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    VariableDeclaration.prototype.each = function (callback, scope) {
        return (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    };
    return VariableDeclaration;
}(Node));
exports.VariableDeclaration = VariableDeclaration;
/**
 * 表示一个空语句(`;`)。
 */
var EmptyStatement = (function (_super) {
    __extends(EmptyStatement, _super);
    function EmptyStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(EmptyStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.start + 1; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EmptyStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return true; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    EmptyStatement.prototype.accept = function (vistior) {
        return vistior.visitEmptyStatement(this);
    };
    return EmptyStatement;
}(Statement));
exports.EmptyStatement = EmptyStatement;
/**
 * 表示一个标签语句(`xx: ...`)。
 */
var LabeledStatement = (function (_super) {
    __extends(LabeledStatement, _super);
    function LabeledStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(LabeledStatement.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.label.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LabeledStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    LabeledStatement.prototype.accept = function (vistior) {
        return vistior.visitLabeledStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    LabeledStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.label, "label", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return LabeledStatement;
}(Statement));
exports.LabeledStatement = LabeledStatement;
/**
 * 表示一个表达式语句(x(`);`)。
 */
var ExpressionStatement = (function (_super) {
    __extends(ExpressionStatement, _super);
    function ExpressionStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ExpressionStatement.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.body.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExpressionStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ExpressionStatement.prototype.accept = function (vistior) {
        return vistior.visitExpressionStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ExpressionStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return ExpressionStatement;
}(Statement));
exports.ExpressionStatement = ExpressionStatement;
/**
 * 表示一个 if 语句(if(`xx) ...`)。
 */
var IfStatement = (function (_super) {
    __extends(IfStatement, _super);
    function IfStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(IfStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this["else"] || this.then).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    IfStatement.prototype.accept = function (vistior) {
        return vistior.visitIfStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    IfStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.then, "then", this) !== false &&
            (!this["else"] || callback.call(scope, this["else"], "else", this) !== false);
    };
    return IfStatement;
}(Statement));
exports.IfStatement = IfStatement;
/**
 * 表示一个 switch 语句(switch(`xx){...}`)。
 */
var SwitchStatement = (function (_super) {
    __extends(SwitchStatement, _super);
    function SwitchStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SwitchStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.cases.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    SwitchStatement.prototype.accept = function (vistior) {
        return vistior.visitSwitchStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    SwitchStatement.prototype.each = function (callback, scope) {
        return (!this.condition || callback.call(scope, this.condition, "condition", this) !== false) &&
            this.cases.each(callback, scope);
    };
    return SwitchStatement;
}(Statement));
exports.SwitchStatement = SwitchStatement;
/**
 * 表示一个 case 分支(`case ...:{...}`)。
 */
var CaseClause = (function (_super) {
    __extends(CaseClause, _super);
    function CaseClause() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CaseClause.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.statements.length ? this.statements[this.statements.length - 1].end : this.colonToken; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    CaseClause.prototype.accept = function (vistior) {
        return vistior.visitCaseClause(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    CaseClause.prototype.each = function (callback, scope) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false) &&
            this.statements.each(callback, scope);
    };
    return CaseClause;
}(Node));
exports.CaseClause = CaseClause;
/**
 * 表示一个 for 语句(for(`var i = 0; i < 9; i++) ...`)。
 */
var ForStatement = (function (_super) {
    __extends(ForStatement, _super);
    function ForStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ForStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ForStatement.prototype.accept = function (vistior) {
        return vistior.visitForStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ForStatement.prototype.each = function (callback, scope) {
        return (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false) &&
            (!this.condition || callback.call(scope, this.condition, "condition", this) !== false) &&
            (!this.iterator || callback.call(scope, this.iterator, "iterator", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return ForStatement;
}(Statement));
exports.ForStatement = ForStatement;
/**
 * 表示一个 for..in 语句(for(`var x in y) ...`)。
 */
var ForInStatement = (function (_super) {
    __extends(ForInStatement, _super);
    function ForInStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ForInStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ForInStatement.prototype.accept = function (vistior) {
        return vistior.visitForInStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ForInStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.initializer, "initializer", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return ForInStatement;
}(Statement));
exports.ForInStatement = ForInStatement;
/**
 * 表示一个 for..of 语句(for(`var x of y) ...`)。
 */
var ForOfStatement = (function (_super) {
    __extends(ForOfStatement, _super);
    function ForOfStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ForOfStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ForOfStatement.prototype.accept = function (vistior) {
        return vistior.visitForOfStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ForOfStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.initializer, "initializer", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return ForOfStatement;
}(Statement));
exports.ForOfStatement = ForOfStatement;
/**
 * 表示一个 for..to 语句(for(`var x = 0 to 10) ...`)。
 */
var ForToStatement = (function (_super) {
    __extends(ForToStatement, _super);
    function ForToStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ForToStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ForToStatement.prototype.accept = function (vistior) {
        return vistior.visitForToStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ForToStatement.prototype.each = function (callback, scope) {
        return (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false) &&
            callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return ForToStatement;
}(Statement));
exports.ForToStatement = ForToStatement;
/**
 * 表示一个 while 语句(while(`...) ...`)。
 */
var WhileStatement = (function (_super) {
    __extends(WhileStatement, _super);
    function WhileStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(WhileStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    WhileStatement.prototype.accept = function (vistior) {
        return vistior.visitWhileStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    WhileStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return WhileStatement;
}(Statement));
exports.WhileStatement = WhileStatement;
/**
 * 表示一个 do..while 语句(do ... while(`xx);`)。
 */
var DoWhileStatement = (function (_super) {
    __extends(DoWhileStatement, _super);
    function DoWhileStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DoWhileStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.condition.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    DoWhileStatement.prototype.accept = function (vistior) {
        return vistior.visitDoWhileStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    DoWhileStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false &&
            callback.call(scope, this.condition, "condition", this) !== false;
    };
    return DoWhileStatement;
}(Statement));
exports.DoWhileStatement = DoWhileStatement;
/**
 * 表示一个 continue 语句(`continue xx;`)。
 */
var ContinueStatement = (function (_super) {
    __extends(ContinueStatement, _super);
    function ContinueStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ContinueStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.start + 8 /*'continue'.length*/; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ContinueStatement.prototype.accept = function (vistior) {
        return vistior.visitContinueStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ContinueStatement.prototype.each = function (callback, scope) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false);
    };
    return ContinueStatement;
}(Statement));
exports.ContinueStatement = ContinueStatement;
/**
 * 表示一个 break 语句(`break xx;`)。
 */
var BreakStatement = (function (_super) {
    __extends(BreakStatement, _super);
    function BreakStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(BreakStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.start + 5 /*'break'.length*/; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    BreakStatement.prototype.accept = function (vistior) {
        return vistior.visitBreakStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    BreakStatement.prototype.each = function (callback, scope) {
        return (!this.label || callback.call(scope, this.label, "label", this) !== false);
    };
    return BreakStatement;
}(Statement));
exports.BreakStatement = BreakStatement;
/**
 * 表示一个 return 语句(`return xx;`)。
 */
var ReturnStatement = (function (_super) {
    __extends(ReturnStatement, _super);
    function ReturnStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ReturnStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > (this.value ? this.value.end : this.start + 6 /*'return'.length*/); },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ReturnStatement.prototype.accept = function (vistior) {
        return vistior.visitReturnStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ReturnStatement.prototype.each = function (callback, scope) {
        return (!this.value || callback.call(scope, this.value, "value", this) !== false);
    };
    return ReturnStatement;
}(Statement));
exports.ReturnStatement = ReturnStatement;
/**
 * 表示一个 throw 语句(`throw xx;`)。
 */
var ThrowStatement = (function (_super) {
    __extends(ThrowStatement, _super);
    function ThrowStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ThrowStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.value.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ThrowStatement.prototype.accept = function (vistior) {
        return vistior.visitThrowStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ThrowStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.value, "value", this) !== false;
    };
    return ThrowStatement;
}(Statement));
exports.ThrowStatement = ThrowStatement;
/**
 * 表示一个 try 语句(try {...} catch(`e) {...}`)。
 */
var TryStatement = (function (_super) {
    __extends(TryStatement, _super);
    function TryStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TryStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this["finally"] || this["catch"]).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TryStatement.prototype.accept = function (vistior) {
        return vistior.visitTryStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    TryStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this["try"], "try", this) !== false &&
            (!this["catch"] || callback.call(scope, this["catch"], "catch", this) !== false) &&
            (!this["finally"] || callback.call(scope, this["finally"], "finally", this) !== false);
    };
    return TryStatement;
}(Statement));
exports.TryStatement = TryStatement;
/**
 * 表示一个 catch 分句(catch(`e) {...}`)。
 */
var CatchClause = (function (_super) {
    __extends(CatchClause, _super);
    function CatchClause() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CatchClause.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    CatchClause.prototype.accept = function (vistior) {
        return vistior.visitCatchClause(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    CatchClause.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return CatchClause;
}(Node));
exports.CatchClause = CatchClause;
/**
 * 表示一个 finally 分句(`finally {...}`)。
 */
var FinallyClause = (function (_super) {
    __extends(FinallyClause, _super);
    function FinallyClause() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FinallyClause.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    FinallyClause.prototype.accept = function (vistior) {
        return vistior.visitFinallyClause(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    FinallyClause.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return FinallyClause;
}(Node));
exports.FinallyClause = FinallyClause;
/**
 * 表示一个 debugger 语句(`debugger;`)。
 */
var DebuggerStatement = (function (_super) {
    __extends(DebuggerStatement, _super);
    function DebuggerStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(DebuggerStatement.prototype, "hasSemicolon", {
        /**
         * 判断当前语句末尾是否包含分号。
         */
        get: function () { return this.end > this.start + 8 /*'debugger'.length*/; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    DebuggerStatement.prototype.accept = function (vistior) {
        return vistior.visitDebuggerStatement(this);
    };
    return DebuggerStatement;
}(Statement));
exports.DebuggerStatement = DebuggerStatement;
/**
 * 表示一个 with 语句(with(`xx) ...`)。
 */
var WithStatement = (function (_super) {
    __extends(WithStatement, _super);
    function WithStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(WithStatement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    WithStatement.prototype.accept = function (vistior) {
        return vistior.visitWithStatement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    WithStatement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.value, "value", this) !== false &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return WithStatement;
}(Statement));
exports.WithStatement = WithStatement;
// #endregion
// #region 声明
/**
 * 表示一个声明(function fn(`) {...}、class T { ... }、...`)。
 */
var Declaration = (function (_super) {
    __extends(Declaration, _super);
    function Declaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Declaration;
}(Statement));
exports.Declaration = Declaration;
/**
 * 表示一个修饰器(`@xx`)。
 */
var Decorator = (function (_super) {
    __extends(Decorator, _super);
    function Decorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Decorator.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    Decorator.prototype.accept = function (vistior) {
        return vistior.visitDecorator(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    Decorator.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return Decorator;
}(Node));
exports.Decorator = Decorator;
/**
 * 表示一个修饰符(`static、private、...`)。
 */
var Modifier = (function (_super) {
    __extends(Modifier, _super);
    function Modifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Modifier.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.start + tokenType_1.tokenToString(this.type).length; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    Modifier.prototype.accept = function (vistior) {
        return vistior.visitModifier(this);
    };
    return Modifier;
}(Node));
exports.Modifier = Modifier;
/**
 * 表示一个类型参数声明(`T、T extends R`)。
 */
var TypeParametersDeclaration = (function (_super) {
    __extends(TypeParametersDeclaration, _super);
    function TypeParametersDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TypeParametersDeclaration.prototype.accept = function (vistior) {
        return vistior.visitTypeParametersDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    TypeParametersDeclaration.prototype.each = function (callback, scope) {
        return callback.call(scope, this.name, "name", this) !== false &&
            (!this["extends"] || callback.call(scope, this["extends"], "extends", this) !== false);
    };
    return TypeParametersDeclaration;
}(Node));
exports.TypeParametersDeclaration = TypeParametersDeclaration;
/**
 * 表示一个函数声明(function fn() {...}、function * fn(`){...}`)。
 */
var FunctionDeclaration = (function (_super) {
    __extends(FunctionDeclaration, _super);
    function FunctionDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FunctionDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.decorators && this.decorators.length ? this.decorators[0].start : this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.functionToken; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    FunctionDeclaration.prototype.accept = function (vistior) {
        return vistior.visitFunctionDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    FunctionDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            this.parameters.each(callback, scope) &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            (!this.body || callback.call(scope, this.body, "body", this) !== false);
    };
    return FunctionDeclaration;
}(Declaration));
exports.FunctionDeclaration = FunctionDeclaration;
/**
 * 表示一个函数表达式(function (`) {}`)。
 */
var FunctionExpression = (function (_super) {
    __extends(FunctionExpression, _super);
    function FunctionExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FunctionExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    FunctionExpression.prototype.accept = function (vistior) {
        return vistior.visitFunctionExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    FunctionExpression.prototype.each = function (callback, scope) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            this.typeParameters.each(callback, scope) &&
            this.parameters.each(callback, scope) &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return FunctionExpression;
}(Expression));
exports.FunctionExpression = FunctionExpression;
/**
 * 表示一个箭头函数表达式(`x => y`)。
 */
var ArrowFunctionExpression = (function (_super) {
    __extends(ArrowFunctionExpression, _super);
    function ArrowFunctionExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ArrowFunctionExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.modifiers ? this.modifiers.start : this.parameters ? this.parameters.start : this.arrowToken; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ArrowFunctionExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrowFunctionExpression.prototype.accept = function (vistior) {
        return vistior.visitArrowFunctionExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrowFunctionExpression.prototype.each = function (callback, scope) {
        return this.typeParameters.each(callback, scope) &&
            this.parameters.each(callback, scope) &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return ArrowFunctionExpression;
}(Expression));
exports.ArrowFunctionExpression = ArrowFunctionExpression;
/**
 * 表示一个参数声明(`x、x = 1、...x`)。
 */
var ParameterDeclaration = (function (_super) {
    __extends(ParameterDeclaration, _super);
    function ParameterDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ParameterDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.name.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParameterDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.initializer ? this.initializer.end : this.type ? this.type.end : this.questionToken != undefined ? this.questionToken : this.name.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ParameterDeclaration.prototype.accept = function (vistior) {
        return vistior.visitParameterDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ParameterDeclaration.prototype.each = function (callback, scope) {
        return (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    };
    return ParameterDeclaration;
}(Node));
exports.ParameterDeclaration = ParameterDeclaration;
/**
 * 表示一个类声明(`class T {...}`)。
 */
var ClassDeclaration = (function (_super) {
    __extends(ClassDeclaration, _super);
    function ClassDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ClassDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.decorators && this.decorators.length ? this.decorators[0].start : this.modifiers && this.modifiers.length ? this.modifiers[0].start : this.classToken; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ClassDeclaration.prototype.accept = function (vistior) {
        return vistior.visitClassDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ClassDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this["extends"] || callback.call(scope, this["extends"], "extends", this) !== false) &&
            (!this.implements || this.implements.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    };
    return ClassDeclaration;
}(Declaration));
exports.ClassDeclaration = ClassDeclaration;
/**
 * 表示一个类表达式(`class xx {}`)。
 */
var ClassExpression = (function (_super) {
    __extends(ClassExpression, _super);
    function ClassExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ClassExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.members.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ClassExpression.prototype.accept = function (vistior) {
        return vistior.visitClassExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ClassExpression.prototype.each = function (callback, scope) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this["extends"] || callback.call(scope, this["extends"], "extends", this) !== false) &&
            (!this.implements || this.implements.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    };
    return ClassExpression;
}(Expression));
exports.ClassExpression = ClassExpression;
/**
 * 表示一个类型成员声明(x: 1、x() {}、get x(){}、set x(`value){}`)。
 */
var TypeMemberDeclaration = (function (_super) {
    __extends(TypeMemberDeclaration, _super);
    function TypeMemberDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TypeMemberDeclaration;
}(Node));
exports.TypeMemberDeclaration = TypeMemberDeclaration;
/**
 * 表示一个属性声明(`x: 1`)。
 */
var PropertyDeclaration = (function (_super) {
    __extends(PropertyDeclaration, _super);
    function PropertyDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PropertyDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.decorators ? this.decorators.start : this.modifiers ? this.modifiers.start : this.name.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this.value || this.type || this.name).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    PropertyDeclaration.prototype.accept = function (vistior) {
        return vistior.visitPropertyDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    PropertyDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.type || callback.call(scope, this.type, "type", this) !== false) &&
            (!this.value || callback.call(scope, this.value, "value", this) !== false);
    };
    return PropertyDeclaration;
}(TypeMemberDeclaration));
exports.PropertyDeclaration = PropertyDeclaration;
/**
 * 表示一个方法声明(fn(`) {...}`)。
 */
var MethodDeclaration = (function (_super) {
    __extends(MethodDeclaration, _super);
    function MethodDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(MethodDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.decorators ? this.decorators.start : this.modifiers ? this.modifiers.start : this.name.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MethodDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.body.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    MethodDeclaration.prototype.accept = function (vistior) {
        return vistior.visitMethodDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    MethodDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            this.parameters.each(callback, scope) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return MethodDeclaration;
}(TypeMemberDeclaration));
exports.MethodDeclaration = MethodDeclaration;
/**
 * 表示一个访问器声明(get fn() {...}、set fn(`) {...}`)。
 */
var AccessorDeclaration = (function (_super) {
    __extends(AccessorDeclaration, _super);
    function AccessorDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(AccessorDeclaration.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.getToken != undefined ? this.getToken : this.setToken; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    AccessorDeclaration.prototype.accept = function (vistior) {
        return vistior.visitAccessorDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    AccessorDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            this.parameters.each(callback, scope) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.returnType || callback.call(scope, this.returnType, "returnType", this) !== false) &&
            callback.call(scope, this.body, "body", this) !== false;
    };
    return AccessorDeclaration;
}(MethodDeclaration));
exports.AccessorDeclaration = AccessorDeclaration;
/**
 * 表示一个接口声明(`interface T {...}`)。
 */
var InterfaceDeclaration = (function (_super) {
    __extends(InterfaceDeclaration, _super);
    function InterfaceDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(InterfaceDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.members.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    InterfaceDeclaration.prototype.accept = function (vistior) {
        return vistior.visitInterfaceDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    InterfaceDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this["extends"] || this["extends"].each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    };
    return InterfaceDeclaration;
}(Declaration));
exports.InterfaceDeclaration = InterfaceDeclaration;
/**
 * 表示一个接口表达式(`interface xx {}`)。
 */
var InterfaceExpression = (function (_super) {
    __extends(InterfaceExpression, _super);
    function InterfaceExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    InterfaceExpression.prototype.accept = function (vistior) {
        return vistior.visitInterfaceExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    InterfaceExpression.prototype.each = function (callback, scope) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this["extends"] || this["extends"].each(callback, scope)) &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    };
    return InterfaceExpression;
}(Expression));
exports.InterfaceExpression = InterfaceExpression;
/**
 * 表示一个枚举声明(`enum T {}`)。
 */
var EnumDeclaration = (function (_super) {
    __extends(EnumDeclaration, _super);
    function EnumDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(EnumDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.members.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    EnumDeclaration.prototype.accept = function (vistior) {
        return vistior.visitEnumDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    EnumDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.members || this.members.each(callback, scope));
    };
    return EnumDeclaration;
}(Declaration));
exports.EnumDeclaration = EnumDeclaration;
/**
 * 表示一个枚举表达式(`enum xx {}`)。
 */
var EnumExpression = (function (_super) {
    __extends(EnumExpression, _super);
    function EnumExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    EnumExpression.prototype.accept = function (vistior) {
        return vistior.visitEnumExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    EnumExpression.prototype.each = function (callback, scope) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            (!this.members || this.members.each(callback, scope));
    };
    return EnumExpression;
}(Expression));
exports.EnumExpression = EnumExpression;
/**
 * 表示一个枚举成员声明(`xx = 1`)。
 */
var EnumMemberDeclaration = (function (_super) {
    __extends(EnumMemberDeclaration, _super);
    function EnumMemberDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(EnumMemberDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this.initializer || this.name).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    EnumMemberDeclaration.prototype.accept = function (vistior) {
        return vistior.visitEnumMemberDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    EnumMemberDeclaration.prototype.each = function (callback, scope) {
        return (!this.decorators || this.decorators.each(callback, scope)) &&
            (!this.modifiers || this.modifiers.each(callback, scope)) &&
            callback.call(scope, this.name, "name", this) !== false &&
            (!this.typeParameters || this.typeParameters.each(callback, scope)) &&
            (!this.initializer || callback.call(scope, this.initializer, "initializer", this) !== false);
    };
    return EnumMemberDeclaration;
}(Declaration));
exports.EnumMemberDeclaration = EnumMemberDeclaration;
/**
 * 表示一个命名空间声明(`namespace abc {...}、module abc {...}`)。
 */
var NamespaceDeclaration = (function (_super) {
    __extends(NamespaceDeclaration, _super);
    function NamespaceDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NamespaceDeclaration.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.members.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NamespaceDeclaration.prototype.accept = function (vistior) {
        return vistior.visitNamespaceDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NamespaceDeclaration.prototype.each = function (callback, scope) {
        return this.names.each(callback, scope) &&
            this.members.each(callback, scope);
    };
    return NamespaceDeclaration;
}(Node));
exports.NamespaceDeclaration = NamespaceDeclaration;
/**
 * 表示一个 import 声明(`import xx from '...';`)。
 */
var ImportDeclaration = (function (_super) {
    __extends(ImportDeclaration, _super);
    function ImportDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ImportDeclaration.prototype.accept = function (vistior) {
        return vistior.visitImportDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ImportDeclaration.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope) &&
            callback.call(scope, this.target, "target", this) !== false;
    };
    return ImportDeclaration;
}(Statement));
exports.ImportDeclaration = ImportDeclaration;
/**
 * 表示一个 import = 指令(import xx = require(`"");`)。
 */
var ImportAliasDeclaration = (function (_super) {
    __extends(ImportAliasDeclaration, _super);
    function ImportAliasDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ImportAliasDeclaration.prototype.accept = function (vistior) {
        return vistior.visitImportAliasDeclaration(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ImportAliasDeclaration.prototype.each = function (callback, scope) {
        return callback.call(scope, this.value, "value", this) !== false;
    };
    return ImportAliasDeclaration;
}(Statement));
exports.ImportAliasDeclaration = ImportAliasDeclaration;
/**
 * 表示一个名字导入声明项(`a as b`)。
 */
var NameImportClause = (function (_super) {
    __extends(NameImportClause, _super);
    function NameImportClause() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NameImportClause.prototype.each = function (callback, scope) {
        return (!this.name || callback.call(scope, this.name, "name", this) !== false) &&
            callback.call(scope, this.alias, "alias", this) !== false;
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NameImportClause.prototype.accept = function (vistior) {
        return vistior.visitNameImportClause(this);
    };
    return NameImportClause;
}(Node));
exports.NameImportClause = NameImportClause;
/**
 * 表示一个命名空间导入声明项(`{a as b}`)。
 */
var NamespaceImportClause = (function (_super) {
    __extends(NamespaceImportClause, _super);
    function NamespaceImportClause() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NamespaceImportClause.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope);
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NamespaceImportClause.prototype.accept = function (vistior) {
        return vistior.visitNamespaceImportClause(this);
    };
    return NamespaceImportClause;
}(Node));
exports.NamespaceImportClause = NamespaceImportClause;
/**
 * 表示一个 export 指令(`export xx from '...';`)。
 */
var ExportDirective = (function (_super) {
    __extends(ExportDirective, _super);
    function ExportDirective() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ExportDirective.prototype.accept = function (vistior) {
        return vistior.visitExportDirective(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ExportDirective.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope) &&
            callback.call(scope, this.target, "target", this) !== false;
    };
    return ExportDirective;
}(Statement));
exports.ExportDirective = ExportDirective;
/**
 * 表示一个 export = 指令(`export = 1;`)。
 */
var ExportEqualsDirective = (function (_super) {
    __extends(ExportEqualsDirective, _super);
    function ExportEqualsDirective() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ExportEqualsDirective.prototype.accept = function (vistior) {
        return vistior.visitExportEqualsDirective(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ExportEqualsDirective.prototype.each = function (callback, scope) {
        return callback.call(scope, this.value, "value", this) !== false;
    };
    return ExportEqualsDirective;
}(Statement));
exports.ExportEqualsDirective = ExportEqualsDirective;
// #endregion
// #region 表达式
/**
 * 表示一个表达式。
 */
var Expression = (function (_super) {
    __extends(Expression, _super);
    function Expression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 获取错误表达式。该表达式可作为语法解析错误时的替代表达式使用。
     */
    Expression.error = Object.freeze(new EmptyExpression());
    /**
     * 获取空表达式。
     */
    Expression.empty = Object.freeze(new EmptyExpression());
    return Expression;
}(Node));
exports.Expression = Expression;
/**
 * 表示一个空表达式。
 */
var EmptyExpression = (function (_super) {
    __extends(EmptyExpression, _super);
    function EmptyExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    EmptyExpression.prototype.accept = function (vistior) { };
    return EmptyExpression;
}(Expression));
/**
 * 表示一个错误表达式。
 */
var ErrorExpression = (function (_super) {
    __extends(ErrorExpression, _super);
    function ErrorExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ErrorExpression.prototype.accept = function (vistior) {
        return vistior.visitErrorExpression(this);
    };
    return ErrorExpression;
}(Expression));
exports.ErrorExpression = ErrorExpression;
/**
 * 表示一个标识符(`x`)。
 */
var Identifier = (function (_super) {
    __extends(Identifier, _super);
    function Identifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Identifier.prototype, "value", {
        /**
         * 获取当前标识符的内容。
         */
        get: function () { return this._value; },
        /**
         * 获取当前标识符的内容。
         */
        set: function (value) { this._value = compiler_1.intern(value); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Identifier.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () {
            return this._end != undefined ? this._end : this.start + this.value.length;
        },
        /**
         * 设置当前节点的结束位置。
         */
        set: function (value) {
            if (this.start + this.value.length !== value) {
                this._end = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    Identifier.prototype.accept = function (vistior) {
        return vistior.visitIdentifier(this);
    };
    return Identifier;
}(Expression));
exports.Identifier = Identifier;
/**
 * 表示一个泛型表达式(`foo<number>`)。
 */
var GenericExpression = (function (_super) {
    __extends(GenericExpression, _super);
    function GenericExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(GenericExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.element.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GenericExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.typeArguments.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    GenericExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.element, "element", this) !== false &&
            this.typeArguments.each(callback, scope);
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    GenericExpression.prototype.accept = function (vistior) {
        return vistior.visitGenericExpression(this);
    };
    return GenericExpression;
}(Expression));
exports.GenericExpression = GenericExpression;
/**
 * 表示一个简单字面量(`this`、`super`、`null`、`true`、`false`)。
 */
var SimpleLiteral = (function (_super) {
    __extends(SimpleLiteral, _super);
    function SimpleLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SimpleLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.start + tokenType_1.tokenToString(this.type).length; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    SimpleLiteral.prototype.accept = function (vistior) {
        return vistior.visitSimpleLiteral(this);
    };
    return SimpleLiteral;
}(Expression));
exports.SimpleLiteral = SimpleLiteral;
/**
 * 表示一个数字字面量(`1`)。
 */
var NumericLiteral = (function (_super) {
    __extends(NumericLiteral, _super);
    function NumericLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NumericLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () {
            return this._end != undefined ? this._end : this.start + this.value.toString().length + 2;
        },
        /**
         * 设置当前节点的结束位置。
         */
        set: function (value) {
            if (this.start + this.value.toString().length + 2 !== value) {
                this._end = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NumericLiteral.prototype.accept = function (vistior) {
        return vistior.visitNumericLiteral(this);
    };
    return NumericLiteral;
}(Expression));
exports.NumericLiteral = NumericLiteral;
/**
 * 表示一个字符串字面量(`'abc'`、`"abc"`、`\`abc\``)。
 */
var StringLiteral = (function (_super) {
    __extends(StringLiteral, _super);
    function StringLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(StringLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () {
            return this._end != undefined ? this._end : this.start + this.value.length + 2;
        },
        /**
         * 设置当前节点的结束位置。
         */
        set: function (value) {
            if (this.start + this.value.length + 2 !== value) {
                this._end = value;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    StringLiteral.prototype.accept = function (vistior) {
        return vistior.visitStringLiteral(this);
    };
    return StringLiteral;
}(Expression));
exports.StringLiteral = StringLiteral;
/**
 * 表示一个模板字面量(``abc${x + y}def``)。
 */
var TemplateLiteral = (function (_super) {
    __extends(TemplateLiteral, _super);
    function TemplateLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TemplateLiteral.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.spans[0].start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TemplateLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.spans[this.spans.length - 1].end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TemplateLiteral.prototype.accept = function (vistior) {
        return vistior.visitTemplateLiteral(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    TemplateLiteral.prototype.each = function (callback, scope) {
        return this.spans.each(callback, scope);
    };
    return TemplateLiteral;
}(Expression));
exports.TemplateLiteral = TemplateLiteral;
/**
 * 表示一个模板字面量的一个文本区域(`\`abc${、}abc${、}abc\``)。
 */
var TemplateSpan = (function (_super) {
    __extends(TemplateSpan, _super);
    function TemplateSpan() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TemplateSpan.prototype.accept = function (vistior) {
        return vistior.visitTemplateSpan(this);
    };
    return TemplateSpan;
}(Node));
exports.TemplateSpan = TemplateSpan;
/**
 * 表示一个正则表达式字面量(`/abc/`)。
 */
var RegularExpressionLiteral = (function (_super) {
    __extends(RegularExpressionLiteral, _super);
    function RegularExpressionLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    RegularExpressionLiteral.prototype.accept = function (vistior) {
        return vistior.visitRegularExpressionLiteral(this);
    };
    return RegularExpressionLiteral;
}(Expression));
exports.RegularExpressionLiteral = RegularExpressionLiteral;
/**
 * 表示一个数组字面量(`[x, y]`)。
 */
var ArrayLiteral = (function (_super) {
    __extends(ArrayLiteral, _super);
    function ArrayLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ArrayLiteral.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.elements.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ArrayLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.elements.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrayLiteral.prototype.accept = function (vistior) {
        return vistior.visitArrayLiteral(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrayLiteral.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope);
    };
    return ArrayLiteral;
}(Expression));
exports.ArrayLiteral = ArrayLiteral;
/**
 * 表示一个对象字面量(`{x: y}`)。
 */
var ObjectLiteral = (function (_super) {
    __extends(ObjectLiteral, _super);
    function ObjectLiteral() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ObjectLiteral.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.elements.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObjectLiteral.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.elements.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ObjectLiteral.prototype.accept = function (vistior) {
        return vistior.visitObjectLiteral(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ObjectLiteral.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope);
    };
    return ObjectLiteral;
}(Expression));
exports.ObjectLiteral = ObjectLiteral;
/**
 * 表示一个箭头函数表达式(`=> xx`)。
 */
var ArrowExpression = (function (_super) {
    __extends(ArrowExpression, _super);
    function ArrowExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrowExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrowExpression.prototype.accept = function (vistior) {
        return vistior.visitArrowExpression(this);
    };
    return ArrowExpression;
}(Expression));
exports.ArrowExpression = ArrowExpression;
/**
 * 表示一个括号表达式((`x)`)。
 */
var ParenthesizedExpression = (function (_super) {
    __extends(ParenthesizedExpression, _super);
    function ParenthesizedExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ParenthesizedExpression.prototype.accept = function (vistior) {
        return vistior.visitParenthesizedExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ParenthesizedExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return ParenthesizedExpression;
}(Expression));
exports.ParenthesizedExpression = ParenthesizedExpression;
/**
 * 表示一个成员调用表达式(`x.y`)。
 */
var MemberCallExpression = (function (_super) {
    __extends(MemberCallExpression, _super);
    function MemberCallExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(MemberCallExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.target.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MemberCallExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.argument.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    MemberCallExpression.prototype.accept = function (vistior) {
        return vistior.visitMemberCallExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    MemberCallExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.target, "target", this) !== false &&
            callback.call(scope, this.argument, "argument", this) !== false;
    };
    return MemberCallExpression;
}(Expression));
exports.MemberCallExpression = MemberCallExpression;
/**
 * 表示一个函数调用表达式(x(`)`)。
 */
var FunctionCallExpression = (function (_super) {
    __extends(FunctionCallExpression, _super);
    function FunctionCallExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FunctionCallExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.target.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FunctionCallExpression.prototype, "end", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.arguments.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    FunctionCallExpression.prototype.accept = function (vistior) {
        return vistior.visitFunctionCallExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    FunctionCallExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    };
    return FunctionCallExpression;
}(Expression));
exports.FunctionCallExpression = FunctionCallExpression;
/**
 * 表示一个索引调用表达式(`x[y]`)。
 */
var IndexCallExpression = (function (_super) {
    __extends(IndexCallExpression, _super);
    function IndexCallExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(IndexCallExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.target.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IndexCallExpression.prototype, "end", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.arguments.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    IndexCallExpression.prototype.accept = function (vistior) {
        return vistior.visitIndexCallExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    IndexCallExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    };
    return IndexCallExpression;
}(Expression));
exports.IndexCallExpression = IndexCallExpression;
/**
 * 表示一个模板调用表达式(`x\`abc\``)。
 */
var TemplateCallExpression = (function (_super) {
    __extends(TemplateCallExpression, _super);
    function TemplateCallExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TemplateCallExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.target.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TemplateCallExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.argument.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TemplateCallExpression.prototype.accept = function (vistior) {
        return vistior.visitTemplateCallExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    TemplateCallExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.target, "target", this) !== false &&
            callback.call(scope, this.argument, "argument", this) !== false;
    };
    return TemplateCallExpression;
}(Expression));
exports.TemplateCallExpression = TemplateCallExpression;
/**
 * 表示一个 new 表达式(`new x()`)。
 */
var NewExpression = (function (_super) {
    __extends(NewExpression, _super);
    function NewExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(NewExpression.prototype, "end", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.arguments.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NewExpression.prototype.accept = function (vistior) {
        return vistior.visitNewExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    NewExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.target, "target", this) !== false &&
            (!this.arguments || this.arguments.each(callback, scope));
    };
    return NewExpression;
}(Expression));
exports.NewExpression = NewExpression;
/**
 * 表示一个 new.target 表达式(`new.target`)。
 */
var NewTargetExpression = (function (_super) {
    __extends(NewTargetExpression, _super);
    function NewTargetExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    NewTargetExpression.prototype.accept = function (vistior) {
        return vistior.visitNewTargetExpression(this);
    };
    return NewTargetExpression;
}(Expression));
exports.NewTargetExpression = NewTargetExpression;
/**
 * 表示一个一元运算表达式(`+x、typeof x、...`)。
 */
var UnaryExpression = (function (_super) {
    __extends(UnaryExpression, _super);
    function UnaryExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(UnaryExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.operand.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    UnaryExpression.prototype.accept = function (vistior) {
        return vistior.visitUnaryExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    UnaryExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.operand, "operand", this) !== false;
    };
    return UnaryExpression;
}(Expression));
exports.UnaryExpression = UnaryExpression;
/**
 * 表示一个后缀增量运算表达式(`x++`、`x--`)。
 */
var PostfixIncrementExpression = (function (_super) {
    __extends(PostfixIncrementExpression, _super);
    function PostfixIncrementExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(PostfixIncrementExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.operand.start; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    PostfixIncrementExpression.prototype.accept = function (vistior) {
        return vistior.visitIncrementExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    PostfixIncrementExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.operand, "operand", this) !== false;
    };
    return PostfixIncrementExpression;
}(Expression));
exports.PostfixIncrementExpression = PostfixIncrementExpression;
/**
 * 表示一个二元运算表达式(`x + y、x = y、...`)。
 */
var BinaryExpression = (function (_super) {
    __extends(BinaryExpression, _super);
    function BinaryExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(BinaryExpression.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.leftOperand.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BinaryExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.rightOperand.end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    BinaryExpression.prototype.accept = function (vistior) {
        return vistior.visitBinaryExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    BinaryExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.leftOperand, "leftOperand", this) !== false &&
            callback.call(scope, this.rightOperand, "rightOperand", this) !== false;
    };
    return BinaryExpression;
}(Expression));
exports.BinaryExpression = BinaryExpression;
/**
 * 表示一个 yield 表达式(`yield x、yield * x`)。
 */
var YieldExpression = (function (_super) {
    __extends(YieldExpression, _super);
    function YieldExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(YieldExpression.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.operand ? this.operand.end : this.start + 5 /*'yield'.length*/; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    YieldExpression.prototype.accept = function (vistior) {
        return vistior.visitYieldExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    YieldExpression.prototype.each = function (callback, scope) {
        return (!this.operand || callback.call(scope, this.operand, "operand", this) !== false);
    };
    return YieldExpression;
}(Expression));
exports.YieldExpression = YieldExpression;
/**
 * 表示一个条件表达式(`x ? y : z`)。
 */
var ConditionalExpression = (function (_super) {
    __extends(ConditionalExpression, _super);
    function ConditionalExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ConditionalExpression.prototype.accept = function (vistior) {
        return vistior.visitConditionalExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ConditionalExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.condition, "condition", this) !== false &&
            callback.call(scope, this.thenExpression, "thenExpression", this) !== false &&
            callback.call(scope, this.elseExpression, "elseExpression", this) !== false;
    };
    return ConditionalExpression;
}(Expression));
exports.ConditionalExpression = ConditionalExpression;
/**
 * 表示一个类型确认表达式(`<T>xx`)。
 */
var TypeAssertionExpression = (function (_super) {
    __extends(TypeAssertionExpression, _super);
    function TypeAssertionExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TypeAssertionExpression.prototype.accept = function (vistior) {
        return vistior.visitTypeCastExpression(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    TypeAssertionExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.type, "type", this) !== false &&
            callback.call(scope, this.operand, "operand", this) !== false;
    };
    return TypeAssertionExpression;
}(Expression));
exports.TypeAssertionExpression = TypeAssertionExpression;
// #endregion
// #region Jsx 节点
/**
 * 表示一个 Jsx 节点(`<div>...</div>`)。
 */
var JsxNode = (function (_super) {
    __extends(JsxNode, _super);
    function JsxNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return JsxNode;
}(Expression));
exports.JsxNode = JsxNode;
/**
 * 表示一个 JSX 标签(`<div>...</div>`)。
 */
var JsxElement = (function (_super) {
    __extends(JsxElement, _super);
    function JsxElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    JsxElement.prototype.accept = function (vistior) {
        return vistior.visitJsxElement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    JsxElement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.tagName, "tagName", this) !== false &&
            this.attributes.each(callback, scope) &&
            this.children.each(callback, scope);
    };
    return JsxElement;
}(JsxNode));
exports.JsxElement = JsxElement;
/**
 * 表示一个 JSX 标签属性(`id="a"`)。
 */
var JsxAttribute = (function (_super) {
    __extends(JsxAttribute, _super);
    function JsxAttribute() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    JsxAttribute.prototype.each = function (callback, scope) {
        return callback.call(scope, this.name, "name", this) !== false &&
            (!this.value || callback.call(scope, this.value, "value", this) !== false);
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    JsxAttribute.prototype.accept = function (vistior) {
        return vistior.visitJsxAttribute(this);
    };
    return JsxAttribute;
}(JsxNode));
exports.JsxAttribute = JsxAttribute;
/**
 * 表示一个 JSX 文本(`{...}`)。
 */
var JsxText = (function (_super) {
    __extends(JsxText, _super);
    function JsxText() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    JsxText.prototype.accept = function (vistior) {
        return vistior.visitJsxText(this);
    };
    return JsxText;
}(JsxNode));
exports.JsxText = JsxText;
/**
 * 表示一个 JSX 表达式(`{...}`)。
 */
var JsxExpression = (function (_super) {
    __extends(JsxExpression, _super);
    function JsxExpression() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    JsxExpression.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    JsxExpression.prototype.accept = function (vistior) {
        return vistior.visitJsxExpression(this);
    };
    return JsxExpression;
}(JsxNode));
exports.JsxExpression = JsxExpression;
/**
 * 表示一个 JSX 关闭元素(`{...}`)。
 */
var JsxClosingElement = (function (_super) {
    __extends(JsxClosingElement, _super);
    function JsxClosingElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    JsxClosingElement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.tagName, "tagName", this) !== false;
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    JsxClosingElement.prototype.accept = function (vistior) {
        return vistior.visitJsxClosingElement(this);
    };
    return JsxClosingElement;
}(JsxNode));
exports.JsxClosingElement = JsxClosingElement;
// #endregion
// #region 类型
/**
 * 表示一个类型节点(`number`、`string[]`、...)。
 */
var TypeNode = (function (_super) {
    __extends(TypeNode, _super);
    function TypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TypeNode;
}(Node));
exports.TypeNode = TypeNode;
/**
 * 表示一个简单类型节点(`number`、`string`、...)。
 */
var SimpleTypeNode = (function (_super) {
    __extends(SimpleTypeNode, _super);
    function SimpleTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(SimpleTypeNode.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return this.start + tokenType_1.tokenToString(this.type).length; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    SimpleTypeNode.prototype.accept = function (vistior) {
        return vistior.visitSimpleTypeNode(this);
    };
    return SimpleTypeNode;
}(TypeNode));
exports.SimpleTypeNode = SimpleTypeNode;
/**
 * 表示一个泛型节点(`Array<T>`)。
 */
var GenericTypeNode = (function (_super) {
    __extends(GenericTypeNode, _super);
    function GenericTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    GenericTypeNode.prototype.accept = function (vistior) {
        return vistior.visitGenericTypeNode(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    GenericTypeNode.prototype.each = function (callback, scope) {
        return callback.call(scope, this.element, "element", this) !== false &&
            this.typeArguments.each(callback, scope);
    };
    return GenericTypeNode;
}(TypeNode));
exports.GenericTypeNode = GenericTypeNode;
/**
 * 表示一个数组类型节点(`T[]`)。
 */
var ArrayTypeNode = (function (_super) {
    __extends(ArrayTypeNode, _super);
    function ArrayTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrayTypeNode.prototype.accept = function (vistior) {
        return vistior.visitArrayTypeNode(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrayTypeNode.prototype.each = function (callback, scope) {
        return callback.call(scope, this.element, "element", this) !== false;
    };
    return ArrayTypeNode;
}(TypeNode));
exports.ArrayTypeNode = ArrayTypeNode;
/**
 * 表示一个函数类型节点(`()=>void`)。
 */
var FunctionTypeNode = (function (_super) {
    __extends(FunctionTypeNode, _super);
    function FunctionTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    FunctionTypeNode.prototype.accept = function (vistior) {
        return vistior.visitFunctionTypeNode(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    FunctionTypeNode.prototype.each = function (callback, scope) {
        return (!this.typeParameters || this.typeParameters.each(callback, scope));
    };
    return FunctionTypeNode;
}(TypeNode));
exports.FunctionTypeNode = FunctionTypeNode;
/**
 * 表示一个构造函数类型节点(`new ()=>void`)。
 */
var ConstructorTypeNode = (function (_super) {
    __extends(ConstructorTypeNode, _super);
    function ConstructorTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ConstructorTypeNode.prototype.accept = function (vistior) {
        return vistior.visitConstructorTypeNode(this);
    };
    return ConstructorTypeNode;
}(TypeNode));
exports.ConstructorTypeNode = ConstructorTypeNode;
/**
 * 表示一个元祖类型节点(`[string, number]`)。
 */
var TupleTypeNode = (function (_super) {
    __extends(TupleTypeNode, _super);
    function TupleTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TupleTypeNode.prototype.accept = function (vistior) {
        return vistior.visitTupleTypeNode(this);
    };
    return TupleTypeNode;
}(TypeNode));
exports.TupleTypeNode = TupleTypeNode;
/**
 * 表示一个联合类型节点(`number | string`)。
 */
var UnionTypeNode = (function (_super) {
    __extends(UnionTypeNode, _super);
    function UnionTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    UnionTypeNode.prototype.accept = function (vistior) {
        return vistior.visitUnionTypeNode(this);
    };
    return UnionTypeNode;
}(TypeNode));
exports.UnionTypeNode = UnionTypeNode;
/**
 * 表示一个交错类型节点(`number & string`)。
 */
var IntersectionTypeNode = (function (_super) {
    __extends(IntersectionTypeNode, _super);
    function IntersectionTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    IntersectionTypeNode.prototype.accept = function (vistior) {
        return vistior.visitIntersectionTypeNode(this);
    };
    return IntersectionTypeNode;
}(TypeNode));
exports.IntersectionTypeNode = IntersectionTypeNode;
/**
 * 表示一个对象类型节点(`{x: string}`)。
 */
var ObjectTypeNode = (function (_super) {
    __extends(ObjectTypeNode, _super);
    function ObjectTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ObjectTypeNode.prototype.accept = function (vistior) {
        return vistior.visitObjectTypeNode(this);
    };
    return ObjectTypeNode;
}(TypeNode));
exports.ObjectTypeNode = ObjectTypeNode;
/**
 * 表示一个类型查询节点(`typeof x`)。
 */
var TypeQueryNode = (function (_super) {
    __extends(TypeQueryNode, _super);
    function TypeQueryNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TypeQueryNode.prototype.accept = function (vistior) {
        return vistior.visitTypeQueryNode(this);
    };
    return TypeQueryNode;
}(TypeNode));
exports.TypeQueryNode = TypeQueryNode;
/**
 * 表示一个括号类型节点(`(number)`)。
 */
var ParenthesizedTypeNode = (function (_super) {
    __extends(ParenthesizedTypeNode, _super);
    function ParenthesizedTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ParenthesizedTypeNode.prototype.accept = function (vistior) {
        return vistior.visitParenthesizedTypeNode(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ParenthesizedTypeNode.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    return ParenthesizedTypeNode;
}(TypeNode));
exports.ParenthesizedTypeNode = ParenthesizedTypeNode;
/**
 * 表示一个表达式类型节点(`"abc"`、`true`)。
 */
var ExpressionTypeNode = (function (_super) {
    __extends(ExpressionTypeNode, _super);
    function ExpressionTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ExpressionTypeNode.prototype.accept = function (vistior) {
        return vistior.visitExpressionTypeNode(this);
    };
    return ExpressionTypeNode;
}(TypeNode));
exports.ExpressionTypeNode = ExpressionTypeNode;
/**
 * 表示一个限定名称类型节点(`"abc"`、`true`)。
 */
var QualifiedNameTypeNode = (function (_super) {
    __extends(QualifiedNameTypeNode, _super);
    function QualifiedNameTypeNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    QualifiedNameTypeNode.prototype.accept = function (vistior) {
        return vistior.visitQualifiedNameTypeNode(this);
    };
    return QualifiedNameTypeNode;
}(TypeNode));
exports.QualifiedNameTypeNode = QualifiedNameTypeNode;
/**
 * 表示一个类型别名声明(`type A = number`)。
 */
var TypeAliasDeclaration = (function (_super) {
    __extends(TypeAliasDeclaration, _super);
    function TypeAliasDeclaration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    TypeAliasDeclaration.prototype.accept = function (vistior) {
        return vistior.visitTypeAliasDeclaration(this);
    };
    return TypeAliasDeclaration;
}(Statement));
exports.TypeAliasDeclaration = TypeAliasDeclaration;
/**
 * 表示一个数组绑定模式项(`[xx]`)。
 */
var ArrayBindingPattern = (function (_super) {
    __extends(ArrayBindingPattern, _super);
    function ArrayBindingPattern() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrayBindingPattern.prototype.accept = function (vistior) {
        return vistior.visitArrayBindingPattern(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrayBindingPattern.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope);
    };
    return ArrayBindingPattern;
}(Node));
exports.ArrayBindingPattern = ArrayBindingPattern;
/**
 * 表示一个数组绑定模式项(xx、..)
 */
var ArrayBindingElement = (function (_super) {
    __extends(ArrayBindingElement, _super);
    function ArrayBindingElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ArrayBindingElement.prototype, "dotDotDot", {
        /**
         * 获取当前绑定模式项的点点点位置(可能不存在)。
         */
        get: function () { return this.name.start > this.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ArrayBindingElement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this.initializer || this.name).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ArrayBindingElement.prototype.accept = function (vistior) {
        return vistior.visitArrayBindingElement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ArrayBindingElement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.initializer, "initializer", this) !== false;
    };
    /**
     * 获取空绑定。
     */
    ArrayBindingElement.empty = Object.freeze(new ArrayBindingElement());
    return ArrayBindingElement;
}(Node));
exports.ArrayBindingElement = ArrayBindingElement;
/**
 * 表示一个对象绑定模式项(`{xx: xx}`)。
 */
var ObjectBindingPattern = (function (_super) {
    __extends(ObjectBindingPattern, _super);
    function ObjectBindingPattern() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ObjectBindingPattern.prototype.each = function (callback, scope) {
        return this.elements.each(callback, scope);
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ObjectBindingPattern.prototype.accept = function (vistior) {
        return vistior.visitObjectBindingPattern(this);
    };
    return ObjectBindingPattern;
}(Node));
exports.ObjectBindingPattern = ObjectBindingPattern;
/**
 * 表示一个对象绑定模式项(xx: y)
 */
var ObjectBindingElement = (function (_super) {
    __extends(ObjectBindingElement, _super);
    function ObjectBindingElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ObjectBindingElement.prototype, "start", {
        /**
         * 获取当前节点的开始位置。
         */
        get: function () { return this.propertyName.start; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObjectBindingElement.prototype, "end", {
        /**
         * 获取当前节点的结束位置。
         */
        get: function () { return (this.initializer || this.name || this.propertyName).end; },
        enumerable: true,
        configurable: true
    });
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ObjectBindingElement.prototype.accept = function (vistior) {
        return vistior.visitObjectBindingElement(this);
    };
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ObjectBindingElement.prototype.each = function (callback, scope) {
        return callback.call(scope, this.initializer, "initializer", this) !== false;
    };
    return ObjectBindingElement;
}(Node));
exports.ObjectBindingElement = ObjectBindingElement;
/**
 * 表示一个已计算的属性名。
 */
var ComputedPropertyName = (function (_super) {
    __extends(ComputedPropertyName, _super);
    function ComputedPropertyName() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 遍历当前节点的所有直接子节点，并对每一项执行 *callback*。
     * @param callback 对每个子节点执行的回调函数。
     * @param scope 设置 *callback* 执行时 this 的值。
     * @returns 如果遍历是因为 *callback* 返回 false 而中止，则返回 false，否则返回 true。
     */
    ComputedPropertyName.prototype.each = function (callback, scope) {
        return callback.call(scope, this.body, "body", this) !== false;
    };
    /**
     * 使用指定的节点访问器处理当前节点。
     * @param vistior 要使用的节点访问器。
     * @returns 返回访问器的处理结果。
     */
    ComputedPropertyName.prototype.accept = function (vistior) {
        return vistior.visitComputedPropertyName(this);
    };
    return ComputedPropertyName;
}(Node));
exports.ComputedPropertyName = ComputedPropertyName;
// #endregion
