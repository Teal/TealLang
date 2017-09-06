/**
 * @fileOverview 标识
 */

import * as nodes from '../ast/nodes';

// #region 标识

/**
 * 表示一个标识（如变量、参数、表达式和成员引用等）。
 */
export abstract class Symbol {

    /**
     * 获取或设置当前成员的名字。
     */
    name: string;

    /**
     * 获取当前标识的定义节点。如果当前标识是外部导入的，则返回 undefined。
     */
    definition: Node;

    /**
     * 获取当前标识的声明节点。如果当前标识是外部导入的，则返回 undefined。
     */
    declarions: Node[];

    /**
     * 获取当前标识的文档注释。
     */
    docComment: nodes.JsDocComment;

}

// #endregion

// #region 成员

/**
 * 表示一个成员标识。
 */
export class MemberSymbol extends Symbol {

    /**
     * 获取当前成员的所属成员。
     */
    parent: MemberSymbol;

    /**
     * 获取当前成员的原型标识。
     */
    proto: MemberSymbol;

    /**
     * 存储当前成员下的子成员。
     */
    members: { [name: string]: MemberSymbol };

    /**
     * 获取当前类型指定名称的成员。
     * @param name 要获取的名称。
     * @returns 返回对应的成员。如果找不到则返回 undefined。
     */
    getMember(name: string) {
        return this.getOwnMember(name) || this.proto.getMember(name);
    }

    /**
     * 获取当前类型所属的指定名称的成员。
     * @param name 要获取的名称。
     * @returns 返回对应的成员。如果找不到则返回 undefined。
     */
    getOwnMember(name: string) {
        if (name === "__proto__") {
            return this.proto;
        }
        return this.members && this.members[name];
    }

}

/**
 * 表示成员修饰符的枚举。
 */
export enum Modifiers {

    /**
     * 无修饰符。
     */
    none,

    /**
     * 表示静态的成员。
     */
    static,

    /**
     * 表示最终的成员。标记当前类不可被继承、函数不可被重写、字段不可被改变。
     */
    final,

    /**
     * 表示覆盖的成员。
     */
    new,

    /**
     * 表示抽象的成员。
     */
    abstract,

    /**
     * 表示虚成员。
     */
    virtual,

    /**
     * 表示重写的成员。
     */
    override,

    /**
     * 表示外部的成员。
     */
    declare,

    /**
     * 表示公开的成员。
     */
    public,

    /**
     * 表示保护的成员。
     */
    protected,

    /**
     * 表示私有的成员。
     */
    private,

    /**
     * 表示访问修饰符。
     */
    accessibility,

}

/**
 * 表示一个方法标识。
 */
export class MethodSymbol extends MemberSymbol {



}

// #endregion

// #region 类型

/**
 * 表示一个类型（如类、结构、接口、枚举）标识。
 */
export class TypeSymbol extends Symbol {

    /**
     * 
     */
    predefined: boolean;

    /**
     * 获取当前符号的定义。如果当前符号是外部导入的，则返回 undefined。
     */
    definition: any;

}

/**
 * 表示一个类型标识。
 */
export class GenericTypeSymbol extends TypeSymbol {

}

/**
 * 表示一个类型（如类、结构、接口、枚举）标识。
 */
export class PrimaryTypeSymbol extends Symbol {

    constructor(name: string) {
        super();
        this.name = name;
    }

}

// #endregion