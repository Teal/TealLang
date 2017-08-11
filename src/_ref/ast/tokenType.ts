/**
 * @fileOverview 标记和关键字
 */

/**
 * 表示一个标记类型。
 * @internal
 */
export enum TokenType {

    // #region 控制符（Control）

    /**
     * 未知标记。
     */
    unknown,

    /**
     * 文件已结束(EOF)。
     */
    endOfFile,

    // #endregion

    // #region 定义（Definitions）

    /**
     * 关键字 function。
     */
    function,

    /**
     * 关键字 class(仅在 JavaScript 7)。
     */
    class,

    /**
     * 关键字 interface(仅在 JavaScript 7)。
     */
    interface,

    /**
     * 关键字 enum(仅在 JavaScript 7)。
     */
    enum,

    /**
     * 关键字 async(仅在 JavaScript 7)。
     */
    async,

    /**
     * 关键字 namespace(仅在 TypeScript)。
     */
    namespace,

    /**
     * 关键字 module(仅在 TypeScript)。
     */
    module,

    /**
     * 关键字 type(仅在 TypeScript)。
     */
    type,

    /**
     * 关键字 global(仅在 TypeScript)。
     */
    global,

    // #endregion

    // #region 字面量（Literal）

    /**
     * 标识符(xx)。
     */
    identifier,

    /**
     * 数字常量(0x0)。
     */
    numericLiteral,

    /**
     * 字符串常量('...')。
     */
    stringLiteral,

    /**
     * 正则表达式常量(/.../)。
     */
    regularExpressionLiteral,

    /**
     * 模板字符串常量(`...`)(仅在 JavaScript 7)。
     */
    noSubstitutionTemplateLiteral,

    /**
     * 模板字符串头(`...${)(仅在 JavaScript 7)。
     */
    templateHead,

    /**
     * 模板字符串主体(}...${)(仅在 JavaScript 7)。
     */
    templateMiddle,

    /**
     * 模板字符串尾(}...`)(仅在 JavaScript 7)。
     */
    templateTail,

    /**
     * 关键字 null。
     */
    null,

    /**
     * 关键字 true。
     */
    true,

    /**
     * 关键字 false。
     */
    false,

    /**
     * 关键字 this。
     */
    this,

    /**
     * 关键字 super(仅在 JavaScript 7)。
     */
    super,

    // #endregion

    // #region 单目运算符（Unary Operators）

    /**
     * 开花括号({)。
     * @precedence 80
     */
    openBrace,

    /**
     * 非(!)。
     */
    exclamation,

    /**
     * 关键字 new。
     */
    new,

    /**
     * 关键字 delete。
     */
    delete,

    /**
     * 关键字 typeof。
     */
    typeof,

    /**
     * 关键字 void。
     */
    void,

    /**
     * 关键字 yield(仅在 JavaScript 7)。
     */
    yield,

    /**
     * 关键字 await(仅在 JavaScript 7)。
     */
    await,

    /**
     * 位反(~)。
     */
    tilde,

    /**
     * 电子邮件符号(@)(仅在 JavaScript 7)。
     * @precedence 80
     */
    at,

    // #endregion

    // #region 单/双目运算符（Unary & Binary Operators）

    /**
     * 开括号(()。
     * @precedence 80
     */
    openParen,

    /**
     * 开方括号([)。
     * @precedence 80
     */
    openBracket,

    /**
     * 加(+)。
     */
    plus,

    /**
     * 减(-)。
     */
    minus,

    /**
     * 斜杠(/)。
     */
    slash,

    /**
     * 加加(++)。
     */
    plusPlus,

    /**
     * 减减(--)。
     */
    minusMinus,

    /**
     * 小于(<)。
     */
    lessThan,

    /**
     * 箭头(=>)(仅在 JavaScript 7)。
     */
    equalsGreaterThan,

    /**
     * 点点点(...)(仅在 JavaScript 7)。
     */
    dotDotDot,

    // #endregion

    // #region 双目运算符（Binary Operators）

    /**
     * 星号(*)。
     */
    asterisk,

    /**
     * 位与(&)。
     */
    ampersand,

    /**
     * 关键字 in。
     */
    in,

    /**
     * 关键字 instanceOf。
     */
    instanceOf,

    /**
     * 点(.)。
     */
    dot,

    /**
     * 点点(..)(仅在 TealScript)。
     */
    dotDot,

    /**
     * 百分号(%)。
     */
    percent,

    /**
     * 大于(>)。
     */
    greaterThan,

    /**
     * 小于等于(<=)。
     */
    lessThanEquals,

    /**
     * 大于等于(>=)。
     */
    greaterThanEquals,

    /**
     * 等于等于(==)。
     */
    equalsEquals,

    /**
     * 不等于(!=)。
     */
    exclamationEquals,

    /**
     * 等于等于等于(===)。
     */
    equalsEqualsEquals,

    /**
     * 不等于等于(!==)。
     */
    exclamationEqualsEquals,

    /**
     * 左移(<<)。
     */
    lessThanLessThan,

    /**
     * 右移(>>)。
     */
    greaterThanGreaterThan,

    /**
     * 无符右移(>>>)。
     */
    greaterThanGreaterThanGreaterThan,

    /**
     * 位或(|)。
     */
    bar,

    /**
     * 异或(^)。
     */
    caret,

    /**
     * 与(&&)。
     */
    ampersandAmpersand,

    /**
     * 或(||)。
     */
    barBar,

    /**
     * 星号星号(**)(仅在 JavaScript 7)。
     */
    asteriskAsterisk,

    /**
     * 等于(=)。
     */
    equals,

    /**
     * 加等于(+=)。
     */
    plusEquals,

    /**
     * 减等于(-=)。
     */
    minusEquals,

    /**
     * 星号等于(*=)。
     */
    asteriskEquals,

    /**
     * 星号星号等于(**=)(仅在 JavaScript 7)。
     */
    asteriskAsteriskEquals,

    /**
     * 斜杠等于(/=)。
     */
    slashEquals,

    /**
     * 百分号等于(%=)。
     */
    percentEquals,

    /**
     * 左移等于(<<=)。
     */
    lessThanLessThanEquals,

    /**
     * 右移等于(>>=)。
     */
    greaterThanGreaterThanEquals,

    /**
     * 无符右移等于(>>>=)。
     */
    greaterThanGreaterThanGreaterThanEquals,

    /**
     * 位与等于(&=)。
     */
    ampersandEquals,

    /**
     * 位或等于(|=)。
     */
    barEquals,

    /**
     * 异或等于(^=)。
     */
    caretEquals,

    /**
     * 问号(?)。
     */
    question,

    /**
     * 逗号(,)。
     * @precedence 8
     */
    comma,

    /**
     * 关键字 as(仅在 TypeScript)。
     */
    as,

    /**
     * 关键字 is(仅在 TypeScript)。
     */
    is,

    // #endregion

    // #region 其它运算符（Other Operators）

    /**
     * 闭括号())。
     * @precedence 84
     */
    closeParen,

    /**
     * 闭方括号(])。
     * @precedence 84
     */
    closeBracket,

    /**
     * 闭花括号(})。
     * @precedence 84
     */
    closeBrace,

    /**
     * 冒号(:)。
     * @precedence 82
     */
    colon,

    /**
     * 分号(;)。
     * @precedence 100
     */
    semicolon,

    // #endregion

    // #region 语句（Statements）

    /**
     * 关键字 if。
     */
    if,

    /**
     * 关键字 else。
     */
    else,

    /**
     * 关键字 switch。
     */
    switch,

    /**
     * 关键字 case。
     */
    case,

    /**
     * 关键字 default。
     */
    default,

    /**
     * 关键字 for。
     */
    for,

    /**
     * 关键字 of(仅在 JavaScript 7)。
     */
    of,

    /**
     * 关键字 to(仅在 TealScript)。
     */
    to,

    /**
     * 关键字 while。
     */
    while,

    /**
     * 关键字 do。
     */
    do,

    /**
     * 关键字 continue。
     */
    continue,

    /**
     * 关键字 break。
     */
    break,

    /**
     * 关键字 return。
     */
    return,

    /**
     * 关键字 throw。
     */
    throw,

    /**
     * 关键字 try。
     */
    try,

    /**
     * 关键字 catch。
     */
    catch,

    /**
     * 关键字 finally。
     */
    finally,

    /**
     * 关键字 var。
     */
    var,

    /**
     * 关键字 const(仅在 JavaScript 7)。
     */
    const,

    /**
     * 关键字 let(仅在 JavaScript 7)。
     */
    let,

    /**
     * 关键字 debugger。
     */
    debugger,

    /**
     * 关键字 with。
     */
    with,

    /**
     * 关键字 import(仅在 JavaScript 7)。
     */
    import,

    /**
     * 关键字 from(仅在 JavaScript 7)。
     */
    from,

    /**
     * 关键字 export(仅在 JavaScript 7)。
     */
    export,

    /**
     * 关键字 extends(仅在 JavaScript 7)。
     */
    extends,

    /**
     * 关键字 implements(仅在 JavaScript 7)。
     */
    implements,

    /**
     * 关键字 package(仅在 JavaScript 7)。
     */
    package,

    /**
     * 关键字 private(仅在 JavaScript 7)。
     */
    private,

    /**
     * 关键字 protected(仅在 JavaScript 7)。
     */
    protected,

    /**
     * 关键字 public(仅在 JavaScript 7)。
     */
    public,

    /**
     * 关键字 static(仅在 JavaScript 7)。
     */
    static,

    /**
     * 关键字 abstract(仅在 JavaScript 7)。
     */
    abstract,

    /**
     * 关键字 declare(仅在 TypeScript)。
     */
    declare,

    /**
     * 关键字 readonly(仅在 TypeScript)。
     */
    readonly,

    ///**
    // * 关键字 constructor(仅在 TypeScript)。
    // */
    //constructor,

    ///**
    // * 关键字 require(仅在 TypeScript)。
    // */
    //require,

    ///**
    // * 关键字 get(仅在 JavaScript 7)。
    // */
    //get,

    ///**
    // * 关键字 set(仅在 JavaScript 7)。
    // */
    //set,

    ///**
    // * 关键字 any(仅在 TypeScript)。
    // */
    //any,

    ///**
    // * 关键字 boolean(仅在 TypeScript)。
    // */
    //boolean,

    ///**
    // * 关键字 type(仅在 TypeScript)。
    // */
    //type,

    ///**
    // * 关键字 number(仅在 TypeScript)。
    // */
    //number,

    ///**
    // * 关键字 string(仅在 TypeScript)。
    // */
    //string,

    ///**
    // * 关键字 symbol(仅在 TypeScript)。
    // */
    //symbol,

    ///**
    // * 关键字 never(仅在 TypeScript)。
    // */
    //never,

    ///**
    // * 关键字 undefined(仅在 TypeScript)。
    // */
    //undefined,

    ///**
    // * 关键字 global(仅在 TypeScript)。
    // */
    //global,

    // #endregion

}


//,
//*= /= %= += ‐= <<= >>= >>>= &= ^= |= **=
//    ? :   yield()=>{ }
//||
//&&
//|
//^
//&
//== != === !==
//    < > <= >= instanceof in
//<< >> >>>
//    + -
//* / %
//    **


    delete void typeof + - ~ !

/**
 * 判断指定的标记是否可作为单目运算符。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isUnaryOperator(token: TokenType) {
    return token >= TokenType.openParen;
}

/**
 * 判断指定的标记是否可作为双目运算符。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isBinaryOperator(token: TokenType) {
    return type >= TokenType.BINARAY_OPERATOR_START && type < TokenType.BINARAY_OPERATOR_END;
}

/**
 * 判断指定的标记是否是赋值运算符。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isAssignOperator(token: TokenType) {
    return type >= TokenType.ASSIGN_OPERATOR_START && type < TokenType.ASSIGN_OPERATOR_END;
}

/**
 * 判断指定的标记是否可作为表达式的开头。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isExpressionStart(token: TokenType) {
    return isUnaryOperator(token) || isPredefinedType(type);
}

/**
 * 判断指定的标记是否可作为语句开头。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isStatementStart(token: TokenType) {
    return type >= TokenType.STATEMENT_START && type < TokenType.STATEMENT_END;
}

/**
 * 存储所有标记的名字。
 */
const tokenNames = [];

/**
 * 将指定标记转为 JavaScript 源码等效的字符串。
 * @param token 要转换的标记。
 * @returns 返回等效的字符串。
 */
export function tokenToString(token: TokenType) {
    return tokenNames[token];
}

///**
// * 判断指定的标记是否是非保留的关键字。
// * @param token 要判断的标记。
// * @returns 如果是则返回 true，否则返回 false。
// */
//export function isNonReservedWord(token: TokenType) {
//    return token > TokenType.with;
//}

/**
 * 存储所有标记的优先级。
 */
const precedences = [];

/**
 * 获取操作符的优先级。
 * @param token 要判断的标记。
 * @returns 返回一个数字。数字越大说明优先级越高。
 */
export function getPrecedence(token: TokenType) {
    return precedences[token];
}

/**
 * 存储所有关键字的名字。
 */
const keywords: { [keyword: string]: TokenType } = {};

/**
 * 将指定的字符串转为对应的标记。
 * @param token 要转换的字符串。
 * @returns 返回等效的标记。如果字符串无效，则返回 undefined。
 */
export function stringToToken(token: string) {
    //// Reserved words are between 2 and 11 characters long and start with a lowercase letter
    //const len = tokenValue.length;
    //if (len >= 2 && len <= 11) {
    //    const ch = tokenValue.charCodeAt(0);
    //    if (ch >= CharacterCodes.a && ch <= CharacterCodes.z && hasOwnProperty.call(textToToken, tokenValue)) {
    //        return token = textToToken[tokenValue];
    //    }
    //}
    return keywords[token];
}

/// <summary>
/// 获取标识符是否是关键字。
/// </summary>
/// <param name="type"></param>
/// <returns></returns>
export function isKeyword(token: TokenType) {
    return Unicode.isLetter(type.getName()[0]);
}

/**
 * 判断一个标记是否是标识符或关键字。
 * @param token 要判断的标记。
 * @returns 如果是则返回 true，否则返回 false。
 */
export function isIdentifierOrKeyword(token: TokenType) {
    return token >= SyntaxKind.Identifier;
}
