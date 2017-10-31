/**
 * @file 中间指令码
 */

/**
 * 表示一个中间指令码。
 */
abstract class ILCode {

    /**
     * 源语法节点。
     */
    node: Node;

}

/**
 * 表示一个无操作指定码。
 */
class NoOperationILCode extends ILCode { }

/**
 * 表示一个复制指定码。
 */
class DuplicateILCode extends ILCode { }

/**
 * 表示一个删除值指定码。
 */
class PopILCode extends ILCode { }

/**
 * 表示一个载入数值指令码（`1`）。
 */
class LoadNumberILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: number;

}

/**
 * 表示一个载入字符串指令码（`"hello"`）。
 */
class LoadStringILCode extends ILCode {

    /**
     * 定义的常量值。
     */
    value: string;

}

/**
 * 表示一个载入 true 指令码（`true`）。
 */
class LoadTrueILCode extends ILCode { }

/**
 * 表示一个载入 false 指令码（`false`）。
 */
class LoadFalseILCode extends ILCode { }

/**
 * 表示一个载入 null 指令码（`null`）。
 */
class LoadNullILCode extends ILCode { }

/**
 * 表示一个载入变量指令码（`abc`）。
 */
class LoadVariableILCode extends ILCode {

    /**
     * 变量名。
     */
    name: string;

}

/**
 * 表示一个载入属性指令码（`abc.xyz`）。
 */
class LoadPropertyILCode extends ILCode {

    /**
     * 属性名。
     */
    name: string;

}

/**
 * 表示一个载入系统变量指令码（`::abc`）。
 */
class LoadSystemVariableILCode extends ILCode {

}

/**
 * 表示一个存储指令码（`a = b`）。
 */
class SaveILCode extends ILCode { }

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
 * 表示一个如果为 true 则跳转指令码（`if true goto #1`）。
 */
class GotoIfTrueILCode extends GotoILCode { }

/**
 * 表示一个如果为 false 则跳转指令码（`if false goto #1`）。
 */
class GotoIfFalseILCode extends GotoILCode { }

/**
 * 表示一个返回指令码（`return xx`）。
 */
class ReturnILCode extends GotoILCode { }

/**
 * 表示一个迭代返回指令码（`yield xx`）。
 */
class YieldLCode extends GotoILCode { }

/**
 * 表示一个函数调用指令码（`%1 = %2(...)`）。
 */
class CallILCode extends ILCode {

    /**
     * 实参数。
     */
    argumentCount: number;

}

/**
 * 表示一个索引指令码（`a[bcd]`）。
 */
class IndexerILCode extends ILCode {

    /**
     * 实参数。
     */
    argumentCount: number;

}

/**
 * 表示一个正运算指令码（`+abc`）。
 */
class PostiveILCode extends ILCode { }

/**
 * 表示一个负运算指令码（`-abc`）。
 */
class NegtiveILCode extends ILCode { }

/**
 * 表示一个非运算指令码（`!abc`）。
 */
class NotILCode extends ILCode { }

/**
 * 表示一个加运算双目指令码（`abc + xyz`）。
 */
class AddBinaryILCode extends ILCode { }

/**
 * 表示一个减运算双目指令码（`abc - xyz`）。
 */
class SubtractILCode extends ILCode { }

/**
 * 表示一个乘运算双目指令码（`abc * xyz`）。
 */
class MultiplyILCode extends ILCode { }

/**
 * 表示一个除运算双目指令码（`abc / xyz`）。
 */
class DivideILCode extends ILCode { }

/**
 * 表示一个模运算双目指令码（`abc % xyz`）。
 */
class ModuleILCode extends ILCode { }

/**
 * 表示一个幂运算双目指令码（`abc ^ xyz`）。
 */
class PowerILCode extends ILCode { }

/**
 * 表示一个等运算双目指令码（`abc == xyz`）。
 */
class EqualILCode extends ILCode { }

/**
 * 表示一个不等运算双目指令码（`abc != xyz`）。
 */
class NotEqualILCode extends ILCode { }

/**
 * 表示一个小于运算双目指令码（`abc < xyz`）。
 */
class LessThanILCode extends ILCode { }

/**
 * 表示一个大于运算双目指令码（`abc > xyz`）。
 */
class GreterThanILCode extends ILCode { }

/**
 * 表示一个小于等于运算双目指令码（`abc <= xyz`）。
 */
class LessThenOrEqualILCode extends ILCode { }

/**
 * 表示一个大于等于运算双目指令码（`abc >= xyz`）。
 */
class GreterThanOrEqualILCode extends ILCode { }

/**
 * 表示一个且运算双目指令码（`abc && xyz`）。
 */
class AndILCode extends ILCode { }

/**
 * 表示一个或运算双目指令码（`abc || xyz`）。
 */
class OrILCode extends ILCode { }

/**
 * 表示一个分支且运算双目指令码（`abc & xyz`）。
 */
class BranchAndILCode extends ILCode { }

/**
 * 表示一个分支或运算双目指令码（`abc | xyz`）。
 */
class BranchOrILCode extends ILCode { }

/**
 * 表示一个绑定运算双目指令码（`abc := xyz`）。
 */
class BindILCode extends ILCode { }

function convertToILCodes(context: Node, statements: Statement): ILCode[] {

}
