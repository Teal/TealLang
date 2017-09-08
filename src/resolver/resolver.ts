/**
 * 表示一个程序。
 */
export class Program {

    /**
     * 所有模块。
     */
    modules: Module[] = [];

}

/**
 * 表示一个模块。
 */
export class Module {

    /**
     * 所在程序。
     */
    parent: Program;

    /**
     * 源文件名。
     */
    fileName: string;

    /**
     * 所有成员。
     */
    members: Member[] = [];

    /**
     * 获取指定名称的成员。
     * @param name 成员名称。
     */
    getMember(name: string) {
        return this.members.find(member => member.name === name);
    }

    /**
     * 获取指定名称的所有成员。
     * @param name 成员名称。
     */
    getMembers(name: string) {
        return this.members.filter(member => member.name === name);
    }

}

/**
 * 表示一个成员。
 */
export abstract class Member {

    /**
     * 所在模块或类。
     */
    parent: Module | Class;

    /**
     * 获取所在模块。
     */
    get module() {
        let p = this.parent;
        while (!(p instanceof Module)) {
            p = this.parent;
        }
        return p;
    }

    /**
     * 成员名。
     */
    name: string;

    /**
     * 所有类型参数。
     */
    typeParameters: TypeParameter[] = [];

}

/**
 * 表示一个类。
 */
export class Class extends Member {

    /**
     * 基类。
     */
    bases: Class[] = [];

    /**
     * 所有成员。
     */
    members: Member[] = [];

    /**
     * 获取指定名称的成员。
     * @param name 成员名称。
     */
    getMember(name: string) {
        const member = this.members.find(member => member.name === name);
        if (member) {
            return member;
        }
        for (const base of this.bases) {
            const member = base.getMember(name);
            if (member) {
                return member;
            }
        }
    }

    /**
     * 获取指定名称的所有成员。
     * @param name 成员名称。
     */
    getMembers(name: string) {
        const members = this.members.filter(member => member.name === name);
        for (const base of this.bases) {
            members.push(...base.getMembers(name));
        }
        return members;
    }

}

/**
 * 表示一个方法。
 */
export class Method extends Member {

    /**
     * 所有参数。
     */
    parameters: Parameter[] = [];

    /**
     * 所有中间指令码。
     */
    body: ILCode[] = [];

}

/**
 * 表示一个参数。
 */
export class Parameter {

    /**
     * 参数名。
     */
    name: string;

}

/**
 * 表示一个类型参数。
 */
export class TypeParameter {

    /**
     * 参数名。
     */
    name: string;

}

/**
 * 表示一个中间指令码。
 */
export abstract class ILCode {

    /**
     * 返回值变量名。
     */
    result: string;

}

/**
 * 表示一个常量定义指令码（%1 = 1）。
 */
export class ConstantILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: number | string | boolean | null;

}

/**
 * 表示一个单目指令码（%1 = +%2）。
 */
export class UnaryILCode extends ILCode {

    /**
     * 运算符。
     */
    operator: "+" | "-" | "!";

    /**
     * 运算数变量名。
     */
    operand: "";

}

/**
 * 表示一个双目指令码（%1 = %2 + %3）。
 */
export class BinaryILCode extends ILCode {

    /**
     * 左运算数变量名。
     */
    leftOperand: "";

    /**
     * 运算符。
     */
    operator: "+" | "-" | "*" | "/" | "%";

    /**
     * 右运算数变量名。
     */
    rightOperand: "";

}

/**
 * 表示一个跳转指令码（goto #1）。
 */
export class GotoILCode extends ILCode {

    /**
     * 跳转的目标指令码码索引。
     */
    target: number;

}

/**
 * 表示一个判断跳转指令码（if %1 goto #1）。
 */
export class GotoIfILCode extends GotoILCode {

    /**
     * 判断的变量名。
     */
    condition: string;

}

/**
 * 表示一个函数调用指令码（call %1(...)）。
 */
export class CallILCode extends ILCode {

    /**
     * 调用的目标变量。
     */
    target: string;

    /**
     * 参数变量名。
     */
    arguments: string[];

}

/**
 * 表示一个成员引用指令码（%1 = %1.foo）。
 */
export class MemberILCode extends ILCode {

    /**
     * 调用的目标成员。
     */
    target: string;

}

/**
 * 表示一个索引指令码（%1 = %1[%2]）。
 */
export class IndexerILCode extends ILCode {

    /**
     * 调用的目标变量名。
     */
    target: string;

}

/**
 * 表示一个变量。
 */
export class Variable {

    /**
     * 变量名。
     */
    name: string;

    /**
     * 变量值。
     */
    value: Value;

}

/**
 * 值。
 */
export class Value {

    /**
     * 值的类型。
     */
    type: Type;

    /**
     * 是否常量。
     */
    const: boolean;

    /**
     * 是否外部。
     */
    external: boolean;

    /**
     * 属性。
     */
    properties: Variable[];

}

/**
 * 表示一个类型。
 */
export class Type {

}
