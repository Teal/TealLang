import * as operation from "./operation";
import * as type from "./type";

/**
 * 表示一个函数主体。
 */
export class FunctionBody {



}

/**
 * 表示一个执行分支。
 */
export class Branch {

    /**
     * 父分支。
     */
    parent?: Branch;

    /**
     * 当前分支开始执行的第一个操作符索引
     */
    start = 0;

    /**
     * 当前分支开始执行的最后一个操作符索引
     */
    end: number;

    /**
     * 当前分支定义的变量。
     */
    variables: Variable[];

    /**
     * 当前分支返回的类型。
     */
    return: type.Type;

    /**
     * 当前分支产生的错误。
     */
    errors: string[];

    /**
     * 报告当前分支的错误。
     * @param message 错误信息。
     * @param args 错误参数列表。
     */
    error(message: string, ...args: any[]) {

    }

    /**
     * 判断当前分支是否包含指定的操作码索引。
     * @param index 要判断的操作码索引。
     * @return 如果包含则返回 true，否则返回 false。
     */
    contains(index: number) {
        if (index >= this.start && index <= this.end) {
            return true;
        }
        if (this.parent) {
            return this.parent.contains(index);
        }
        return false;
    }

    /**
     * 获取当前分支变量的值。
     * @param name 要获取的变量名。
     * @return 返回变量的类型。如果变量是一个引用则自动计算。如果变量不存在则返回 null。
     */
    get(name: string) {

    }

    /**
     * 设置当前分支变量的值。
     * @param name 要设置的变量名。 
     * @param value 要设置的变量值。
     */
    set(name: string, value: Type) {

    }

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
     * 变量类型。
     */
    type: type.Type;

}

export class ResolveContext {

}

//
// a = 1
// a = a + 1
// if a > 2 goto #61
// goto #58

/**
 * 解析指定的字节码。
 * @param operations 要解析的操作列表。
 * @param branch 初始的分支。
 * @return 返回执行结束的所有分支。
 */
export function resolve(operations: operation.Operation[], branch: Branch) {
    const result: Branch[] = [];
    for (let i = branch.start; i < operations.length; i++) {
        const op = operations[i];
        switch (op.constructor) {
            case operation.ConstantOperation:
                branch.set(op.result, type.createTypeFromConstant((op as operation.ConstantOperation).value));
                break;
            case operation.UnaryOperation:
                const operand = branch.get((op as operation.UnaryOperation).operand);
                if (!operand) {
                    branch.error("Variable {0} is not defined in current branch.", (op as operation.UnaryOperation).operand);
                } else {
                    // TODO: 将 operand 引用转为类型。
                    switch ((op as operation.UnaryOperation).operator) {
                        case "+":
                            branch.set(op.result, operand.positive());
                            break;
                        case "-":
                            branch.set(op.result, operand.negative());
                            break;
                    }
                }
                break;
            case operation.GotoOperation:
                branch.end = i;

                // 如果当前分支已包含目标字节码，则重新执行会导致死循环。
                if (!branch.contains((op as operation.GotoOperation).target)) {
                    const childBranch = new Branch();
                    childBranch.parent = branch;
                    childBranch.start = (op as operation.GotoOperation).target;
                    result.push(...resolve(operations, childBranch));
                }
                return result;
        }
    }
    result.push(branch);
    return result;
}
