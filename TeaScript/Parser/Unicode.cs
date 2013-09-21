using System;
using System.Collections.Generic;
using System.Text;
using System.Globalization;

namespace TeaScript.Parser {

    /// <summary>
    /// 用于实现 ECMA3 规范的字符判断。
    /// </summary>
    public static class Unicode {

        #region 初始化

        [Flags]
        enum Category : byte {

            //
            //  7 6 5 4 3 2 1 0
            //
            // 0 - Letter
            // 1 - IdentifierStart
            // 2 - SpaceCombiningMark
            // 3 - Digit
            // 4 - ConnectorPunctuation
            // 5 - WhiteSpace
            // 6 - LineTerminator
            // 
            //

            Letter = 1 << 0,
            IdentifierStartNonLetter = 1 << 1,
            IdentifierStart = Letter | IdentifierStartNonLetter,
            CombiningMark = 1 << 2,
            Digit = 1 << 3,
            ConnectorPunctuation = 1 << 4,
            IdentifierPart = IdentifierStart | CombiningMark | Digit | ConnectorPunctuation,

            Whitespace = 1 << 5,
            LineTerminator = 1 << 6,

            EOS = 1 << 7,
            Other = 0

        }

        static readonly Category[] charData;

        static Unicode() {

            const int LAST = (int)(unchecked((char)-1)); //  0x10000

            charData = new Category[LAST + 1];

            charData[LAST] = Category.EOS;

            for (int i = LAST - 1; i >= 0; i--) {
                Category result;
                switch (CharUnicodeInfo.GetUnicodeCategory((char)i)) {
                    case UnicodeCategory.LowercaseLetter:
                    case UnicodeCategory.UppercaseLetter:
                    case UnicodeCategory.TitlecaseLetter:
                    case UnicodeCategory.ModifierLetter:
                    case UnicodeCategory.OtherLetter:
                    case UnicodeCategory.LetterNumber:
                        result = Category.Letter;
                        break;


                    case UnicodeCategory.SpacingCombiningMark:
                    case UnicodeCategory.NonSpacingMark:
                        result = Category.CombiningMark;
                        break;

                    case UnicodeCategory.ConnectorPunctuation:
                        result = Category.ConnectorPunctuation;
                        break;

                    case UnicodeCategory.DecimalDigitNumber:
                        result = Category.Digit;
                        break;

                    case UnicodeCategory.SpaceSeparator:
                        result = Category.Whitespace;
                        break;

                    case UnicodeCategory.LineSeparator:
                        result = Category.LineTerminator;
                        break;

                    default:
                        continue;


                }

                charData[i] = result;
            }


            //  0xFEFF   和 0xFFFE   是 BOM  这里作为  空格处理。

            SetProperties("\u0009\u000B\u000C\uFEFF\uFFFE", Category.Whitespace); // 1-> 空格
            SetProperties("\u000A\u000D\u2029", Category.LineTerminator); // 1-> 空格

            SetProperties("_$\\", Category.IdentifierStartNonLetter);

        }

        static void SetProperties(string ranges, Category value) {
            for (int i = 0; i < ranges.Length; i++) {
                charData[ranges[i]] = value;
            }
        }

        #endregion

        static bool InRange(int value, int start, int end) {
            return value >= start && value <= end;
        }

        //  $7.1 - 由于 C# 同样使用 Unicode 字符。 故在这里不加处理。

        // $7.2

        //\u0009 Tab <TAB>
        //\u000B Vertical Tab <VT>
        //\u000C Form Feed <FF>
        //\u0020 Space <SP>
        //\u00A0 No-break space <NBSP>
        //Other category “Zs” Any other Unicode
        //“space separator”
        //<USP>

        //  WhiteSpace ::
        //      <TAB>
        //      <VT>
        //      <FF>
        //      <SP>
        //      <NBSP>
        //      <USP>

        /// <summary>
        /// 判断一个字符是否为空白字符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsWhiteSpace(int c) {
            return charData[(int)unchecked((char)c)] == Category.Whitespace;
        }

        // $7.3

        //\u000A Line Feed <LF>
        //\u000D Carriage Return <CR>
        //\u2028 Line separator <LS>
        //\u2029 Paragraph separator <PS>

        //  LineTerminator ::
        //    <LF>
        //    <CR>
        //    <LS>
        //    <PS>

        /// <summary>
        /// 判断一个字符是否是行尾。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsLineTerminator(int c) {
            return charData[(int)unchecked((char)c)] == Category.LineTerminator;
        }

        /// <summary>
        /// 判断一个字符是否是行尾。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsLineTerminatorOrEOS(int c) {
            switch (charData[(int)unchecked((char)c)]) {
                case Category.LineTerminator:
                case Category.EOS:
                    return true;

                default:
                    return false;
            }
        }

        // $7.4 Comments

        //  Comment ::
        //    MultiLineComment
        //    SingleLineComment

        //  MultiLineComment ::
        //    /* MultiLineCommentCharsopt */

        //    MultiLineCommentChars ::
        //    MultiLineNotAsteriskChar MultiLineCommentCharsopt
        //    * PostAsteriskCommentCharsopt

        //    PostAsteriskCommentChars ::
        //    MultiLineNotForwardSlashOrAsteriskChar MultiLineCommentCharsopt
        //    * PostAsteriskCommentCharsopt

        //    MultiLineNotAsteriskChar ::
        //    SourceCharacter but not asterisk *

        //    MultiLineNotForwardSlashOrAsteriskChar ::
        //    SourceCharacter but not forward-slash / or asterisk *

        //    SingleLineComment ::
        //    // SingleLineCommentCharsopt

        //    SingleLineCommentChars ::
        //    SingleLineCommentChar SingleLineCommentCharsopt

        //    SingleLineCommentChar ::
        //    SourceCharacter but not LineTerminator

        // $7.5 Tokens

        //  Token ::
        //    ReservedWord
        //    Identifier
        //    Punctuator
        //    NumericLiteral
        //    StringLiteral

        //   ReservedWord ::
        //    Keyword
        //    FutureReservedWord
        //    NullLiteral
        //    BooleanLiteral

        //  Keyword :: one of
        //    break else new var
        //    case finally return void
        //    catch for switch while
        //    continue function this with
        //    default if throw
        //    delete in try
        //    do instanceof typeof

        //  FutureReservedWord :: one of
        //    abstract enum int short
        //    boolean export interface static
        //    byte extends long super
        //    char final native synchronized
        //    class float package throws
        //    const goto private transient
        //    debugger implements protected volatile
        //    double import public

        // $7.6 Identifiers

        //UnicodeLetter
        //$
        //_
        //\ UnicodeEscapeSequence

        //  Identifier ::
        //    IdentifierName but not ReservedWord

        //  IdentifierName ::
        //    IdentifierStart
        //    IdentifierName IdentifierPart

        //   IdentifierStart ::
        //    UnicodeLetter
        //    $
        //    _
        //    \ UnicodeEscapeSequence

        /// <summary>
        /// 判断一个字符是否是标识符的首字母。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsIdentifierStart(int c) {
            return (charData[(int)unchecked((char)c)] & Category.IdentifierStart) != 0;
        }

        /// <summary>
        /// 判断一个字符是否是标识符的首字母。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsIdentifierStartNonLetter(int c) {
            return charData[(int)unchecked((char)c)] == Category.IdentifierStartNonLetter;
        }

        //  IdentifierPart ::
        //    IdentifierStart
        //    UnicodeCombiningMark
        //    UnicodeDigit
        //    UnicodeConnectorPunctuation
        //    \ UnicodeEscapeSequence

        /// <summary>
        /// 判断一个字符是否是标识符的某个字符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsIdentifierPart(int c) {
            return (charData[(int)unchecked((char)c)] & Category.IdentifierPart) != 0;
        }

        //    UnicodeLetter :: 
        //    any character in the Unicode categories “Uppercase letter (Lu)”, “Lowercase letter (Ll)”, “Titlecase letter (Lt)”, “Modifier letter (Lm)”, “Other letter (Lo)”, or “Letter number (Nl)”.

        /// <summary>
        /// 判断一个字符是否是字符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsLetter(int c) {
            return charData[(int)unchecked((char)c)] == Category.Letter;
        }

        //  UnicodeCombiningMark :: 
        //    any character in the Unicode categories “Non-spacing mark (Mn)” or “Combining spacing mark (Mc)”

        //  UnicodeDigit :: 
        //    any character in the Unicode category “Decimal number (Nd)”

        /// <summary>
        /// 判断一个字符是否是数字。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsDigit(int c) {
            return charData[(int)unchecked((char)c)] == Category.Digit;
        }

        //  UnicodeConnectorPunctuation :: 
        //    any character in the Unicode category “Connector punctuation (Pc)”

        /// <summary>
        /// 判断一个字符是否是连接符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsConnectorPunctuation(char c) {
            return charData[(int)unchecked((char)c)] == Category.ConnectorPunctuation;
        }

        //  UnicodeEscapeSequence :: 
        //    see 7.8.4.

        //  HexDigit :: one of
        //    0 1 2 3 4 5 6 7 8 9 a b c d e f A B C D E F

        /// <summary>
        /// 判断一个字符是否是十六进制数字。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsHexDigit(int c) {

            //  | 0x20 -> 小写
            return IsDecimalDigit(c) || InRange(c | 0x20, 'a', 'f');
        }

        //IdentifierStart
        //UnicodeCombiningMark
        //UnicodeDigit
        //UnicodeConnectorPunctuation
        //\ UnicodeEscapeSequence

        // any character in the Unicode categories “Uppercase letter (Lu)”, “Lowercase letter (Ll)”, “Titlecase letter (Lt)”,  “Modifier letter (Lm)”, “Other letter (Lo)”, or “Letter number (Nl)”.


        // $7.7 Punctuators

        //  Punctuator :: one of
        //    { } ( ) [ ]
        //    . ; , < > <=
        //    >= == != === !==
        //    + - * % ++ --
        //    << >> >>> & | ^
        //    ! ~ && || ? :
        //    = += -= *= %= <<=
        //    >>= >>>= &= |= ^=

        //  DivPunctuator :: one of
        //    / /=


        // $7.8 Literals

        //  Literal ::
        //    NullLiteral
        //    BooleanLiteral
        //    NumericLiteral
        //    StringLiteral

        //  NullLiteral ::
        //      null

        //  BooleanLiteral ::
        //    true
        //    false

        //  NumericLiteral ::
        //    DecimalLiteral
        //    HexIntegerLiteral

        //  DecimalLiteral ::
        //    DecimalIntegerLiteral . DecimalDigitsopt ExponentPartopt
        //    . DecimalDigits ExponentPartopt
        //    DecimalIntegerLiteral ExponentPartopt

        //    DecimalIntegerLiteral ::
        //    0
        //    NonZeroDigit DecimalDigitsopt

        //    DecimalDigits ::
        //    DecimalDigit
        //    DecimalDigits DecimalDigit

        //    DecimalDigit :: one of
        //    0 1 2 3 4 5 6 7 8 9

        /// <summary>
        /// 判断一个字符是否是十进制数字。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsDecimalDigit(int c) {
            return InRange(c, '0', '9');
        }

        //    NonZeroDigit :: one of
        //    1 2 3 4 5 6 7 8 9

        public static bool IsNonZeroDigit(int c) {
            return InRange(c, '1', '9');
        }

        //    ExponentPart ::
        //    ExponentIndicator SignedInteger

        //    ExponentIndicator :: one of
        //    e E

        //    SignedInteger ::
        //    DecimalDigits
        //    + DecimalDigits
        //    - DecimalDigits

        public static bool IsSignedInteger(int c) {
            return IsDecimalDigit(c) || c == '-' || c == '+';
        }

        //    HexIntegerLiteral ::
        //    0x HexDigit
        //    0X HexDigit
        //    HexIntegerLiteral HexDigit

        // 7.10 String Literals

        //  StringLiteral ::
        //    " DoubleStringCharactersopt "
        //    ' SingleStringCharactersopt '

        //    DoubleStringCharacters ::
        //    DoubleStringCharacter DoubleStringCharactersopt

        //    SingleStringCharacters ::
        //    SingleStringCharacter SingleStringCharactersopt

        //    DoubleStringCharacter ::
        //    SourceCharacter but not double-quote " or backslash \ or LineTerminator
        //    \ EscapeSequence

        //    SingleStringCharacter ::
        //    SourceCharacter but not single-quote ' or backslash \ or LineTerminator
        //    \ EscapeSequence

        //    EscapeSequence ::
        //    CharacterEscapeSequence
        //    0 [lookahead ∉ DecimalDigit]
        //    HexEscapeSequence
        //    UnicodeEscapeSequence

        //    CharacterEscapeSequence ::
        //    SingleEscapeCharacter
        //    NonEscapeCharacter

        //    SingleEscapeCharacter :: one of
        //    ' " \ b f n r t v

        public static bool IsSingleEscapeCharacter(int c) {
            return c == '\'' ||
                c == '\"' ||
                c == '\\' ||
                c == '\n' ||
                c == '\r' ||
                c == '\t' ||
                c == '\0' ||
                c == '\a' ||
                c == '\b' ||
                c == '\f' ||
                c == '\v';
        }

        //    NonEscapeCharacter ::
        //    SourceCharacter but not EscapeCharacter or LineTerminator

        //    EscapeCharacter ::
        //    SingleEscapeCharacter
        //    DecimalDigit
        //    x
        //    u

        //    HexEscapeSequence ::
        //    x HexDigit HexDigit

        //    UnicodeEscapeSequence ::
        //    u HexDigit HexDigit HexDigit HexDigit

        //\b \u0008 backspace <BS>
        //\t \u0009 horizontal tab <HT>
        //\n \u000A line feed (new line) <LF>
        //\v \u000B vertical tab <VT>
        //\f \u000C form feed <FF>
        //\r \u000D carriage return <CR>
        //\" \u0022 double quote "
        //\' \u0027 single quote '
        //\\ \u005C backslash \


        //  RegularExpressionLiteral ::
        //    / RegularExpressionBody / RegularExpressionFlags

        //  RegularExpressionBody ::
        //    RegularExpressionFirstChar RegularExpressionChars

        //  RegularExpressionChars ::
        //    [empty]
        //    RegularExpressionChars RegularExpressionChar

        /// <summary>
        /// 判断一个字符是否是正则表达式字符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsRegularExpressionChar(char c) {
            return IsNonTerminator(c) && c != '/' && c != '\\';
        }

        //  RegularExpressionFirstChar ::
        //    NonTerminator but not * or \ or /
        //    BackslashSequence

        public static bool IsBackslashSequence(int c) {
            return IsNonTerminator(c) && c != '*' && c != '/' && c != '\\';
        }

        //  RegularExpressionChar ::
        //    NonTerminator but not \ or /
        //    BackslashSequence

        //  BackslashSequence ::
        //    \ NonTerminator

        //  NonTerminator ::
        //    SourceCharacter but not LineTerminator

        /// <summary>
        /// 判断一个字符是否是正则表达式内不换行字符。
        /// </summary>
        /// <param name="c">要判断的字符。</param>
        /// <returns>如果是，则返回 true 。</returns>
        public static bool IsNonTerminator(int c) {
            return !IsLineTerminatorOrEOS(c);
        }

        //  RegularExpressionFlags ::
        //    [empty]
        //    RegularExpressionFlags IdentifierPart


        // $7.9 Automatic Semicolon Insertion


        //  PostfixExpression :
        //    LeftHandSideExpression [no LineTerminator here] ++
        //    LeftHandSideExpression [no LineTerminator here] --
        //    ContinueStatement :
        //    continue [no LineTerminator here] Identifieropt ;
        //    BreakStatement :
        //    break [no LineTerminator here] Identifieropt ;
        //    ReturnStatement :
        //    return [no LineTerminator here] Expressionopt ;
        //    ThrowStatement :
        //    throw [no LineTerminator here] Expression ;
    }
}
