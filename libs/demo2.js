
class Sample {

	main {
		a = [@p + 3, null].length;
		b = this.fn(a);
		if(a){
			for(b = 3;b < 100; b++){
				c = 4;
				break;
			}
		} else {
			for(b < 100){
				c = 4;
			}
		}
		
		gn = {
			return b;
		}
		
		c = gn();
		return c;
	}
	
	fn(String value) {
		return value + 1;
	}

}


Sample.main();

a = 1; 
b = 2;
s = 'plain text with no escape, use '' inside.' + "support $a,text with \ escape except \"" + `support $,text with \ escape except \``;
c = a + b - a * b / a == b != a <= b >= a < b > a & b && a | null || !b | ?c ? false : true;
c += c *= c /=c &= c |= c &&= c ||= c;
d = [];
obj = [aaa:44, kkkkk:333];
g = d.length;
gg = dd..length;
e = d is Array;
f = d as Array;
fn = {};
g = fn() or null;
%fn();
gn = %{};

{};
aaa:{};
require path;
require ./path;
if(a){}else{}
for(;0;){};
for(0){};
goto aaa;
1=>a;
fn = {
	fnff = {
		out.@param4;
	};
	fnff(@param: 7);
};
fn(param: 4, param4: 6, outp=>g);



// 1. 常量
num: 1  -1.
string:  'plain text with no escape, use '' inside.'      "support $,text with \ escape except \""          `support $,text with \ escape except \``
speceil:  this   base null true false  [/*array*/]     {/*function*/}

// 2. 操作符

1 + 2
1 - 2
1 * 2
1 / 2
a == 2
a != 2
a <= 2
a >= 2
a < 2
a > 2
a & b    //  bool
a && b   //  if (a) b else a
a | b    //  bool
a || b   //  if (!a) b else a
!a       //  bool
?a       //  a is defined
a ? b : c    // if (a) b else c
+= -= *= /= &= |= &&= ||=
a.b
a[]
a .. b     // action with b and return a
a is String
a as String
a or null
%fn(); // ensure function is called once.

// 3. 变量和函数

a = 1
obj.a = ""  // define directly
fn = { Console.write(value)  }
fn = { 
	# doc comment
	valA # doc coment
	valB ?= "default value" # the doc
	Console.write(valB);
	Console.write(args[0]);
}
fn(
	args: 2
)

// 4. 语句

{}
if(a){}
switch(a){case 2: default:}
for(a){}
for(;;){}
break;
continue;
goto;
return;
a: {}


// 5. 类

A.base = Object;
A.staticFunc = {};
A.dynaticFunc = {this;};

// 6. 模块导入
require file.ext
ns = %file.ext%




a = 1;
a = 1+1;
a = [];
a = [0:44, 1:333];