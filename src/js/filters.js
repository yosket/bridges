'use strict';

app.filter('deleteDomain', ['Website', function(Website) {
	return function(input) {
		var result = input.replace(Website.top, '');
		return result ? result : Website.top;
	};
}]);
