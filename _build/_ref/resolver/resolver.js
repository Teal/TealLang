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
var nodeVisitor_1 = require("../ast/nodeVisitor");
var symbols = require("./symbols");
/**
 * 表示一个语义分析器。
 */
var Resolver = (function () {
    /**
     * 初始化新的语义分析器。
     * @param pkg 要分析的包。
     */
    function Resolver(pkg) {
        _this = _super.call(this) || this;
        this.anyType = new symbols.PrimaryTypeSymbol("any");
        this.nullType = new symbols.PrimaryTypeSymbol("null");
        /**
         * 获取内置的 boolean 类型。
         */
        this.booleanType = new symbols.PrimaryTypeSymbol("boolean");
        this.typeResolver = new TypeResolver(this);
        this.package = pkg;
        // 初始化语法树以便语义分析。
    }
    /**
     * 启用语义分析。
     */
    Resolver.prototype.enable = function () {
    };
    /**
     * 禁用语义分析。此操作可能使正在进行的语义分析终止。
     */
    Resolver.prototype.disable = function () {
    };
    /**
     * 解析指定表达式的返回类型。
     * @param node 要获取的节点。
     */
    Resolver.prototype.resolveTypeOfExpression = function (node) {
        return node.accept(this.typeResolver);
    };
    /**
     * 获取指定标识符的标识。
     * @param node 要获取的节点。
     */
    Resolver.prototype.resolveSymbolOfIdentifier = function (node) {
    };
    /**
     *
     * @param block
     * @param name
     */
    Resolver.prototype.resolveValueOfString = function (block, name) {
    };
    return Resolver;
}());
exports.Resolver = Resolver;
/**
 * 表示一个类型解析器。
 */
var TypeResolver = (function (_super) {
    __extends(TypeResolver, _super);
    /**
     * 初始化新的类型解析器。
     * @param resovler 当前使用的解析器。
     */
    function TypeResolver(resovler) {
        var _this = _super.call(this) || this;
        _this.resovler = resovler;
        return _this;
    }
    // #region 节点访问器
    /**
     * 访问一个逗号隔开的节点列表(<..., ...>。
     * @param nodes 要访问的节点列表。
     */
    TypeResolver.prototype.visitNodeList = function (nodes) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            node.accept(this);
        }
    };
    /**
     * 访问一个源文件。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitSourceFile = function (node) {
        node.comments && node.comments.accept(this);
        node.jsDoc && node.jsDoc.accept(this);
        node.statements.accept(this);
    };
    /**
     * 访问一个空语句(;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitEmptyStatement = function (node) {
    };
    /**
     * 访问一个语句块({...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitBlock = function (node) {
        node.statements.accept(this);
    };
    /**
     * 访问一个变量声明语句(var xx = ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitVariableStatement = function (node) {
        node.decorators.accept(this);
        node.variables.accept(this);
    };
    /**
     * 访问一个标签语句(xx: ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitLabeledStatement = function (node) {
        node.label.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个表达式语句(...;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitExpressionStatement = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 if 语句(if(...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitIfStatement = function (node) {
        node.condition.accept(this);
        node.then.accept(this);
        node.elseToken && node.elseToken.accept(this);
    };
    /**
     * 访问一个 switch 语句(switch(...){...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitSwitchStatement = function (node) {
        node.condition && node.condition.accept(this);
        node.cases.accept(this);
    };
    /**
     * 访问一个 switch 语句的 case 分支(case ...:{...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitCaseClause = function (node) {
        node.label && node.label.accept(this);
        node.statements.accept(this);
    };
    /**
     * 访问一个 for 语句(for(...; ...; ...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitForStatement = function (node) {
        node.initializer && node.initializer.accept(this);
        node.condition && node.condition.accept(this);
        node.iterator && node.iterator.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..in 语句(for(var xx in ...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitForInStatement = function (node) {
        node.variable.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..of 语句(for(var xx of ...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitForOfStatement = function (node) {
        node.variable.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..to 语句(for(var xx = ... to ...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitForToStatement = function (node) {
        node.variable.accept(this);
        node.initializer && node.initializer.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 while 语句(while(...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitWhileStatement = function (node) {
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 do..while 语句(do {...} while(...);)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitDoWhileStatement = function (node) {
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 continue 语句(continue;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitContinueStatement = function (node) {
        node.label && node.label.accept(this);
    };
    /**
     * 访问一个 break 语句(break;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitBreakStatement = function (node) {
        node.label && node.label.accept(this);
    };
    /**
     * 访问一个 return 语句(return ...;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitReturnStatement = function (node) {
        node.value && node.value.accept(this);
    };
    /**
     * 访问一个 throw 语句(throw ...;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitThrowStatement = function (node) {
        node.value.accept(this);
    };
    /**
     * 访问一个 try 语句(try {...} catch(e) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitTryStatement = function (node) {
        node["try"].accept(this);
        node["catch"].accept(this);
        node["finally"].accept(this);
    };
    /**
     * 访问一个 try 语句的 catch 分句(catch(e) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitCatchClause = function (node) {
        node.variable.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 try 语句的 finally 分句(finally {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitFinallyClause = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 debugger 语句(debugger;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitDebuggerStatement = function (node) {
    };
    /**
     * 访问一个 with 语句(with(...) {...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitWithStatement = function (node) {
        node.value.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个标识符(xx)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitIdentifier = function (node) {
    };
    /**
     * 访问 null 字面量(null)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNullLiteral = function (node) {
    };
    /**
     * 访问 true 字面量(true)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitTrueLiteral = function (node) {
    };
    /**
     * 访问 false 字面量(false)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitFalseLiteral = function (node) {
    };
    /**
     * 访问一个浮点数字面量(1)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNumericLiteral = function (node) {
    };
    /**
     * 访问一个字符串字面量('...')。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitStringLiteral = function (node) {
    };
    /**
     * 访问一个正则表达式字面量(/.../)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitRegExpLiteral = function (node) {
        node.flags && node.flags.accept(this);
    };
    /**
     * 访问一个模板字符串字面量(`...`)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitTemplateStringLiteral = function (node) {
        node.tag && node.tag.accept(this);
    };
    /**
     * 访问一个数组字面量([...])。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitArrayLiteral = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个对象字面量({x: ...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitObjectLiteral = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个对象字面量项。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitObjectLiteralElement = function (node) {
        node.name.accept(this);
        node.value.accept(this);
    };
    /**
     * 访问 this 字面量(this)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitThisLiteral = function (node) {
    };
    /**
     * 访问 super 字面量(super)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitSuperLiteral = function (node) {
    };
    /**
     * 访问一个括号表达式((...))。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitParenthesizedExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个条件表达式(... ? ... : ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitConditionalExpression = function (node) {
        node.condition.accept(this);
        node.then.accept(this);
        node["else"].accept(this);
    };
    /**
     * 访问一个成员调用表达式(x.y)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitMemberCallExpression = function (node) {
        node.target.accept(this);
        node.argument.accept(this);
    };
    /**
     * 访问一个函数调用表达式(x(...))。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitCallExpression = function (node) {
        node.target.accept(this);
        node.arguments.accept(this);
    };
    /**
     * 访问一个 new 表达式(new x(...))。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNewExpression = function (node) {
        node.target.accept(this);
        node.arguments.accept(this);
    };
    /**
     * 访问一个索引调用表达式(x[...])。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitIndexCallExpression = function (node) {
        node.target.accept(this);
        node.arguments.accept(this);
    };
    /**
     * 访问一个一元运算表达式(+x)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitUnaryExpression = function (node) {
        node.operand.accept(this);
    };
    /**
     * 访问一个二元运算表达式(x + y)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitBinaryExpression = function (node) {
        node.leftOperand.accept(this);
        node.rightOperand.accept(this);
    };
    /**
     * 访问一个箭头函数(x => ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitLambdaLiteral = function (node) {
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 yield 表达式(yield xx)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitYieldExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个类型转换表达式(<T>xx)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitCastExpression = function (node) {
        node.type.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问内置类型字面量(number)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitPredefinedTypeLiteral = function (node) {
    };
    /**
     * 访问一个泛型表达式(Array<T>)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitGenericTypeExpression = function (node) {
        node.element.accept(this);
        node.genericArguments.accept(this);
    };
    /**
     * 访问一个数组类型表达式(T[])。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitArrayTypeExpression = function (node) {
        node.element.accept(this);
    };
    /**
     * 访问一个 JSX 标签（<div>...</div>)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsxElement = function (node) {
        node.tagName.accept(this);
        node.attributes.accept(this);
        node.children.accept(this);
    };
    /**
     * 访问一个 JSX 标签属性（id="a")。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsxAttribute = function (node) {
        node.name.accept(this);
        node.value && node.value.accept(this);
    };
    /**
     * 访问一个 JSX 表达式（{...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsxExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 JSX 文本（{...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsxText = function (node) {
    };
    /**
     * 访问一个 JSX 文本（{...})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsxClosingElement = function (node) {
        node.tagName.accept(this);
    };
    /**
     * 访问一个描述器(@xx(...))。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitDecorator = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个修饰符(public)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitModifier = function (node) {
    };
    /**
     * 访问一个类定义(@class ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitClassDefinition = function (node) {
        node["extends"].accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个接口定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitInterfaceDefinition = function (node) {
        node["extends"].accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个枚举定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitEnumDefinition = function (node) {
        node.members.accept(this);
        node["extends"].accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个扩展定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitExtensionDefinition = function (node) {
        node.targetType.accept(this);
        node.implements.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个命名空间定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNamespaceDefinition = function (node) {
        node.names.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个模块。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitModuleDefinition = function (node) {
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个类型子成员定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitTypeMemberDefinition = function (node) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个字段定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitFieldDefinition = function (node) {
        node.variables.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个方法或属性定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitMethodOrPropertyDefinition = function (node) {
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个属性或索引器定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitPropertyOrIndexerDefinition = function (node) {
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个属性定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitPropertyDefinition = function (node) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个索引器定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitIndexerDefinition = function (node) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个方法或构造函数定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitMethodOrConstructorDefinition = function (node) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个方法定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitMethodDefinition = function (node) {
        node.genericParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个构造函数定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitConstructorDefinition = function (node) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个枚举的成员定义。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitEnumMemberDefinition = function (node) {
        node.initializer.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    };
    /**
     * 访问一个 import 指令(import xx from '...';)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitImportDirective = function (node) {
        node.elements.accept(this);
        node.fromToken.accept(this);
    };
    /**
     * 访问一个 import = 指令(import xx = require("");)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitImportEqualsDirective = function (node) {
        node.variable.accept(this);
        node.value.accept(this);
    };
    /**
     * 访问一个名字导入声明项(a as b)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNameImportClause = function (node) {
        node.name && node.name.accept(this);
        node.alias.accept(this);
    };
    /**
     * 访问一个命名空间导入声明项({a as b})。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitNamespaceImportClause = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个 export 指令(export xx from '...';)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitExportDirective = function (node) {
        node.elements.accept(this);
        node.fromToken.accept(this);
    };
    /**
     * 访问一个 export = 指令(export = 1;)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitExportEqualsDirective = function (node) {
        node.value.accept(this);
    };
    /**
     * 访问一个数组绑定模式([xx, ...])
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitArrayBindingPattern = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个数组绑定模式项(xx, ..)
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitArrayBindingElement = function (node) {
        node.initializer.accept(this);
        node.name.accept(this);
    };
    /**
     * 访问一个对象绑定模式({xx, ...})
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitObjectBindingPattern = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个对象绑定模式项(xx: y)
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitObjectBindingElement = function (node) {
        node.propertyName.accept(this);
        node.name.accept(this);
    };
    /**
     * 访问一个变量声明(xx = ...)。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitVariableDeclaration = function (node) {
        node.type.accept(this);
        node.initializer.accept(this);
        node.name.accept(this);
    };
    /**
     * 访问一个参数声明。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitParameterDeclaration = function (node) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name.accept(this);
    };
    /**
     * 访问一个泛型参数。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitGenericParameterDeclaration = function (node) {
        node.name.accept(this);
        node.constraint && node.constraint.accept(this);
    };
    /**
     * 访问一个 JS 注释。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitComment = function (node) {
    };
    /**
     * 访问一个 JS 文档注释。
     * @param node 要访问的节点。
     */
    TypeResolver.prototype.visitJsDocComment = function (node) {
    };
    return TypeResolver;
}(nodeVisitor_1.NodeVisitor));
