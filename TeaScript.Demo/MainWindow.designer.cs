namespace TeaScript.Demo {
    partial class MainWindow {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing) {
            if (disposing && (components != null)) {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent() {
            this.menuStrip1 = new System.Windows.Forms.MenuStrip();
            this.语法ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.词法ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.splitContainer1 = new System.Windows.Forms.SplitContainer();
            this.rtbSourceCode = new System.Windows.Forms.RichTextBox();
            this.menuStrip1.SuspendLayout();
            this.splitContainer1.Panel1.SuspendLayout();
            this.splitContainer1.SuspendLayout();
            this.SuspendLayout();
            // 
            // menuStrip1
            // 
            this.menuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.语法ToolStripMenuItem,
            this.词法ToolStripMenuItem});
            this.menuStrip1.Location = new System.Drawing.Point(0, 0);
            this.menuStrip1.Name = "menuStrip1";
            this.menuStrip1.Size = new System.Drawing.Size(836, 25);
            this.menuStrip1.TabIndex = 0;
            this.menuStrip1.Text = "menuStrip1";
            // 
            // 语法ToolStripMenuItem
            // 
            this.语法ToolStripMenuItem.Name = "语法ToolStripMenuItem";
            this.语法ToolStripMenuItem.Size = new System.Drawing.Size(44, 21);
            this.语法ToolStripMenuItem.Text = "语法";
            this.语法ToolStripMenuItem.Click += new System.EventHandler(this.语法ToolStripMenuItem_Click);
            // 
            // 词法ToolStripMenuItem
            // 
            this.词法ToolStripMenuItem.Name = "词法ToolStripMenuItem";
            this.词法ToolStripMenuItem.Size = new System.Drawing.Size(44, 21);
            this.词法ToolStripMenuItem.Text = "词法";
            this.词法ToolStripMenuItem.Click += new System.EventHandler(this.词法ToolStripMenuItem_Click);
            // 
            // splitContainer1
            // 
            this.splitContainer1.DataBindings.Add(new System.Windows.Forms.Binding("SplitterDistance", global::TeaScript.Demo.Properties.Settings.Default, "SplitterDistance", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
            this.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.splitContainer1.Location = new System.Drawing.Point(0, 25);
            this.splitContainer1.Name = "splitContainer1";
            // 
            // splitContainer1.Panel1
            // 
            this.splitContainer1.Panel1.Controls.Add(this.rtbSourceCode);
            this.splitContainer1.Size = new System.Drawing.Size(836, 503);
            this.splitContainer1.SplitterDistance = global::TeaScript.Demo.Properties.Settings.Default.SplitterDistance;
            this.splitContainer1.TabIndex = 1;
            // 
            // rtbSourceCode
            // 
            this.rtbSourceCode.AcceptsTab = true;
            this.rtbSourceCode.DataBindings.Add(new System.Windows.Forms.Binding("Text", global::TeaScript.Demo.Properties.Settings.Default, "RichTextBoxText", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
            this.rtbSourceCode.Dock = System.Windows.Forms.DockStyle.Fill;
            this.rtbSourceCode.Font = new System.Drawing.Font("Courier New", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.rtbSourceCode.HideSelection = false;
            this.rtbSourceCode.Location = new System.Drawing.Point(0, 0);
            this.rtbSourceCode.Name = "rtbSourceCode";
            this.rtbSourceCode.Size = new System.Drawing.Size(457, 503);
            this.rtbSourceCode.TabIndex = 0;
            this.rtbSourceCode.Text = global::TeaScript.Demo.Properties.Settings.Default.RichTextBoxText;
            this.rtbSourceCode.WordWrap = false;
            // 
            // MainWindow
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(836, 528);
            this.Controls.Add(this.splitContainer1);
            this.Controls.Add(this.menuStrip1);
            this.MainMenuStrip = this.menuStrip1;
            this.Name = "MainWindow";
            this.Text = "TeaLanguage";
            this.menuStrip1.ResumeLayout(false);
            this.menuStrip1.PerformLayout();
            this.splitContainer1.Panel1.ResumeLayout(false);
            this.splitContainer1.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.MenuStrip menuStrip1;
        private System.Windows.Forms.SplitContainer splitContainer1;
        private System.Windows.Forms.RichTextBox rtbSourceCode;
        private System.Windows.Forms.ToolStripMenuItem 语法ToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem 词法ToolStripMenuItem;

    }
}