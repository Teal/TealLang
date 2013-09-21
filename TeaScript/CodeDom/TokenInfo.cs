using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TeaScript.CodeDom {

    /// <summary>
    /// 获取指定标识符信息。
    /// </summary>
    public static class TokenInfo {

        struct Token {

            public string Name;

            public byte Precedence;

        }

        readonly static Token[] _tokens = new Token[] {
            new Token(){Name = "<EOS>", Precedence = 0},
            new Token(){Name = "<Illegal>", Precedence = 0},
            new Token(){Name = "(", Precedence = 46},
            new Token(){Name = ")", Precedence = 0},
            new Token(){Name = "]", Precedence = 0},
            new Token(){Name = "}", Precedence = 0},
            new Token(){Name = ":", Precedence = 48},
            new Token(){Name = ";", Precedence = 100},
            new Token(){Name = "<Identifier>", Precedence = 101},
            new Token(){Name = "<@Identifier>", Precedence = 101},
            new Token(){Name = "<^Identifier>", Precedence = 101},
            new Token(){Name = "this", Precedence = 100},
            new Token(){Name = "base", Precedence = 100},
            new Token(){Name = "arguments", Precedence = 100},
            new Token(){Name = "undefined", Precedence = 100},
            new Token(){Name = "null", Precedence = 100},
            new Token(){Name = "true", Precedence = 100},
            new Token(){Name = "false", Precedence = 100},
            new Token(){Name = "<Int>", Precedence = 101},
            new Token(){Name = "<Hex>", Precedence = 101},
            new Token(){Name = "<Real>", Precedence = 101},
            new Token(){Name = "<String>", Precedence = 101},
            new Token(){Name = "<EscapedString>", Precedence = 101},
            new Token(){Name = "<TemplateString>", Precedence = 101},
            new Token(){Name = "<TemplateVarString>", Precedence = 101},
            new Token(){Name = "[", Precedence = 46},
            new Token(){Name = "{", Precedence = 46},
            new Token(){Name = "await", Precedence = 42},
            new Token(){Name = "!", Precedence = 42},
            new Token(){Name = "++", Precedence = 44},
            new Token(){Name = "--", Precedence = 44},
            new Token(){Name = "+", Precedence = 36},
            new Token(){Name = "-", Precedence = 36},
            new Token(){Name = "|", Precedence = 26},
            new Token(){Name = "&", Precedence = 28},
            new Token(){Name = "*", Precedence = 38},
            new Token(){Name = "/", Precedence = 38},
            new Token(){Name = "%", Precedence = 38},
            new Token(){Name = "<", Precedence = 32},
            new Token(){Name = ">", Precedence = 32},
            new Token(){Name = "<=", Precedence = 32},
            new Token(){Name = ">=", Precedence = 32},
            new Token(){Name = "==", Precedence = 30},
            new Token(){Name = "!=", Precedence = 30},
            new Token(){Name = "&&", Precedence = 24},
            new Token(){Name = "||", Precedence = 22},
            new Token(){Name = "or", Precedence = 20},
            new Token(){Name = "~", Precedence = 12},
            new Token(){Name = "as", Precedence = 32},
            new Token(){Name = "is", Precedence = 32},
            new Token(){Name = ",", Precedence = 10},
            new Token(){Name = "=", Precedence = 16},
            new Token(){Name = "=>", Precedence = 16},
            new Token(){Name = ":=", Precedence = 16},
            new Token(){Name = "+=", Precedence = 16},
            new Token(){Name = "-=", Precedence = 16},
            new Token(){Name = "*=", Precedence = 16},
            new Token(){Name = "/=", Precedence = 16},
            new Token(){Name = "%=", Precedence = 16},
            new Token(){Name = ".", Precedence = 46},
            new Token(){Name = "..", Precedence = 14},
            new Token(){Name = "?", Precedence = 18},
            new Token(){Name = "trace", Precedence = 100},
            new Token(){Name = "assert", Precedence = 100},
            new Token(){Name = "yield", Precedence = 100},
            new Token(){Name = "import", Precedence = 100},
            new Token(){Name = "return", Precedence = 100},
            new Token(){Name = "throw", Precedence = 100},
            new Token(){Name = "break", Precedence = 100},
            new Token(){Name = "continue", Precedence = 100},
            new Token(){Name = "goto", Precedence = 100},
            new Token(){Name = "if", Precedence =100},
            new Token(){Name = "else", Precedence = 100},
            new Token(){Name = "switch", Precedence = 100},
            new Token(){Name = "case", Precedence = 100},
            new Token(){Name = "for", Precedence = 100},
            new Token(){Name = "try", Precedence = 100},
            new Token(){Name = "catch", Precedence = 100},
            new Token(){Name = "finally", Precedence = 100},
            new Token(){Name = "let", Precedence = 100},
            new Token(){Name = "lock", Precedence = 100},
            new Token(){Name = "class", Precedence = 100},
            new Token(){Name = "struct", Precedence = 100},
            new Token(){Name = "enum", Precedence = 100},
            new Token(){Name = "interface", Precedence = 100},
            new Token(){Name = "namespace", Precedence = 100},
            new Token(){Name = "extend", Precedence = 100},
            new Token(){Name = "<#>", Precedence = 101},
            new Token(){Name = "<//>", Precedence = 101},
            new Token(){Name = "</**/>", Precedence = 101},
            new Token(){Name = "<///>", Precedence = 101},
            new Token(){Name = "</***/>", Precedence = 101},
            
        };

        /// <summary>
        /// 获取标识符的优先级。
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public static byte GetPrecedence(this TokenType type) {
            return _tokens[(int)type].Precedence;
        }

        /// <summary>
        /// 获取标识符的名字。
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public static string GetName(this TokenType type) {
            return _tokens[(int)type].Name;
        }

        /// <summary>
        /// 获取标识符是否是唯一的字符串。
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public static bool IsConst(this TokenType type) {
            return _tokens[(int)type].Precedence != 101;
        }

        //public static bool IsPredefinedType(string typeName) {
        //    switch (typeName.Length) {
        //        case 3:
        //            switch (typeName[0]) {
        //                case 'i':
        //                    if (typeName[1] == 'n' && typeName[2] == 't') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'n':
        //                    if (typeName[1] == 'u' && typeName[2] == 'm') {
        //                        return true;
        //                    }
        //                    break;
        //            }

        //            break;
        //        case 4:
        //            switch (typeName[3]) {
        //                case 't':
        //                    if (typeName[0] == 'u' && typeName[1] == 'i' && typeName[2] == 'n') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'l':
        //                    if (typeName[0] == 'b' && typeName[1] == 'o' && typeName[2] == 'o') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'g':
        //                    if (typeName[0] == 'l' && typeName[1] == 'o' && typeName[2] == 'n') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'e':
        //                    if (typeName[0] == 'b' && typeName[1] == 'y' && typeName[2] == 't') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'r':
        //                    if (typeName[0] == 'c' && typeName[1] == 'h' && typeName[2] == 'a') {
        //                        return true;
        //                    }
        //                    break;
        //            }
        //            break;
        //        case 5:
        //            switch (typeName[4]) {
        //                case 't':
        //                    if (typeName[0] == 's' && typeName[1] == 'h' && typeName[2] == 'o' && typeName[3] == 'r') {
        //                        return true;
        //                    } else if (typeName[0] == 'f' && typeName[1] == 'l' && typeName[2] == 'o' && typeName[3] == 'a') {
        //                        return true;
        //                    } else if (typeName[0] == 's' && typeName[1] == 'b' && typeName[2] == 'y' && typeName[3] == 't') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'g':
        //                    if (typeName[0] == 'u' && typeName[1] == 'l' && typeName[2] == 'o' && typeName[3] == 'n') {
        //                        return true;
        //                    }
        //                    break;
        //            }

        //            break;
        //        case 6:
        //            switch (typeName[0]) {
        //                case 's':
        //                    if (typeName[1] == 't' && typeName[2] == 'r' && typeName[3] == 'i' && typeName[4] == 'n' && typeName[5] == 'g') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'd':
        //                    if (typeName[1] == 'o' && typeName[2] == 'u' && typeName[3] == 'b' && typeName[4] == 'l' && typeName[5] == 'e') {
        //                        return true;
        //                    }
        //                    break;
        //                case 'u':
        //                    if (typeName[1] == 's' && typeName[2] == 'h' && typeName[3] == 'o' && typeName[4] == 'r' && typeName[5] == 't') {
        //                        return true;
        //                    }
        //                    break;
        //            }

        //            break;
        //        case 7:
        //            switch (typeName[0]) {
        //                case 'd':
        //                    if (typeName[1] == 'e' && typeName[2] == 'c' && typeName[3] == 'i' && typeName[4] == 'm' && typeName[5] == 'a' && typeName[6] == 'l') {
        //                        return true;
        //                    }
        //                    break;
        //            }

        //            break;


        //    }

        //    return false;
        //}

        public static string EscapeString(TokenType tokenType, string s) {
            switch (tokenType) {
                case TeaScript.CodeDom.TokenType.String:
                    return '\'' + s.Replace("'", "''") + '\'';
                case TeaScript.CodeDom.TokenType.EscapedString:
                    StringBuilder sb = new StringBuilder(s.Length + 2);
                    sb.Append('\"');
                    for (int i = 0; i < s.Length; i++) {
                        switch (s[i]) {
                            case '\'':
                            case '\"':
                            case '\\':
                                sb.Append('\\');
                                sb.Append(s[i]);
                                break;
                            case '\n':
                                sb.Append('\\');
                                sb.Append('n');
                                break;
                            case '\r':
                                sb.Append('\\');
                                sb.Append('r');
                                break;
                            case '\t':
                                sb.Append('\\');
                                sb.Append('t');
                                break;
                            case '\0':
                                sb.Append('\\');
                                sb.Append('0');
                                break;
                            case '\a':
                                sb.Append('\\');
                                sb.Append('a');
                                break;
                            case '\b':
                                sb.Append('\\');
                                sb.Append('b');
                                break;
                            case '\f':
                                sb.Append('\\');
                                sb.Append('f');
                                break;
                            case '\v':
                                sb.Append('\\');
                                sb.Append('v');
                                break;
                            default:
                                sb.Append(s[i]);
                                break;
                        }
                    }
                    sb.Append('\"');

                    return sb.ToString();
            }

            return '`' + s.Replace("`", "``") + '`';
        }

    }
}
