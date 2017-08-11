/**
 * @fileOverview 节点访问器
 * @generated 此文件可使用 `$ tpack gen-nodes` 命令生成。
 */

import * as nodes from './nodes';

/**
 * 表示一个节点访问器。
 */
export abstract class NodeVisitor {

    /**
     * 访问一个逗号隔开的节点列表(<..., ...>。
     * @param nodes 要访问的节点列表。
     */
    visitNodeList<T extends nodes.Node>(nodes: nodes.NodeList<T>) {
        for(const node of nodes) {
            node.accept(this);
        }
    }

    /**
     * 访问一个源文件。
     * @param node 要访问的节点。
     */
    visitSourceFile(node: nodes.SourceFile) {
        node.statements.accept(this);
    }

    /**
     * 访问一个语句块(`{...}`)。
     * @param node 要访问的节点。
     */
    visitBlockStatement(node: nodes.BlockStatement) {
        node.statements.accept(this);
    }

    /**
     * 访问一个变量声明语句(`var xx、let xx、const xx`)。
     * @param node 要访问的节点。
     */
    visitVariableStatement(node: nodes.VariableStatement) {
        node.variables.accept(this);
    }

    /**
     * 访问一个变量声明(`x = 1、[x] = [1]、{a: x} = {a: 1}`)。
     * @param node 要访问的节点。
     */
    visitVariableDeclaration(node: nodes.VariableDeclaration) {
        node.type && node.type.accept(this);
        node.initializer && node.initializer.accept(this);
    }

    /**
     * 访问一个空语句(`;`)。
     * @param node 要访问的节点。
     */
    visitEmptyStatement(node: nodes.EmptyStatement) {

    }

    /**
     * 访问一个标签语句(`xx: ...`)。
     * @param node 要访问的节点。
     */
    visitLabeledStatement(node: nodes.LabeledStatement) {
        node.label.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个表达式语句(x(`);`)。
     * @param node 要访问的节点。
     */
    visitExpressionStatement(node: nodes.ExpressionStatement) {
        node.body.accept(this);
    }

    /**
     * 访问一个 if 语句(if(`xx) ...`)。
     * @param node 要访问的节点。
     */
    visitIfStatement(node: nodes.IfStatement) {
        node.condition.accept(this);
        node.then.accept(this);
        node.else && node.else.accept(this);
    }

    /**
     * 访问一个 switch 语句(switch(`xx){...}`)。
     * @param node 要访问的节点。
     */
    visitSwitchStatement(node: nodes.SwitchStatement) {
        node.condition && node.condition.accept(this);
        node.cases.accept(this);
    }

    /**
     * 访问一个 case 分支(`case ...:{...}`)。
     * @param node 要访问的节点。
     */
    visitCaseClause(node: nodes.CaseClause) {
        node.label && node.label.accept(this);
        node.statements.accept(this);
    }

    /**
     * 访问一个 for 语句(for(`var i = 0; i < 9; i++) ...`)。
     * @param node 要访问的节点。
     */
    visitForStatement(node: nodes.ForStatement) {
        node.initializer && node.initializer.accept(this);
        node.condition && node.condition.accept(this);
        node.iterator && node.iterator.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..in 语句(for(`var x in y) ...`)。
     * @param node 要访问的节点。
     */
    visitForInStatement(node: nodes.ForInStatement) {
        node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..of 语句(for(`var x of y) ...`)。
     * @param node 要访问的节点。
     */
    visitForOfStatement(node: nodes.ForOfStatement) {
        node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..to 语句(for(`var x = 0 to 10) ...`)。
     * @param node 要访问的节点。
     */
    visitForToStatement(node: nodes.ForToStatement) {
        node.initializer && node.initializer.accept(this);
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 while 语句(while(`...) ...`)。
     * @param node 要访问的节点。
     */
    visitWhileStatement(node: nodes.WhileStatement) {
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 do..while 语句(do ... while(`xx);`)。
     * @param node 要访问的节点。
     */
    visitDoWhileStatement(node: nodes.DoWhileStatement) {
        node.body.accept(this);
        node.condition.accept(this);
    }

    /**
     * 访问一个 continue 语句(`continue xx;`)。
     * @param node 要访问的节点。
     */
    visitContinueStatement(node: nodes.ContinueStatement) {
        node.label && node.label.accept(this);
    }

    /**
     * 访问一个 break 语句(`break xx;`)。
     * @param node 要访问的节点。
     */
    visitBreakStatement(node: nodes.BreakStatement) {
        node.label && node.label.accept(this);
    }

    /**
     * 访问一个 return 语句(`return xx;`)。
     * @param node 要访问的节点。
     */
    visitReturnStatement(node: nodes.ReturnStatement) {
        node.value && node.value.accept(this);
    }

    /**
     * 访问一个 throw 语句(`throw xx;`)。
     * @param node 要访问的节点。
     */
    visitThrowStatement(node: nodes.ThrowStatement) {
        node.value.accept(this);
    }

    /**
     * 访问一个 try 语句(try {...} catch(`e) {...}`)。
     * @param node 要访问的节点。
     */
    visitTryStatement(node: nodes.TryStatement) {
        node.try.accept(this);
        node.catch && node.catch.accept(this);
        node.finally && node.finally.accept(this);
    }

    /**
     * 访问一个 catch 分句(catch(`e) {...}`)。
     * @param node 要访问的节点。
     */
    visitCatchClause(node: nodes.CatchClause) {
        node.body.accept(this);
    }

    /**
     * 访问一个 finally 分句(`finally {...}`)。
     * @param node 要访问的节点。
     */
    visitFinallyClause(node: nodes.FinallyClause) {
        node.body.accept(this);
    }

    /**
     * 访问一个 debugger 语句(`debugger;`)。
     * @param node 要访问的节点。
     */
    visitDebuggerStatement(node: nodes.DebuggerStatement) {

    }

    /**
     * 访问一个 with 语句(with(`xx) ...`)。
     * @param node 要访问的节点。
     */
    visitWithStatement(node: nodes.WithStatement) {
        node.value.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个修饰器(`@xx`)。
     * @param node 要访问的节点。
     */
    visitDecorator(node: nodes.Decorator) {
        node.body.accept(this);
    }

    /**
     * 访问一个修饰符(`static、private、...`)。
     * @param node 要访问的节点。
     */
    visitModifier(node: nodes.Modifier) {

    }

    /**
     * 访问一个类型参数声明(`T、T extends R`)。
     * @param node 要访问的节点。
     */
    visitTypeParametersDeclaration(node: nodes.TypeParametersDeclaration) {
        node.name.accept(this);
        node.extends && node.extends.accept(this);
    }

    /**
     * 访问一个函数声明(function fn() {...}、function * fn(`){...}`)。
     * @param node 要访问的节点。
     */
    visitFunctionDeclaration(node: nodes.FunctionDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body && node.body.accept(this);
    }

    /**
     * 访问一个函数表达式(function (`) {}`)。
     * @param node 要访问的节点。
     */
    visitFunctionExpression(node: nodes.FunctionExpression) {
        node.name && node.name.accept(this);
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个参数声明(`x、x = 1、...x`)。
     * @param node 要访问的节点。
     */
    visitParameterDeclaration(node: nodes.ParameterDeclaration) {
        node.modifiers && node.modifiers.accept(this);
        node.type && node.type.accept(this);
        node.initializer && node.initializer.accept(this);
    }

    /**
     * 访问一个类声明(`class T {...}`)。
     * @param node 要访问的节点。
     */
    visitClassDeclaration(node: nodes.ClassDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.extends && node.extends.accept(this);
        node.implements && node.implements.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个类表达式(`class xx {}`)。
     * @param node 要访问的节点。
     */
    visitClassExpression(node: nodes.ClassExpression) {
        node.name && node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.extends && node.extends.accept(this);
        node.implements && node.implements.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个属性声明(`x: 1`)。
     * @param node 要访问的节点。
     */
    visitPropertyDeclaration(node: nodes.PropertyDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.type && node.type.accept(this);
        node.value && node.value.accept(this);
    }

    /**
     * 访问一个方法声明(fn(`) {...}`)。
     * @param node 要访问的节点。
     */
    visitMethodDeclaration(node: nodes.MethodDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.name.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个访问器声明(get fn() {...}、set fn(`) {...}`)。
     * @param node 要访问的节点。
     */
    visitAccessorDeclaration(node: nodes.AccessorDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.name.accept(this);
        node.returnType && node.returnType.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个接口声明(`interface T {...}`)。
     * @param node 要访问的节点。
     */
    visitInterfaceDeclaration(node: nodes.InterfaceDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.extends && node.extends.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个接口表达式(`interface xx {}`)。
     * @param node 要访问的节点。
     */
    visitInterfaceExpression(node: nodes.InterfaceExpression) {
        node.name && node.name.accept(this);
        node.extends && node.extends.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个枚举声明(`enum T {}`)。
     * @param node 要访问的节点。
     */
    visitEnumDeclaration(node: nodes.EnumDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个枚举表达式(`enum xx {}`)。
     * @param node 要访问的节点。
     */
    visitEnumExpression(node: nodes.EnumExpression) {
        node.name && node.name.accept(this);
        node.members && node.members.accept(this);
    }

    /**
     * 访问一个枚举成员声明(`xx = 1`)。
     * @param node 要访问的节点。
     */
    visitEnumMemberDeclaration(node: nodes.EnumMemberDeclaration) {
        node.decorators && node.decorators.accept(this);
        node.modifiers && node.modifiers.accept(this);
        node.name.accept(this);
        node.typeParameters && node.typeParameters.accept(this);
        node.initializer && node.initializer.accept(this);
    }

    /**
     * 访问一个命名空间声明(`namespace abc {...}、module abc {...}`)。
     * @param node 要访问的节点。
     */
    visitNamespaceDeclaration(node: nodes.NamespaceDeclaration) {
        node.names.accept(this);
        node.members.accept(this);
    }

    /**
     * 访问一个 import 声明(`import xx from '...';`)。
     * @param node 要访问的节点。
     */
    visitImportDeclaration(node: nodes.ImportDeclaration) {
        node.elements.accept(this);
        node.target.accept(this);
    }

    /**
     * 访问一个 import = 指令(import xx = require(`"");`)。
     * @param node 要访问的节点。
     */
    visitImportAliasDeclaration(node: nodes.ImportAliasDeclaration) {
        node.value.accept(this);
    }

    /**
     * 访问一个名字导入声明项(`a as b`)。
     * @param node 要访问的节点。
     */
    visitNameImportClause(node: nodes.NameImportClause) {
        node.name && node.name.accept(this);
        node.alias.accept(this);
    }

    /**
     * 访问一个命名空间导入声明项(`{a as b}`)。
     * @param node 要访问的节点。
     */
    visitNamespaceImportClause(node: nodes.NamespaceImportClause) {
        node.elements.accept(this);
    }

    /**
     * 访问一个 export 指令(`export xx from '...';`)。
     * @param node 要访问的节点。
     */
    visitExportDirective(node: nodes.ExportDirective) {
        node.elements.accept(this);
        node.target.accept(this);
    }

    /**
     * 访问一个 export = 指令(`export = 1;`)。
     * @param node 要访问的节点。
     */
    visitExportEqualsDirective(node: nodes.ExportEqualsDirective) {
        node.value.accept(this);
    }

    /**
     * 访问一个错误表达式。
     * @param node 要访问的节点。
     */
    visitErrorExpression(node: nodes.ErrorExpression) {

    }

    /**
     * 访问一个标识符(`x`)。
     * @param node 要访问的节点。
     */
    visitIdentifier(node: nodes.Identifier) {

    }

    /**
     * 访问一个泛型表达式。
     * @param node 要访问的节点。
     */
    visitGenericExpression(node: nodes.GenericExpression) {
        node.element.accept(this);
        node.typeArguments.accept(this);
    }

    /**
     * 访问一个简单字面量(`this`、`super`、`null`、`true`、`false`)。
     * @param node 要访问的节点。
     */
    visitSimpleLiteral(node: nodes.SimpleLiteral) {

    }

    /**
     * 访问一个数字字面量(`1`)。
     * @param node 要访问的节点。
     */
    visitNumericLiteral(node: nodes.NumericLiteral) {

    }

    /**
     * 访问一个字符串字面量(`'abc'`、`"abc"`、`\`abc\``)。
     * @param node 要访问的节点。
     */
    visitStringLiteral(node: nodes.StringLiteral) {

    }

    /**
     * 访问一个模板字面量(``abc${x + y}def``)。
     * @param node 要访问的节点。
     */
    visitTemplateLiteral(node: nodes.TemplateLiteral) {
        node.spans.accept(this);
    }

    /**
     * 访问一个模板字面量的一个文本区域(`\`abc${、}abc${、}abc\``)。
     * @param node 要访问的节点。
     */
    visitTemplateSpan(node: nodes.TemplateSpan) {

    }

    /**
     * 访问一个正则表达式字面量(`/abc/`)。
     * @param node 要访问的节点。
     */
    visitRegularExpressionLiteral(node: nodes.RegularExpressionLiteral) {

    }

    /**
     * 访问一个数组字面量(`[x, y]`)。
     * @param node 要访问的节点。
     */
    visitArrayLiteral(node: nodes.ArrayLiteral) {
        node.elements.accept(this);
    }

    /**
     * 访问一个对象字面量(`{x: y}`)。
     * @param node 要访问的节点。
     */
    visitObjectLiteral(node: nodes.ObjectLiteral) {
        node.elements.accept(this);
    }

    /**
     * 访问一个箭头函数表达式(`x => y`)。
     * @param node 要访问的节点。
     */
    visitArrowFunctionExpression(node: nodes.ArrowFunctionExpression) {
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个箭头函数表达式(`=> xx`)。
     * @param node 要访问的节点。
     */
    visitArrowExpression(node: nodes.ArrowExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个括号表达式((`x)`)。
     * @param node 要访问的节点。
     */
    visitParenthesizedExpression(node: nodes.ParenthesizedExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个成员调用表达式(`x.y`)。
     * @param node 要访问的节点。
     */
    visitMemberCallExpression(node: nodes.MemberCallExpression) {
        node.target.accept(this);
        node.argument.accept(this);
    }

    /**
     * 访问一个函数调用表达式(x(`)`)。
     * @param node 要访问的节点。
     */
    visitFunctionCallExpression(node: nodes.FunctionCallExpression) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    }

    /**
     * 访问一个索引调用表达式(`x[y]`)。
     * @param node 要访问的节点。
     */
    visitIndexCallExpression(node: nodes.IndexCallExpression) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    }

    /**
     * 访问一个模板调用表达式(`x\`abc\``)。
     * @param node 要访问的节点。
     */
    visitTemplateCallExpression(node: nodes.TemplateCallExpression) {
        node.target.accept(this);
        node.argument.accept(this);
    }

    /**
     * 访问一个 new 表达式(`new x()`)。
     * @param node 要访问的节点。
     */
    visitNewExpression(node: nodes.NewExpression) {
        node.target.accept(this);
        node.arguments && node.arguments.accept(this);
    }

    /**
     * 访问一个 new.target 表达式(`new.target`)。
     * @param node 要访问的节点。
     */
    visitNewTargetExpression(node: nodes.NewTargetExpression) {

    }

    /**
     * 访问一个一元运算表达式(`+x、typeof x、...`)。
     * @param node 要访问的节点。
     */
    visitUnaryExpression(node: nodes.UnaryExpression) {
        node.operand.accept(this);
    }

    /**
     * 访问一个增量运算表达式(`x++、--x`)。
     * @param node 要访问的节点。
     */
    visitIncrementExpression(node: nodes.IncrementExpression) {
        node.operand.accept(this);
    }

    /**
     * 访问一个二元运算表达式(`x + y、x = y、...`)。
     * @param node 要访问的节点。
     */
    visitBinaryExpression(node: nodes.BinaryExpression) {
        node.leftOperand.accept(this);
        node.rightOperand.accept(this);
    }

    /**
     * 访问一个 yield 表达式(`yield x、yield * x`)。
     * @param node 要访问的节点。
     */
    visitYieldExpression(node: nodes.YieldExpression) {
        node.operand && node.operand.accept(this);
    }

    /**
     * 访问一个条件表达式(`x ? y : z`)。
     * @param node 要访问的节点。
     */
    visitConditionalExpression(node: nodes.ConditionalExpression) {
        node.condition.accept(this);
        node.thenExpression.accept(this);
        node.elseExpression.accept(this);
    }

    /**
     * 访问一个类型转换表达式(`<T>xx`)。
     * @param node 要访问的节点。
     */
    visitTypeCastExpression(node: nodes.TypeAssertionExpression) {
        node.type.accept(this);
        node.operand.accept(this);
    }

    /**
     * 访问一个 JSX 标签(`<div>...</div>`)。
     * @param node 要访问的节点。
     */
    visitJsxElement(node: nodes.JsxElement) {
        node.tagName.accept(this);
        node.attributes.accept(this);
        node.children.accept(this);
    }

    /**
     * 访问一个 JSX 标签属性(`id="a"`)。
     * @param node 要访问的节点。
     */
    visitJsxAttribute(node: nodes.JsxAttribute) {
        node.name.accept(this);
        node.value && node.value.accept(this);
    }

    /**
     * 访问一个 JSX 文本(`{...}`)。
     * @param node 要访问的节点。
     */
    visitJsxText(node: nodes.JsxText) {

    }

    /**
     * 访问一个 JSX 表达式(`{...}`)。
     * @param node 要访问的节点。
     */
    visitJsxExpression(node: nodes.JsxExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个 JSX 关闭元素(`{...}`)。
     * @param node 要访问的节点。
     */
    visitJsxClosingElement(node: nodes.JsxClosingElement) {
        node.tagName.accept(this);
    }

    /**
     * 访问一个简单类型节点(`number`、`string`、...)。
     * @param node 要访问的节点。
     */
    visitSimpleTypeNode(node: nodes.SimpleTypeNode) {

    }

    /**
     * 访问一个泛型节点(`Array<T>`)。
     * @param node 要访问的节点。
     */
    visitGenericTypeNode(node: nodes.GenericTypeNode) {
        node.element.accept(this);
        node.typeArguments.accept(this);
    }

    /**
     * 访问一个数组类型节点(`T[]`)。
     * @param node 要访问的节点。
     */
    visitArrayTypeNode(node: nodes.ArrayTypeNode) {
        node.element.accept(this);
    }

    /**
     * 访问一个函数类型节点(`()=>void`)。
     * @param node 要访问的节点。
     */
    visitFunctionTypeNode(node: nodes.FunctionTypeNode) {
        node.typeParameters && node.typeParameters.accept(this);
    }

    /**
     * 访问一个构造函数类型节点(`new ()=>void`)。
     * @param node 要访问的节点。
     */
    visitConstructorTypeNode(node: nodes.ConstructorTypeNode) {

    }

    /**
     * 访问一个元祖类型节点(`[string, number]`)。
     * @param node 要访问的节点。
     */
    visitTupleTypeNode(node: nodes.TupleTypeNode) {

    }

    /**
     * 访问一个联合类型节点(`number | string`)。
     * @param node 要访问的节点。
     */
    visitUnionTypeNode(node: nodes.UnionTypeNode) {

    }

    /**
     * 访问一个交错类型节点(`number & string`)。
     * @param node 要访问的节点。
     */
    visitIntersectionTypeNode(node: nodes.IntersectionTypeNode) {

    }

    /**
     * 访问一个对象类型节点(`{x: string}`)。
     * @param node 要访问的节点。
     */
    visitObjectTypeNode(node: nodes.ObjectTypeNode) {

    }

    /**
     * 访问一个类型查询节点(`typeof x`)。
     * @param node 要访问的节点。
     */
    visitTypeQueryNode(node: nodes.TypeQueryNode) {

    }

    /**
     * 访问一个括号类型节点(`(number)`)。
     * @param node 要访问的节点。
     */
    visitParenthesizedTypeNode(node: nodes.ParenthesizedTypeNode) {
        node.body.accept(this);
    }

    /**
     * 访问一个表达式类型节点(`"abc"`、`true`)。
     * @param node 要访问的节点。
     */
    visitExpressionTypeNode(node: nodes.ExpressionTypeNode) {

    }

    /**
     * 访问一个限定名称类型节点(`"abc"`、`true`)。
     * @param node 要访问的节点。
     */
    visitQualifiedNameTypeNode(node: nodes.QualifiedNameTypeNode) {

    }

    /**
     * 访问一个类型别名声明(`type A = number`)。
     * @param node 要访问的节点。
     */
    visitTypeAliasDeclaration(node: nodes.TypeAliasDeclaration) {

    }

    /**
     * 访问一个数组绑定模式项(`[xx]`)。
     * @param node 要访问的节点。
     */
    visitArrayBindingPattern(node: nodes.ArrayBindingPattern) {
        node.elements.accept(this);
    }

    /**
     * 访问一个数组绑定模式项(xx、..)
     * @param node 要访问的节点。
     */
    visitArrayBindingElement(node: nodes.ArrayBindingElement) {
        node.initializer.accept(this);
    }

    /**
     * 访问一个对象绑定模式项(`{xx: xx}`)。
     * @param node 要访问的节点。
     */
    visitObjectBindingPattern(node: nodes.ObjectBindingPattern) {
        node.elements.accept(this);
    }

    /**
     * 访问一个对象绑定模式项(xx: y)
     * @param node 要访问的节点。
     */
    visitObjectBindingElement(node: nodes.ObjectBindingElement) {
        node.initializer.accept(this);
    }

    /**
     * 访问一个已计算的属性名。
     * @param node 要访问的节点。
     */
    visitComputedPropertyName(node: nodes.ComputedPropertyName) {
        node.body.accept(this);
    }

}