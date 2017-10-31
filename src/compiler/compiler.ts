/**
 * @file 编译器
 */

/**
 * 表示一个编译器。
 */
class Compiler {

    /**
     * 编译指定的源文件。
     * @param sourceFiles 要编译的源文件。
     * @return 返回已编译的程序。
     */
    createProgram(sourceFiles: string[]): Program {

    }

    /**
     * 报告一个编译器错误。
     * @param location 错误的位置。
     * @param message 错误的消息。
     * @param args 消息中替换的变量。
     */
    error(location: Location, message: string, ...args: any[]) {

    }

}
