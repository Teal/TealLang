using System;
using System.Text;
using TeaScript.CodeDom;

namespace TeaScript.Parser {

    /// <summary>
    /// 表示一个标识符。
    /// </summary>
    public sealed class Token {

        /// <summary>
        /// 表示标识符的类型。
        /// </summary>
        public TokenType Type;

        /// <summary>
        /// 表示当前标识符的开始位置。
        /// </summary>
        public Location StartLocation;

        /// <summary>
        /// 表示当前标识符的结束位置。
        /// </summary>
        public Location EndLocation;

        /// <summary>
        /// 表示当前标识符的字符串缓存。
        /// </summary>
        public StringBuilder LiteralBuffer = new StringBuilder();

        /// <summary>
        /// 表示当前标识符后存在换行符。
        /// </summary>
        public bool HasLineTerminatorBeforeStart;

        /// <summary>
        /// 返回表示当前 <see cref="T:System.Object"/> 的 <see cref="T:System.String"/>。
        /// </summary>
        /// <returns>
        /// 	<see cref="T:System.String"/>，表示当前的 <see cref="T:System.Object"/>。
        /// </returns>
        public override string ToString() {
            if(Type.IsConst()){
                return Type.GetName();
            }

            if (Type >= TokenType.String && Type <= TokenType.TemplateVarString) {
                return TokenInfo.EscapeString(Type, LiteralBuffer.ToString());
            }

            return LiteralBuffer.ToString();
        }

    }

}
