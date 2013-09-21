class DateTime {

	DateTime {
	
		// DateTime(value) => DateTime(value: value)
		if(@.length == 1 || ?@value) {
			this._data = @value;
		
		// DateTime(year, month, ...) => DateTime(year: year, month: month, ...)
		} else {
			this._data = @year:1970 + @month:0 + @day:0 + @hour:0 + @minute:0 + @second:0;
		}
	}
	
	add {
		if(?@year){
			@month = @year * 12;
		}
		
		if(?@month){
			
		}
	
	}
	
	daysInMonth {
		
	
	}
	
	_get {
	
	}
	
	get day {
	
	}

	operator + {
	
	}
}