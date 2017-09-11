/**
 * @file 中间指令码
 */

/**
 * 表示一个中间指令码。
 */
abstract class ILCode {

    /**
     * 当前字节码的原始节点。
     */
    node: Node;

}

/**
 * 表示一个空指定码。
 */
class EmptyILCode extends ILCode { }

/**
 * 表示一个复制指定码（`%2 = %1`）。
 */
class DuplicateILCode extends ILCode { }

/**
 * 表示一个载入 true 指令码（`%1 = true`）。
 */
class LoadTrueILCode extends ILCode { }

/**
 * 表示一个载入 false 指令码（`%1 = false`）。
 */
class LoadFalseILCode extends ILCode { }

/**
 * 表示一个载入 null 指令码（`%1 = null`）。
 */
class LoadNullILCode extends ILCode { }

/**
 * 表示一个载入数值指令码（`%1 = 1`）。
 */
class LoadNumberILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: number;

}

/**
 * 表示一个载入字符串指令码（`%1 = "foo"`）。
 */
class LoadStringILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: string;

}

/**
 * 表示一个载入单位指令码（`%1 = 10px`）。
 */
class LoadUnitILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: number;

    /**
     * 定义的单位。
     */
    unit: string;

}

/**
 * 表示一个载入标识符指令码（`%1 = abc`）。
 */
class LoadIdentifierILCode extends ILCode {

    /**
     * 变量名。
     */
    name: string;

}

/**
 * 表示一个载入成员指令码（`%1 = %2.foo`）。
 */
class LoadMemberILCode extends ILCode {

    /**
     * 调用的目标。
     */
    target: string;

    /**
     * 调用的成员名。
     */
    name: string;

}

/**
 * 表示一个存储指令码（`%1 = %2`）。
 */
class SaveILCode extends ILCode {

    /**
     * 变量名。
     */
    name: string;

}

/**
 * 表示一个跳转指令码（`goto #1`）。
 */
class GotoILCode extends ILCode {

    /**
     * 跳转的目标指令码索引。
     */
    target: number;

}

/**
 * 表示一个判断跳转指令码（`if %1 goto #1`）。
 */
class GotoIfILCode extends GotoILCode { }

/**
 * 表示一个函数调用指令码（`%1 = %2(...)`）。
 */
class CallILCode extends ILCode {

    /**
     * 参数变量名。
     */
    argumentCount: number;

}

/**
 * 表示一个索引指令码（`%1 = %2[...]`）。
 */
class IndexerILCode extends ILCode {

    /**
     * 参数变量名。
     */
    argumentCount: number;

}

/**
 * 表示一个返回指令码（`return %1`）。
 */
class ReturnILCode extends ILCode { }

/**
 * 表示一个正运算指令码（`%1 = +%2`）。
 */
class AddUnaryILCode extends ILCode { }

/**
 * 表示一个负运算指令码（`%1 = -%2`）。
 */
class SubUnaryILCode extends ILCode { }

/**
 * 表示一个非运算指令码（`%1 = !%2`）。
 */
class NotUnaryILCode extends ILCode { }

/**
 * 表示一个加运算双目指令码（`%1 = %2 + %3`）。
 */
class AddBinaryILCode extends ILCode { }

/**
 * 表示一个减运算双目指令码（`%1 = %2 - %3`）。
 */
class SubBinaryILCode extends ILCode { }

function convertToILCodes(context: Node, statements: Statement): ILCode[] {

}
