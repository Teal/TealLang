using System;
using System.Collections.Generic;
using System.Text;

namespace TeaScript.CodeDom {

    /// <summary>
    /// 表示一个执行的作用域。
    /// </summary>
    public interface IScope {

        /// <summary>
        /// 获取当前作用域所属的模块。
        /// </summary>
        Module Module {
            get;
        }

        /// <summary>
        /// 获取当前作用域的父作用域。
        /// </summary>
        IScope Parent {
            get;
            set;
        }

        /// <summary>
        /// 获取当前作用域内的全部语句。
        /// </summary>
        List<Statement> Statements {
            get;
        }

    }
}
