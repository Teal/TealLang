/**
 * @file 流程控制
 */

/**
 * 表示一个流程分支。
 */
class FlowBranch {

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
    execution: { [key: number]: number } = {};

    /**
     * 当前分支的执行栈。
     */
    statck: Value[] = [];

    /**
     * 当前分支内的所有变量。
     */
    variables = new Map<string, Value>();

    /**
     * 标记当前分支是否存在死循环。
     */
    loop: boolean;

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
        const branch = new FlowBranch();
        branch.parent = this;
        return branch;
    }

}

/**
 * 表示一个值。
 */
class Value {

    /**
     * 值的类型。
     */
    type: Type;

    /**
     * 如果当前值是常量则获取常量值。
     */
    value: boolean | number | string;

    /**
     * 是否常量。
     */
    get const() { return this.value !== undefined; }

    /**
     * 目标值。
     */
    target: Value;

    /**
     * 调用的成员列表。
     */
    members: Member[];

    /**
     * 属性。
     */
    properties = new Map<string, Value>();

}

/**
 * 执行指定的函数。
 * @param method 要执行的函数。
 * @param arguments 执行时传递的参数。
 */
function invokeMethod(method: Method, arguments: Value[]) {
  
}
