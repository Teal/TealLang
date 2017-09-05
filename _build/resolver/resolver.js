"use strict";
exports.__esModule = true;
var operation = require("./operation");
var type = require("./type");
/**
 * 表示一个函数主体。
 */
var FunctionBody = (function () {
    function FunctionBody() {
    }
    return FunctionBody;
}());
exports.FunctionBody = FunctionBody;
/**
 * 表示一个执行分支。
 */
var Branch = (function () {
    function Branch() {
        /**
         * 当前分支开始执行的第一个操作符索引
         */
        this.start = 0;
    }
    /**
     * 报告当前分支的错误。
     * @param message 错误信息。
     * @param args 错误参数列表。
     */
    Branch.prototype.error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    /**
     * 判断当前分支是否包含指定的操作码索引。
     * @param index 要判断的操作码索引。
     * @return 如果包含则返回 true，否则返回 false。
     */
    Branch.prototype.contains = function (index) {
        if (index >= this.start && index <= this.end) {
            return true;
        }
        if (this.parent) {
            return this.parent.contains(index);
        }
        return false;
    };
    /**
     * 获取当前分支变量的值。
     * @param name 要获取的变量名。
     * @return 返回变量的类型。如果变量是一个引用则自动计算。如果变量不存在则返回 null。
     */
    Branch.prototype.get = function (name) {
    };
    /**
     * 设置当前分支变量的值。
     * @param name 要设置的变量名。
     * @param value 要设置的变量值。
     */
    Branch.prototype.set = function (name, value) {
    };
    return Branch;
}());
exports.Branch = Branch;
/**
 * 表示一个变量。
 */
var Variable = (function () {
    function Variable() {
    }
    return Variable;
}());
exports.Variable = Variable;
var ResolveContext = (function () {
    function ResolveContext() {
    }
    return ResolveContext;
}());
exports.ResolveContext = ResolveContext;
//
// a = 1
// a = a + 1
// if a > 2 goto #61
// goto #58
/**
 * 解析指定的字节码。
 * @param operations 要解析的操作列表。
 * @param branch 初始的分支。
 * @return 返回执行结束的所有分支。
 */
function resolve(operations, branch) {
    var result = [];
    for (var i = branch.start; i < operations.length; i++) {
        var op = operations[i];
        switch (op.constructor) {
            case operation.ConstantOperation:
                branch.set(op.result, type.createTypeFromConstant(op.value));
                break;
            case operation.UnaryOperation:
                var operand = branch.get(op.operand);
                if (!operand) {
                    branch.error("Variable {0} is not defined in current branch.", op.operand);
                }
                else {
                    // TODO: 将 operand 引用转为类型。
                    switch (op.operator) {
                        case "+":
                            branch.set(op.result, operand.positive());
                            break;
                        case "-":
                            branch.set(op.result, operand.negative());
                            break;
                    }
                }
                break;
            case operation.GotoOperation:
                branch.end = i;
                // 如果当前分支已包含目标字节码，则重新执行会导致死循环。
                if (!branch.contains(op.target)) {
                    var childBranch = new Branch();
                    childBranch.parent = branch;
                    childBranch.start = op.target;
                    result.push.apply(result, resolve(operations, childBranch));
                }
                return result;
        }
    }
    result.push(branch);
    return result;
}
exports.resolve = resolve;
