/**
 * @file 中间指令码
 */

/**
 * 表示一个中间指令码。
 */
abstract class ILCode {

    /**
     * 返回值变量名。
     */
    result: string;

}

/**
 * 表示一个常量定义指令码（`%1 = 1`）。
 */
class ConstantILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: number | string | boolean | null;

}

/**
 * 表示一个单目指令码（`%1 = +%2`）。
 */
class UnaryILCode extends ILCode {

    /**
     * 运算符。
     */
    operator: TokenType;

    /**
     * 运算数变量名。
     */
    operand: string;

}

/**
 * 表示一个双目指令码（`%1 = %2 + %3`）。
 */
class BinaryILCode extends ILCode {

    /**
     * 左运算数变量名。
     */
    leftOperand: string;

    /**
     * 运算符。
     */
    operator: TokenType;

    /**
     * 右运算数变量名。
     */
    rightOperand: string;

}

/**
 * 表示一个跳转指令码（`goto #1`）。
 */
class GotoILCode extends ILCode {

    /**
     * 跳转的目标指令码码索引。
     */
    target: number;

}

/**
 * 表示一个判断跳转指令码（`if %1 goto #1`）。
 */
class GotoIfILCode extends GotoILCode {

    /**
     * 判断的变量名。
     */
    condition: string;

}

/**
 * 表示一个函数调用指令码（`%1 = %2(...)`）。
 */
class CallILCode extends ILCode {

    /**
     * 调用的目标。
     */
    target: string;

    /**
     * 参数变量名。
     */
    arguments: string[];

}

/**
 * 表示一个成员引用指令码（`%1 = %2.foo`）。
 */
class MemberILCode extends ILCode {

    /**
     * 调用的目标。
     */
    target: string;

    /**
     * 调用的参数。
     */
    argument: string;

}

/**
 * 表示一个索引指令码（`%1 = %2[%3]`）。
 */
class IndexerILCode extends ILCode {

    /**
     * 调用的目标变量名。
     */
    target: string;

}

function convertToILCodes(context: Node, statements: Statement): ILCode[] {

}
