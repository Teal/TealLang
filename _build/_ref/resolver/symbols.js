"use strict";
/**
 * @fileOverview 标识
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
// #region 标识
/**
 * 表示一个标识（如变量、参数、表达式和成员引用等）。
 */
var Symbol = (function () {
    function Symbol() {
    }
    return Symbol;
}());
exports.Symbol = Symbol;
// #endregion
// #region 成员
/**
 * 表示一个成员标识。
 */
var MemberSymbol = (function (_super) {
    __extends(MemberSymbol, _super);
    function MemberSymbol() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * 获取当前类型指定名称的成员。
     * @param name 要获取的名称。
     * @returns 返回对应的成员。如果找不到则返回 undefined。
     */
    MemberSymbol.prototype.getMember = function (name) {
        return this.getOwnMember(name) || this.proto.getMember(name);
    };
    /**
     * 获取当前类型所属的指定名称的成员。
     * @param name 要获取的名称。
     * @returns 返回对应的成员。如果找不到则返回 undefined。
     */
    MemberSymbol.prototype.getOwnMember = function (name) {
        if (name === "__proto__") {
            return this.proto;
        }
        return this.members && this.members[name];
    };
    return MemberSymbol;
}(Symbol));
exports.MemberSymbol = MemberSymbol;
/**
 * 表示成员修饰符的枚举。
 */
var Modifiers;
(function (Modifiers) {
    /**
     * 无修饰符。
     */
    Modifiers[Modifiers["none"] = 0] = "none";
    /**
     * 表示静态的成员。
     */
    Modifiers[Modifiers["static"] = 1] = "static";
    /**
     * 表示最终的成员。标记当前类不可被继承、函数不可被重写、字段不可被改变。
     */
    Modifiers[Modifiers["final"] = 2] = "final";
    /**
     * 表示覆盖的成员。
     */
    Modifiers[Modifiers["new"] = 3] = "new";
    /**
     * 表示抽象的成员。
     */
    Modifiers[Modifiers["abstract"] = 4] = "abstract";
    /**
     * 表示虚成员。
     */
    Modifiers[Modifiers["virtual"] = 5] = "virtual";
    /**
     * 表示重写的成员。
     */
    Modifiers[Modifiers["override"] = 6] = "override";
    /**
     * 表示外部的成员。
     */
    Modifiers[Modifiers["declare"] = 7] = "declare";
    /**
     * 表示公开的成员。
     */
    Modifiers[Modifiers["public"] = 8] = "public";
    /**
     * 表示保护的成员。
     */
    Modifiers[Modifiers["protected"] = 9] = "protected";
    /**
     * 表示私有的成员。
     */
    Modifiers[Modifiers["private"] = 10] = "private";
    /**
     * 表示访问修饰符。
     */
    Modifiers[Modifiers["accessibility"] = 11] = "accessibility";
})(Modifiers = exports.Modifiers || (exports.Modifiers = {}));
/**
 * 表示一个方法标识。
 */
var MethodSymbol = (function (_super) {
    __extends(MethodSymbol, _super);
    function MethodSymbol() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MethodSymbol;
}(MemberSymbol));
exports.MethodSymbol = MethodSymbol;
// #endregion
// #region 类型
/**
 * 表示一个类型（如类、结构、接口、枚举）标识。
 */
var TypeSymbol = (function (_super) {
    __extends(TypeSymbol, _super);
    function TypeSymbol() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TypeSymbol;
}(Symbol));
exports.TypeSymbol = TypeSymbol;
/**
 * 表示一个类型标识。
 */
var GenericTypeSymbol = (function (_super) {
    __extends(GenericTypeSymbol, _super);
    function GenericTypeSymbol() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GenericTypeSymbol;
}(TypeSymbol));
exports.GenericTypeSymbol = GenericTypeSymbol;
/**
 * 表示一个类型（如类、结构、接口、枚举）标识。
 */
var PrimaryTypeSymbol = (function (_super) {
    __extends(PrimaryTypeSymbol, _super);
    function PrimaryTypeSymbol(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    return PrimaryTypeSymbol;
}(Symbol));
exports.PrimaryTypeSymbol = PrimaryTypeSymbol;
// #endregion 
