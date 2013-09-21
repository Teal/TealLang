using System;
using System.Collections.Generic;
using System.Text;
using TeaScript.CodeDom;

namespace TeaScript.Parser {

    /// <summary>
    /// 默认的使用控制台的错误报告工具。
    /// </summary>
    public class DefaultErrorReporter : IErrorReporter {

        public void Error(string message, Location startLocation, Location endLocation) {
            ErrorCount++;
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[Error]{0} @Line {1},{2}", message, startLocation.Line, startLocation.Column);
            Console.ResetColor();
        }

        public void Warning(string message, Location startLocation, Location endLocation) {
            WarningCount++;
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[Warning]{0} @Line {1},{2}", message, startLocation.Line, startLocation.Column);
            Console.ResetColor();
        }

        public void WarningStrict(string message, Location startLocation, Location endLocation) {
            WarningCount++;
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[Strict]{0} @Line {1},{2}", message, startLocation.Line, startLocation.Column);
            Console.ResetColor();
        }

        public void Clear() {
            WarningCount = ErrorCount = 0;
            Console.Clear();
        }

        public int WarningCount {
            get;
            set;
        }

        public int ErrorCount {
            get;
            set;
        }

    }
}
