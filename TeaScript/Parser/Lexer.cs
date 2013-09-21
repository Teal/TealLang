using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using TeaScript.CodeDom;

namespace TeaScript.Parser {

    /// <summary>
    /// 词法解析工具。
    /// </summary>
    public class Lexer {

        #region Internal

        TextReader _source;

        Location _currentLocation;

        int _currentChar;

        public TextReader Source {
            get {
                return _source;
            }
            set {
                _source = value;
                _currentLocation.Line = _currentLocation.Column = 1;

                // 预读一个字符。
                _currentChar = _source.Read();
                Token t = _currentToken;
                _currentToken = _peekToken;
                Scan();
                _currentToken = _peek1Token;
                Scan();
                _currentToken = t;
            }

        }

        public Location CurrentLocation {
            get {
                return _currentLocation;
            }
            set {
                _currentLocation = value;
            }
        }

        public Lexer()
            : this(TextReader.Null) {
        }

        public Lexer(TextReader source) {
            Source = source;
        }

        Token _currentToken = new Token();

        Token _peekToken = new Token();

        Token _peek1Token = new Token();

        /// <summary>
        /// 获取当前的标识符。
        /// </summary>
        public Token Current {
            get {
                return _currentToken;
            }
        }

        /// <summary>
        /// 读取下一个标识符。
        /// </summary>
        /// <returns></returns>
        public Token Read() {

            // 读取新的数据，保存到 _currentToken 。
            Scan();

            Token t = _currentToken;
            _currentToken = _peekToken;
            _peekToken = _peek1Token;
            _peek1Token = t;

            return _currentToken;
        }

        /// <summary>
        /// 预览下一个标识符。
        /// </summary>
        /// <returns></returns>
        public Token Peek() {
            return _peekToken;
        }

        /// <summary>
        /// 预览下一个标识符。
        /// </summary>
        /// <returns></returns>
        public Token Peek1() {
            return _peek1Token;
        }

        #endregion

        #region Scan

        /// <summary>
        /// 读取一下一个操作符的数据。
        /// </summary>
        void Scan() {

            _currentToken.HasLineTerminatorBeforeStart = false;

            // 开始过滤空格。
        skip:

            // 读取下一个字符。
            switch (_currentChar) {

                case ' ':
                case '\t':
                    _currentChar = _source.Read();
                    _currentLocation.Column++;
                    goto skip;

                case '\r':
                    if (_source.Peek() == '\n') {
                        _source.Read();
                    }
                    goto case '\n';
                case '\n':
                    _currentChar = _source.Read();
                    NewLine();
                    goto skip;

            }

            // 下一个标识符的开始位置是当前位置。
            _currentToken.StartLocation = _currentLocation;

            if (Unicode.IsLetter(_currentChar)) {
                _currentToken.Type = TokenType.Identifier;
                _currentToken.LiteralBuffer.Length = 0;
                _currentToken.LiteralBuffer.Append((char)_currentChar);
                ScanIdentifierBody();
                _currentLocation.Column += _currentToken.LiteralBuffer.Length;

                #region Keywords

                StringBuilder value = _currentToken.LiteralBuffer;

                switch (value.Length) {

                    #region 2

                    case 2:
                        switch (value[1]) {

                            case 'f':
                                if (value[0] == 'i')
                                    _currentToken.Type = TokenType.If;
                                break;

                            case 's':
                                switch (value[0]) {
                                    case 'a':
                                        _currentToken.Type = TokenType.As;
                                        break;
                                    case 'i':
                                        _currentToken.Type = TokenType.Is;
                                        break;
                                }
                                break;

                            case 'r':
                                if (value[0] == 'o')
                                    _currentToken.Type = TokenType.OrReturn;
                                break;

                        }

                        break;

                    #endregion

                    #region 3

                    case 3:
                        switch (value[0]) {

                            case 'f':
                                if (value[1] == 'o' && value[2] == 'r')
                                    _currentToken.Type = TokenType.For;
                                break;

                            case 'l':
                                if (value[1] == 'e' && value[2] == 't')
                                    _currentToken.Type = TokenType.Let;
                                break;

                            case 't':
                                if (value[1] == 'r' && value[2] == 'y')
                                    _currentToken.Type = TokenType.Try;
                                break;

                        }

                        break;

                    #endregion

                    #region 4

                    case 4:


                        switch (value[0]) {

                            case 'b':
                                if (value[1] == 'a' && value[2] == 's' && value[3] == 'e')
                                    _currentToken.Type = TokenType.Base;
                                break;

                            case 'c':
                                if (value[1] == 'a' && value[2] == 's' && value[3] == 'e')
                                    _currentToken.Type = TokenType.Case;
                                break;

                            case 'e':

                                switch (value[3]) {
                                    case 'e':
                                        if (value[2] == 's' && value[1] == 'l')
                                            _currentToken.Type = TokenType.Else;
                                        break;
                                    case 'm':
                                        if (value[2] == 'u' && value[1] == 'n')
                                            _currentToken.Type = TokenType.Enum;
                                        break;

                                }

                                break;

                            case 'g':
                                if (value[1] == 'o' && value[2] == 't' && value[3] == 'o')
                                    _currentToken.Type = TokenType.Goto;
                                break;

                            case 'l':
                                if (value[1] == 'o' && value[2] == 'c' && value[3] == 'k')
                                    _currentToken.Type = TokenType.Lock;
                                break;

                            case 'n':
                                if (value[1] == 'u' && value[2] == 'l' && value[3] == 'l')
                                    _currentToken.Type = TokenType.Null;
                                break;

                            case 't':

                                switch (value[3]) {
                                    case 'e':
                                        if (value[2] == 'u' && value[1] == 'r')
                                            _currentToken.Type = TokenType.True;
                                        break;

                                    case 's':
                                        if (value[2] == 'i' && value[1] == 'h')
                                            _currentToken.Type = TokenType.This;
                                        break;

                                }

                                break;

                        }

                        break;

                    #endregion

                    #region 5

                    case 5:
                        switch (value[2]) {
                            case 'a':
                                switch (value[0]) {
                                    case 'c':
                                        if (value[1] == 'l' && value[3] == 's' && value[4] == 's') {
                                            _currentToken.Type = TokenType.Class;
                                        }
                                        break;
                                    case 'a':
                                        if (value[1] == 'w' && value[3] == 'i' && value[4] == 't')
                                            _currentToken.Type = TokenType.Await;

                                        break;
                                }
                                break;
                            case 'e':
                                switch (value[0]) {
                                    case 'b':
                                        if (value[1] == 'r' && value[3] == 'a' && value[4] == 'k')
                                            _currentToken.Type = TokenType.Break;

                                        break;

                                }
                                break;
                            case 'l':
                                if (value[0] == 'f' && value[1] == 'a' && value[3] == 's' && value[4] == 'e')
                                    _currentToken.Type = TokenType.False;

                                break;
                            case 'r':
                                if (value[0] == 't' && value[1] == 'h' && value[3] == 'o' && value[4] == 'w')
                                    _currentToken.Type = TokenType.Throw;

                                break;
                            case 't':
                                if (value[0] == 'c' && value[1] == 'a' && value[3] == 'c' && value[4] == 'h')
                                    _currentToken.Type = TokenType.Catch;

                                break;
                        }

                        break;

                    #endregion

                    #region 6

                    case 6:

                        switch (value[1]) {
                            case 'e':
                                if (value[0] == 'r' && value[2] == 't' && value[3] == 'u' && value[4] == 'r' && value[5] == 'n')
                                    _currentToken.Type = TokenType.Return;
                                break;
                            case 'm':
                                if (value[0] == 'i' && value[2] == 'p' && value[3] == 'o' && value[4] == 'r' && value[5] == 't')
                                    _currentToken.Type = TokenType.Import;

                                break;

                            case 'w':
                                if (value[0] == 's' && value[2] == 'i' && value[3] == 't' && value[4] == 'c' && value[5] == 'h')
                                    _currentToken.Type = TokenType.Switch;
                                break;

                            case 's':
                                if (value[0] == 'a' && value[2] == 's' && value[3] == 'e' && value[4] == 'r' && value[5] == 't')
                                    _currentToken.Type = TokenType.Assert;
                                break;

                            case 'x':
                                if (value[0] == 'e' && value[2] == 't' && value[3] == 'e' && value[4] == 'n' && value[5] == 'd')
                                    _currentToken.Type = TokenType.Extend;
                                break;

                        }

                        break;

                    #endregion

                    #region 7

                    case 7:
                        if (value[0] == 'f' && value[1] == 'i' && value[2] == 'n' && value[3] == 'a' && value[4] == 'l' && value[5] == 'l' && value[6] == 'y')
                            _currentToken.Type = TokenType.Finally;

                        break;

                    #endregion

                    #region 8

                    case 8:

                        switch (value[0]) {

                            case 'c':
                                if (value[1] == 'o' && value[2] == 'n' && value[3] == 't' && value[4] == 'i' && value[5] == 'n' && value[6] == 'u' && value[7] == 'e')
                                    _currentToken.Type = TokenType.Continue;
                                break;

                        }

                        break;

                    #endregion

                    #region 9

                    case 9:

                        switch (value[0]) {
                            case 'n':
                                if (value[1] == 'a' && value[2] == 'm' && value[3] == 'e' && value[4] == 's' && value[5] == 'p' && value[6] == 'a' && value[7] == 'c' && value[8] == 'e')
                                    _currentToken.Type = TokenType.Namespace;
                                break;
                            case 'a':
                                if (value[1] == 'r' && value[2] == 'g' && value[3] == 'u' && value[4] == 'm' && value[5] == 'e' && value[6] == 'n' && value[7] == 't' && value[8] == 's')
                                    _currentToken.Type = TokenType.Arguments;
                                break;
                            case 'i':
                                if (value[1] == 'n' && value[2] == 't' && value[3] == 'e' && value[4] == 'r' && value[5] == 'f' && value[6] == 'a' && value[7] == 'c' && value[8] == 'e')
                                    _currentToken.Type = TokenType.Interface;
                                break;
                            case 'u':
                                if (value[1] == 'n' && value[2] == 'd' && value[3] == 'e' && value[4] == 'f' && value[5] == 'i' && value[6] == 'n' && value[7] == 'e' && value[8] == 'd')
                                    _currentToken.Type = TokenType.Undefined;
                                break;
                        }
                        break;

                    #endregion

                }

                #endregion

            } else if (Unicode.IsDigit(_currentChar)) {

                #region Numbers

                _currentToken.Type = TokenType.Int;
                _currentToken.LiteralBuffer.Length = 0;
                        
                switch (_currentChar) {
                    case '0':
                        int val = _source.Peek();
                        if (val == 'x' || val == 'X') {
                            _source.Read();
                            _currentLocation.Column += 2;
                            ScanHexNumber();
                            break;
                        }
                        goto default;

                    default:
                        _currentToken.LiteralBuffer.Append((char)_currentChar);
                        ScanDigits();
                        if (_currentChar == '.' && Unicode.IsDigit(_source.Peek())) {
                            ScanRealNumber();
                        }
                        break;
                }

                _currentLocation.Column += _currentToken.LiteralBuffer.Length;

                #endregion

            } else {

                #region Operators

                switch (_currentChar) {

                    case '\'':
                        _currentToken.Type = TokenType.String;
                        ScanString(false, false, false);
                        break;

                    case '"':
                        _currentToken.Type = TokenType.EscapedString;
                        ScanString(true, false, false);
                        break;

                    case '`':
                        _currentToken.Type = TokenType.TemplateString;
                        ScanString(false, true, true);
                        break;

                    case '=':
                        // = == =>
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.Eq;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            case '>':
                                _currentToken.Type = TokenType.AssignTo;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Assign;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '.':
                        // . Number ..
                        _currentChar = _source.Read();
                        if (Unicode.IsDigit(_currentChar)) {
                            _currentToken.LiteralBuffer.Length = 0;
                            _currentToken.LiteralBuffer.Append((char)_currentChar);
                            ScanRealNumber();
                            _currentLocation.Column += _currentToken.LiteralBuffer.Length;
                        } else if (_currentChar == '.') {
                            _currentToken.Type = TokenType.PeriodChain;
                            _currentChar = _source.Read();
                            _currentLocation.Column += 2;
                        } else {
                            _currentToken.Type = TokenType.Period;
                            _currentLocation.Column++;
                        }
                        break;

                    case '<':
                        // < <=
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.Lte;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Lt;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '>':
                        // > >= >>
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.Gte;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            case '>':
                                _currentChar = _source.Read();
                                _currentToken.Type = TokenType.Trace;
                                _currentLocation.Column += 2;
                                break;
                            default:
                                _currentToken.Type = TokenType.Gt;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '!':
                        // ! !=
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.Ne;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Not;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '+':
                        // + ++ +=
                        switch (_currentChar = _source.Read()) {
                            case '+':
                                _currentToken.Type = TokenType.Inc;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            case '=':
                                _currentToken.Type = TokenType.AssignAdd;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Add;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '-':
                        // - -- -=
                        switch (_currentChar = _source.Read()) {
                            case '-':
                                _currentToken.Type = TokenType.Dec;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            case '=':
                                _currentToken.Type = TokenType.AssignSub;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Sub;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '*':
                        // * *=
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.AssignMul;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Mul;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '%':
                        // % %=
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.AssignMod;
                                _currentLocation.Column += 2;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Mod;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '/':
                        // /  // /* /=
                        _currentLocation.Column += 2;
                        switch (_currentChar = _source.Read()) {
                            case '/':

                                // 忽略注释。
                                while (Unicode.IsNonTerminator(_currentChar = _source.Read())) ;

                                goto skip;
                            case '*':

                            parsenext2:
                                switch (_currentChar = _source.Read()) {
                                    case '*':
                                        if (_source.Peek() == '/') {
                                            _source.Read();
                                            _currentChar = _source.Read();
                                            _currentLocation.Column += 2;
                                            break;
                                        }
                                        goto default;
                                    case '\r':
                                        if (_source.Peek() == '\n') {
                                            _source.Read();
                                        }
                                        goto case '\n';
                                    case '\n':
                                        NewLine();
                                        goto parsenext2;
                                    case -1:
                                        break;
                                    default:
                                        _currentLocation.Column++;
                                        goto parsenext2;
                                }

                                goto skip;

                            case '=':
                                _currentToken.Type = TokenType.AssignDiv;
                                _currentChar = _source.Read();
                                break;
                            default:
                                _currentToken.Type = TokenType.Div;
                                _currentLocation.Column--;
                                break;
                        }
                        break;

                    case '&':
                        // & &&
                        switch (_currentChar = _source.Read()) {
                            case '&':
                                _currentToken.Type = TokenType.And;
                                _currentChar = _source.Read();
                                _currentLocation.Column += 2;
                                break;
                            default:
                                _currentToken.Type = TokenType.VarAnd;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case '|':
                        // | ||
                        switch (_currentChar = _source.Read()) {
                            case '|':
                                _currentToken.Type = TokenType.Or;
                                _currentChar = _source.Read();
                                _currentLocation.Column += 2;
                                break;
                            default:
                                _currentToken.Type = TokenType.VarOr;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case ':':
                        // : :=
                        switch (_currentChar = _source.Read()) {
                            case '=':
                                _currentToken.Type = TokenType.AssignCopy;
                                _currentChar = _source.Read();
                                _currentLocation.Column += 2;
                                break;
                            default:
                                _currentToken.Type = TokenType.Colon;
                                _currentLocation.Column++;
                                break;
                        }
                        break;

                    case ';':
                        _currentToken.Type = TokenType.Semicolon;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case ',':
                        _currentToken.Type = TokenType.Comma;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case '(':
                        _currentToken.Type = TokenType.LParam;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case ')':
                        _currentToken.Type = TokenType.RParam;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case '[':
                        _currentToken.Type = TokenType.LBrack;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case ']':
                        _currentToken.Type = TokenType.RBrack;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case '{':
                        _currentToken.Type = TokenType.LBrace;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case '}':
                        _currentToken.Type = TokenType.RBrace;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case '?':
                        _currentChar = _source.Read();
                        _currentToken.Type = TokenType.Conditional;
                        _currentLocation.Column++;
                        break;

                    //case '\\':
                    //    _currentToken.Type = TokenType.Identifier;
                    //    _currentToken.LiteralBuffer.Length = 0;
                    //    int c = ScanIdentifierUnicodeEscape();
                    //    if (!Unicode.IsIdentifierPart(c)) {
                    //        _currentToken.Type = TokenType.Illegal;
                    //        _currentToken.LiteralBuffer.Length = 0;
                    //        _currentToken.LiteralBuffer.AppendFormat("Bad IdentifierPart Character: {0}", (char)_currentChar);
                    //        break;
                    //    }
                    //    _currentToken.LiteralBuffer.Append((char)_currentChar);
                    //    _currentLocation.Column += _currentToken.LiteralBuffer.Length;
                    //    break;

                    case '$':
                    case '_':
                        _currentToken.Type = TokenType.Identifier;
                        _currentToken.LiteralBuffer.Length = 0;
                        _currentToken.LiteralBuffer.Append((char)_currentChar);
                        ScanIdentifierBody();
                        _currentLocation.Column += _currentToken.LiteralBuffer.Length;
                        break;
                    case '@':
                        _currentToken.Type = TokenType.AtIdentifier;
                        _currentToken.LiteralBuffer.Length = 0;
                        ScanIdentifierBody();
                        _currentLocation.Column += _currentToken.LiteralBuffer.Length + 1;
                        break;
                    case '^':
                        _currentToken.Type = TokenType.OutIdentifier;
                        _currentToken.LiteralBuffer.Length = 0;
                        ScanIdentifierBody();
                        _currentLocation.Column += _currentToken.LiteralBuffer.Length + 1;
                        break;

                    case '~':
                        _currentToken.Type = TokenType.To;
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;

                    case -1:
                        _currentToken.Type = TokenType.EOF;
                        break;

                    case '#':
                        _currentToken.Type = TokenType.DocComment;
                        _currentToken.LiteralBuffer.Length = 0;
                    parsenext3:
                        // 只要不换行就一直追加。
                        while(Unicode.IsNonTerminator(_currentChar = _source.Read())) {
                            _currentToken.LiteralBuffer.Append((char)_currentChar);
                        }
                        if(_currentChar == '\r' && _source.Peek()== '\n'){
                            _currentChar = _source.Read();
                        }
                        NewLine();
                        _currentChar = _source.Read();
                        if(_currentChar == '#'){
                            _currentToken.LiteralBuffer.Append('\n');
                            goto parsenext3;
                        }

                        break;

                    default:
                        if (Unicode.IsWhiteSpace(_currentChar)) {
                            _currentChar = _source.Read();
                            _currentLocation.Column++;
                            goto skip;
                        } else if (Unicode.IsLineTerminator(_currentChar)) {
                            _currentChar = _source.Read();
                            NewLine();
                            goto skip;
                        }

                        _currentToken.Type = TokenType.Illegal;
                        _currentToken.LiteralBuffer.Length = 0;
                        _currentToken.LiteralBuffer.AppendFormat("Unexpected Character: {0}", (char)_currentChar);
                        _currentChar = _source.Read();
                        _currentLocation.Column++;
                        break;
                }

                #endregion

            }

            _currentToken.EndLocation = _currentLocation;

        }

        /// <summary>
        /// 碰到换行符之后重新初始化位置。
        /// </summary>
        void NewLine() {
            _currentLocation.Line++;
            _currentLocation.Column = 1;
            _currentToken.HasLineTerminatorBeforeStart = true;
        }

        void ScanIdentifierBody() {

            // 如下代码支持变量名转义字符。
            //// 读取一个连续字符。 不考虑这是关键字 或其它符。
            //while (Unicode.IsIdentifierPart(_currentChar = _source.Read())) {
            //    if (_currentChar == '\\') {
            //        int c = ScanIdentifierUnicodeEscape();
            //        if (!Unicode.IsIdentifierPart(c)) {
            //            _currentToken.Type = TokenType.Illegal;
            //            _currentToken.LiteralBuffer.AppendFormat("BadIdentifierPartChar", (char)_currentChar);
            //            return;
            //        }

            //        _currentToken.LiteralBuffer.Append((char)_currentChar);
            //    } else {
            //        _currentToken.LiteralBuffer.Append((char)_currentChar);
            //    }
            //}

            while (Unicode.IsIdentifierPart(_currentChar = _source.Read())) {
                _currentToken.LiteralBuffer.Append((char)_currentChar);
            }
        }

        void ScanString(bool allowEscape, bool allowVarString, bool allowNewLine) {

            _currentToken.LiteralBuffer.Length = 0;
            int quote = _currentChar;
            _currentLocation.Column++;

        parsenext:
            switch (_currentChar = _source.Read()) {
                // 处理转义。
                case '\\':
                    if (!allowEscape) {
                        goto default;
                    }

                    // 判断是否下一个字符是 EOF 。
                    _currentLocation.Column++;
                    switch (_currentChar = _source.Read()) {
                        case -1:
                            _currentLocation.Column++;
                            _currentToken.LiteralBuffer.Append('\\');
                            break;
                        case '\r':
                            if (_source.Peek() == '\n') {
                                _source.Read();
                            }
                            goto case '\n';
                        case '\n':
                            NewLine();
                            break;
                        case 'n':
                            _currentChar = '\n';
                            goto default;
                        case 'r':
                            _currentChar = '\r';
                            goto default;
                        case 't':
                            _currentChar = '\t';
                            goto default;
                        case 'u':
                            _currentChar = ReadHexEscape(4, _currentChar);
                            goto default;
                        case 'b':
                            _currentChar = '\b';
                            goto default;
                        case 'f':
                            _currentChar = '\f';
                            goto default;
                        case 'v':
                            _currentChar = '\v';
                            goto default;
                        case '0':
                            _currentChar = '\0';
                            goto default;
                        default:
                            _currentLocation.Column++;
                            _currentToken.LiteralBuffer.Append((char)_currentChar);
                            goto parsenext;
                    }
                    break;
                case '\r':
                    if (_source.Peek() == '\n') {
                        _source.Read();
                    }
                    _currentToken.LiteralBuffer.Append('\r');
                    goto case '\n';
                case '\n':
                    if (!allowNewLine) {
                        goto case -1;
                    }
                    NewLine();
                    _currentToken.LiteralBuffer.Append('\n');
                    goto parsenext;
                case -1:
                    _currentToken.Type = TokenType.Illegal;
                    _currentToken.LiteralBuffer.Length = 0;
                    _currentToken.LiteralBuffer.Append("字符串未关闭");
                    break;
                case '$':
                    if (!allowVarString) {
                        goto default;
                    }
                    _currentToken.Type = TokenType.TemplateVarString;
                    goto default;
                default:
                    if (_currentChar == quote) {
                        _currentLocation.Column++;
                        _currentChar = _source.Read();
                        break;
                    }
                    _currentLocation.Column++;
                    _currentToken.LiteralBuffer.Append((char)_currentChar);
                    goto parsenext;

            }

        }

        int ReadHexEscape(sbyte length, int defaultChar) {

            int ret = 0;

            while (--length >= 0) {
                _currentChar = _source.Read();
                _currentLocation.Column++;
                int value = _currentChar - '0';
                if (value < 0 || value > 9) {
                    value = (_currentChar | 0x20) - 'a';
                    if (value < 0 || value > 5) {
                        // 不合法的字符。
                        return defaultChar;
                    }

                    value += 10;
                }

                ret = (ret << 4) | value;
            }

            return ret;
        }

        //int ScanIdentifierUnicodeEscape() {

        //    if ((_currentChar = _source.Read()) != 'u') {
        //        return 0;
        //    }

        //    return ScanHexEscape(4, 'u');
        //}

        void ScanRealNumber() {
            _currentToken.Type = TokenType.Real;
            _currentToken.LiteralBuffer.Append((char)'.');
            ScanDigits();
        }

        void ScanDigits() {
            while (Unicode.IsDigit(_currentChar = _source.Read())) {
                _currentToken.LiteralBuffer.Append((char)_currentChar);
            }
        }

        void ScanHexNumber() {
            _currentToken.Type = TokenType.HexInt;
            while (Unicode.IsHexDigit(_currentChar = _source.Read())) {
                _currentToken.LiteralBuffer.Append((char)_currentChar);
            }
        }

        #endregion

    }
}
