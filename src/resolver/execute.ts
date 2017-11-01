
/**
 * 执行指定的函数。
 * @param method 要执行的函数。
 * @param arguments 执行时传递的参数。
 */
function executeMethod(method: Method, arguments: Value[]) {
    method.branches = [];
    const currentBranch = new FlowBranch();
    currentBranch.parent = method;
    currentBranch.values.push(...arguments);
    _executeCore(currentBranch, method.body, 0);
    return method.branches;
}

// fn(a) {
//      b = 1
//  #18:a++
//      gn(b)
//      b = "4"
//      if (a > 10) goto #18
// }

function _executeCore(ilCodes: ILCode[], index: number, branch: Branch) {
    while (index < ilCodes.length) {
        if (branch.execution[index]) {
            branch.end = false;
            return;
        }
        branch.execution[index] = true;
        const ilCode = ilCodes[index];
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
