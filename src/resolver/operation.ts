/**
 * 表示一个操作。
 */
export abstract class Operation {

    /**
     * 返回值变量名。
     */
    result: string;

}

/**
 * 表示一个常量定义操作（%1 = 1）。
 */
export class ConstantOperation extends Operation {

    /**
     * 定义的常量值。
     */
    value: number | string | boolean | null;

}

/**
 * 表示一个单目操作（%1 = +%2）。
 */
export class UnaryOperation extends Operation {

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
 * 表示一个双目操作（%1 = %2 + %3）。
 */
export class BinaryOperation extends Operation {

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
 * 表示一个跳转操作（goto #1）。
 */
export class GotoOperation extends Operation {

    /**
     * 跳转的目标操作码索引。
     */
    target: number;

}

/**
 * 表示一个判断跳转操作（if %1 goto #1）。
 */
export class GotoIfOperation extends GotoOperation {

    /**
     * 判断的变量名。
     */
    condition: string;

}

/**
 * 表示一个函数调用操作（call %1(...)）。
 */
export class CallOperation extends Operation {

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
 * 表示一个成员引用操作（%1 = %1.foo）。
 */
export class MemberOperation extends Operation {

    /**
     * 调用的目标成员。
     */
    target: string;

}

/**
 * 表示一个索引操作（%1 = %1[%2]）。
 */
export class IndexerOperation extends Operation {

    /**
     * 调用的目标变量名。
     */
    target: string;

}
