/**
 * @file 流程控制
 */

/**
 * 表示一个流程分支。
 */
class FlowBranch {

    /**
     * 上级流程分支。
     */
    parent: FlowBranch | Method;

    /**
     * 当前分支的所有值。
     */
    values: Value[];

    /**
     * 当前分支的返回值。
     */
    return: Value;

    /**
     * 存储每个指令的执行次数。
     */
    execution: { [key: number]: number } = {};

    /**
     * 在当前分支查找指定的值。
     * @param name 变量名。
     */
    get(name: string): Value {
        const value = this.values.find(v => v.name === value.name);
        if (value) {
            return value;
        }
        if (this.parent instanceof FlowBranch) {
            return this.parent.get(name);
        }
        return this.parent.resolveMember(name);
    }

    /**
     * 添加或覆盖当前分支指定变量的值。
     * @param value 变量值。
     */
    add(value: Value) {
        const index = this.values.findIndex(v => v.name === value.name);
        if (index >= 0) {
            this.values[index] = value;
        } else {
            this.values.push(value);
        }
    }

}

/**
 * 表示一个值。
 */
class Value {

    /**
     * 变量名。
     */
    name: string;

    /**
     * 值的类型。
     */
    type: Type;

    /**
     * 目标值。
     */
    target: Value;

    /**
     * 调用的成员列表。
     */
    members: Member[];

    /**
     * 如果当前值是常量则获取常量值。
     */
    value: ConstantILCode["value"];

    /**
     * 是否常量。
     */
    get const() { return this.value !== undefined; }

    /**
     * 是否外部。
     */
    external: boolean;

    /**
     * 属性。
     */
    properties: Value[];

    getMember(name: string): Member[] {

    }

}

/**
 * 执行指定的函数。
 * @param method 要执行的函数。
 * @param arguments 执行时传递的参数。
 */
function invokeMethod(method: Method, arguments: Value[]) {
    const currentBranch = new FlowBranch();
    currentBranch.parent = method;
    currentBranch.values.push(...arguments);
    return _executeCore(currentBranch, method.body, 0);
}

function _executeCore(branch: FlowBranch, ilCodes: ILCode[], index: number) {
    for (let i = index; i < ilCodes.length; i++) {
        if (branch.execution[i]) {
            return;
        }
        branch.execution[i] = 1;
        const ilCode = ilCodes[i];
        switch (ilCode.constructor) {
            case ConstantILCode:
                {
                    branch.add(createValueFromConstatnt(ilCode.result, (ilCode as ConstantILCode).value));
                }
                break;
            case UnaryILCode:
            case BinaryILCode:
            case IndexerILCode:
            case GotoILCode:
                {
                    _executeCore(branch, ilCodes, (ilCode as GotoILCode).target);
                    return;
                }
                break;
            case GotoIfILCode:
                {
                    const child = createBranch(branch);
                    _executeCore(child, ilCodes, i + 1);
                    return;
                }
                break;
            case CallILCode:
                {
                    const value = branch.get((ilCode as CallILCode).target);
                    if (!value) {

                    }
                    const arguments = (ilCode as CallILCode).arguments.map(argument => branch.get(argument));
                    if (value.members) {
                        const member = resolveOverload(value.members, arguments);
                        if (!member) {

                        }
                        const branches = invokeMethod(member, arguments);
                        if (branches.length > 1) {
                            // 为每个返回结果创建新分支。
                            for (const br of branches) {
                                const child = createBranch(branch);
                                child.add(createValueFromValue(ilCode.result, br.return));
                                _executeCore(child, ilCodes, i + 1);
                                return;
                            }
                        } else {
                            branch.add(createValueFromValue(ilCode.result, branches[0].return));
                        }
                    }
                }
                break;
            case MemberILCode:
                {
                    const value = branch.get((ilCode as MemberILCode).target);
                    if (!value) {

                    }
                    const members = value.type.getMember((ilCode as MemberILCode).target);
                    if (members) {
                        branch.add(createValueFromMember(ilCode.result, value, members));
                    }
                }
                break;
        }
    }
}

function resolveMember() {

}

function createBranch(parent: FlowBranch) {
    const branch = new FlowBranch();
    branch.parent = parent;
    return branch;
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

function createValueFromConstatnt(name: string, value: ConstantILCode["value"]) {
    const v = new Value();
    v.name = name;
    v.value = value;
    v.type = typeof value === "boolean" ? booleanType : typeof value === "string" ? stringType : typeof value === "number" ? numberType : anyType;
    return v;
}

function createValueFromMember(name: string, value: Value, members: Member[]) {
    const v = new Value();
    v.name = name;
    v.target = value;
    v.members = members;
    v.type = members[0] && members[0] instanceof Method ? functionType : classType;
    return v;
}

function resolveOverload(overloads: Member[], arguments: Value[]) {

}
