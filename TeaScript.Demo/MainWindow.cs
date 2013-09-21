using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using TeaScript.CodeDom;
using TeaScript.Parser;

namespace TeaScript.Demo {
    public partial class MainWindow : Form {
        public MainWindow() {
            InitializeComponent();
        }

        void Select(Location start, Location end) {
            int startPos = rtbSourceCode.GetFirstCharIndexFromLine(start.Line - 1) + start.Column - 1;
            int endPos = rtbSourceCode.GetFirstCharIndexFromLine(end.Line - 1) + end.Column - 1;
            rtbSourceCode.Select(startPos, endPos - startPos);
        }

        sealed class TokenListItem {
            public string Value;
            public Location StartLocation;
            public Location EndLocation;
            public TokenListItem(Token token) {
                Value = "[" + token.Type.ToString() + "]  " + token.ToString();
                StartLocation = token.StartLocation;
                EndLocation = token.EndLocation;
            }
            public override string ToString() {
                return Value;
            }
        }

        private void 词法ToolStripMenuItem_Click(object sender, EventArgs e) {
            TeaScript.Demo.Properties.Settings.Default.Save();
            ListBox listBox = new ListBox() {
                Dock = DockStyle.Fill
            };
            listBox.SelectedIndexChanged += listBox_SelectedIndexChanged;
            listBox.Click += listBox_SelectedIndexChanged;

            splitContainer1.Panel2.Controls.Clear();
            splitContainer1.Panel2.Controls.Add(listBox);
            listBox.SuspendLayout();

            Lexer lexer = new Lexer(new StringReader(rtbSourceCode.Text));
            while (lexer.Read().Type != TokenType.EOF) {
                listBox.Items.Add(new TokenListItem(lexer.Current));
            }
            listBox.ResumeLayout();
        }

        void listBox_SelectedIndexChanged(object sender, EventArgs e) {
            TokenListItem t = (TokenListItem)((ListBox)sender).SelectedItem;
            if (t != null)
                Select(t.StartLocation, t.EndLocation);
        }

        private void 语法ToolStripMenuItem_Click(object sender, EventArgs e) {
            TeaScript.Demo.Properties.Settings.Default.Save();
            Parser.Parser parser = new Parser.Parser();
            Module module = parser.ParseString(rtbSourceCode.Text);

            TreeView treeView = new TreeView(){
                Dock = DockStyle.Fill
            };

            treeView.AfterSelect += treeView_AfterSelect;

            splitContainer1.Panel2.Controls.Clear();
            splitContainer1.Panel2.Controls.Add(treeView);
            treeView.SuspendLayout();
            DrawTreeNode(treeView.Nodes.Add(""), module);
            treeView.ResumeLayout();
        }

        void treeView_AfterSelect(object sender, TreeViewEventArgs e) {
            Node node = (Node)e.Node.Tag;
            if (node != null) {
                Select(node.StartLocation, node.EndLocation);
            }
        }

        void DrawTreeNode(TreeNode treeNode, Node codeNode) {
            System.Type type = codeNode.GetType();
            treeNode.Text += String.Format("[{0}]  {1}", type.Name, codeNode);
            treeNode.Tag = codeNode;
            if (codeNode is IScope) {
                foreach (Statement s in ((IScope)codeNode).Statements) {
                    DrawTreeNode(treeNode.Nodes.Add(""), s);
                }

                treeNode.Expand();
            } else {

                foreach (System.Reflection.PropertyInfo p in type.GetProperties()) {

                    if (p.Name == "IsInlineable" || p.Name == "HasSideEffects" || p.Name == "IsEmpty" || p.Name == "StartLocation" || p.Name == "EndLocation" || p.Name == "MissingSemicolon") {
                        continue;
                    }

                    object value = p.GetValue(codeNode, null);

                    if (value is Node) {
                        DrawTreeNode(treeNode.Nodes.Add(p.Name + " = "), (Node)value);

                      //  treeNode.Expand();
                    } else if (value is System.Collections.IEnumerable && !(value is string)) {
                        TreeNode n = treeNode.Nodes.Add(p.Name);
                        foreach (object item in (System.Collections.IEnumerable)value) {
                            if (item is Node) {
                                DrawTreeNode(n.Nodes.Add(""), (Node)item);

                          //      n.Expand();
                            } else {
                                n.ForeColor = Color.Gray;
                                n.Nodes.Add(item.ToString()).ForeColor = Color.Gray;
                            }
                        }

                    } else {
                        treeNode.Nodes.Add(p.Name + " = " + (value == null ? "null" : value.ToString())).ForeColor = Color.Gray;
                    }

                }


            }

        }

    }
}
