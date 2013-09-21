using System;
using System.Collections.Generic;
using System.Text;

namespace TeaScript.CodeDom {

    /// <summary>
    /// 代表源码内的位置。
    /// </summary>
    [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Auto)]
    public struct Location : IEquatable<Location>, IComparable<Location> {

        #region 字段

        /// <summary>
        /// 获取或设置行号。 行号从 1 开始。 
        /// </summary>
        public int Line {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置列号。 列号从 1 开始。 
        /// </summary>
        public int Column {
            get;
            set;
        }

        #endregion

        #region 属性
	
        /// <summary>
        /// 表示一个无的位置。
        /// </summary>
        public static readonly Location Empty = new Location() { Line = 0, Column = 0 };

        /// <summary>
        /// 获取一个值，该值指示当前位置是不是空地址。
        /// </summary>
        public bool IsEmpty {
            get {
                return Line == 0 && Column == 0;
            }
        }

        #endregion

        #region 方法

        /// <summary>
        /// 新建行。
        /// </summary>
        public void NewLine() {
            Column = 1;
            Line++;
        }

        /// <summary>
        /// 重置行列。
        /// </summary>
        public void Reset(int line = 1, int column = 1) {
            Line = line;
            Column = column;
        }

        /// <summary>
        /// 返回该实例的完全限定类型名。
        /// </summary>
        /// <returns>
        /// 包含完全限定类型名的 <see cref="T:System.String"/>。
        /// </returns>
        public override string ToString() {
            return string.Format("Line {0},{1}", Line, Column);
        }

        /// <summary>
        /// 返回此实例的哈希代码。
        /// </summary>
        /// <returns>一个 32 位有符号整数，它是该实例的哈希代码。</returns>
        public override int GetHashCode() {
            return unchecked((1 << sizeof(int)) * Line.GetHashCode() ^ Column.GetHashCode());
        }

        /// <summary>
        /// 指示此实例与指定对象是否相等。
        /// </summary>
        /// <param name="obj">要比较的另一个对象。</param>
        /// <returns>
        /// 如果 <paramref name="obj"/> 和该实例具有相同的类型并表示相同的值，则为 true；否则为 false。
        /// </returns>
        public override bool Equals(object obj) {
            if (!(obj is Location)) return false;
            return (Location)obj == this;
        }

        /// <summary>
        /// 指示此实例与指定对象是否相等。
        /// </summary>
        /// <param name="obj">要比较的另一个对象。</param>
        /// <returns>
        /// 如果 <paramref name="obj"/> 和该实例具有相同的类型并表示相同的值，则为 true；否则为 false。
        /// </returns>
        public bool Equals(Location other) {
            return this == other;
        }

        /// <summary>
        /// 获取当前对象和指定对象的差值。
        /// </summary>
        /// <param name="other">比较的对象。</param>
        /// <returns>如果当前值小，返回负数，相同，返回 0 。</returns>
        public int CompareTo(Location other) {
            if (this == other)
                return 0;
            if (this < other)
                return -1;
            else
                return 1;
        }

        #endregion

        #region 操作符重载

        /// <summary>
        /// 实现操作 operator ==。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator ==(Location a, Location b) {
            return a.Line == b.Line && a.Column == b.Column;
        }

        /// <summary>
        /// 实现操作 operator !=。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator !=(Location a, Location b) {
            return a.Line != b.Line || a.Column != b.Column;
        }

        /// <summary>
        /// 实现操作 operator &lt;。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator <(Location a, Location b) {
            if (a.Line < b.Line)
                return true;
            else if (a.Line == b.Line)
                return a.Column < b.Column;
            else
                return false;
        }

        /// <summary>
        /// 实现操作 operator &gt;。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator >(Location a, Location b) {
            if (a.Line > b.Line)
                return true;
            else if (a.Line == b.Line)
                return a.Column > b.Column;
            else
                return false;
        }

        /// <summary>
        /// 实现操作 operator &lt;=。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator <=(Location a, Location b) {
            return !(a > b);
        }

        /// <summary>
        /// 实现操作 operator &gt;=。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="b">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static bool operator >=(Location a, Location b) {
            return !(a < b);
        }

        /// <summary>
        /// 实现操作 operator +。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator +(Location a, int offset) {
            a.Column += offset;
            return a;
        }

        /// <summary>
        /// 实现操作 operator -。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator -(Location a, int offset) {
            a.Column -= offset;
            return a;
        }

        /// <summary>
        /// 实现操作 operator +。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator ++(Location a) {
            a.Column ++;
            return a;
        }

        /// <summary>
        /// 实现操作 operator -。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator --(Location a) {
            a.Column --;
            return a;
        }

        /// <summary>
        /// 实现操作 operator &gt;&gt;。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator >>(Location a,  int offset) {
            a.Line += offset;
            return a;
        }

        /// <summary>
        /// 实现操作 operator &lt;&lt;。
        /// </summary>
        /// <param name="a">要计算的第1个值。</param>
        /// <param name="offset">要计算的第2个值。</param>
        /// <returns>操作的结果。</returns>
        public static Location operator <<(Location a, int offset) {
            a.Line -= offset;
            return a;
        }

        #endregion
    }
}
