/**
 * @file 语义解析器
 */

/**
 * 表示一个程序。
 */
class Program {

    /**
     * 当前使用的编译器。
     */
    compiler: Compiler;

    /**
     * 所有模块。
     */
    modules: Module[] = [];

    /**
     * 对整个程序执行语义分析。
     */
    resolve(){

    }

}

/**
 * 表示一个模块。
 */
class Module {

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
abstract class Member {

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
class Class extends Member {

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
class Method extends Member {

    /**
     * 当前函数的原始声明。
     */
    declaration: MethodDeclaration;

    /**
     * 所有参数。
     */
    parameters: Parameter[] = [];

    /**
     * 所有中间指令码。
     */
    @cache get body(): ILCode[] {
        return convertToILCodes(this.declaration, this.declaration.body);
    }

}

/**
 * 表示一个参数。
 */
class Parameter {

    /**
     * 参数名。
     */
    name: string;

}

/**
 * 表示一个类型参数。
 */
class TypeParameter {

    /**
     * 参数名。
     */
    name: string;

}

/**
 * 表示一个类型。
 */
class Type {

}
