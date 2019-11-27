var storage = window.localStorage;// 本地数据

// 获取参数
var paramStr = window.location.search.replace('?', '');
var paramArray = paramStr.split('&');
var paramMap = {};
for (var i = 0; i < paramArray.length; i++) {
	var mapStr = paramArray[i];
	if (mapStr.length > 0) {
		var key = mapStr.match(/(\S*)=/)[1]; // 截取=之前的内容
		var value = mapStr.match(/=(\S*)/)[1]; // 截取=之后的内容
		paramMap[key] = value;
	}
}

// 根据param获取指定参数
function getParameter(param) {
	return paramMap[param];
}
