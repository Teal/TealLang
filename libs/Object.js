class Object {

	get type {
		return Native.typeOf(this);
	}

	get hash {
		return Native.getHash(this);
	}
	
	clone() {
		return Native.clone(this);
	}
	
	as String {
		return obj.type as String;
	}
	
	==(@value) {
		return Native.referenceEquals(this, @value);
	}
	
	!=(@value) {
		return !(this == @value);
	}
	
	>> {
		>> this as String
	}
	
}

class Member {
	
	get name {
		return Native.getMemberName(this);
	}
	
	get fullName {
		return Native.getMemberFullName(this);
	}
	
	get attributes {
		return Native.getAttributes(this);
	}

	as String {
		return this.fullName;
	}
	
}

class Type : Member {
	
	
	

}

class Class : Type {

}

class Scope {

}

interface ICollection {

	for?
	
	as Array {
		ret = Array(this.length);
		for(value, key in this) {
			ret[key] = value;
		}
		return value;
	}
	
	each(@do:Function, @where:Function, @order?, @desc?:Bool, @target?, @index?) {
		#@target Used in `@do(target: @target)`. 
		#@index Used in `@do(index: @index++)`. Set @index = 0 if @do want to known the current iterate count. 
	
		// Temp array to save all items that matches @where.
		ret = List(this.length);
		for(value, key in this){
			if(@where(value: value, key: key, target: @target | this) == true){
				ret.add(value);
			}
		}
		
		@order & ret.sort(order: @order);
		
		return ret.each(do: @do, desc: @desc, target: @target | this, index: @index);
	}
	
	each(@do:Function, @target?, @index?:Int) {
		for(value, key in this) {
			if((ret = @do(value: value, key: key, target: @target | this), index: @index & @index++)?) 
				return ret;
		}
	}
	
	each(@do:Function, @desc?:Bool, @target?, @index?) {
		if(@desc) {
			if(this.("get length")? && this.("get []")?) {
				for(i = this.length; --i >= 0; ) {
					if((ret = @do(value: this[i], key: i, index: @index & @index++, target: @target | this))?) 
						return ret;
				}
			} else {
				// Copy all items to a template array first.
				return (this as Array).each(do: @do, desc: true, target: @target | this, index: index);
			}
		}
		
		return this.each(do: @do, target: @target);
	}
	
	each(@do, @order, @desc?, @target?, @index?) {
		return (this as Array).sort(order: @order).each(do: @do, desc: @desc, target: @target | this, index: @index);
	}
	
	find(@where?, @select?, @order?, @desc?, @result?, @target?) {
		@result |= List(this.length);
		this.each(
			do: @select? ? @select is Function ? {
				result[@index] = @select(value: @value, key: @key, index: @index, target: @target);
			} : {
				result[@index] = @value.(@select);
			} : {
				result[@index] = @value;
			},
			where: @where,
			order: @order,
			desc: @desc,
			target: @target,
			index: 0
		);
		return @result;
	}
	
	find(@first, @where?, @select?, @order?, @desc?, @result?, @target?) {
		if(@first == true){
			return this.each(
				do: @select? ? @select is Function ? {
					return @select(value: @value, key: @key, index: @index, target: @target);
				} : {
					return @value.(@select);
				} : {
					return @value;
				},
				where: @where,
				order: @order,
				desc: @desc,
				target: @target
			);
		}
		return this.find(where: @where, select: @select, order: @order, desc: @desc, result: @result, target: @target);
	}
	
	indexOf(@value, @order?, @desc?){
		return this.indexOf(
			where:{
				return value == @value;
			},
			order: @order,
			desc: @desc
		);
	}
	
	indexOf(@where, @order?, @desc?, @target?){
		return this.each(
			do: {
				return @index;
			},
			where: @where,
			order: @order,
			desc: @desc,
			target: @target,
			index: 0
		) | -1;
	}
	
}

interface IList : ICollection {

	get length?
	
	set length?
	
	get []?
	
	set []?
	
	for {
		for(i = 0; i < this.length; i++) {
			yield this[i], i;
		}
	}
	
	add(@value) {
		this[this.length++] = @value;
	}
	
	add(@value, @at) {
		for(i = this.length++; i > @at; i--){
			this[i] = this[i - 1];
		}
		this[@at] = @value;
	}

	add(@values, @at = this.length) {
		for(value in @values){
			this.add(value: value, at: @at & @at++);
		}
	}
	
	reverse {
		
	}
	
	sort {
		
	}
	
	indexOf {
		
	}
	
	find {
	
	}
	
	
	
}

class List: IList {

	get capacity {
		return this._data.length;
	}
	
	set capacity {
		if(@value > this.capacity){
			this._updateCapacity(@value);
		}
	}
	
	_updateCapacity {
		data = Array(@value);
		this._data.copyTo(to: data, fromLength: this.length);
		this._data = data;
	}

	List {
		this._data = @data | Array(length: this.length = @length | 0, itemType: @itemType);
	}
	
	add(@value, @at = this.length) {
		if(++this.length == this.capacity){
			this._updateCapacity(this.capacity == 0 ? 4 : this.capacity * 2);
		}
		if(?@at) {
			this._data.copyTo(to: this._data, fromStart: @at, toStart: @at + 1, length: this.length - @at);
		}
		this._data[@at] = @value;
	}
	
	add(@values, @at = this.length) {
	
		// If length is known, use fast copy.
		if(@values.length?) {
			if(@values.length > 0){
			
				if((this.length += @values.length) >= this.capacity){
					// this._updateCapacity(Math.max(this.length, this.capacity * 2));
					this._updateCapacity(this.length);
				}
				
				if(@at?) {
					this._data.copyTo(to: this._data, fromStart: @at, toStart: @at + @values.length, length: this.length - @at);
				}
				
				if(@values.copyTo) {
					@values.copyTo(to: this._data, toStart: @at);
				} else {
					for(value in @values){
						this._data[@at++] = value;
					}
				}
			}
		} else {
			base.add(@);
		}
	}
	
	remove(@at) {
		this._data.copyTo(to: this._data, fromStart: @at, toStart: @at - 1);
		this._data[--this.length] = null;
	}
	
	remove(@start, @length) {
		this._data.copyTo(to: this._data, fromStart: @at, toStart: @at - @length);
		this._data.clear(start: this.length -= @length);
	}
	
	remove(@start, @end) {
		return this.remove(start: @start, length: @end - @start);
	}
	
	remove(@length, @end) {
		return this.remove(start: @end - @length, length: @length);
	}
	
	remove(@where){
		len = 0;
		for(i = 0; i < this.length; i++){
			if(@where(value: this._data[i], key: i, target: this._data) != true) {
				this._data[len++] = this._data[i];
			}
		}
		if(len <= this.length){
			this._data.clear(start: len);
			this.length = len;
			return true;
		}
		return false;
	}
	
	remove(@value){
		index = this.indexOf(@value);
		if(index >= 0){
			this.remove(at: index);
			return true;
		}
		return false;
	}
	
	get [] {
		return this._data[@];
	}
}


class Module : Scope {


}

class StaticArray {
	
	StaticArray(Object[] data, Int length) {
		this.%data = data;
		this.%length = length;
	}

	[](Int index) {
		return Native.ptrval(this.data, index);
	}
	
	each(Function do) {
		for(i = 0; i < this.length; i++){
			do(key: i, value: this[i]);
		}
	}
	
}

class String {

	#region Basic
	
	String(Native.type("char*") value) {
		this.%data = value;
		this.%length = Native.strlen(value);
	}
	
	String(Native.type("byte*") value) {
		this.%length = Native.strlen(@value);
		this.%data = Native.byteptrtostr(value, this.%length);
	}
	
	String(Native.type("char") value, Int length:0) {
		this.%data = value;
		this.%length = length;
	}
	
	clone() {
		return this;
	}
	
	+(String value) {
		if(value == null || value.length == 0){
			return this;
		}
		totolLength = this.length + value.length;
		data = Native.allocString(totolLength);
		Native.wstrcpy(Native.wstrcpy(data, this.data, this.length), value.data, value.length);
		return String(data, totolLength);
	}
	
	==(String value) {
		if(this.length != value.length){
			return true;
		}
		
		return Native.streq(this.data, value.data, this.length);
	}
	
	concat(String[] values) {
		totolLength = 0;
		values.each {
			totolLength += @value.length;
		};
		data = Native.allocString(totolLength);
		ret = String(data, totolLength);
		values.each {
			data = Native.wstrcpy(data, @value.data, @value.length);
		}
		return ret;
	}
	
	[](Int index) {
		return index >= 0 && index < this.length ? Native.charat(this.data, index) : '\0';
	}
	
	each = StaticArray.each
	
	#endregion
	
	equals(@value) {
		if(?@ignoreCase == true){
		}
		
		return this == value;
	}
	
}

struct DateTime {

	DateTime(Int value) {
		this.%data = value;
	}
	
	DateTime(Int year:1970, Int month:0,Int day:0, Int hour:0, Int minute:0, Int second:0) {
		this.%data = year + month + day + hour + minute + second;
	}
	
	add(Int year) {
	
	}
	
	add(Int month) {
	
	}
	
	daysInMonth {
		
	
	}
	
	get day {
	
	}

	+ {
	
	}
}

struct Number {

}

struct Int : Number {

}

struct BigInt : Int {

}

struct Decimal : Number {

}

struct Float : Number {

}

struct Byte {

}

struct Char {

}

struct Bool {

}

struct Null {

}

class Buffer {
	
}

namespace Math {


}

class Encoding {


}

class Regex {

	Regex(String pattern) {
		
	}

}

# 表示一个 FTP 服务器。
#
# 	FtpClient() => {
#		@ftp.open("localhost", 21, "userName", "password");
#		>> @ftp.getFiles()
#	}
class FtpClient {

	FtpClient{
		this.passive = @passive | true;
		this.connTimeout = @connTimeout | -1;
		this.openTimeout = @openTimeout | -1;
	}
	
	open(Url url) {
		return this.open(url.server, url.port, url.userName, url.password);
	}

	open {
		this._socket = Socket(server:@server, port:@port | 21, sendTimeout: this.openTimeout, receiveTimeout: this.connTimeout)..open() ;
		
		@userName & this.login(@userName, @password);
		
	}
	
	close = this._socket.close
	
	sendCommand {
		this._socket.send(@command + "\r\n");
	}
	
	dispose = this.close
	
	list {
	
	}
	
	login {
		
	}

}


namespace Console {

	write {
		@.each { Native.stdput(@value); }
		
		if(?@appendLine == true){
			Native.stdputline();
		}
	}
	
	read {
		if(?@key) {
			return @key = Native.stdkey(@intercept);
		}
	
	}

}

class Obj {

	value;
	
	fn{
		this.$vals = @gg;
	}

}

namespace Environment {
	
	get isWindows {
		return Native.getOS() === 1;
	}
	
	get isUnix {
		return Native.getOS() === 2;
	}
	
	get isMac {
		return Native.getOS() === 3;
	}
	
	newLine = Environment.isWindows ? "\r\n" : Environment.isMac ? "\r" : "\n"; 
	
	get exitCode {
		return Native.getExitCode();
	}
	
	set exitCode {
		return Native.getExitCode(@value);
	}
	
	get uptime {
		return Native.getUptime(@value);
	}
	
}

# 处理所有的路径。
namespace Path {

	dirSeparator = Environment.isWindows ? '/' : '\';
	
	altDirSeparator = Environment.isWindows ? '\' : '/';
	
	pathSeparator = Environment.isWindows ? ';' : '/';
	
	volumeSeparator = Environment.isWindows ? ':' : '/';
	
	maxLength = 260,

	isSeparator {
		return @value == Path.dirSeparator || @value == Path.altDirSeparator || @value == Path.volumeSeparatorChar;
	}

	changeExtension {
		extensionIndex = @path.indexOf(desc: true, value: '.', until: Path.isSeparator);
		@extension = @extension.prepend('.');
		return extensionIndex >= 0 ? @path.replace(start: extensionIndex, to: @extension) : (@path + @extension);
	}
	
	concat {
	
	}
	
	getDirName {
		return @path.substring(desc: true, end: {@value == Path.dirSeparator || @value == Path.altDirSeparator});
	}
	
	getExtension {
		return @path.substring(desc: true, start: '.', until: Path.isSeparator);
	/*
		return @path.each(
			desc: true,
			do: {
				if(@value == '.'){
					return @target.substring(@index);
				}
				
				if(@value == '/' || @value == '\' || @value == ':') {
					return '';
				}
			
			}
		) | '';
	 */
	}
	
	getFileName {
		return @path.substring(desc: true, start: Path.isSeparator);
	}
	
	getFileNameWithoutExtension {
		return @path.substring(desc: true, start: Path.isSeparator, end: '.');
	}
	
	getRandomFileName {
	
	}
	
	getTempFileName {
	
	}
	
	getTempPath {
	
	}
	
	hasExtension(@path, @extension) {
		return @path.endsWith(@extension.prepend('.'));
	}
	
	hasExtension {
		return @path.indexOf(desc: true, value: '.', until: Path.isSeparator) >= 0;
	}
	
	normalize {
	
	}
	
	resovle {
	
	}
	
	relative {
	
	}

}


class Dict {

	Dict {
		Native.initDict(this, @);
	}
	
	. {
		
	}

}


class File {

	

}


o = Obj();
o.fn();
