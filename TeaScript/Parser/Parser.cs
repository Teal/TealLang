using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using TeaScript.CodeDom;

namespace TeaScript.Parser {

    /// <summary>
    /// 用于生成语法树的工具。
    /// </summary>
    public class Parser {

        #region Internal

        /// <summary>
        /// 当前的词法解析器。
        /// </summary>
        Lexer _lexer;

        /// <summary>
        /// 获取或设置当前的词法解析器。
        /// </summary>
        public Lexer Lexer {
            get {
                return _lexer;
            }
            set {
                _lexer = value;
            }
        }

        /// <summary>
        /// 获取或设置当前转换器是否为严格模式。
        /// </summary>
        public bool IsStrictMode {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置当前错误报告工具。
        /// </summary>
        public IErrorReporter ErrorReporter {
            get;
            set;
        }

        /// <summary>
        /// 获取当前解析有无出现错误的状态。
        /// </summary>
        public bool HasError {
            get {
                return ErrorReporter.ErrorCount > 0;
            }
        }

        public bool AllowMissingFunctionCallQuote {
            get;
            set;
        }

        public bool AllowMissingConditionQuote {
            get;
            set;
        }

        void Error(string msg) {
            ErrorReporter.Error(msg, _lexer.Current.StartLocation, _lexer.Current.EndLocation);
        }

        void Error(string msg, params string[] args) {
            Error(String.Format(msg, args));
        }

        void WarningStrict(string msg) {
            ErrorReporter.WarningStrict(msg, _lexer.Current.StartLocation, _lexer.Current.EndLocation);
        }

        void WarningStrict(string msg, params string[] args) {
            WarningStrict(String.Format(msg, args));
        }

        void Warning(string msg) {
            ErrorReporter.Warning(msg, _lexer.Current.StartLocation, _lexer.Current.EndLocation);
        }

        void Warning(string msg, params string[] args) {
            Warning(String.Format(msg, args));
        }

        /// <summary>
        /// 初始化 <see cref="CorePlus.Parser.Javascript.Parser"/> 的新实例。
        /// </summary>
        public Parser(Lexer lexer, IErrorReporter errorReportor) {
            _lexer = lexer;
            ErrorReporter = errorReportor;

            AllowMissingFunctionCallQuote = true;
            AllowMissingConditionQuote = true;
        }

        /// <summary>
        /// 初始化 <see cref="CorePlus.Parser.Javascript.Parser"/> 的新实例。
        /// </summary>
        public Parser(IErrorReporter errorReportor)
            : this(new Lexer(), errorReportor) {
        }

        /// <summary>
        /// 初始化 <see cref="CorePlus.Parser.Javascript.Parser"/> 的新实例。
        /// </summary>
        public Parser()
            : this(new Lexer(), new DefaultErrorReporter()) {
        }

        /// <summary>
        /// 解析指定的文档 。
        /// </summary>
        /// <param name="souceCode">要操作的字符串。</param>
        /// <returns></returns>
        public Module ParseString(string souceCode) {
            return Parse(new StringReader(souceCode));
        }

        public Module ParseFile(string fileName, Encoding encoding = null) {
            using (StreamReader sb = new StreamReader(fileName, encoding ?? Encoding.UTF8))
                return Parse(sb);
        }

        public Module ParseUri(Uri uri, Encoding encoding = null) {
            System.Net.WebRequest req = System.Net.HttpWebRequest.Create(uri);
            return ParseStream(req.GetResponse().GetResponseStream(), encoding);
        }

        public Module ParseStream(Stream stream, Encoding encoding = null) {
            return Parse(new StreamReader(stream, encoding ?? Encoding.UTF8));
        }

        /// <summary>
        /// 解析指定的文档 。
        /// </summary>
        /// <param name="souceCode">要操作的字符串。</param>
        /// <returns></returns>
        public Module Parse(TextReader source) {
            ErrorReporter.Clear();
            _lexer.Source = source;
            Module module = new Module() {
                StartLocation = _lexer.Peek().StartLocation,
                Statements = new List<Statement>()
            };
            ParseProgram(module);
            module.EndLocation = _lexer.Current.EndLocation;
            return module;
        }

        /// <summary>
        /// 如果下一个操作符和指定的操作符 <paramref name="token"/> 一致， 则移动到下一个操作符 。
        /// </summary>
        /// <param name="token">需要获取的操作符 。</param>
        /// <returns>如果当前操作符符合指定的操作符且移动位置， 返回 true; 否则返回 false 。</returns>
        bool MatchToken(TokenType token) {
            if (_lexer.Peek().Type == token) {
                _lexer.Read();
                return true;
            }

            return false;
        }

        /// <summary>
        /// 确保下一个 Token 为指定的 <paramref name="token"/> ，否则输出错误。
        /// </summary>
        /// <param name="token">期待的下一个操作符。</param>
        Token ExpectToken(TokenType token) {
            if (_lexer.Peek().Type == token) {
                return _lexer.Read();
            }

            ErrorReporter.Error("应输入 \"" + token.GetName() + "\"", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
            return _lexer.Current;
        }

        static bool CheckIdentifier(Token token, string p) {
            if (token.Type == TokenType.Identifier && token.LiteralBuffer.Length == p.Length) {

                for (int i = 0; i < p.Length; i++) {
                    if (token.LiteralBuffer[i] != p[i]) {
                        return false;
                    }
                }

                return true;
            }

            return false;
        }

        #endregion

        #region Statement

        private void ParseProgram(Module scope) {

            //  Program :
            //    StatementList

            //  StatementList :
            //    Statement
            //    StatementList Statement

            scope.Statements = new List<Statement>(16);
            while (_lexer.Peek().Type != TokenType.EOF) {
                scope.Statements.Add(ParseStatement());
            }

        }

        private Statement ParseStatement() {

            //  Statement :
            //    Block
            //    EmptyStatement
            //    Semicolon
            //    LabeledStatement
            //    ExpressionStatement
            //    SelectionStatement
            //    IterationStatement
            //    JumpStatement
            //    LockStatement
            //    TryStatement
            //    LetStatement
            //    ImportStatement
            //    TypeDeclaration

            //  EmptyStatement :
            //    (Empty)

            //  Semicolon :
            //    ;

            //  SelectionStatement :
            //    IfStatement
            //    SwitchStatement

            //  IterationStatement :
            //    ForStatement
            //    ForInStatemeent
            //    WhileStatemeent

            //  JumpStatement :
            //    ContinueStatement
            //    BreakStatement
            //    ReturnStatement
            //    YieldStatement
            //    GotoStatement
            //    ThrowStatement 

            //  TypeDeclaration :
            //    ClassDeclaration
            //    StructDeclaration
            //    EnumDeclaration
            //    InterfaceDeclaration
            //    NamespaceDeclaration
            //    ExtendDeclaration

            TokenType type = _lexer.Peek().Type;

            switch (type) {

                case TokenType.Identifier:
                    if (_lexer.Peek1().Type == TokenType.Colon) {
                        return ParseLabeledStatement();
                    }

                    return ParseExpressionStatement();

                case TokenType.LBrace:
                    return ParseBlock();

                case TokenType.Semicolon:
                    return new Semicolon() {
                        StartLocation = _lexer.Read().StartLocation
                    };

                case TokenType.Illegal:
                    Error("非法的字符：" + _lexer.Read().LiteralBuffer.ToString());
                    return ParseStatement();

                case TokenType.EOF:
                    return new EmptyStatement() {
                        StartLocation = _lexer.Read().StartLocation
                    };

            }

            if (type >= TokenType.Class && type <= TokenType.Extend) {
                return ParseTypeDeclaration(type);
            }

            if (type < TokenType.Trace || type > TokenType.Lock) {
                return ParseExpressionStatement();
            }

            switch (type) {

                case TokenType.If:
                    return ParseIfStatement();

                case TokenType.Switch:
                    return ParseSwitchStatement();

                case TokenType.For:
                    return ParseForStatement();

                case TokenType.Return:
                    return ParseReturnStatement();

                case TokenType.Import:
                    return ParseImportStatement();

                case TokenType.Assert:
                    return ParseAssertStatement();

                case TokenType.Break:
                    return ParseBreakStatement();

                case TokenType.Continue:
                    return ParseContinueStatement();

                case TokenType.Goto:
                    return ParseGotoStatement();

                case TokenType.Throw:
                    return ParseThrowStatement();

                case TokenType.Try:
                    return ParseTryStatement();

                case TokenType.Let:
                    return ParseLetStatement();

                case TokenType.Lock:
                    return ParseLockStatement();

                case TokenType.Trace:
                    return ParseTraceStatement();

                case TokenType.DocComment:
                    ParseDocComment();
                    return ParseStatement();

                default:
                    return ParseExpressionStatement();
            }


        }

        private Statement ParseStatementExceptEmptyStatement() {
            Statement s = ParseStatement();

            if (s.IsEmpty) {
                Error("应输入语句");
            }

            return s;
        }

        private Block ParseBlock() {

            //  Block :
            //    { StatementList }

            return new Block() {
                StartLocation = _lexer.Read().StartLocation,
                Statements = ParseBlockBody(),
                EndLocation = ExpectToken(TokenType.RBrace).EndLocation
            };

        }

        private List<Statement> ParseBlockBody() {

            List<Statement> ret = new List<Statement>();

        parsenext:

            switch (_lexer.Peek().Type) {

                case TokenType.RBrace:
                case TokenType.EOF:
                    break;

                default:
                    ret.Add(ParseStatement());
                    goto parsenext;

            }

            return ret;

        }

        private ExpressionStatement ParseExpressionStatement() {

            //  ExpressionStatement :
            //    Expression ;

            return new ExpressionStatement() {
                Expression = ParseExpression()
            };

        }

        private IfStatement ParseIfStatement() {

            //  IfStatement :
            //    if Condition Statement
            //    if Condition Statement else Statement

            return new IfStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Condition = ParseCondition(),
                Then = ParseStatementExceptEmptyStatement(),
                Else = MatchToken(TokenType.Else) ? ParseStatementExceptEmptyStatement() : null
            };
        }

        private SwitchStatement ParseSwitchStatement() {

            //  SwitchStatement :
            //    switch Condition? { CaseClauseList }

            //  CaseClauseList :
            //    CaseClause
            //    CaseClauseList CaseClause

            //  CaseClause :
            //    case UnaryExpression : StatementList
            //    case UnaryExpression, UnaryExpression : StatementList
            //    case else : StatementList

            SwitchStatement ret = new SwitchStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Cases = new List<SwitchStatement.CaseClause>()
            };

            if (AllowMissingConditionQuote && _lexer.Peek().Type != TokenType.LParam) {
                ret.Condition = _lexer.Peek().Type == TokenType.LBrace ? null : ParseExpression(2);
            } else {
                ExpectToken(TokenType.LParam);
                ret.Condition = ParseExpression();
                ExpectToken(TokenType.RParam);
            }


            ExpectToken(TokenType.LBrace);

        parsenextcase:

            switch (_lexer.Peek().Type) {

                case TokenType.Case:
                    SwitchStatement.CaseClause cc = new SwitchStatement.CaseClause() {
                        StartLocation = _lexer.Read().StartLocation,
                        Statements = new List<Statement>(),
                        Label = MatchToken(TokenType.Else) ? null : ParseExpression()
                    };

                    ExpectToken(TokenType.Colon);

                    // 检查 case 的重复性。
                    foreach (SwitchStatement.CaseClause old in ret.Cases) {
                        if (old.Label == null && cc.Label == null) {
                            ErrorReporter.Error("标签 case else 已经出现在该 switch 中", cc.Label.StartLocation, cc.Label.EndLocation);
                        }

                        if (old.Label != null && cc.Label != null && old.ToString() == cc.ToString()) {
                            ErrorReporter.Error("标签 case " + old.ToString() + " 已经出现在该 switch 中", cc.Label.StartLocation, cc.Label.EndLocation);
                        }

                    }

                    ret.Cases.Add(cc);

                parsenext:
                    switch (_lexer.Peek().Type) {
                        case TokenType.RBrace:
                        case TokenType.Case:
                        case TokenType.EOF:
                            break;
                        default:
                            cc.Statements.Add(ParseStatement());
                            goto parsenext;
                    }


                    goto parsenextcase;

                case TokenType.RBrace:
                    _lexer.Read();
                    break;

                default:
                    Error("应输入 \"}\" 或 \"case\"");
                    break;
            }

            ret.EndLocation = _lexer.Current.EndLocation;

            return ret;
        }

        private IterationStatement ParseForStatement() {

            //  ForStatement :
            //    for Condition? Statement
            //    for InitStatement?; Expression? ; Expression? Statement
            //    for (InitStatement?; Expression? ; Expression? ) Statement
            //    for Identifier in Expression Statement
            //    for (Identifier in Expression) Statement

            Location start = _lexer.Read().StartLocation;

            IterationStatement ret;

            bool missingQuote = AllowMissingConditionQuote && _lexer.Peek().Type != TokenType.LParam;

            if (!missingQuote) {
                ExpectToken(TokenType.LParam);
            }

            // for Identifier in Expression
            if (_lexer.Peek().Type == TokenType.Identifier && CheckIdentifier(_lexer.Peek1(), "in")) {

                ret = new ForInStatement() {
                    StartLocation = start,
                    Target = _lexer.Read().LiteralBuffer.ToString()
                };

                // skip in
                _lexer.Read();

                ret.Condition = missingQuote ? ParseExpression() : ParseExpression(2);

                // for Expression
            } else {

                ForStatement s = new ForStatement() {
                    StartLocation = start
                };

                ret = s;

                // 读取初始表达式。
                switch (_lexer.Peek().Type) {
                    case TokenType.Semicolon:
                        break;
                    case TokenType.LBrace:
                        break;
                    default:
                        s.InitExpression = missingQuote ? ParseExpression() : ParseExpression(2);
                        break;
                }

                // 如果接下来是分号，说明是三段式的 for 。
                if (_lexer.Peek().Type == TokenType.Semicolon) {
                    _lexer.Read();

                    if (_lexer.Peek().Type != TokenType.Semicolon) {
                        s.Condition = missingQuote ? ParseExpression() : ParseExpression(2);
                    }

                    ExpectToken(TokenType.Semicolon);

                    if (_lexer.Peek().Type != (missingQuote ? TokenType.LBrace : TokenType.RParam)) {
                        s.NextExpression = missingQuote ? ParseExpression() : ParseExpression(2);
                    }

                    // 否则说明是只有条件语句的 for 。
                } else {
                    // 接下来直接是括号，说明语句已经结束。
                    s.Condition = s.InitExpression;
                    s.InitExpression = null;
                }

            }

            if (!missingQuote) {
                ExpectToken(TokenType.RParam);
            }

            ret.Body = ParseStatementExceptEmptyStatement();

            return ret;
        }

        private Expression ParseCondition() {

            // Condition :
            //    Expression

            Expression ret;

            // 如果省略了 if 的括号，不允许函数省略括号。
            if (AllowMissingConditionQuote && _lexer.Peek().Type != TokenType.LParam) {
                ret = ParseExpression(2);
            } else {
                ExpectToken(TokenType.LParam);
                ret = ParseExpression();
                ExpectToken(TokenType.RParam);
            }

            // 对 if (a = 7) ... 语句 报错。

            if (IsStrictMode && ret is AssignmentExpression) {
                Warning("AssignCondition");
            }

            return ret;
        }

        private ThrowStatement ParseThrowStatement() {

            //  ThrowStatement :
            //    throw Expression? ;

            return new ThrowStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = FollowsWithExpression() ? ParseExpression() : null,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private TraceStatement ParseTraceStatement() {

            //  TraceStatement :
            //    >> Expression? ;

            return new TraceStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = FollowsWithExpression() ? ParseExpression() : null,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private AssertStatement ParseAssertStatement() {

            //  AssertStatement :
            //    assert Expression ;
            //    //assert Expression throw Expression ;

            return new AssertStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Body = ParseExpression(),
                // Throws = MatchToken(TokenType.Throw) ? ParseExpression() : null,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private YieldStatement ParseYieldStatement() {

            //  YieldStatement :
            //    yield Expression ;

            return new YieldStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = ParseExpression(),
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private GotoStatement ParseGotoStatement() {

            //  GotoStatement :
            //    goto Identifier ;

            GotoStatement ret = new GotoStatement() {
                StartLocation = _lexer.Read().StartLocation,
            };

            switch (_lexer.Peek().Type) {
                case TokenType.Identifier:
                    ret.Label = _lexer.Read().LiteralBuffer.ToString();
                    break;
                case TokenType.Case:
                    ret.LabelExpression = ParseExpression();
                    break;
                default:
                    ErrorReporter.Error("应输入标签名", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
                    break;
            }

            ret.EndsWithsSemicolon = MatchToken(TokenType.Semicolon);
            ret.EndLocation = _lexer.Current.EndLocation;

            return ret;
        }

        private BreakStatement ParseBreakStatement() {

            //  BreakStatement :
            //    break ;

            return new BreakStatement() {
                StartLocation = _lexer.Read().StartLocation,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private ContinueStatement ParseContinueStatement() {

            //  ContinueStatement :
            //    continue ;

            return new ContinueStatement() {
                StartLocation = _lexer.Read().StartLocation,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private ImportStatement ParseImportStatement() {

            //  ImportStatement :
            //    import Key ;
            //    import Key => Identifier ;

            ImportStatement ret = new ImportStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = ParseKey()
            };

            if (MatchToken(TokenType.AssignTo)) {
                if (_lexer.Peek().Type == TokenType.Identifier) {
                    ret.AsModuleName = _lexer.Current.LiteralBuffer.ToString();
                } else {
                    ErrorReporter.Error("应输入标识符", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
                }
            }

            ret.EndsWithSemicolon = MatchToken(TokenType.Semicolon);
            ret.EndLocation = _lexer.Current.EndLocation;

            return ret;

        }

        private ReturnStatement ParseReturnStatement() {

            //  ReturnStatement :
            //    return Expression? ;

            return new ReturnStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = FollowsWithExpression() ? ParseExpression() : null,
                EndsWithsSemicolon = MatchToken(TokenType.Semicolon),
                EndLocation = _lexer.Current.EndLocation
            };

        }

        private LabeledStatement ParseLabeledStatement() {

            //  LabeledStatement :
            //    Identifier : Statement

            LabeledStatement ret = new LabeledStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Label = _lexer.Current.LiteralBuffer.ToString(),
            };

            // skip :
            _lexer.Read();

            ret.Statement = ParseStatement();

            return ret;
        }

        private TryStatement ParseTryStatement() {

            //  TryStatement :
            //    try Statement
            //    try Statement catch Statement
            //    try Statement finally Statement
            //    try Statement catch Statement finally Statement

            TryStatement ret = new TryStatement() {
                StartLocation = _lexer.Read().StartLocation,
                TryClause = ParseStatementExceptEmptyStatement()
            };

            if (MatchToken(TokenType.Catch)) {
                ret.CatchClause = ParseStatementExceptEmptyStatement();
            }

            if (MatchToken(TokenType.Finally)) {
                ret.FinallyClause = ParseStatementExceptEmptyStatement();
            }

            return ret;
        }

        private LetStatement ParseLetStatement() {

            //  LetStatement :
            //    let Condition Statement

            return new LetStatement() {
                StartLocation = _lexer.Read().StartLocation,
                InitExpression = ParseCondition(),
                Body = ParseStatementExceptEmptyStatement()
            };

        }

        private LockStatement ParseLockStatement() {

            //  LockStatement :
            //    lock Condition Statement

            return new LockStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Condition = ParseCondition(),
                Body = ParseStatementExceptEmptyStatement()
            };

        }

        private TypeDeclaration ParseTypeDeclaration(TokenType tokenType) {

            //  TypeDeclaration :
            //    ClassDeclaration
            //    StructDeclaration
            //    EnumDeclaration
            //    InterfaceDeclaration
            //    NamespaceDeclaration
            //    ExtendDeclaration

            //  ClassDeclaration :
            //    class DeclarationBody

            //  StructDeclaration :
            //    class DeclarationBody

            //  EnumDeclaration :
            //    enum DeclarationBody

            //  InterfaceDeclaration :
            //    interface DeclarationBody

            //  NamespaceDeclaration :
            //    namespace DeclarationBody

            //  ExtendDeclaration :
            //    extend DeclarationBody

            //  DeclarationBody :
            //    Identifier TypeBase? { TypeBody? }

            //  TypeBase :
            //    : TypeList

            //  TypeList :
            //    Type
            //    TypeList , Type

            //  TypeBody :
            //    MemberDeclaration
            //    TypeBody MemberDeclaration

            //  MemberDeclaration :
            //    FieldDeclaration
            //    MethodDeclaration
            //    PropertyDeclaration
            //    DeclarationStatement
            //    OperatorDeclaration
            //    AbstractMethodDeclaration
            //    AbstractPropertyDeclaration
            //    AbstractOperatorDeclaration

            //  FieldDeclaration :
            //    Identifier ;
            //    Identifier = Expression;

            //  MethodDeclaration :
            //    Identifier { StatementList? }
            //    Identifier ( ParameterList? ) { StatementList? }

            //  ParameterList :
            //    Parameter
            //    ParameterList , Parameter

            //  Parameter :
            //    Identifier
            //    Parameter ?
            //    Parameter : Type
            //    Parameter = Expression
            //    Parameter [ ]

            //  PropertyDeclaration :
            //    get MethodDeclaration
            //    set MethodDeclaration

            //  OperatorDeclaration :
            //    Operator ParameterList? { StatementList? }

            //  AbstractMethodDeclaration :
            //    Identifier ? ;
            //    Identifier ( ParameterList? ) ? ;

            //  AbstractPropertyDeclaration :
            //    get AbstractMethodDeclaration
            //    set AbstractMethodDeclaration
            //    add AbstractMethodDeclaration
            //    remove AbstractMethodDeclaration

            //  AbstractOperatorDeclaration :
            //    Operator ParameterList? ? ;

            TypeDeclaration ret = new TypeDeclaration() {
                StartLocation = _lexer.Read().StartLocation,
                Type = tokenType,
                Members = new List<MemberDeclaration>()
            };

            if (MatchToken(TokenType.Identifier)) {
                ret.Name = _lexer.Current.LiteralBuffer.ToString();
            } else {
                ErrorReporter.Error("应输入标识符", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
            }

            if (MatchToken(TokenType.Colon)) {
                ret.Bases = new List<Expression>();
            parsenextbase:
                if (FollowsWithExpression()) {
                    ret.Bases.Add(ParseType());

                    if (MatchToken(TokenType.Comma)) {
                        goto parsenextbase;
                    }

                }
            }

            // 解析成员。

            ExpectToken(TokenType.LBrace);

        parsenext:

            MemberDeclaration mm;

            TokenType type = _lexer.Peek().Type;

            // 解析成员名。

            // name
            if (type == TokenType.Identifier) {

                // get name
                if (_lexer.Peek1().Type == TokenType.Identifier && (CheckIdentifier(_lexer.Peek(), "get") || CheckIdentifier(_lexer.Peek(), "set"))) {
                    mm = new PropertyDeclaration() {
                        StartLocation = _lexer.Read().StartLocation,
                        Getter = _lexer.Current.LiteralBuffer[0] == 'g',
                        Name = _lexer.Read().LiteralBuffer.ToString()
                    };
                    // get [
                } else if (_lexer.Peek1().Type == TokenType.LBrack && (CheckIdentifier(_lexer.Peek(), "get") || CheckIdentifier(_lexer.Peek(), "set"))) {
                    mm = new PropertyDeclaration() {
                        StartLocation = _lexer.Read().StartLocation,
                        Getter = _lexer.Current.LiteralBuffer[0] == 'g',
                        Name = null
                    };
                    ExpectToken(TokenType.LBrack);
                    ExpectToken(TokenType.RBrack);
                    // name
                } else {
                    mm = new MethodDeclaration() {
                        StartLocation = _lexer.Read().StartLocation,
                        Name = _lexer.Current.LiteralBuffer.ToString()
                    };
                }

            } else if ((type >= TokenType.Not && type <= TokenType.Sub) || (type >= TokenType.Mul && type <= TokenType.Gte) || type == TokenType.Eq || type == TokenType.Ne || type == TokenType.Period || type == TokenType.For || type == TokenType.Trace) {
                mm = new OperatorDeclaration() {
                    StartLocation = _lexer.Read().StartLocation,
                    Operator = _lexer.Current.Type
                };
            } else if (type >= TokenType.Class && type <= TokenType.Extend) {
                ret.Members.Add( ParseTypeDeclaration(type) );
                goto parsenext;
            } else {

                switch (type) {
                    case TokenType.As:
                        mm = new AsOperatorDeclaration() {
                            StartLocation = _lexer.Read().StartLocation,
                            Value = ParseType()
                        };
                        break;
                    case TokenType.RBrace:
                        mm = null;
                        break;
                    default:
                        ErrorReporter.Error("应输入成员名", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
                        goto case TokenType.RBrace;

                }


            }

            if (mm != null) {

                ret.Members.Add(mm);

                // 解析参数。

                if (MatchToken(TokenType.LParam)) {


                    mm.Parameters = new List<MemberDeclaration.Parameter>();

                parsenextparam:

                    if (MatchToken(TokenType.Identifier)) {

                        MemberDeclaration.Parameter p = new MemberDeclaration.Parameter() {
                            StartLocation = _lexer.Current.StartLocation,
                            Name = _lexer.Current.LiteralBuffer.ToString()
                        };

                        bool conditionalParsed = false;
                        bool colonParsed = false;
                        bool eqParsed = false;

                    parsenextmark:

                        if (!conditionalParsed && MatchToken(TokenType.Conditional)) {
                            conditionalParsed = true;
                            p.HasDefaultValue = true;
                            goto parsenextmark;
                        }

                        if (!colonParsed && MatchToken(TokenType.Colon)) {
                            colonParsed = true;
                            p.Type = ParseType();
                            goto parsenextmark;
                        }

                        if (!eqParsed && MatchToken(TokenType.Eq)) {
                            eqParsed = true;
                            p.DefaultValue = ParseExpression();
                            goto parsenextmark;
                        }

                        p.EndLocation = _lexer.Current.EndLocation;

                        mm.Parameters.Add(p);

                        if (MatchToken(TokenType.Comma)) {
                            goto parsenextparam;
                        }

                    }

                    ExpectToken(TokenType.RParam);

                }



                // 解析主体。

                if (MatchToken(TokenType.Assign)) {
                    mm.InitExpression = ParseExpression();
                } else if (_lexer.Peek().Type == TokenType.LBrace) {
                    mm.Body = ParseFunctionLiteral();
                } else if (_lexer.Peek().Type == TokenType.VarOr) {
                    mm.Body = ParseConditionalFunctionLiteral();
                }

                mm.EndsWithSemicolon = MatchToken(TokenType.Semicolon);

                mm.EndLocation = _lexer.Current.EndLocation;

                goto parsenext;

            }

            ret.EndLocation = ExpectToken(TokenType.RBrace).EndLocation;

            return ret;
        }

        private Expression ParseType() {
            if (MatchToken(TokenType.Identifier)) {
                Expression expr = new Identifier() {
                    StartLocation = _lexer.Current.StartLocation,
                    Name = _lexer.Current.LiteralBuffer.ToString(),
                };

                while (MatchToken(TokenType.Period)) {
                    expr = new PropertyCallExpression() {
                        Target = expr,
                        Argument = ParseKey()
                    };
                }
                return expr;
            } else {
                Error("应输入类型");

                return new EmptyExpression() {
                    StartLocation = _lexer.Current.StartLocation,
                };

            }
        }

        #endregion

        #region Expression

        /// <summary>
        /// 解析表达式。
        /// </summary>
        /// <returns>表达式节点。</returns>
        private Expression ParseExpression() {
            Expression ret = ParseExpression(2);

            // 如果目前上下文没有省略括号，并且标识符之后如果没有换行，且紧跟了表达式，则认为是省略括号的函数。
            if (AllowMissingFunctionCallQuote && !_lexer.Peek().HasLineTerminatorBeforeStart && FollowsWithExpression() && (ret is PropertyCallExpression || ret is Identifier)) {
                ret = new FunctionCallExpression() {
                    Target = ret,
                    Arguments = ParseFunctionCallArguments(),
                    EndLocation = _lexer.Current.EndLocation
                };
            }

            return ret;
        }

        /// <summary>
        /// 解析表达式。
        /// </summary>
        /// <returns>表达式节点。</returns>
        private Expression ParseExpression(byte currentPrecedence) {

            // Expression :
            //   UnaryExpression
            //   UnaryExpression Elision UnaryExpression

            //  UnaryExpression :
            //    PostfixExpression
            //    await UnaryExpression
            //    ++ UnaryExpression
            //    -- UnaryExpression
            //    + UnaryExpression
            //    - UnaryExpression
            //    ! UnaryExpression

            TokenType type = _lexer.Peek().Type;
            Expression left;

            switch (type) {
                case TokenType.LParam:
                    left = new ParenthesizedExpression() {
                        StartLocation = _lexer.Read().StartLocation,
                        Expression = ParseExpression(),
                        EndLocation = ExpectToken(TokenType.RParam).EndLocation
                    };
                    break;
                case TokenType.Identifier:
                    left = new Identifier() {
                        StartLocation = _lexer.Read().StartLocation,
                        Name = _lexer.Current.LiteralBuffer.ToString()
                    };
                    break;
                default:
                    if (type >= TokenType.This && type <= TokenType.False) {
                        left = new ConstantLiteral() {
                            StartLocation = _lexer.Read().StartLocation,
                            Type = type,
                        };
                        break;
                    }

                    if (type >= TokenType.Int && type <= TokenType.TemplateVarString) {
                        left = new ValueLiteral() {
                            StartLocation = _lexer.Read().StartLocation,
                            Value = _lexer.Current.LiteralBuffer.ToString(),
                            Type = type,
                            EndLocation = _lexer.Current.EndLocation,
                        };
                        break;
                    }

                    if (type >= TokenType.Not && type <= TokenType.Sub) {
                        left = new UnaryExpression() {
                            StartLocation = _lexer.Read().StartLocation,
                            Expression = ParseExpression(type.GetPrecedence()),
                            Operator = type
                        };
                        break;
                    }

                    switch (type) {
                        case TokenType.LBrack:
                            left = ParseListOrDictLiteral();
                            break;
                        case TokenType.LBrace:
                            left = ParseFunctionLiteral();
                            break;
                        case TokenType.AtIdentifier:
                            left = new AtIdentifier() {
                                StartLocation = _lexer.Read().StartLocation,
                                Name = _lexer.Current.LiteralBuffer.ToString()
                            };
                            break;
                        case TokenType.OutIdentifier:
                            left = new OutIdentifier() {
                                StartLocation = _lexer.Read().StartLocation,
                                Name = _lexer.Current.LiteralBuffer.ToString()
                            };
                            break;
                        case TokenType.Await:
                            left = new AwaitExpression() {
                                StartLocation = _lexer.Read().StartLocation,
                                Expression = ParseExpression(type.GetPrecedence())
                            };
                            break;
                        case TokenType.VarOr:
                            left = _lexer.Peek1().Type == TokenType.LBrace ? (Expression)ParseConditionalFunctionLiteral() : (Expression)new CheckExpression() {
                                StartLocation = _lexer.Read().StartLocation,
                                Expression = ParseExpression(type.GetPrecedence())
                            };
                            break;
                        default:
                            _lexer.Read();
                            ErrorReporter.Error(String.Format("无效的表达式项 \"{0}\"", _lexer.Current.ToString()), _lexer.Current.StartLocation, _lexer.Current.EndLocation);
                            return new EmptyExpression() {
                                StartLocation = _lexer.Current.StartLocation
                            };
                    }
                    break;

            }

            return ParseExpression(left, currentPrecedence);

        }

        private Expression ParseExpression(Expression left, byte currentPrecedence) {

            //  PostfixExpression :
            //    MemberExpression
            //    MemberExpression [no LineTerminator here] ++
            //    MemberExpression [no LineTerminator here] --

            //  MemberExpression :
            //    CallExpression
            //    PrimaryExpression
            //    FunctionExpression
            //    MemberExpression [ Expression ]
            //    MemberExpression . Identifier

            byte precedence;
            TokenType type;

            // 依次处理优先级更小的操作符。
            while ((precedence = (type = _lexer.Peek().Type).GetPrecedence()) >= currentPrecedence) {

                switch (type) {
                    case TokenType.Period:
                        _lexer.Read();
                        left = new PropertyCallExpression() {
                            Target = left,
                            Argument = ParseKey()
                        };
                        continue;
                    case TokenType.LParam:
                        _lexer.Read();
                        left = new FunctionCallExpression() {
                            Target = left,
                            Arguments = ParseFunctionCallArguments(),
                            EndLocation = ExpectToken(TokenType.RParam).EndLocation
                        };
                        continue;
                    case TokenType.LBrack:
                        _lexer.Read();
                        left = new IndexCallExpression() {
                            Target = left,
                            Arguments = ParseFunctionCallArguments(),
                            EndLocation = ExpectToken(TokenType.RBrack).EndLocation
                        };
                        continue;
                }

                if (type >= TokenType.Assign && type <= TokenType.AssignMod) {
                    _lexer.Read();
                    left = new AssignmentExpression() {
                        Left = left,
                        Operator = type,
                        Right = ParseExpression(precedence)
                    };
                    continue;
                }

                if (type >= TokenType.Add && type <= TokenType.Is) {
                    _lexer.Read();
                    left = new BinaryExpression() {
                        Left = left,
                        Operator = type,
                        Right = ParseExpression((byte)(precedence + 1))
                    };
                    continue;
                }

                switch (type) {
                    case TokenType.Conditional: {
                            _lexer.Read();
                            ConditionalExpression e = new ConditionalExpression {
                                Condition = left,
                                ThenExpression = ParseExpression(precedence)
                            };

                            ExpectToken(TokenType.Colon);
                            e.ElseExpression = ParseExpression(precedence);
                            left = e;
                            continue;
                        }

                    case TokenType.PeriodChain:
                        _lexer.Read();
                        left = new ChainCallExpression() {
                            Target = left,
                            Argument = ParseExpression(ParseKey(), (byte)(TokenType.PeriodChain.GetPrecedence() + 1))
                        };
                        continue;
                    case TokenType.Inc:
                    case TokenType.Dec:
                        if (!_lexer.Peek().HasLineTerminatorBeforeStart) {
                            left = new PostfixExpression {
                                Expression = left,
                                Operator = type,
                                EndLocation = _lexer.Read().EndLocation
                            };
                            continue;
                        }

                        break;
                    //case TokenType.As:
                    //case TokenType.Is:
                    //    _lexer.Read();
                    //    left = new BinaryExpression() {
                    //        Left = left,
                    //        Operator = type,
                    //        Right = ParseType()
                    //    };
                    //    continue;

                    case TokenType.Comma:
                        _lexer.Read();
                        left = new CommaExpression() {
                            Left = left,
                            Operator = type,
                            Right = ParseExpression((byte)(precedence + 1))
                        };
                        continue;
                }

                break;
            }

            return left;
        }

        private bool FollowsWithExpression() {
            TokenType type = _lexer.Peek().Type;
            return type >= TokenType.Identifier && type <= TokenType.VarOr;
        }

        //private bool FollowsWithPrimaryExpression() {
        //    TokenType type = _lexer.Peek().Type;
        //    return type >= TokenType.Identifier && type <= TokenType.Not;
        //}

        /// <summary>
        /// 解析点之后的属性表达式。
        /// </summary>
        /// <returns></returns>
        private Expression ParseKey() {

            Expression p = TryParseKey();
            if (p != null) {
                return p;
            }

            ErrorReporter.Error("应输入标识符", _lexer.Peek().StartLocation, _lexer.Peek().EndLocation);
            return new EmptyExpression() {
                StartLocation = _lexer.Read().EndLocation
            };
        }

        private Expression TryParseKey() {

            //  PropertyName :
            //    Identifier
            //    StringLiteral
            //    EscapedStringLiteral

            switch (_lexer.Peek().Type) {
                case TokenType.Identifier:
                    return new Identifier() {
                        StartLocation = _lexer.Read().StartLocation,
                        Name = _lexer.Current.LiteralBuffer.ToString()
                    };
                case TokenType.String:
                case TokenType.EscapedString:
                    return new ValueLiteral() {
                        StartLocation = _lexer.Read().StartLocation,
                        Value = _lexer.Current.LiteralBuffer.ToString(),
                        Type = _lexer.Current.Type,
                        EndLocation = _lexer.Current.StartLocation,
                    };
                case TokenType.LParam:
                    return ParseExpression(2);
                default:
                    return null;
            }
        }

        private List<FunctionCallExpression.Argument> ParseFunctionCallArguments() {

            //  CallExpression :
            //    MemberExpression Arguments?
            //    MemberExpression Arguments? ,
            //    MemberExpression ( Arguments? )
            //    MemberExpression ( Arguments? , )

            //  Arguments :
            //    Argument
            //    Arguments , Argument

            //  Argument :
            //    UnaryExpression
            //    PropertyName : ToExpression
            //    PropertyName => ToExpression

            List<FunctionCallExpression.Argument> ret = new List<FunctionCallExpression.Argument>();

        parsenext:
            if (FollowsWithExpression()) {
                Expression propName = TryParseKey();
                if (propName != null) {
                    switch (_lexer.Peek().Type) {
                        case TokenType.Colon:
                            _lexer.Read();
                            ret.Add(new FunctionCallExpression.Argument() {
                                Name = propName,
                                Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                            });
                            break;
                        case TokenType.AssignTo:
                            _lexer.Read();
                            ret.Add(new FunctionCallExpression.Argument() {
                                Name = propName,
                                IsOut = true,
                                Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                            });
                            break;
                        default:
                            ret.Add(new FunctionCallExpression.Argument() {
                                Value = ParseExpression(propName, (byte)(TokenType.Comma.GetPrecedence() + 1))
                            });
                            break;
                    }
                } else {
                    ret.Add(new FunctionCallExpression.Argument() {
                        Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                    });
                }
                if (MatchToken(TokenType.Comma)) {
                    goto parsenext;
                }
            }

            return ret;
        }

        private Expression ParseListOrDictLiteral() {

            // ListOrDictLiteral :
            //   ListLiteral
            //   DictLiterals

            // ListLiteral :
            //   [ ElementList? ]
            //   [ ElementList? , ]

            // ElementList :
            //   AssignmentExpression
            //   ElementList , ToExpression

            // DictLiteral :
            //   [ : ]
            //   [ PropertyNameAndValueList ,? ]

            // PropertyNameAndValueList :
            //   PropertyName : ToExpression
            //   PropertyNameAndValueList , PropertyName : ToExpressions

            Location start = _lexer.Read().StartLocation;

            // []
            if (MatchToken(TokenType.RBrack)) {
                return new ListLiteral() {
                    StartLocation = start,
                    Values = new List<Expression>(),
                    EndLocation = _lexer.Current.EndLocation
                };
            }

            // [:]
            if (MatchToken(TokenType.Colon)) {
                return new DictLiteral() {
                    StartLocation = start,
                    Values = new List<DictLiteral.Property>(),
                    EndLocation = ExpectToken(TokenType.RBrack).EndLocation
                };
            }

            Expression maybeKey = TryParseKey();

            if (maybeKey != null && MatchToken(TokenType.Colon)) {

                DictLiteral ret = new DictLiteral() {
                    StartLocation = start,
                    Values = new List<DictLiteral.Property>() {
                        new DictLiteral.Property {
                            Key = maybeKey,
                            Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                        }
                    }
                };

                while (MatchToken(TokenType.Comma)) {

                    maybeKey = TryParseKey();

                    if (maybeKey == null) {
                        break;
                    }

                    ExpectToken(TokenType.Colon);

                    ret.Values.Add(new DictLiteral.Property() {
                        Key = maybeKey,
                        Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                    });

                }

                ret.EndLocation = ExpectToken(TokenType.RBrack).EndLocation;
                return ret;

            } else {
                ListLiteral ret = new ListLiteral() {
                    StartLocation = start,
                    Values = new List<Expression>(){
                         null ==maybeKey ? ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1)) : ParseExpression(maybeKey, (byte)(TokenType.Comma.GetPrecedence() + 1))
                    }
                };

                while (MatchToken(TokenType.Comma) && FollowsWithExpression()) {
                    ret.Values.Add(ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1)));
                }

                ret.EndLocation = ExpectToken(TokenType.RBrack).EndLocation;
                return ret;

            }

        }

        private FunctionLiteral ParseConditionalFunctionLiteral() {

            //  ConditionalFunctionLiteral:
            //    |{ StatementList? }

            Location start = _lexer.Read().StartLocation;
            MatchToken(TokenType.LBrace);

            return new FunctionLiteral() {
                StartLocation = start,
                Conditional = true,
                Statements = ParseBlockBody(),
                EndLocation = ExpectToken(TokenType.RBrace).EndLocation
            };
        }

        private FunctionLiteral ParseFunctionLiteral() {

            //  FunctionLiteral:
            //    { StatementList? }

            return new FunctionLiteral() {
                StartLocation = _lexer.Read().StartLocation,
                Statements = ParseBlockBody(),
                EndLocation = ExpectToken(TokenType.RBrace).EndLocation
            };
        }

        #endregion

        #region DocComment

        string DocComment;

        private void ParseDocComment() {
            DocComment = _lexer.Read().LiteralBuffer.ToString();
        }

        #endregion

    }

}
