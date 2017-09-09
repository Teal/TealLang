/**
 * @file JavaScript 代码生成器
 */

/**
 * 表示一个 JavaScript 代码生成器。
 */
class JavaScriptEmitter {

    /**
     * 最终生成的代码。
     */
    output = "";

    /**
     * 生成指定的主函数及其依赖项。
     * @param main 要生成的主函数。
     */
    emit(main: Method) {
        this._emitBody(main.body);
    }

    private _emitBody(body: ILCode[]){

    }

}
