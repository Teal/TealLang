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
    method.branches = [];
    const currentBranch = new FlowBranch();
    currentBranch.parent = method;
    currentBranch.values.push(...arguments);
    _executeCore(currentBranch, method.body, 0);
    return method.branches;
}

function _executeCore(branch: FlowBranch, ilCodes: ILCode[], index: number) {
    for (let i = index; i < ilCodes.length; i++) {
        if (branch.execution[i]) {
            branch.execution[i]++;
            branch.loop = true;
            return;
        }
        branch.execution[i] = 1;
        const ilCode = ilCodes[i];
        switch (ilCode.constructor) {
            case LoadNullILCode:
                branch.statck.push(createValueFromConstatnt(null));
                break;
            case LoadTrueILCode:
                branch.statck.push(createValueFromConstatnt(true));
                break;
            case LoadFalseILCode:
                branch.statck.push(createValueFromConstatnt(false));
                break;
            case LoadNumberILCode:
                branch.statck.push(createValueFromConstatnt((ilCode as LoadNumberILCode).value));
                break;
            case LoadStringILCode:
                branch.statck.push(createValueFromConstatnt((ilCode as LoadStringILCode).value));
                break;
            case LoadIdentifierILCode:
                {
                    const resolved = branch.resolveIdentifier((ilCode as LoadIdentifierILCode).name);
                    if (resolved) {
                        branch.statck.push(resolved);
                    } else {
                        branch.method.compiler.error(ilCode.node.location, "'{0}' is not defined.", (ilCode as LoadIdentifierILCode).name);
                        branch.statck.push(createValueFromConstatnt(null));
                    }
                }
                break;
            case LoadMemberILCode:
                {
                    const value = branch.statck.pop();
                    if (value) {
                        const resolved = value.type.getMembers((ilCode as LoadMemberILCode).name);
                        if (resolved) {
                            branch.statck.push(createValueFromMembers(value, resolved));
                        } else {
                            branch.method.compiler.error(ilCode.node.location, "'{0}' is not a member of '{1}'.", (ilCode as LoadIdentifierILCode).name, value.type);
                            branch.statck.push(createValueFromConstatnt(null));
                        }
                    } else {
                        branch.method.compiler.error(ilCode.node.location, "Invalid ilcode");
                        branch.statck.push(createValueFromConstatnt(null));
                    }
                }
                break;
            case AddUnaryILCode:
            case IndexerILCode:
            case GotoILCode:
                {
                    _executeCore(branch, ilCodes, (ilCode as GotoILCode).target);
                    return;
                }
                break;
            case GotoIfILCode:
                {
                    const child = branch.createChild();
                    _executeCore(child, ilCodes, i + 1);
                    return;
                }
                break;
            case CallILCode:
                {
                    // 取出调用参数。
                    const arguments = new Array((ilCode as CallILCode).argumentCount);
                    for (let i = (ilCode as CallILCode).argumentCount; i > 0; i--) {
                        const argument = branch.statck.pop();
                        if (!argument) {
                            // 错误
                        }
                        arguments.push(argument);
                    }

                    // 取出函数本身。
                    const func = branch.statck.pop();
                    if (!func) {
                        // 错误
                    }

                    if (func.members) {
                        // 解析函数重载。
                        const member = resolveOverload(func.members, arguments);
                        if (!member) {

                        }

                        // 执行各分支。
                        const branches = invokeMethod(member, arguments);
                        if (branches.length > 1) {
                            // 为每个返回结果创建新分支。
                            for (const br of branches) {
                                const child = branch.createChild();
                                child.statck.push(br.return);
                                _executeCore(child, ilCodes, i + 1);
                                return;
                            }
                        } else {
                            branch.statck.push(createValueFromValue(ilCode.result, branches[0].return));
                        }
                    }
                }
                break;
            case ReturnILCode:
                branch.method.branches.push(branch);
                return;
        }
    }
    branch.method.branches.push(branch);
}

function resolveMember() {

}

function createValueFromValue(name: string, value: Value) {
    const v = new Value();
    v.name = name;
    v.value = value.value;
    v.target = value.target;
    v.members = value.members;
    v.type = value.type;
    v.properties = value.properties.slice(0);
    return v;
}

function createValueFromConstatnt(value: Value["value"]) {
    const v = new Value();
    v.value = value;
    v.type = typeof value === "boolean" ? booleanType : typeof value === "string" ? stringType : typeof value === "number" ? numberType : anyType;
    return v;
}

function createValueFromMembers(target: Value, members: Member[]) {
    const v = new Value();
    v.target = target;
    v.members = members;
    v.type = members[0] && members[0] instanceof Method ? functionType : classType;
    return v;
}

function resolveOverload(overloads: Member[], arguments: Value[]) {

}
