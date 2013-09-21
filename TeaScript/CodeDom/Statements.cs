using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TeaScript.CodeDom {

    #region Statement

    /// <summary>
    /// 表示一个语句。
    /// </summary>
    public abstract class Statement : Node {

    }

    /// <summary>
    /// 表示一个脚本块。
    /// </summary>
    public class Block : Statement, IScope {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取当前的全部语句。
        /// </summary>
        public List<Statement> Statements {
            get;
            set;
        }

        //Dictionary<string, TokenType> _maps;

        //public void AddSymbol(string name, TokenType declType) {

        //    if (_maps == null)
        //        _maps = new Dictionary<string, TokenType>();


        //    _maps[name] = declType;

        //}

        //public TokenType GetSymbol(string name) {
        //    return _maps[name];
        //}

        //IScopeNode IScopeNode.GetDefinedBlock(string name) {
        //    return GetDefinedBlock(name);
        //}

        ///// <summary>
        ///// 在当前块和父块搜索已经定义了变量名为 <paramref name="name"/> 的块。
        ///// </summary>
        ///// <param name="name">查找的名字。</param>
        ///// <returns>返回找到块。如果找不到返回 null 。</returns>
        //public Block GetDefinedBlock(string name) {
        //    for (BreakableStatement b = this; b != null; b = b.Parent) {
        //        Block target = b as Block;
        //        if (target != null && target._maps != null && target._maps.ContainsKey(name))
        //            return target;
        //    }
        //    return null;
        //}

        public override void Write(IndentedTextWriter writer) {
            writer.Write('{');
            writer.Indent++;

            foreach (Statement f in Statements) {
                writer.WriteLine();
                f.Write(writer);
            }

            writer.WriteLine();
            writer.Indent--;
            writer.Write('}');
        }

        //NodeList<FunctionDeclaration> _fns;

        //public NodeList<FunctionDeclaration> Functions {
        //    get {

        //        if (_fns == null)
        //            _fns = new NodeList<FunctionDeclaration>();
        //        return _fns;
        //    }
        //}

        //public void AddFunction(FunctionDeclaration fn) {
        //    AddSymbol(fn.Name, TokenType.Var);

        //    Functions.Add(fn);
        //}

        //public override void GenerateC(IndentedTextWriter writer) {
        //    foreach (Statement s in Statements) {
        //        s.GenerateC(writer);
        //    }
        //}

        public Module Module {
            get {
                return null;
            }
        }

        public IScope Parent {
            get;
            set;
        }
    }

    /// <summary>
    /// 表示一个最终的模块。
    /// </summary>
    public class Module : Block, IScope {

        Module IScope.Module {
            get {
                return this;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            foreach (Statement f in Statements) {
                writer.WriteLine();
                f.Write(writer);
            }
        }

    }

    /// <summary>
    /// 表示一个表达式语句。
    /// </summary>
    public class ExpressionStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get {
                return Expression.StartLocation;
            }
            set {
                Expression.StartLocation = value;
            }
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return Expression.EndLocation;
            }
            set {
                Expression.EndLocation = value;
            }
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        /// <summary>
        /// 判断当前语句是否为空语句。
        /// </summary>
        public override bool IsEmpty {
            get {
                return Expression.IsEmpty;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            Expression.Write(writer);
        }
    }

    /// <summary>
    /// 空语句。
    /// </summary>
    public class EmptyStatement : Statement {

        public override Location StartLocation {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return StartLocation;
            }
            set {
                StartLocation = value;
            }
        }

        /// <summary>
        /// 判断当前语句是否为空语句。
        /// </summary>
        public override bool IsEmpty {
            get {
                return true;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            
        }
    }

    /// <summary>
    /// 表示一个分号。
    /// </summary>
    public class Semicolon : EmptyStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return StartLocation + 1;
            }
            set {
                StartLocation = EndLocation - 1;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write(';');
        }

    }

    /// <summary>
    /// 表示一个层语句。
    /// </summary>
    public class LabeledStatement : Statement {

        public override Location StartLocation {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return Statement.EndLocation;
            }
            set {
                Statement.EndLocation = value;
            }
        }

        public string Label {
            get;
            set;
        }

        public Statement Statement {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Indent--;
            writer.Write(Label);
            writer.Write(':');
            writer.WriteLine();
            writer.Indent++;
            Statement.Write(writer);
        }
    }

    #endregion

    #region SelectionStatement

    /// <summary>
    /// 表示一个选择语句。
    /// </summary>
    public abstract class SelectionStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

    }

    /// <summary>
    /// 表示一个 if 语句。
    /// </summary>
    public class IfStatement : SelectionStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                if (Else != null) {
                    return Else.EndLocation;
                }

                return Then.EndLocation;
            }
            set {
                if (Else != null) {
                    Else.EndLocation = value;
                } else {
                    Then.EndLocation = value;
                }
            }
        }

        /// <summary>
        /// 获取条件。
        /// </summary>
        public Expression Condition {
            get;
            set;
        }

        /// <summary>
        /// 获取当前的则的部分。
        /// </summary>
        public Statement Then {
            get;
            set;
        }

        /// <summary>
        /// 获取当前的否则的部分。
        /// </summary>
        public Statement Else {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("if(");
            Condition.Write(writer);
            writer.Write(")");
            writer.Indent++;
            Then.Write(writer);
            writer.Indent--;

            if (Else != null) {
                writer.Write(" else ");
                writer.Indent++;
                Else.Write(writer);
                writer.Indent--;
            }

        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitIfStatement(this);
        //}


        //public override void GenerateC(IndentedTextWriter writer) {
        //    writer.WriteSingleLine("if (");
        //    Condition.GenerateC(writer);
        //    writer.WriteLine(")");
        //    writer.Indent();
        //    Then.GenerateC(writer);
        //    writer.UnIndent();
        //    writer.WriteIndent();

        //    if (!Else.IsEmpty) {
        //        writer.Write(" else ");
        //        writer.Indent();
        //        Else.GenerateC(writer);
        //        writer.UnIndent();
        //    }

        //}
    }

    /// <summary>
    /// 表示一个 switch 语句。
    /// </summary>
    public class SwitchStatement : SelectionStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 表示一个 Case 层。
        /// </summary>
        public class CaseClause : Node {

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location StartLocation {
                get;
                set;
            }

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location EndLocation {
                get;
                set;
            }

            /// <summary>
            /// 获取当前的全部语句。
            /// </summary>
            public List<Statement> Statements {
                get;
                set;
            }

            /// <summary>
            /// 获取层。
            /// </summary>
            public Expression Label {
                get;
                set;
            }

            public override void Write(IndentedTextWriter writer) {
                if (Label == null) {
                    writer.Write("case else");
                } else {
                    writer.Write("case ");
                    Label.Write(writer);
                }
                writer.WriteLine(": ");
                writer.Indent++;
                foreach (Statement st in Statements) {
                    st.Write(writer);
                }
                writer.Indent--;
            }

            //[System.Diagnostics.DebuggerStepThrough]
            //public override void Accept(IAstVisitor visitor) {
            //    visitor.VisitCaseClause(this);
            //}

            //public override void GenerateC(IndentedTextWriter writer) {

            //}

        }

        /// <summary>
        /// 获取选项。
        /// </summary>
        public List<CaseClause> Cases {
            get;
            set;
        }

        public Expression Condition {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("switch ");
            if (Condition != null) {
                writer.Write('(');
                Condition.Write(writer);
                writer.Write(')');
                writer.Write(' ');
            }
            writer.WriteLine("{");
            writer.Indent++;

            foreach (CaseClause aa in Cases) {
                aa.Write(writer);
                writer.WriteLine();
            }

            writer.Indent--;
            writer.WriteLine("}");

        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitSwitchStatement(this);
        //}
    }

    #endregion

    #region IterationStatement

    /// <summary>
    /// 表示一个循环语句。
    /// </summary>
    public abstract class IterationStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取条件。
        /// </summary>
        public Expression Condition {
            get;
            internal set;
        }

        /// <summary>
        /// 获取主体。
        /// </summary>
        public Statement Body {
            get;
            internal set;
        }

        public override Location EndLocation {
            get {
                return Body.EndLocation;
            }
            set {
                Body.EndLocation = value;
            }
        }

    }

    /// <summary>
    /// 表示一个For语句。
    /// </summary>
    public class ForStatement : IterationStatement {

        /// <summary>
        /// 获取初始化语句。
        /// </summary>
        public Expression InitExpression {
            get;
            set;
        }

        /// <summary>
        /// 获取下一次语句。
        /// </summary>
        public Expression NextExpression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("for");
            if (InitExpression != null || Condition != null || NextExpression != null) {
                writer.Write('(');
            }

            if (InitExpression != null) {
                InitExpression.Write(writer);
                writer.Write(';');
            }
            if (Condition != null) {
                Condition.Write(writer);
            }

            if (NextExpression != null) {
                writer.Write(';');
                NextExpression.Write(writer);
            }

            if (InitExpression != null || Condition != null || NextExpression != null) {
                writer.Write(')');
            }


            Body.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitForStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个For-In语句。
    /// </summary>
    public class ForInStatement : IterationStatement {

        /// <summary>
        /// 获取Each表达式。
        /// </summary>
        public string Target {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("for(");

            writer.Write(Target);
            writer.Write(" in ");
            Condition.Write(writer);
            writer.Write(")");

            Body.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitForInStatement(this);
        //}
    }

    #endregion

    #region JumpStatement

    /// <summary>
    /// 表示一个跳转语句。
    /// </summary>
    public abstract class JumpStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }


    }

    /// <summary>
    /// 表示一个Continue语句。
    /// </summary>
    public class ContinueStatement : JumpStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return StartLocation + 8;
            }
            set {
                StartLocation = value - 8;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.WriteLine("continue");
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitContinueStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Break语句。
    /// </summary>
    public class BreakStatement : JumpStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return StartLocation + 5;
            }
            set {
                StartLocation = value - 5;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.WriteLine("break");
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitBreakStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Continue语句。
    /// </summary>
    public class GotoStatement : JumpStatement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取层。
        /// </summary>
        public string Label {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("goto ");
            writer.Write(Label);
            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitContinueStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Return语句。
    /// </summary>
    public class ReturnStatement : JumpStatement {

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Expression == null ? StartLocation + 6 : Expression.EndLocation;
            }
            set {
                if (Expression != null) {
                    Expression.EndLocation = value;
                } else {
                    StartLocation = value - 6;
                }
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("return");
            if (Expression != null) {
                writer.Write(' ');
                Expression.Write(writer);
            }

            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitReturnStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Throw表达式。
    /// </summary>
    public class ThrowStatement : JumpStatement {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Expression == null ? StartLocation + 5 : Expression.EndLocation;
            }
            set {
                if (Expression != null) {
                    Expression.EndLocation = value;
                } else {
                    StartLocation = value - 5;
                }
            }
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("throw");
            if (Expression != null) {
                writer.Write(' ');
                Expression.Write(writer);
            }

            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitThrowStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Yield语句。
    /// </summary>
    public class YieldStatement : JumpStatement {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Expression == null ? StartLocation + 5 : Expression.EndLocation;
            }
            set {
                if (Expression != null) {
                    Expression.EndLocation = value;
                } else {
                    StartLocation = value - 5;
                }
            }
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("return");
            if (Expression != null) {
                writer.Write(' ');
                Expression.Write(writer);
            }

            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitReturnStatement(this);
        //}
    }

    #endregion

    #region Other Statement

    /// <summary>
    /// 表示一个Try语句。
    /// </summary>
    public class TryStatement : Statement {

        public override Location StartLocation {
            get {
                return TryClause.StartLocation;
            }
            set {
                TryClause.StartLocation = value;
            }
        }

        public override Location EndLocation {
            get {
                if (FinallyClause != null) {
                    return FinallyClause.EndLocation;
                }

                if (CatchClause != null) {
                    return CatchClause.EndLocation;
                }


                return TryClause.EndLocation;
            }
            set {

                if (FinallyClause != null) {
                    FinallyClause.EndLocation = value;
                } else if (CatchClause != null) {
                    CatchClause.EndLocation = value;
                } else {
                    TryClause.EndLocation = value;
                }
            }

        }

        /// <summary>
        /// 获取 try 语句块。
        /// </summary>
        public Statement TryClause {
            get;
            set;
        }

        /// <summary>
        /// 获取 try 语句块。
        /// </summary>
        public Statement CatchClause {
            get;
            set;
        }

        /// <summary>
        /// 获取 finally 语句块。
        /// </summary>
        public Statement FinallyClause {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("try...");
        }
    }

    /// <summary>
    /// 表示一个可调试语句。
    /// </summary>
    public class LockStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        public Expression Condition {
            get;
            set;
        }

        public Statement Body {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Body.EndLocation;
            }
            set {
                Body.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("lock (");
            Condition.Write(writer);
            writer.Write(")");
            Body.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitDebuggerStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个可调试语句。
    /// </summary>
    public class LetStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        public Expression InitExpression {
            get;
            set;
        }

        public Statement Body {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Body.EndLocation;
            }
            set {
                Body.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("let (");
            InitExpression.Write(writer);
            writer.Write(")");
            Body.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitDebuggerStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个可调试语句。
    /// </summary>
    public class AssertStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        public Expression Body {
            get;
            set;
        }

        public Expression Throws {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Throws == null ? Body.EndLocation : Throws.EndLocation;
            }
            set {
                if (Throws != null) {
                    Throws.EndLocation = value;
                } else {
                    Body.EndLocation = value;
                }
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("assert ");
            Body.Write(writer);

            if (Throws != null) {
                writer.Write(" throw ");
                Throws.Write(writer);
            }
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitDebuggerStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Yield语句。
    /// </summary>
    public class TraceStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }


        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Expression == null ? StartLocation + 5 : Expression.EndLocation;
            }
            set {
                if (Expression != null) {
                    Expression.EndLocation = value;
                } else {
                    StartLocation = value - 5;
                }
            }
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write(">>");
            if (Expression != null) {
                writer.Write(' ');
                Expression.Write(writer);
            }

            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitReturnStatement(this);
        //}
    }

    /// <summary>
    /// 表示一个Yield语句。
    /// </summary>
    public class ImportStatement : Statement {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get {
                return Expression == null ? StartLocation + 5 : Expression.EndLocation;
            }
            set {
                if (Expression != null) {
                    Expression.EndLocation = value;
                } else {
                    StartLocation = value - 5;
                }
            }
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("import");
            if (Expression != null) {
                writer.Write(' ');
                Expression.Write(writer);
            }

            writer.WriteLine();
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitReturnStatement(this);
        //}
    }

    #endregion

    #region Declarations

    /// <summary>
    /// 表示一个表达式语句。
    /// </summary>
    public class TypeDeclaration : Statement {

        public abstract class MemberDeclaration : Node {

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location StartLocation {
                get;
                set;
            }

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location EndLocation {
                get;
                set;
            }

        }

        public class Parameter : Node {

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location StartLocation {
                get;
                set;
            }

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location EndLocation {
                get;
                set;
            }

            public string Name {
                get;
                set;
            }

            public Expression Type {
                get;
                set;
            }

            public bool HasDefaultValue {
                get;
                set;
            }

            public Expression DefaultValue {
                get;
                set;
            }

        }

        public class MethodDeclaration : MemberDeclaration {

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location StartLocation {
                get;
                set;
            }

            /// <summary>
            /// 获取或设置节点结束位置。
            /// </summary>
            public override Location EndLocation {
                get;
                set;
            }

            public string Name {
                get;
                set;
            }

            public List<Parameter> Parameters {
                get;
                set;
            }

        }
             
        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        public TokenType Type {
            get;
            set;
        }

        public Expression Extends {
            get;
            set;
        }

        public List<MemberDeclaration> Members {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            
        }
    }

    #endregion

}
