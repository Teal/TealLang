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
 * 表示一个类型。
 */
var Type = (function () {
    function Type() {
        /**
         * 当前类型的属性。
         */
        this.properties = {};
    }
    /**
     * 对当前类型各属性执行正操作。
     */
    Type.prototype.positive = function () {
        return this;
    };
    /**
     * 对当前类型各属性执行负操作。
     */
    Type.prototype.negative = function () {
    };
    return Type;
}());
exports.Type = Type;
/**
 * 表示一个联合类型。
 */
var UnionType = (function (_super) {
    __extends(UnionType, _super);
    function UnionType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnionType;
}(Type));
exports.UnionType = UnionType;
/**
 * 表示一个数字类型。
 */
var NumberType = (function (_super) {
    __extends(NumberType, _super);
    function NumberType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 对当前类型各属性执行负操作。
     */
    NumberType.prototype.negative = function () {
        if (this["const"]) {
            return createTypeFromConstant(-this.value);
        }
        var result = new NumberType();
        result.base = this.base;
        result.properties.precision = this.properties.precision;
        if (this.properties.min != null) {
            result.properties.max = -this.properties.min;
        }
        if (this.properties.max != null) {
            result.properties.min = -this.properties.max;
        }
        return result;
    };
    return NumberType;
}(Type));
exports.NumberType = NumberType;
function createTypeFromConstant(value) {
    if (typeof value === "number") {
        var result = new NumberType();
        result["const"] = true;
        result.value = value;
        return result;
    }
}
exports.createTypeFromConstant = createTypeFromConstant;
