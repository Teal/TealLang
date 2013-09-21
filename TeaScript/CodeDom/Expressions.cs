using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Text;

namespace TeaScript.CodeDom {

    #region Expression

    /// <summary>
    /// 表示一个表达式。
    /// </summary>
    public abstract class Expression : Node {

        //public virtual Type Type {
        //    get {
        //        return Type.Unknown;
        //    }
        //}

        ///// <summary>
        ///// 将当前节点写入指定的 IndentedTextWriter 。
        ///// </summary>
        ///// <param name="writer">写入工具。</param>
        //public override void Write(IndentedTextWriter writer) {
        //    //writer.Write(ToString());
        //}

        //public override void GenerateC(IndentedTextWriter writer) {

        //}
    }

    /// <summary>
    /// 表示一个空表达式。
    /// </summary>
    public class EmptyExpression : Expression {

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
    /// 表示一个标识符。
    /// </summary>
    public class Identifier : Expression {

        public override Location StartLocation {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return StartLocation + Name.Length;
            }
            set {
                StartLocation = value - Name.Length;
            }
        }

        public string Name {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write(Name);
        }

        public override string ToString() {
            return Name;
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitIdentifier(this);
        //}

        //#region ILiteral 成员


        ///// <summary>
        ///// 获取当前文本真正的字符串值。
        ///// </summary>
        ///// <value></value>
        //public string Value {
        //    get {
        //        return Name;
        //    }
        //}

        //#endregion

        //public override void GenerateC(IndentedTextWriter writer) {
        //    writer.Write(Name);
        //}
    }

    public class AtIdentifier : Identifier {

        public override Location EndLocation {
            get {
                return StartLocation + Name.Length + 1;
            }
            set {
                StartLocation = value - Name.Length - 1;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write('@');
            writer.Write(Name);
        }

    }

    public class OutIdentifier : Identifier {

        public override Location EndLocation {
            get {
                return StartLocation + Name.Length + 1;
            }
            set {
                StartLocation = value - Name.Length - 1;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write('^');
            writer.Write(Name);
        }

    }

    /// <summary>
    /// 表示一个条件表达式。
    /// </summary>
    public class ConditionalExpression : Expression {

        /// <summary>
        /// 获取条件。
        /// </summary>
        public Expression Condition {
            get;
            set;
        }

        /// <summary>
        /// 获取则语句。
        /// </summary>
        public Expression ThenExpression {
            get;
            set;
        }

        /// <summary>
        /// 获取否则语句。
        /// </summary>
        public Expression ElseExpression {
            get;
            set;
        }

        public override Location StartLocation {
            get {
                return Condition.StartLocation;
            }
            set {
                Condition.StartLocation = value;
            }
        }

        public override Location EndLocation {
            get {
                return ElseExpression.EndLocation;
            }
            set {
                ElseExpression.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            Condition.Write(writer);
            writer.Write(' ');
            writer.Write('?');
            writer.Write(' ');
            ThenExpression.Write(writer);
            writer.Write(' ');
            writer.Write(':');
            writer.Write(' ');
            ElseExpression.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitConditionalExpression(this);
        //}
    }

    /// <summary>
    /// 表示用括号括起来的表达式。
    /// </summary>
    public class ParenthesizedExpression : Expression {

        public override Location StartLocation {
            get;
            set;
        }

        public override Location EndLocation {
            get;
            set;
        }

        public Expression Expression {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write('(');
            Expression.Write(writer);
            writer.Write(')');
        }

        //public override string ToString() {
        //    return String.Format("({0})", Expression);
        //}

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitParamedExpression(this);
        //}
    }

    #endregion

    #region UnaryExpression

    /// <summary>
    /// 表示一个单目运算表达式。
    /// </summary>
    public class UnaryExpression : Expression {

        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取当前表达式的操作符。
        /// </summary>
        public TokenType Operator {
            get;
            set;
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return Expression.EndLocation;
            }
            set {
                Expression.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write(Operator.GetName());
            Expression.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitUnaryExpression(this);
        //}
    }

    /// <summary>
    /// 表示一个 await 表达式。
    /// </summary>
    public class AwaitExpression : Expression {

        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return Expression.EndLocation;
            }
            set {
                Expression.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("await ");
            Expression.Write(writer);
        }

    }

    public class CheckExpression : Expression {

        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取表达式。
        /// </summary>
        public Expression Expression {
            get;
            set;
        }

        public override Location EndLocation {
            get {
                return Expression.EndLocation;
            }
            set {
                Expression.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write("?");
            Expression.Write(writer);
        }

    }

    /// <summary>
    /// 表示一个后缀表达式计算表达式。
    /// </summary>
    public class PostfixExpression : UnaryExpression {

        public override Location StartLocation {
            get {
                return Expression.StartLocation;
            }
            set {
                Expression.StartLocation = value;
            }
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            Expression.Write(writer);
            writer.Write(Operator.GetName());
        }

        ///// <summary>
        ///// 返回表示当前 <see cref="T:System.Object"/> 的 <see cref="T:System.String"/>。
        ///// </summary>
        ///// <returns>
        ///// 	<see cref="T:System.String"/>，表示当前的 <see cref="T:System.Object"/>。
        ///// </returns>
        //public override string ToString() {
        //    return Expression.ToString() + (Operator == TokenType.Inc ? "++" : "--");
        //}

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitPostfixExpression(this);
        //}
    }

    #endregion

    #region BinaryExpression

    /// <summary>
    /// 表示一个二目运算表达式。
    /// </summary>
    public class BinaryExpression : Expression {

        /// <summary>
        /// 获取左式。
        /// </summary>
        public Expression Left {
            get;
            set;
        }

        /// <summary>
        /// 获取当前表达式的操作符。
        /// </summary>
        public TokenType Operator {
            get;
            set;
        }

        /// <summary>
        /// 获取右式。
        /// </summary>
        public Expression Right {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location StartLocation {
            get {
                return Left.StartLocation;
            }
            set {
                Left.StartLocation = value;
            }
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return Right.EndLocation;
            }
            set {
                Right.EndLocation = value;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            Left.Write(writer);
            writer.Write(' ');
            writer.Write(Operator.GetName());
            writer.Write(' ');
            Right.Write(writer);
        }

    }

    /// <summary>
    /// 表示一个赋值语句。
    /// </summary>
    public class AssignmentExpression : BinaryExpression {

    }

    /// <summary>
    /// 表示一个赋值语句。
    /// </summary>
    public class CommaExpression : BinaryExpression {

    }

    #endregion

    #region CallExpression

    /// <summary>
    /// 表示一个Call语句。
    /// </summary>
    public abstract class CallExpression : Expression {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location StartLocation {
            get {
                return Target.StartLocation;
            }
            set {
                Target.StartLocation = value;
            }
        }

        /// <summary>
        /// 获取目标。
        /// </summary>
        public Expression Target {
            get;
            set;
        }

    }

    /// <summary>
    /// 表示通过.形式的调用。fn.
    /// </summary>
    public class PropertyCallExpression : CallExpression {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return Argument.EndLocation;
            }
            set {
                Argument.EndLocation = value;
            }
        }

        public Expression Argument {
            get;
            set;
        }

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            Target.Write(writer);
            writer.Write('.');
            Argument.Write(writer);
        }

    }

    /// <summary>
    /// 表示通过函数形式的调用。 fn()
    /// </summary>
    public class FunctionCallExpression : CallExpression {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        public class Argument : Node {

            public override Location StartLocation {
                get {
                    return Name != null ? Name.StartLocation : Value.StartLocation;
                }
                set {
                    if (Name != null) {
                        Name.StartLocation = value;
                    } else {
                        Value.StartLocation = value;
                    }
                }
            }

            public override Location EndLocation {
                get {
                    return Value.EndLocation;
                }
                set {
                    Value.EndLocation = value;
                }
            }

            public Expression Name {
                get;
                set;
            }

            public bool IsOut {
                get;
                set;
            }

            public Expression Value {
                get;
                set;
            }

            public override void Write(IndentedTextWriter writer) {
                if (Name != null) {
                    writer.Write(Name);
                    if (IsOut) {
                        writer.Write("=>");
                    } else {
                        writer.Write(':');
                    }
                    writer.Write(' ');
                }

                Value.Write(writer);
            }

        }

        public List<Argument> Arguments {
            get;
            set;
        }

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            Target.Write(writer);

            writer.Write('(');
            bool appendComma = false;
            foreach (Argument args in Arguments) {
                if (appendComma) {
                    writer.Write(',');
                    writer.Write(' ');
                } else {
                    appendComma = true;
                }
                args.Write(writer);
            }
            writer.Write(')');

        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitFunctionCallExpression(this);
        //}
    }

    /// <summary>
    /// 表示通过数组形式的调用。 fn[]
    /// </summary>
    public class IndexCallExpression : CallExpression {

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public override Location EndLocation {
            get;
            set;
        }

        public List<FunctionCallExpression.Argument> Arguments {
            get;
            set;
        }

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            Target.Write(writer);

            writer.Write('[');
            bool appendComma = false;
            foreach (FunctionCallExpression.Argument args in Arguments) {
                if (appendComma) {
                    writer.Write(',');
                    writer.Write(' ');
                } else {
                    appendComma = true;
                }
                args.Write(writer);
            }
            writer.Write(']');
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitIndexCallExpression(this);
        //}
    }

    /// <summary>
    /// 表示通过.形式的调用。
    /// </summary>
    public class ChainCallExpression : PropertyCallExpression {

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            Target.Write(writer);
            writer.Write('.');
            writer.Write('.');
            Argument.Write(writer);
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitPropertyCallExpression(this);
        //}
    }

    #endregion

    #region Literal

    /// <summary>
    /// 表示字面量表达式。
    /// </summary>
    public abstract class Literal : Expression {

    }

    /// <summary>
    /// 表示常量表达式。
    /// </summary>
    public class ConstantLiteral : Literal {

        public TokenType Type {
            get;
            set;
        }

        public string Name {
            get {
                return Type.GetName();
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
        /// 获取结束位置。
        /// </summary>
        public override Location EndLocation {
            get {
                return StartLocation + Name.Length;
            }
            set {
                StartLocation = value - Name.Length;
            }
        }

        public override void Write(IndentedTextWriter writer) {
            writer.Write(Name);
        }

        /// <summary>
        /// 返回表示当前 <see cref="T:System.Object"/> 的 <see cref="T:System.String"/>。
        /// </summary>
        /// <returns>
        /// 	<see cref="T:System.String"/>，表示当前的 <see cref="T:System.Object"/>。
        /// </returns>
        public override string ToString() {
            return Name;
        }

    }

    /// <summary>
    /// 表示一个字面常量。
    /// </summary>
    public class ValueLiteral : Literal {

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

        /// <summary>
        /// 获取值。
        /// </summary>
        public string Value {
            get;
            set;
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitNumberLiteral(this);
        //}

        public override void Write(IndentedTextWriter writer) {
            switch(Type) {
                case TokenType.Int:
                case TokenType.Real:
                    writer.Write(Value);
                    break;
                case TokenType.HexInt:
                    writer.Write("0x");
                    writer.Write(Value);
                    break;
                default:
                    writer.Write(TokenInfo.EscapeString(Type, Value));
                    break;
            }
        }

    }

    /// <summary>
    /// 表示一个列表表达式。
    /// </summary>
    public class ListLiteral : Literal {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取值。
        /// </summary>
        public List<Expression> Values {
            get;
            set;
        }

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            writer.Write('[');
            bool appendComma = false;
            foreach (Expression e in Values) {
                if (appendComma) {
                    writer.Write(',');
                    writer.Write(' ');
                } else {
                    appendComma = true;
                }

                e.Write(writer);
            }
            writer.Write(']');
        }

    }

    /// <summary>
    /// 表示一个对象常量。
    /// </summary>
    public class DictLiteral : Literal {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 表示 DictionaryLiteral 的 键/值 属性对。
        /// </summary>
        public class Property : Node {

            /// <summary>
            /// 获取属性的键。
            /// </summary>
            public Expression Key {
                get;
                set;
            }

            /// <summary>
            /// 获取属性的值。
            /// </summary>
            public Expression Value {
                get;
                set;
            }

            public override Location StartLocation {
                get {
                    return Key.EndLocation;
                }
                set {
                    Key.EndLocation = value;
                }
            }

            public override Location EndLocation {
                get {
                    return Value.EndLocation;
                }
                set {
                    Value.EndLocation = value;
                }
            }

            public override void Write(IndentedTextWriter writer) {
                Key.Write(writer);
                writer.Write(':');
                writer.Write(' ');
                Value.Write(writer);
            }

            //[System.Diagnostics.DebuggerStepThrough]
            //public override void Accept(IAstVisitor visitor) {
            //    visitor.VisitProperty(this);
            //}

            //public override void GenerateC(IndentedTextWriter writer) {

            //}
        }

        /// <summary>
        /// 获取值。
        /// </summary>
        public List<Property> Values {
            get;
            set;
        }

        /// <summary>
        /// 将当前节点写入指定的 IndentedTextWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public override void Write(IndentedTextWriter writer) {
            writer.Write('[');
            bool appendComma = false;
            foreach (Property p in Values) {
                if (appendComma) {
                    writer.Write(',');
                    writer.Write(' ');
                } else {
                    appendComma = true;
                }

                p.Write(writer);
            }


            writer.Write(']');
        }

        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitObjectLiteral(this);
        //}

    }

    /// <summary>
    /// 表示一个函数表达式。
    /// </summary>
    public class FunctionLiteral : Literal, IScope {

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取结束位置。
        /// </summary>
        /// <value></value>
        public override Location EndLocation {
            get;
            set;
        }

        public bool Conditional {
            get;
            set;
        }

        /// <summary>
        /// 获取主体。
        /// </summary>
        public List<Statement> Statements {
            get;
            set;
        }

        public override void Write(IndentedTextWriter writer) {
            if (Conditional) {
                writer.Write('|');
            }


            writer.WriteLine('{');
            writer.Indent++;

            foreach(Statement s in Statements){
                writer.Write(s);
            }

            writer.Indent--;
            writer.Write('}');
        }

        //#endregion


        //[System.Diagnostics.DebuggerStepThrough]
        //public override void Accept(IAstVisitor visitor) {
        //    visitor.VisitFunctionExpression(this);
        //}

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

    #endregion

}
