using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
 
namespace Test {
     
    class Program {
       

        private static string Foo1(dynamic param) {
            return "";
        }

        private static void Foo2() {
            dynamic param = new {
                a = "a"
            };
            var ret1 = Foo1(param);
            try {
                Console.WriteLine(ret1.Length);
            } catch (Exception e) {
                Console.WriteLine("At ret1:");
                Console.WriteLine(e.ToString());
            }
        }
 
        static void Main(string[] args) {
            Foo2();
            Console.Read();

        }

    }

}
