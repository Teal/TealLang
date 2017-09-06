"use strict";
/**
 * @fileOverview 节点访问器
 * @generated 此文件可使用 `$ tpack gen-nodes` 命令生成。
 */
exports.__esModule = true;
/**
 * 表示一个节点访问器。
 */
var NodeVisitor = (function () {
    function NodeVisitor() {
    }
    /**
     * 访问一个逗号隔开的节点列表(<..., ...>。
     * @param nodes 要访问的节点列表。
     */
    NodeVisitor.prototype.visitNodeList = function (nodes) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            node.accept(this);
        }
    };
    /**
     * 访问一个源文件。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitSourceFile = function (node) {
        node.statements.accept(this);
    };
    /**
     * 访问一个语句块(`{...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitBlockStatement = function (node) {
        node.statements.accept(this);
    };
    /**
     * 访问一个变量声明语句(`var xx、let xx、const xx`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitVariableStatement = function (node) {
        node.variables.accept(this);
    };
    /**
     * 访问一个变量声明(`x = 1、[x] = [1]、{a: x} = {a: 1}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitVariableDeclaration = function (node) {
        node.type && node.type.accept(this);
        node.initializer && node.initializer.accept(this);
    };
    /**
     * 访问一个空语句(`;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitEmptyStatement = function (node) {
    };
    /**
     * 访问一个标签语句(`xx: ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitLabeledStatement = function (node) {
        node.label.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个表达式语句(x(`);`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitExpressionStatement = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 if 语句(if(`xx) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitIfStatement = function (node) {
        node.condition.accept(this);
        node.then.accept(this);
        node["else"] && node["else"].accept(this);
    };
    /**
     * 访问一个 switch 语句(switch(`xx){...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitSwitchStatement = function (node) {
        node.condition && node.condition.accept(this);
        node.cases.accept(this);
    };
    /**
     * 访问一个 case 分支(`case ...:{...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitCaseClause = function (node) {
        node.label && node.label.accept(this);
        node.statements.accept(this);
    };
    /**
     * 访问一个 for 语句(for(`var i = 0; i < 9; i++) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitForStatement = function (node) {
        node.initializer && node.initializer.accept(this);
        node.condition && node.condition.accept(this);
        node.iterator && node.iterator.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..in 语句(for(`var x in y) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitForInStatement = function (node) {
        node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..of 语句(for(`var x of y) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitForOfStatement = function (node) {
        node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 for..to 语句(for(`var x = 0 to 10) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitForToStatement = function (node) {
        node.initializer && node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 while 语句(while(`...) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitWhileStatement = function (node) {
        node.condition.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个 do..while 语句(do ... while(`xx);`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitDoWhileStatement = function (node) {
        node.body.accept(this);
        node.condition.accept(this);
    };
    /**
     * 访问一个 continue 语句(`continue xx;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitContinueStatement = function (node) {
        node.label && node.label.accept(this);
    };
    /**
     * 访问一个 break 语句(`break xx;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitBreakStatement = function (node) {
        node.label && node.label.accept(this);
    };
    /**
     * 访问一个 return 语句(`return xx;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitReturnStatement = function (node) {
        node.value && node.value.accept(this);
    };
    /**
     * 访问一个 throw 语句(`throw xx;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitThrowStatement = function (node) {
        node.value.accept(this);
    };
    /**
     * 访问一个 try 语句(try {...} catch(`e) {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTryStatement = function (node) {
        node["try"].accept(this);
        node["catch"] && node["catch"].accept(this);
        node["finally"] && node["finally"].accept(this);
    };
    /**
     * 访问一个 catch 分句(catch(`e) {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitCatchClause = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 finally 分句(`finally {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitFinallyClause = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 debugger 语句(`debugger;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitDebuggerStatement = function (node) {
    };
    /**
     * 访问一个 with 语句(with(`xx) ...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitWithStatement = function (node) {
        node.value.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个修饰器(`@xx`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitDecorator = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个修饰符(`static、private、...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitModifier = function (node) {
    };
    /**
     * 访问一个类型参数声明(`T、T extends R`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTypeParametersDeclaration = function (node) {
        node.name.accept(this);
        node["extends"] && node["extends"].accept(this);
    };
    /**
     * 访问一个函数声明(function fn() {...}、function * fn(`){...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitFunctionDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body && node.body.accept(this);
    };
    /**
     * 访问一个函数表达式(function (`) {}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitFunctionExpression = function (node) {
        node.name && node.name.accept(this);
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个参数声明(`x、x = 1、...x`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitParameterDeclaration = function (node) {
        node.modifiers && node.modifiers.accept(this);
        node.type && node.type.accept(this);
        node.initializer && node.initializer.accept(this);
    };
    /**
     * 访问一个类声明(`class T {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitClassDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node["extends"] && node["extends"].accept(this);
        node.implements && node.implements.accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个类表达式(`class xx {}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitClassExpression = function (node) {
        node.name && node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node["extends"] && node["extends"].accept(this);
        node.implements && node.implements.accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个属性声明(`x: 1`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitPropertyDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.type && node.type.accept(this);
        node.value && node.value.accept(this);
    };
    /**
     * 访问一个方法声明(fn(`) {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitMethodDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.name.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个访问器声明(get fn() {...}、set fn(`) {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitAccessorDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.name.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个接口声明(`interface T {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitInterfaceDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node["extends"] && node["extends"].accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个接口表达式(`interface xx {}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitInterfaceExpression = function (node) {
        node.name && node.name.accept(this);
        node["extends"] && node["extends"].accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个枚举声明(`enum T {}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitEnumDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个枚举表达式(`enum xx {}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitEnumExpression = function (node) {
        node.name && node.name.accept(this);
        node.members && node.members.accept(this);
    };
    /**
     * 访问一个枚举成员声明(`xx = 1`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitEnumMemberDeclaration = function (node) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.initializer && node.initializer.accept(this);
    };
    /**
     * 访问一个命名空间声明(`namespace abc {...}、module abc {...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNamespaceDeclaration = function (node) {
        node.names.accept(this);
        node.members.accept(this);
    };
    /**
     * 访问一个 import 声明(`import xx from '...';`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitImportDeclaration = function (node) {
        node.elements.accept(this);
        node.target.accept(this);
    };
    /**
     * 访问一个 import = 指令(import xx = require(`"");`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitImportAliasDeclaration = function (node) {
        node.value.accept(this);
    };
    /**
     * 访问一个名字导入声明项(`a as b`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNameImportClause = function (node) {
        node.name && node.name.accept(this);
        node.alias.accept(this);
    };
    /**
     * 访问一个命名空间导入声明项(`{a as b}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNamespaceImportClause = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个 export 指令(`export xx from '...';`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitExportDirective = function (node) {
        node.elements.accept(this);
        node.target.accept(this);
    };
    /**
     * 访问一个 export = 指令(`export = 1;`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitExportEqualsDirective = function (node) {
        node.value.accept(this);
    };
    /**
     * 访问一个错误表达式。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitErrorExpression = function (node) {
    };
    /**
     * 访问一个标识符(`x`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitIdentifier = function (node) {
    };
    /**
     * 访问一个泛型表达式。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitGenericExpression = function (node) {
        node.element.accept(this);
        node.typeArguments.accept(this);
    };
    /**
     * 访问一个简单字面量(`this`、`super`、`null`、`true`、`false`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitSimpleLiteral = function (node) {
    };
    /**
     * 访问一个数字字面量(`1`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNumericLiteral = function (node) {
    };
    /**
     * 访问一个字符串字面量(`'abc'`、`"abc"`、`\`abc\``)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitStringLiteral = function (node) {
    };
    /**
     * 访问一个模板字面量(``abc${x + y}def``)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTemplateLiteral = function (node) {
        node.spans.accept(this);
    };
    /**
     * 访问一个模板字面量的一个文本区域(`\`abc${、}abc${、}abc\``)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTemplateSpan = function (node) {
    };
    /**
     * 访问一个正则表达式字面量(`/abc/`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitRegularExpressionLiteral = function (node) {
    };
    /**
     * 访问一个数组字面量(`[x, y]`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrayLiteral = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个对象字面量(`{x: y}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitObjectLiteral = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个箭头函数表达式(`x => y`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrowFunctionExpression = function (node) {
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
    };
    /**
     * 访问一个箭头函数表达式(`=> xx`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrowExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个括号表达式((`x)`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitParenthesizedExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个成员调用表达式(`x.y`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitMemberCallExpression = function (node) {
        node.target.accept(this);
        node.argument.accept(this);
    };
    /**
     * 访问一个函数调用表达式(x(`)`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitFunctionCallExpression = function (node) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    };
    /**
     * 访问一个索引调用表达式(`x[y]`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitIndexCallExpression = function (node) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    };
    /**
     * 访问一个模板调用表达式(`x\`abc\``)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTemplateCallExpression = function (node) {
        node.target.accept(this);
        node.argument.accept(this);
    };
    /**
     * 访问一个 new 表达式(`new x()`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNewExpression = function (node) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    };
    /**
     * 访问一个 new.target 表达式(`new.target`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitNewTargetExpression = function (node) {
    };
    /**
     * 访问一个一元运算表达式(`+x、typeof x、...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitUnaryExpression = function (node) {
        node.operand.accept(this);
    };
    /**
     * 访问一个增量运算表达式(`x++、--x`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitIncrementExpression = function (node) {
        node.operand.accept(this);
    };
    /**
     * 访问一个二元运算表达式(`x + y、x = y、...`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitBinaryExpression = function (node) {
        node.leftOperand.accept(this);
        node.rightOperand.accept(this);
    };
    /**
     * 访问一个 yield 表达式(`yield x、yield * x`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitYieldExpression = function (node) {
        node.operand && node.operand.accept(this);
    };
    /**
     * 访问一个条件表达式(`x ? y : z`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitConditionalExpression = function (node) {
        node.condition.accept(this);
        node.thenExpression.accept(this);
        node.elseExpression.accept(this);
    };
    /**
     * 访问一个类型转换表达式(`<T>xx`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTypeCastExpression = function (node) {
        node.type.accept(this);
        node.operand.accept(this);
    };
    /**
     * 访问一个 JSX 标签(`<div>...</div>`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitJsxElement = function (node) {
        node.tagName.accept(this);
        node.attributes.accept(this);
        node.children.accept(this);
    };
    /**
     * 访问一个 JSX 标签属性(`id="a"`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitJsxAttribute = function (node) {
        node.name.accept(this);
        node.value && node.value.accept(this);
    };
    /**
     * 访问一个 JSX 文本(`{...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitJsxText = function (node) {
    };
    /**
     * 访问一个 JSX 表达式(`{...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitJsxExpression = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个 JSX 关闭元素(`{...}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitJsxClosingElement = function (node) {
        node.tagName.accept(this);
    };
    /**
     * 访问一个简单类型节点(`number`、`string`、...)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitSimpleTypeNode = function (node) {
    };
    /**
     * 访问一个泛型节点(`Array<T>`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitGenericTypeNode = function (node) {
        node.element.accept(this);
        node.typeArguments.accept(this);
    };
    /**
     * 访问一个数组类型节点(`T[]`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrayTypeNode = function (node) {
        node.element.accept(this);
    };
    /**
     * 访问一个函数类型节点(`()=>void`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitFunctionTypeNode = function (node) {
        node.typeParameters && node.typeParameters.accept(this);
    };
    /**
     * 访问一个构造函数类型节点(`new ()=>void`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitConstructorTypeNode = function (node) {
    };
    /**
     * 访问一个元祖类型节点(`[string, number]`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTupleTypeNode = function (node) {
    };
    /**
     * 访问一个联合类型节点(`number | string`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitUnionTypeNode = function (node) {
    };
    /**
     * 访问一个交错类型节点(`number & string`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitIntersectionTypeNode = function (node) {
    };
    /**
     * 访问一个对象类型节点(`{x: string}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitObjectTypeNode = function (node) {
    };
    /**
     * 访问一个类型查询节点(`typeof x`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTypeQueryNode = function (node) {
    };
    /**
     * 访问一个括号类型节点(`(number)`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitParenthesizedTypeNode = function (node) {
        node.body.accept(this);
    };
    /**
     * 访问一个表达式类型节点(`"abc"`、`true`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitExpressionTypeNode = function (node) {
    };
    /**
     * 访问一个限定名称类型节点(`"abc"`、`true`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitQualifiedNameTypeNode = function (node) {
    };
    /**
     * 访问一个类型别名声明(`type A = number`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitTypeAliasDeclaration = function (node) {
    };
    /**
     * 访问一个数组绑定模式项(`[xx]`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrayBindingPattern = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个数组绑定模式项(xx、..)
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitArrayBindingElement = function (node) {
        node.initializer.accept(this);
    };
    /**
     * 访问一个对象绑定模式项(`{xx: xx}`)。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitObjectBindingPattern = function (node) {
        node.elements.accept(this);
    };
    /**
     * 访问一个对象绑定模式项(xx: y)
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitObjectBindingElement = function (node) {
        node.initializer.accept(this);
    };
    /**
     * 访问一个已计算的属性名。
     * @param node 要访问的节点。
     */
    NodeVisitor.prototype.visitComputedPropertyName = function (node) {
        node.body.accept(this);
    };
    return NodeVisitor;
}());
exports.NodeVisitor = NodeVisitor;
