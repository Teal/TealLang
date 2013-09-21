using System;
using TeaScript.CodeDom;
namespace TeaScript.Parser {

    /// <summary>
    /// 表示一个用于显示错误信息的工具类。
    /// </summary>
    public interface IErrorReporter {

        void Error(string message, Location startLocation, Location endLocation);

        void Warning(string message, Location startLocation, Location endLocation);

        void WarningStrict(string message, Location startLocation, Location endLocation);

        void Clear();

        int WarningCount {
            get;
        }

        int ErrorCount {
            get;
        }
    }
}
