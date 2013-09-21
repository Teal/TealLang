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
            
            Error("应输入 " + token.GetName());
            //  Error(String.Format(Messages.ExpectedToken, Token.Find(token).Name));
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

            scope.Statements = ParseStatementList(false);

        }

        private List<Statement> ParseStatementList(bool inBlock = true) {

            //  StatementList :
            //    Statement
            //    StatementList Statement

            List<Statement> ret = new List<Statement>();

        parsenext:

            switch (_lexer.Peek().Type) {

                case TokenType.RBrace:

                    // 如果是内部脚本块，则发现 RBrace 时中停止解析。
                    if (inBlock) {
                        return ret;
                    }

                    Error("多余的 }");
                    _lexer.Read();
                    break;

                case TokenType.EOF:
                    break;

                default:
                    ret.Add(ParseStatement());
                    goto parsenext;

            }

            return ret;

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
                Statements = ParseStatementList(),
                EndLocation = ExpectToken(TokenType.RBrace).EndLocation
            };

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
                ret.Condition = _lexer.Peek().Type == TokenType.LBrace ? null : ParseExpression();
            } else {
                ExpectToken(TokenType.LParam);
                ret.Condition = ParseExpression();
                ExpectToken(TokenType.RParam);
            }


            ExpectToken(TokenType.LBrace);
            bool hasDefault = false;
            for (; ; ) {
                SwitchStatement.CaseClause cc;

                switch (_lexer.Read().Type) {
                    case TokenType.Case:

                        cc = new SwitchStatement.CaseClause() {
                            StartLocation = _lexer.Current.StartLocation,
                            Statements = new List<Statement>()
                        };

                        Expression ep;
                        if (_lexer.Peek().Type == TokenType.Else) {
                            if (hasDefault) {
                                Error("case else 段只能出现一次。");
                            } else {
                                hasDefault = true;
                            }

                            ep = null;
                        } else if (hasDefault) {
                            Error("case else 应该出现在所有 case 的最后一个");
                            ep = ParseExpression();
                        } else {
                            ep = ParseExpression();
                        }

                        cc.Label = ep;

                        ExpectToken(TokenType.Colon);
                        break;

                    case TokenType.RBrace:
                        goto endLoop;

                    default:
                        Error("switch 块错误");
                        goto endLoop;
                }
                  
                ret.Cases.Add(cc);
                
                TokenType tokenType;

                while ((tokenType = _lexer.Peek().Type) != TokenType.RBrace
                       && tokenType != TokenType.Case
                       && tokenType != TokenType.EOF) {
                    cc.Statements.Add(ParseStatement());
                }

                cc.EndLocation = _lexer.Current.EndLocation;

            }

        endLoop:

            ret.EndLocation = ExpectToken(TokenType.RBrace).EndLocation;

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

            // 判断是否存在括号，分开处理。
            if (AllowMissingConditionQuote && _lexer.Peek().Type != TokenType.LParam) {

                // for (Identifier in Expression)
                if (_lexer.Peek().Type == TokenType.Identifier && CheckIdentifier(_lexer.Peek1(), "in")) {

                    string id = _lexer.Read().LiteralBuffer.ToString();

                    // skip in
                    _lexer.Read();

                    ret = new ForInStatement() {
                        StartLocation = start,
                        Target = id,
                        Condition = ParseExpression()
                    };

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
                            s.InitExpression = ParseExpression();
                            break;
                    }

                    // 如果接下来是分号，说明是三段式的 for 。
                    if (_lexer.Peek().Type == TokenType.Semicolon) {
                        _lexer.Read();

                        if (_lexer.Peek().Type != TokenType.Semicolon) {
                            s.Condition = ParseExpression();
                        }

                        ExpectToken(TokenType.Semicolon);

                        if (_lexer.Peek().Type != TokenType.LBrace) {
                            s.NextExpression = ParseExpression();
                        }

                        // 否则说明是只有条件语句的 for 。
                    } else {
                        // 接下来直接是括号，说明语句已经结束。
                        s.Condition = s.InitExpression;
                        s.InitExpression = null;
                    }

                }

            } else {

                ExpectToken(TokenType.LParam);

                // for (Identifier in Expression)
                if (_lexer.Peek().Type == TokenType.Identifier && CheckIdentifier(_lexer.Peek1(), "in")) {

                    string id = _lexer.Read().LiteralBuffer.ToString();

                    // skip in
                    _lexer.Read();

                    ret = new ForInStatement() {
                        StartLocation = start,
                        Target = id,
                        Condition = ParseExpression()
                    };

                // for Expression
                } else {

                    ForStatement s = new ForStatement() {
                        StartLocation = start
                    };

                    ret = s;

                    // 读取初始表达式。
                    switch(_lexer.Peek().Type){
                        case TokenType.Semicolon:
                            break;
                        case TokenType.RParam:
                            Error("缺少表达式");
                            break;
                        default:
                            s.InitExpression = ParseExpression();
                            break;
                    }

                    // 如果接下来是分号，说明是三段式的 for 。
                    if (_lexer.Peek().Type == TokenType.Semicolon) {
                        _lexer.Read();

                        if (_lexer.Peek().Type != TokenType.Semicolon) {
                            s.Condition = ParseExpression();
                        }

                        ExpectToken(TokenType.Semicolon);

                        if (_lexer.Peek().Type != TokenType.RParam) {
                            s.NextExpression = ParseExpression();
                        }

                    // 否则说明是只有条件语句的 for 。
                    } else {
                        // 接下来直接是括号，说明语句已经结束。
                        s.Condition = s.InitExpression;
                        s.InitExpression = null;
                    }

                }

                ExpectToken(TokenType.RParam);

            }

            ret.Body = ParseStatementExceptEmptyStatement();

            return ret;
        }

        private Expression ParseCondition() {

            // Condition :
            //    Expression

            Expression ret;

            if (AllowMissingConditionQuote && _lexer.Peek().Type != TokenType.LParam) {
                //bool orignalValue = AllowMissingFunctionCallQuote;
                //AllowMissingFunctionCallQuote = false;
                ret = ParseExpression();
                //AllowMissingFunctionCallQuote = orignalValue;
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
                Expression = FollowsWithExpression() ? ParseExpression() : null
            };
        }

        private TraceStatement ParseTraceStatement() {
            return new TraceStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = FollowsWithExpression() ? ParseExpression() : null
            };
        }

        private AssertStatement ParseAssertStatement() {
            return new AssertStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Body = FollowsWithExpression() ? ParseExpression() : null,
                Throws = MatchToken(TokenType.Throw) ? ParseExpression() : null
            };
        }

        private YieldStatement ParseYieldStatement() {

            //  YieldStatement :
            //    yield Expression;

            return new YieldStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = ParseExpression()
            };
        }

        private BreakStatement ParseBreakStatement() {

            //  BreakStatement :
            //    break;

            return new BreakStatement() {
                StartLocation = _lexer.Read().StartLocation
            };
        }

        private GotoStatement ParseGotoStatement() {

            //  GotoStatement :
            //    goto Identifier ;

            return new GotoStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Label = MatchToken(TokenType.Case) ? null : ExpectToken(TokenType.Identifier).LiteralBuffer.ToString(),
                EndLocation = _lexer.Current.EndLocation
            };
        }

        private ContinueStatement ParseContinueStatement() {

            //  ContinueStatement :
            //    continue;

            return new ContinueStatement() {
                StartLocation = _lexer.Read().StartLocation
            };
        }

        private ImportStatement ParseImportStatement() {

            return new ImportStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = ParseExpression()
            };

        }

        private ReturnStatement ParseReturnStatement() {

            //  ReturnStatement :
            //    return Expression? ;

            return new ReturnStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Expression = ParseExpression()
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

            if(MatchToken(TokenType.Catch)){
                ret.CatchClause = ParseStatementExceptEmptyStatement();
            }

            if (MatchToken(TokenType.Finally)) {
                ret.FinallyClause = ParseStatementExceptEmptyStatement();
            }

            return ret;
        }

        private LetStatement ParseLetStatement() {

            //  LetStatement :
            //    let ExpressionStatement Statement

            return new LetStatement() {
                StartLocation = _lexer.Read().StartLocation,
                InitExpression = ParseCondition(),
                Body = ParseStatementExceptEmptyStatement(),
                EndLocation = _lexer.Current.EndLocation
            };

        }

        private LockStatement ParseLockStatement() {

            //  LockStatement :
            //    lock ExpressionStatement Statement

            return new LockStatement() {
                StartLocation = _lexer.Read().StartLocation,
                Condition = ParseCondition(),
                Body = ParseStatementExceptEmptyStatement(),
                EndLocation = _lexer.Current.EndLocation
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

            TypeDeclaration ret = new TypeDeclaration() {
                StartLocation = _lexer.Read().StartLocation,
                Type = tokenType,
            };

            ExpectToken(TokenType.LBrace);

            switch (_lexer.Peek().Type) {
                case TokenType.Identifier:
                    if (_lexer.Peek1().Type == TokenType.Identifier && (CheckIdentifier(_lexer.Peek(), "get") || CheckIdentifier(_lexer.Peek(), "set"))) {

                    } else {
                        TypeDeclaration.MethodDeclaration mm = new TypeDeclaration.MethodDeclaration() {
                            StartLocation = _lexer.Read().StartLocation,
                            Name = _lexer.Current.LiteralBuffer.ToString()
                        };

                        if(MatchToken(TokenType.LParam)){

                            mm.Parameters.Add(new TypeDeclaration.Parameter() {
                               // Name = ExpectToken()

                            });

                        }

                    }
                    break;
            }

            ExpectToken(TokenType.RBrace);

            return ret;
        }

        #endregion

        #region Expression

        /// <summary>
        /// 解析表达式。
        /// </summary>
        /// <returns>表达式节点。</returns>
        private Expression ParseExpression(byte currentPrecedence = 1) {

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

                    if (type >= TokenType.Not && type <= TokenType.Dec) {
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
                        case TokenType.Conditional:
                            left = new CheckExpression() {
                                StartLocation = _lexer.Read().StartLocation,
                                Expression = ParseExpression(type.GetPrecedence())
                            };
                            break;
                        default:
                            Error("{0} 不能作为表达式的一部分。", _lexer.Read().LiteralBuffer.ToString());
                            return new EmptyExpression() {
                                StartLocation = _lexer.Current.EndLocation
                            };
                    }
                    break;

            }

            return ParseExpression(left, currentPrecedence);
        }

        private Expression ParseExpression(Expression left, byte currentPrecedence = 1) {

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
                            Argument = ParsePropertyCallArgument()
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
                            Argument = ParseExpression(),
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

                if (type >= TokenType.Add && type <= TokenType.To) {
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
                            Argument = ParseExpression(ParsePropertyCallArgument(), (byte)(TokenType.PeriodChain.GetPrecedence() + 1))
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


            // 如果目前上下文没有省略括号，并且标识符之后如果没有换行，且紧跟了表达式，则认为是省略括号的函数。
            if (AllowMissingFunctionCallQuote && !_lexer.Peek().HasLineTerminatorBeforeStart && FollowsWithPrimaryExpression() && (left is PropertyCallExpression || left is Identifier)) {
                left = new FunctionCallExpression() {
                    Target = left,
                    Arguments = ParseFunctionCallArguments(),
                    EndLocation = _lexer.Current.EndLocation
                };
            }

            return left;
        }

        private bool FollowsWithExpression() {
            TokenType type = _lexer.Peek().Type;
            return type >= TokenType.Identifier && type <= TokenType.Sub;
        }

        private bool FollowsWithPrimaryExpression() {
            TokenType type = _lexer.Peek().Type;
            return type >= TokenType.Identifier && type <= TokenType.Not;
        }

        /// <summary>
        /// 解析点之后的属性表达式。
        /// </summary>
        /// <returns></returns>
        private Expression ParsePropertyCallArgument() {

            Expression p = TryParsePropertyName();
            if (p != null) {
                return p;
            }

            Error("需要合法的属性名");
            return new EmptyExpression() {
                StartLocation = _lexer.Read().EndLocation
            };
        }

        private List<FunctionCallExpression.Argument> ParseFunctionCallArguments() {

            //  CallExpression :
            //    MemberExpression Arguments?
            //    MemberExpression ( Arguments? )

            //  Arguments :
            //    Elision
            //    Argument
            //    Arguments Elision Argument

            //  Argument :
            //    UnaryExpression
            //    PropertyName : UnaryExpression
            //    PropertyName => UnaryExpression

            List<FunctionCallExpression.Argument> ret = new List<FunctionCallExpression.Argument>();

        parsenext:
            switch (_lexer.Peek().Type) {
                case TokenType.RParam:
                    _lexer.Read();
                    return ret;
                case TokenType.EOF:
                    break;
                default:
                    Expression propName = TryParsePropertyName();
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

                    break;
            }

            return ret;
        }

        private Expression TryParsePropertyName() {

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
                    return ParseExpression();
                default:
                    return null;
            }
        }

        private Expression ParseListOrDictLiteral() {

             //ListOrDictLiteral :
             //   ListLiteral
             //   DictLiterals

             // ListLiteral :
             //   [ Elision? ElementList? Elision? ]

             // ElementList :
             //   AssignmentExpression
             //   ElementList Elision AssignmentExpression

             // DictLiteral :
             //   { }
             //   { Elision? PropertyNameAndValueList Elision? }

             // PropertyNameAndValueList :
             //   PropertyName : AssignmentExpression
             //   PropertyNameAndValueList Elision PropertyName : AssignmentExpression

             // Elision :
             //   ,
             //   Elision ,

            Location start = _lexer.Read().StartLocation;
            TokenType type;

            while ((type = _lexer.Peek().Type) == TokenType.Comma) {
                type = _lexer.Read().Type;
            }

            if (type == TokenType.RBrack) {
                return new ListLiteral() {
                    StartLocation = start,
                    Values = new List<Expression>(),
                    EndLocation = _lexer.Current.EndLocation
                };
            }

            if (type == TokenType.Colon) {
                while ((type = _lexer.Peek().Type) == TokenType.Comma) {
                    type = _lexer.Read().Type;
                }
                ExpectToken(TokenType.RBrack);
                return new DictLiteral() {
                    StartLocation = start,
                    Values = new List<DictLiteral.Property>(),
                    EndLocation = _lexer.Current.EndLocation
                };
            }

            if (!FollowsWithExpression()) {
                return new EmptyExpression() {
                    StartLocation = start
                };
            }

            Expression firstValue = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1));

            type = _lexer.Peek().Type;

            if (type == TokenType.Colon) {
                if (!FollowsWithExpression()) {
                    return new DictLiteral() {
                        StartLocation = start,
                        Values = new List<DictLiteral.Property>() {
                            new DictLiteral.Property {
                                Key = firstValue,
                                Value = new EmptyExpression(){StartLocation = _lexer.Current.EndLocation}
                            }
                        }
                    };
                }

                DictLiteral ret = new DictLiteral() {
                    StartLocation = start,
                    Values = new List<DictLiteral.Property>() {
                        new DictLiteral.Property {
                            Key = firstValue,
                            Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                        }
                    }
                };

                type = _lexer.Peek().Type;

                while (type == TokenType.Comma) {
                    _lexer.Read();

                    type = _lexer.Peek().Type;

                    switch (type) {
                        case TokenType.RBrack:
                            _lexer.Read();
                            break;
                        case TokenType.Comma:
                            continue;
                        case TokenType.EOF:
                            Error("缺少 ]");
                            break;
                        default:

                            Expression left = TryParsePropertyName();

                            ExpectToken(TokenType.Colon);

                            if (!FollowsWithExpression()) {
                                break;
                            }

                            ret.Values.Add(new DictLiteral.Property() {
                                Key = left,
                                Value = ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1))
                            });
                            continue;
                    }

                    break;
                }

                ret.EndLocation = ExpectToken(TokenType.RBrack).EndLocation;
                return ret;
            } else {
                ListLiteral ret = new ListLiteral() {
                    StartLocation = start,
                    Values = new List<Expression>(){
                        firstValue
                    }
                };

                while (type == TokenType.Comma) {
                    _lexer.Read();

                    type = _lexer.Peek().Type;

                    switch (type) {
                        case TokenType.RBrack:
                            _lexer.Read();
                            break;
                        case TokenType.Comma:
                            continue;
                        case TokenType.EOF:
                            Error("缺少 ]");
                            break;
                        default:

                            if (!FollowsWithExpression()) {
                                break;
                            }

                            ret.Values.Add(ParseExpression((byte)(TokenType.Comma.GetPrecedence() + 1)));
                            continue;
                    }

                    break;
                }

                ret.EndLocation = ExpectToken(TokenType.RBrack).EndLocation;
                return ret;
            }

        }

        private Expression ParseFunctionLiteral() {

            //  FunctionLiteral:
            //    { StatementList? }

            return new FunctionLiteral() {
                StartLocation = _lexer.Read().StartLocation,
                Statements = ParseStatementList(),
                EndLocation = ExpectToken(TokenType.RBrace).EndLocation
            };
        }

        #endregion

    }

}
