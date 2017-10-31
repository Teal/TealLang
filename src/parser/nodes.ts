/**
 * @file 语法树节点
 */

/**
 * 表示一个位置。
 */
export class Location {

    /**
     * 当前位置所在的源文件。
     */
    fileName: string;

    /**
     * 当前位置在源文件中的开始索引。
     */
    start: number;

    /**
     * 当前位置在源文件中的结束索引。
     */
    end: number;

}

/**
 * 表示一个语法树节点。
 */
abstract class Node {

    /**
     * 当前节点的父节点。
     */
    parent: Node;

    /**
     * 当前节点在源码的位置。
     */
    location: Location;

}

/**
 * 表示一个表达式。
 */
abstract class Expression extends Node {

}

/**
 * 表示一个标识符(`x`)。
 */
class Identifier extends Expression {

    /**
     * 当前标识符的内容。
     */
    value: string;

}

/**
 * 表示一个简单字面量(`this`、`super`、`null`、`true`、`false`)。
 */
class SimpleLiteral extends Expression {

    /**
     * 获取当前字面量的类型。合法的值有：this、super、null、true、false。
     */
    type: TokenType;

}

/**
 * 表示一个语句。
 */
abstract class Statement extends Node {

    /**
     * 当前语句末尾分号的位置。如果不存在分号则为 null。
     */
    semicolon: Location;

}

/**
 * 表示一个空语句(`;`)。
 */
class EmptyStatement extends Statement {

}

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
 * 表示一个方法声明(`fn() {...}`)。
 */
class MethodDeclaration extends Declaration {

    /**
     * 获取当前方法的所有类型参数(可能不存在)。
     */
    typeParameters: NodeList<TypeParametersDeclaration>;

    /**
     * 获取当前方法的所有参数。
     */
    parameters: NodeList<ParameterDeclaration>;

    /**
     * 获取当前方法的名字部分。
     */
    name: Identifier;

    /**
     * 获取当前方法返回类型前冒号的位置(可能不存在)。
     */
    colonToken: number;

    /**
     * 获取当前方法的返回类型(可能不存在)。
     */
    returnType: Expression;

    /**
     * 获取当前方法的主体。
     */
    body: ArrowFunctionExpression | BlockStatement;


}

/**
 * 表示一个源文件。
 */
class SourceFile extends Node {
    
    /**
     * 当前源文件的内容。
     */
    content: string;

    /**
     * 当前源文件的文档注释。
     */
    docComment: DocComment;

    /**
     * 当前源文件的所有语句。
     */
    statements: Statement[];

}
