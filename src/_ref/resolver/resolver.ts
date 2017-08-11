
import * as nodes from '../ast/nodes';
import {NodeVisitor} from '../ast/nodeVisitor';
import {Package} from '../ast/package';
import * as symbols from './symbols';

/**
 * 表示一个语义分析器。
 */
export class Resolver {

    /**
     * 获取当前
     */
    package: Package;

    anyType = new symbols.PrimaryTypeSymbol("any");

    nullType = new symbols.PrimaryTypeSymbol("null");

    /**
     * 获取内置的 boolean 类型。
     */
    booleanType = new symbols.PrimaryTypeSymbol("boolean");

    /**
     * 初始化新的语义分析器。
     * @param pkg 要分析的包。
     */
    constructor(pkg: Package) {
        super();
        this.package = pkg;

        // 初始化语法树以便语义分析。
    }

    /**
     * 启用语义分析。
     */
    enable() {

    }

    /**
     * 禁用语义分析。此操作可能使正在进行的语义分析终止。
     */
    disable() {

    }

    typeResolver = new TypeResolver(this);

    /**
     * 解析指定表达式的返回类型。
     * @param node 要获取的节点。
     */
    resolveTypeOfExpression(node: nodes.Expression) {
        return <symbols.TypeSymbol>node.accept(this.typeResolver);
    }

    /**
     * 获取指定标识符的标识。
     * @param node 要获取的节点。
     */
    resolveSymbolOfIdentifier(node: nodes.Identifier) {

    }

    /**
     * 
     * @param block
     * @param name
     */
    resolveValueOfString(block: nodes.BlockStatement, name: string) {

    }

    ///**
    // * 获取指定节点的类型。
    // * @param node
    // */
    //getTypeOfNode(node: nodes.Node) {

    //}

}

declare module '../ast/nodes' {

    interface Node {

        /**
         * 获取或设置当前节点语义解析的结果。
         * @internal
         */
        _resolveCache: ResolveCache;

    }

}

/**
 * 缓存一个节点语义解析的结果。
 */
interface ResolveCache {

    /**
     * 获取当前节点的父节点。
     */
    parent: Node;

    /**
     * 获取当前表达式或函数定义的解析类型。
     */
    type: symbols.TypeSymbol;

}

/**
 * 表示一个类型解析器。
 */
class TypeResolver extends NodeVisitor {

    /**
     * 当前使用的解析器。
     */
    resovler: Resolver;

    /**
     * 初始化新的类型解析器。
     * @param resovler 当前使用的解析器。
     */
    constructor(resovler: Resolver) {
        super();
        this.resovler = resovler;
    }

    // #region 节点访问器

    /**
     * 访问一个逗号隔开的节点列表(<..., ...>。
     * @param nodes 要访问的节点列表。
     */
    visitNodeList<T extends nodes.Node>(nodes: nodes.NodeList<T>) {
        for (const node of nodes) {
            node.accept(this);
        }
    }

    /**
     * 访问一个源文件。
     * @param node 要访问的节点。
     */
    visitSourceFile(node: nodes.SourceFile) {
        node.comments && node.comments.accept(this);
        node.jsDoc && node.jsDoc.accept(this);
        node.statements.accept(this);
    }

    /**
     * 访问一个空语句(;)。
     * @param node 要访问的节点。
     */
    visitEmptyStatement(node: nodes.EmptyStatement) {

    }

    /**
     * 访问一个语句块({...})。
     * @param node 要访问的节点。
     */
    visitBlock(node: nodes.BlockStatement) {
        node.statements.accept(this);
    }

    /**
     * 访问一个变量声明语句(var xx = ...)。
     * @param node 要访问的节点。
     */
    visitVariableStatement(node: nodes.VariableStatement) {
        node.decorators.accept(this);
        node.variables.accept(this);
    }

    /**
     * 访问一个标签语句(xx: ...)。
     * @param node 要访问的节点。
     */
    visitLabeledStatement(node: nodes.LabeledStatement) {
        node.label.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个表达式语句(...;)。
     * @param node 要访问的节点。
     */
    visitExpressionStatement(node: nodes.ExpressionStatement) {
        node.body.accept(this);
    }

    /**
     * 访问一个 if 语句(if(...) {...})。
     * @param node 要访问的节点。
     */
    visitIfStatement(node: nodes.IfStatement) {
        node.condition.accept(this);
        node.then.accept(this);
        node.elseToken && node.elseToken.accept(this);
    }

    /**
     * 访问一个 switch 语句(switch(...){...})。
     * @param node 要访问的节点。
     */
    visitSwitchStatement(node: nodes.SwitchStatement) {
        node.condition && node.condition.accept(this);
        node.cases.accept(this);
    }

    /**
     * 访问一个 switch 语句的 case 分支(case ...:{...})。
     * @param node 要访问的节点。
     */
    visitCaseClause(node: nodes.CaseClause) {
        node.label && node.label.accept(this);
        node.statements.accept(this);
    }

    /**
     * 访问一个 for 语句(for(...; ...; ...) {...})。
     * @param node 要访问的节点。
     */
    visitForStatement(node: nodes.ForStatement) {
        node.initializer && node.initializer.accept(this);
        node.condition && node.condition.accept(this);
        node.iterator && node.iterator.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..in 语句(for(var xx in ...) {...})。
     * @param node 要访问的节点。
     */
    visitForInStatement(node: nodes.ForInStatement) {
        node.variable.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..of 语句(for(var xx of ...) {...})。
     * @param node 要访问的节点。
     */
    visitForOfStatement(node: nodes.ForOfStatement) {
        node.variable.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 for..to 语句(for(var xx = ... to ...) {...})。
     * @param node 要访问的节点。
     */
    visitForToStatement(node: nodes.ForToStatement) {
        node.variable.accept(this);
        node.initializer && node.initializer.accept(this);
        node.iterator.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 while 语句(while(...) {...})。
     * @param node 要访问的节点。
     */
    visitWhileStatement(node: nodes.WhileStatement) {
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 do..while 语句(do {...} while(...);)。
     * @param node 要访问的节点。
     */
    visitDoWhileStatement(node: nodes.DoWhileStatement) {
        node.condition.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 continue 语句(continue;)。
     * @param node 要访问的节点。
     */
    visitContinueStatement(node: nodes.ContinueStatement) {
        node.label && node.label.accept(this);
    }

    /**
     * 访问一个 break 语句(break;)。
     * @param node 要访问的节点。
     */
    visitBreakStatement(node: nodes.BreakStatement) {
        node.label && node.label.accept(this);
    }

    /**
     * 访问一个 return 语句(return ...;)。
     * @param node 要访问的节点。
     */
    visitReturnStatement(node: nodes.ReturnStatement) {
        node.value && node.value.accept(this);
    }

    /**
     * 访问一个 throw 语句(throw ...;)。
     * @param node 要访问的节点。
     */
    visitThrowStatement(node: nodes.ThrowStatement) {
        node.value.accept(this);
    }

    /**
     * 访问一个 try 语句(try {...} catch(e) {...})。
     * @param node 要访问的节点。
     */
    visitTryStatement(node: nodes.TryStatement) {
        node.try.accept(this);
        node.catch.accept(this);
        node.finally.accept(this);
    }

    /**
     * 访问一个 try 语句的 catch 分句(catch(e) {...})。
     * @param node 要访问的节点。
     */
    visitCatchClause(node: nodes.CatchClause) {
        node.variable.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 try 语句的 finally 分句(finally {...})。
     * @param node 要访问的节点。
     */
    visitFinallyClause(node: nodes.FinallyClause) {
        node.body.accept(this);
    }

    /**
     * 访问一个 debugger 语句(debugger;)。
     * @param node 要访问的节点。
     */
    visitDebuggerStatement(node: nodes.DebuggerStatement) {

    }

    /**
     * 访问一个 with 语句(with(...) {...})。
     * @param node 要访问的节点。
     */
    visitWithStatement(node: nodes.WithStatement) {
        node.value.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个标识符(xx)。
     * @param node 要访问的节点。
     */
    visitIdentifier(node: nodes.Identifier) {

    }

    /**
     * 访问 null 字面量(null)。
     * @param node 要访问的节点。
     */
    visitNullLiteral(node: nodes.NullLiteral) {

    }

    /**
     * 访问 true 字面量(true)。
     * @param node 要访问的节点。
     */
    visitTrueLiteral(node: nodes.TrueLiteral) {

    }

    /**
     * 访问 false 字面量(false)。
     * @param node 要访问的节点。
     */
    visitFalseLiteral(node: nodes.FalseLiteral) {

    }

    /**
     * 访问一个浮点数字面量(1)。
     * @param node 要访问的节点。
     */
    visitNumericLiteral(node: nodes.NumericLiteral) {

    }

    /**
     * 访问一个字符串字面量('...')。
     * @param node 要访问的节点。
     */
    visitStringLiteral(node: nodes.StringLiteral) {

    }

    /**
     * 访问一个正则表达式字面量(/.../)。
     * @param node 要访问的节点。
     */
    visitRegExpLiteral(node: nodes.RegExpLiteral) {
        node.flags && node.flags.accept(this);
    }

    /**
     * 访问一个模板字符串字面量(`...`)。
     * @param node 要访问的节点。
     */
    visitTemplateStringLiteral(node: nodes.TemplateStringLiteral) {
        node.tag && node.tag.accept(this);
    }

    /**
     * 访问一个数组字面量([...])。
     * @param node 要访问的节点。
     */
    visitArrayLiteral(node: nodes.ArrayLiteral) {
        node.elements.accept(this);
    }

    /**
     * 访问一个对象字面量({x: ...})。
     * @param node 要访问的节点。
     */
    visitObjectLiteral(node: nodes.ObjectLiteral) {
        node.elements.accept(this);
    }

    /**
     * 访问一个对象字面量项。
     * @param node 要访问的节点。
     */
    visitObjectLiteralElement(node: nodes.ObjectLiteralElement) {
        node.name.accept(this);
        node.value.accept(this);
    }

    /**
     * 访问 this 字面量(this)。
     * @param node 要访问的节点。
     */
    visitThisLiteral(node: nodes.ThisLiteral) {

    }

    /**
     * 访问 super 字面量(super)。
     * @param node 要访问的节点。
     */
    visitSuperLiteral(node: nodes.SuperLiteral) {

    }

    /**
     * 访问一个括号表达式((...))。
     * @param node 要访问的节点。
     */
    visitParenthesizedExpression(node: nodes.ParenthesizedExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个条件表达式(... ? ... : ...)。
     * @param node 要访问的节点。
     */
    visitConditionalExpression(node: nodes.ConditionalExpression) {
        node.condition.accept(this);
        node.then.accept(this);
        node.else.accept(this);
    }

    /**
     * 访问一个成员调用表达式(x.y)。
     * @param node 要访问的节点。
     */
    visitMemberCallExpression(node: nodes.MemberCallExpression) {
        node.target.accept(this);
        node.argument.accept(this);
    }

    /**
     * 访问一个函数调用表达式(x(...))。
     * @param node 要访问的节点。
     */
    visitCallExpression(node: nodes.CallExpression) {
        node.target.accept(this);
        node.arguments.accept(this);
    }

    /**
     * 访问一个 new 表达式(new x(...))。
     * @param node 要访问的节点。
     */
    visitNewExpression(node: nodes.NewExpression) {
        node.target.accept(this);
        node.arguments.accept(this);
    }

    /**
     * 访问一个索引调用表达式(x[...])。
     * @param node 要访问的节点。
     */
    visitIndexCallExpression(node: nodes.IndexCallExpression) {
        node.target.accept(this);
        node.arguments.accept(this);
    }

    /**
     * 访问一个一元运算表达式(+x)。
     * @param node 要访问的节点。
     */
    visitUnaryExpression(node: nodes.UnaryExpression) {
        node.operand.accept(this);
    }

    /**
     * 访问一个二元运算表达式(x + y)。
     * @param node 要访问的节点。
     */
    visitBinaryExpression(node: nodes.BinaryExpression) {
        node.leftOperand.accept(this);
        node.rightOperand.accept(this);
    }

    /**
     * 访问一个箭头函数(x => ...)。
     * @param node 要访问的节点。
     */
    visitLambdaLiteral(node: nodes.LambdaLiteral) {
        node.typeParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问一个 yield 表达式(yield xx)。
     * @param node 要访问的节点。
     */
    visitYieldExpression(node: nodes.YieldExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个类型转换表达式(<T>xx)。
     * @param node 要访问的节点。
     */
    visitCastExpression(node: nodes.CastExpression) {
        node.type.accept(this);
        node.body.accept(this);
    }

    /**
     * 访问内置类型字面量(number)。
     * @param node 要访问的节点。
     */
    visitPredefinedTypeLiteral(node: nodes.PredefinedTypeLiteral) {

    }

    /**
     * 访问一个泛型表达式(Array<T>)。
     * @param node 要访问的节点。
     */
    visitGenericTypeExpression(node: nodes.GenericTypeExpression) {
        node.element.accept(this);
        node.genericArguments.accept(this);
    }

    /**
     * 访问一个数组类型表达式(T[])。
     * @param node 要访问的节点。
     */
    visitArrayTypeExpression(node: nodes.ArrayTypeExpression) {
        node.element.accept(this);
    }

    /**
     * 访问一个 JSX 标签（<div>...</div>)。
     * @param node 要访问的节点。
     */
    visitJsxElement(node: nodes.JsxElement) {
        node.tagName.accept(this);
        node.attributes.accept(this);
        node.children.accept(this);
    }

    /**
     * 访问一个 JSX 标签属性（id="a")。
     * @param node 要访问的节点。
     */
    visitJsxAttribute(node: nodes.JsxAttribute) {
        node.name.accept(this);
        node.value && node.value.accept(this);
    }

    /**
     * 访问一个 JSX 表达式（{...})。
     * @param node 要访问的节点。
     */
    visitJsxExpression(node: nodes.JsxExpression) {
        node.body.accept(this);
    }

    /**
     * 访问一个 JSX 文本（{...})。
     * @param node 要访问的节点。
     */
    visitJsxText(node: nodes.JsxText) {

    }

    /**
     * 访问一个 JSX 文本（{...})。
     * @param node 要访问的节点。
     */
    visitJsxClosingElement(node: nodes.JsxClosingElement) {
        node.tagName.accept(this);
    }

    /**
     * 访问一个描述器(@xx(...))。
     * @param node 要访问的节点。
     */
    visitDecorator(node: nodes.Decorator) {
        node.body.accept(this);
    }

    /**
     * 访问一个修饰符(public)。
     * @param node 要访问的节点。
     */
    visitModifier(node: nodes.Modifier) {

    }

    /**
     * 访问一个类定义(@class ...)。
     * @param node 要访问的节点。
     */
    visitClassDefinition(node: nodes.ClassDefinition) {
        node.extends.accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个接口定义。
     * @param node 要访问的节点。
     */
    visitInterfaceDefinition(node: nodes.InterfaceDefinition) {
        node.extends.accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个枚举定义。
     * @param node 要访问的节点。
     */
    visitEnumDefinition(node: nodes.EnumDefinition) {
        node.members.accept(this);
        node.extends.accept(this);
        node.implements.accept(this);
        node.genericParameters && node.genericParameters.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个扩展定义。
     * @param node 要访问的节点。
     */
    visitExtensionDefinition(node: nodes.ExtensionDefinition) {
        node.targetType.accept(this);
        node.implements.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个命名空间定义。
     * @param node 要访问的节点。
     */
    visitNamespaceDefinition(node: nodes.NamespaceDefinition) {
        node.names.accept(this);
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个模块。
     * @param node 要访问的节点。
     */
    visitModuleDefinition(node: nodes.ModuleDefinition) {
        node.members.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个类型子成员定义。
     * @param node 要访问的节点。
     */
    visitTypeMemberDefinition(node: nodes.TypeMemberDefinition) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个字段定义。
     * @param node 要访问的节点。
     */
    visitFieldDefinition(node: nodes.FieldDefinition) {
        node.variables.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个方法或属性定义。
     * @param node 要访问的节点。
     */
    visitMethodOrPropertyDefinition(node: nodes.MethodOrPropertyDefinition) {
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个属性或索引器定义。
     * @param node 要访问的节点。
     */
    visitPropertyOrIndexerDefinition(node: nodes.PropertyOrIndexerDefinition) {
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个属性定义。
     * @param node 要访问的节点。
     */
    visitPropertyDefinition(node: nodes.PropertyDefinition) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个索引器定义。
     * @param node 要访问的节点。
     */
    visitIndexerDefinition(node: nodes.IndexerDefinition) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个方法或构造函数定义。
     * @param node 要访问的节点。
     */
    visitMethodOrConstructorDefinition(node: nodes.MethodOrConstructorDefinition) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个方法定义。
     * @param node 要访问的节点。
     */
    visitMethodDefinition(node: nodes.MethodDefinition) {
        node.genericParameters.accept(this);
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个构造函数定义。
     * @param node 要访问的节点。
     */
    visitConstructorDefinition(node: nodes.ConstructorDefinition) {
        node.parameters.accept(this);
        node.body.accept(this);
        node.returnType.accept(this);
        node.explicitType.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个枚举的成员定义。
     * @param node 要访问的节点。
     */
    visitEnumMemberDefinition(node: nodes.EnumMemberDefinition) {
        node.initializer.accept(this);
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name && node.name.accept(this);
    }

    /**
     * 访问一个 import 指令(import xx from '...';)。
     * @param node 要访问的节点。
     */
    visitImportDirective(node: nodes.ImportDeclaration) {
        node.elements.accept(this);
        node.fromToken.accept(this);
    }

    /**
     * 访问一个 import = 指令(import xx = require("");)。
     * @param node 要访问的节点。
     */
    visitImportEqualsDirective(node: nodes.ImportAliasDeclaration) {
        node.variable.accept(this);
        node.value.accept(this);
    }

    /**
     * 访问一个名字导入声明项(a as b)。
     * @param node 要访问的节点。
     */
    visitNameImportClause(node: nodes.NameImportClause) {
        node.name && node.name.accept(this);
        node.alias.accept(this);
    }

    /**
     * 访问一个命名空间导入声明项({a as b})。
     * @param node 要访问的节点。
     */
    visitNamespaceImportClause(node: nodes.NamespaceImportClause) {
        node.elements.accept(this);
    }

    /**
     * 访问一个 export 指令(export xx from '...';)。
     * @param node 要访问的节点。
     */
    visitExportDirective(node: nodes.ExportDirective) {
        node.elements.accept(this);
        node.fromToken.accept(this);
    }

    /**
     * 访问一个 export = 指令(export = 1;)。
     * @param node 要访问的节点。
     */
    visitExportEqualsDirective(node: nodes.ExportEqualsDirective) {
        node.value.accept(this);
    }

    /**
     * 访问一个数组绑定模式([xx, ...])
     * @param node 要访问的节点。
     */
    visitArrayBindingPattern(node: nodes.ArrayBindingPattern) {
        node.elements.accept(this);
    }

    /**
     * 访问一个数组绑定模式项(xx, ..)
     * @param node 要访问的节点。
     */
    visitArrayBindingElement(node: nodes.ArrayBindingElement) {
        node.initializer.accept(this);
        node.name.accept(this);
    }

    /**
     * 访问一个对象绑定模式({xx, ...})
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
        node.propertyName.accept(this);
        node.name.accept(this);
    }

    /**
     * 访问一个变量声明(xx = ...)。
     * @param node 要访问的节点。
     */
    visitVariableDeclaration(node: nodes.VariableDeclaration) {
        node.type.accept(this);
        node.initializer.accept(this);
        node.name.accept(this);
    }

    /**
     * 访问一个参数声明。
     * @param node 要访问的节点。
     */
    visitParameterDeclaration(node: nodes.ParameterDeclaration) {
        node.decorators.accept(this);
        node.modifiers.accept(this);
        node.name.accept(this);
    }

    /**
     * 访问一个泛型参数。
     * @param node 要访问的节点。
     */
    visitGenericParameterDeclaration(node: nodes.GenericParameterDeclaration) {
        node.name.accept(this);
        node.constraint && node.constraint.accept(this);
    }

    /**
     * 访问一个 JS 注释。
     * @param node 要访问的节点。
     */
    visitComment(node: nodes.Comment) {

    }

    /**
     * 访问一个 JS 文档注释。
     * @param node 要访问的节点。
     */
    visitJsDocComment(node: nodes.JsDocComment) {

    }

    // #endregion

}