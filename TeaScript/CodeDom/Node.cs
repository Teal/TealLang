using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TeaScript.CodeDom {

    /// <summary>
    /// 为所有节点提供抽象基类。
    /// </summary>
    public abstract class Node {

        #region 成员

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public abstract Location StartLocation {
            get;
            set;
        }

        /// <summary>
        /// 获取或设置节点结束位置。
        /// </summary>
        public abstract Location EndLocation {
            get;
            set;
        }

        /// <summary>
        /// 表示当前节点为有意义的节点。
        /// </summary>
        public virtual bool HasSideEffects {
            get {
                return true;
            }
        }

        /// <summary>
        /// 判断当前语句是否为空语句。
        /// </summary>
        public virtual bool IsEmpty {
            get {
                return false;
            }
        }

        #endregion

        #region 输出

        /// <summary>
        /// 将当前节点写入指定的 CodeWriter 。
        /// </summary>
        /// <param name="writer">写入工具。</param>
        public abstract void Write(IndentedTextWriter writer);

        /// <summary>
        /// 返回表示当前 <see cref="T:System.Object"/> 的 <see cref="T:System.String"/>。
        /// </summary>
        /// <returns>
        /// 	<see cref="T:System.String"/>，表示当前的 <see cref="T:System.Object"/>。
        /// </returns>
        public override string ToString() {
            StringBuilder sb = new StringBuilder();
            IndentedTextWriter writer = new IndentedTextWriter(new StringWriter(sb));
            Write(writer);
            return sb.ToString();
        }

        #endregion

    }

}
