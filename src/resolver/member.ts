/**
 * @file 成员
 */

/**
 * 表示一个成员。
 */
abstract class Member {

    /**
     * 源语法树节点。
     */
    node: Node;

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
     * 获取所在程序。
     */
    get program() { return this.module.parent; }

    /** 
     * 获取所使用的编译器。
     */
    get compiler() { return this.program.compiler; }

    /**
     * 成员名。
     */
    name: string;

    /**
     * 所有类型参数。
     */
    typeParameters: TypeParameter[] = [];

    /**
     * 当前成员被获取的次数。
     */
    getCount = 0;

    /**
     * 当前成员被设置的次数。
     */
    setCount = 0;

    /**
     * 解析当前成员。
     */
    abstract resolve();

    /**
     * 获取指定名称指代的成员。
     * @param name 成员名称。
     */
    findMembers(name: string) {
        return this.parent.resolveMember(name);
    }

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

    resolve() {

    }

}

/**
 * 表示一个方法。
 */
class Method extends Member {

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

    resolve() {
        this.getCount++;


    }

    /**
     * 判断当前函数是否有副作用。
     */
    hasSideEffects: boolean;

    /**
     * 当前函数内被获取过的成员。
     */
    getted: Member[];

    /**
     * 当前函数内被设置过的成员。
     */
    setted: Member[];

    /**
     * 当前函数执行完成后的分支情况。
     */
    @cache get branches() { return invokeMethod(this, []); }

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
    
        /**
         * 获取指定名称指代的成员。
         * @param name 成员名称。
         */
        resolveMember(name: string) {
            // 在当前模块范围内无法找到指定的模块。
            const member = this.getMembers(name);
            if (member.length) {
                return member;
            }
            // 尝试扫描项目内所有源码。
        }
    
    }
    
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
        resolve() {
    
        }
    
    }
    