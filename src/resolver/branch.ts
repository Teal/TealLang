/**
 * @file 执行分支
 */

/**
 * 表示一个执行分支。
 */
class Branch {

    /**
     * 上级流程分支。如果是顶级分支则返回所在函数。
     */
    parent: FlowBranch | Method;

    /**
     * 获取所在方法。
     */
    get method() {
        let p = this.parent;
        while (p instanceof FlowBranch) {
            p = p.parent;
        }
        return p;
    }

    /**
     * 存储每个指令的执行次数。
     */
    execution: { [key: number]: boolean } = {};

    /**
     * 当前分支的执行栈。
     */
    statck: Value[] = [];

    /**
     * 当前分支内的所有变量。
     */
    variables = new Map<string, Value>();

    /**
     * 标记当前分支是否存在执行到末尾。
     */
    end: boolean;

    /**
     * 当前分支的返回值。
     */
    get return() { return this.loop ? null : this.statck[this.statck.length - 1]; }

    /**
     * 在当前分支解析一个名称实际指代的值。
     * @param name 变量名。
     */
    resolveIdentifier(name: string): Value {
        // 可能是当前分支下定义的变量。
        const local = this.variables.get(name);
        if (local) {
            return local;
        }

        // 可能是父分支定义的变量。
        if (this.parent instanceof FlowBranch) {
            return this.parent.resolveIdentifier(name);
        }

        // 可能是所在类和模块的成员。
        const members = this.parent.findMembers(name);
        if (members) {
            return createValueFromMembers(null, members);
        }

        // 找不到名称。
        return null;
    }

    /**
     * 创建当前分支的子分支。
     */
    createChild() {
        const branch = new Branch();
        branch.parent = this;
        return branch;
    }

}

/**
 * 表示一个值。
 */
class Value {

    /**
     * 获取指定名字的所有属性。
     * @param name 属性名。
     */
    getProperties(name: string): Value[] {

    }

}

const anyType = new Type();

const booleanType = new Type();

const numberType = new Type();

const stringType = new Type();

const functionType = new Type();

const classType = new Type();
