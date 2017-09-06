"use strict";
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
/**
 * 表示一个操作。
 */
var Operation = (function () {
    function Operation() {
    }
    return Operation;
}());
exports.Operation = Operation;
/**
 * 表示一个常量定义操作（%1 = 1）。
 */
var ConstantOperation = (function (_super) {
    __extends(ConstantOperation, _super);
    function ConstantOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ConstantOperation;
}(Operation));
exports.ConstantOperation = ConstantOperation;
/**
 * 表示一个单目操作（%1 = +%2）。
 */
var UnaryOperation = (function (_super) {
    __extends(UnaryOperation, _super);
    function UnaryOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnaryOperation;
}(Operation));
exports.UnaryOperation = UnaryOperation;
/**
 * 表示一个双目操作（%1 = %2 + %3）。
 */
var BinaryOperation = (function (_super) {
    __extends(BinaryOperation, _super);
    function BinaryOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BinaryOperation;
}(Operation));
exports.BinaryOperation = BinaryOperation;
/**
 * 表示一个跳转操作（goto #1）。
 */
var GotoOperation = (function (_super) {
    __extends(GotoOperation, _super);
    function GotoOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GotoOperation;
}(Operation));
exports.GotoOperation = GotoOperation;
/**
 * 表示一个判断跳转操作（if %1 goto #1）。
 */
var GotoIfOperation = (function (_super) {
    __extends(GotoIfOperation, _super);
    function GotoIfOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GotoIfOperation;
}(GotoOperation));
exports.GotoIfOperation = GotoIfOperation;
/**
 * 表示一个函数调用操作（call %1(...)）。
 */
var CallOperation = (function (_super) {
    __extends(CallOperation, _super);
    function CallOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CallOperation;
}(Operation));
exports.CallOperation = CallOperation;
/**
 * 表示一个成员引用操作（%1 = %1.foo）。
 */
var MemberOperation = (function (_super) {
    __extends(MemberOperation, _super);
    function MemberOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MemberOperation;
}(Operation));
exports.MemberOperation = MemberOperation;
/**
 * 表示一个索引操作（%1 = %1[%2]）。
 */
var IndexerOperation = (function (_super) {
    __extends(IndexerOperation, _super);
    function IndexerOperation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IndexerOperation;
}(Operation));
exports.IndexerOperation = IndexerOperation;
