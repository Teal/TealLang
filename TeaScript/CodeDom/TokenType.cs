using System;
using System.Collections.Generic;
using System.Text;

namespace TeaScript.CodeDom {

    /// <summary>
    /// 列举了所有可用的标识符。
    /// </summary>
    public enum TokenType : byte {

        #region Control

        /// <summary>
        /// 表示流为空。 (EndOfFlow 简写)
        /// </summary>
        EOF,

        /// <summary>
        /// 非法字符。
        /// </summary>
        Illegal,

        #endregion

        #region Punctuations

        /// <summary>
        /// (
        /// </summary>
        LParam,

        /// <summary>
        /// )
        /// </summary>
        RParam,

        /// <summary>
        /// ]
        /// </summary>
        RBrack,

        /// <summary>
        /// }
        /// </summary>
        RBrace,

        /// <summary>
        /// :
        /// </summary>
        Colon,

        /// <summary>
        /// ;
        /// </summary>
        Semicolon,

        #endregion

        #region Identifier

        /// <summary>
        /// 标识符。
        /// </summary>
        Identifier,

        /// <summary>
        /// @标识符。
        /// </summary>
        AtIdentifier,

        /// <summary>
        /// ^标识符。
        /// </summary>
        OutIdentifier,

        #endregion

        #region Literal

        /// <summary>
        /// this
        /// </summary>
        This,

        /// <summary>
        /// base
        /// </summary>
        Base,

        /// <summary>
        /// arguments
        /// </summary>
        Arguments,

        /// <summary>
        /// undefined
        /// </summary>
        Undefined,

        /// <summary>
        /// null
        /// </summary>
        Null,

        /// <summary>
        /// true
        /// </summary>
        True,

        /// <summary>
        /// false
        /// </summary>
        False,

        /// <summary>
        /// 数字。
        /// </summary>
        Int,

        /// <summary>
        /// 数字。
        /// </summary>
        HexInt,

        /// <summary>
        /// 单浮点数字。
        /// </summary>
        Real,

        /// <summary>
        /// 字符串 ''。
        /// </summary>
        String,

        /// <summary>
        /// 字符串 ""。
        /// </summary>
        EscapedString,

        /// <summary>
        /// 字符串 ``。
        /// </summary>
        TemplateString,

        /// <summary>
        /// 字符串 ``。
        /// </summary>
        TemplateVarString,

        /// <summary>
        /// [
        /// </summary>
        LBrack,

        /// <summary>
        /// {
        /// </summary>
        LBrace,

        #endregion

        #region Unary

        /// <summary>
        /// await
        /// </summary>
        Await,

        /// <summary>
        /// !
        /// </summary>
        Not,

        /// <summary>
        /// ++
        /// </summary>
        Inc,

        /// <summary>
        /// --
        /// </summary>
        Dec,

        /// <summary>
        /// ?
        /// </summary>
        Conditional,

        #endregion

        #region Binary

        /// <summary>
        /// +
        /// </summary>
        Add,

        /// <summary>
        /// -
        /// </summary>
        Sub,

        /// <summary>
        /// *
        /// </summary>
        Mul,

        /// <summary>
        /// &amp;
        /// </summary>
        VarAnd,

        /// <summary>
        /// /
        /// </summary>
        Div,

        /// <summary>
        /// %
        /// </summary>
        Mod,

        /// <summary>
        /// &lt;
        /// </summary>
        Lt,

        /// <summary>
        /// &gt;
        /// </summary>
        Gt,

        /// <summary>
        /// &lt;=
        /// </summary>
        Lte,

        /// <summary>
        /// &gt;=
        /// </summary>
        Gte,

        /// <summary>
        /// as
        /// </summary>
        As,

        /// <summary>
        /// is
        /// </summary>
        Is,

        /// <summary>
        /// ==
        /// </summary>
        Eq,

        /// <summary>
        /// !=
        /// </summary>
        Ne,

        /// <summary>
        /// |
        /// </summary>
        VarOr,

        /// <summary>
        /// &amp;&amp;
        /// </summary>
        And,

        /// <summary>
        /// ||
        /// </summary>
        Or,

        /// <summary>
        /// or
        /// </summary>
        OrReturn,

        /// <summary>
        /// ~
        /// </summary>
        To,

        /// <summary>
        /// ,
        /// </summary>
        Comma,

        #endregion

        #region Assign

        /// <summary>
        /// =
        /// </summary>
        Assign,

        /// <summary>
        /// =&gt;
        /// </summary>
        AssignTo,

        /// <summary>
        /// :=
        /// </summary>
        AssignCopy,

        /// <summary>
        /// +=
        /// </summary>
        AssignAdd,

        /// <summary>
        /// -=
        /// </summary>
        AssignSub,

        /// <summary>
        /// *=
        /// </summary>
        AssignMul,

        /// <summary>
        /// /=
        /// </summary>
        AssignDiv,

        /// <summary>
        /// %=
        /// </summary>
        AssignMod,

        #endregion

        #region Call

        /// <summary>
        /// .
        /// </summary>
        Period,

        /// <summary>
        /// ..
        /// </summary>
        PeriodChain,

        #endregion

        #region Keywords

        /// <summary>
        /// &gt;&gt;
        /// </summary>
        Trace,

        /// <summary>
        /// assert
        /// </summary>
        Assert,

        /// <summary>
        /// yield
        /// </summary>
        Yield,

        /// <summary>
        /// import
        /// </summary>
        Import,

        /// <summary>
        /// return
        /// </summary>
        Return,

        /// <summary>
        /// throw
        /// </summary>
        Throw,

        /// <summary>
        /// break
        /// </summary>
        Break,

        /// <summary>
        /// continue
        /// </summary>
        Continue,

        /// <summary>
        /// goto
        /// </summary>
        Goto,

        /// <summary>
        /// if
        /// </summary>
        If,

        /// <summary>
        /// else
        /// </summary>
        Else,

        /// <summary>
        /// switch
        /// </summary>
        Switch,

        /// <summary>
        /// case
        /// </summary>
        Case,

        /// <summary>
        /// for
        /// </summary>
        For,

        /// <summary>
        /// try
        /// </summary>
        Try,

        /// <summary>
        /// catch
        /// </summary>
        Catch,

        /// <summary>
        /// finally
        /// </summary>
        Finally,

        /// <summary>
        /// let
        /// </summary>
        Let,

        /// <summary>
        /// lock
        /// </summary>
        Lock,

        #endregion

        #region Declarations

        /// <summary>
        /// class
        /// </summary>
        Class,

        /// <summary>
        /// struct
        /// </summary>
        Struct,

        /// <summary>
        /// enum
        /// </summary>
        Enum,

        /// <summary>
        /// interface
        /// </summary>
        Interface,

        /// <summary>
        /// namespace
        /// </summary>
        Namespace,

        /// <summary>
        /// extend
        /// </summary>
        Extend,

        #endregion

        #region Comments

        /// <summary>
        /// DocComment
        /// </summary>
        DocComment,

        /// <summary>
        /// //
        /// </summary>
        SingleLineComment,

        /// <summary>
        /// /*
        /// </summary>
        MultiLineComment,

        /// <summary>
        /// ///
        /// </summary>
        SingleLineDocComment,

        /// <summary>
        /// /**
        /// </summary>
        MultiLineDocComment,

        #endregion

    }

}
