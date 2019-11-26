// 文章区域文本对象
var story;
var show;
// 拼图大小
var puzzleRow = getParameter("puzzleRow");
var puzzleCol = getParameter("puzzleCol");
var puzzleLevel = getParameter("puzzleLevel"); // 拼图难度等级
var puzzleTime = getParameter("puzzleTime"); // 拼图剩余时间
var puzzleTimeTotal = getParameter("puzzleTime"); // 拼图时间限制

// 获取文章内容并填充
var chapterObj = $.ajax({
	url: "chapter/chapter" + puzzleLevel + ".txt",
	async: false
});

var chapterTextLength = chapterObj.responseText.length;
var puzzleInnerHTML = ""; // 拼图的div代码
var puzzleIdx = 0; // 拼图编号
var puzzleStartFlag = 0; // 游戏开始标识 0:未开始;1:开始

// 取拼图中空格的位置
//var blankX = Math.floor(Math.random() * puzzleRow); // 空格X坐标
//var blankY = Math.floor(Math.random() * puzzleCol); // 空格Y坐标
var blankX; // 空格X坐标
var blankY; // 空格Y坐标

// 初始化拼图数组
var puzzleArray = new Array();
puzzleArray = puzzleInit(puzzleRow, puzzleCol);
var percent; // 拼图完成度

// 定时器
var wordTimerFlag = 0; // 文章定时器开关 0:关闭;1:开启
var wordTimer; // 文章定时器
var countDownTimer; // 倒计时定时器
var wordIdx = 0; // 当前显示文字下标
var wordMaxIdx = 0; // 当前可以显示到的文字下标
document.addEventListener("plusready", function() {
	// 注册返回按键事件 
	plus.key.addEventListener('backbutton', function() {
		// 事件处理 
		window.history.back();
	}, false);
});

// 交换拼图和空白的位置
function exchangePuzzle(puzzle, blank) {
	var puzzleTemp = puzzle.clone();
	var temp = $('<span/>');
	blank.before(temp);
	puzzle.replaceWith(blank);
	temp.replaceWith(puzzleTemp);
	percent = percentComplete(puzzleRow, puzzleCol); // 获取完成度
	wordMaxIdx = chapterTextLength * percent / 100 + 1; // 计算最大显示文字数
	$("#percent").text(percent + "%");

	// 判断完成度，展示文章
	if (percent > 0 && wordTimerFlag == 0) {
		wordTimerFlag = 1;
		wordTimer = setInterval(function() {
			if (wordIdx < wordMaxIdx) {
				show.html(story.html().substring(0, wordIdx));
				wordIdx++;
				var height = $("#show")[0].scrollHeight;
				$("#show").scrollTop(height);
				if (show.html() == story.html()) {
					clearInterval(wordTimer);
				}
			}
		}, 50);
	}

	// 完成度百分百停止倒计时
	if (percent == 100) {
		clearInterval(countdownTimer);
		var finishHTML =
			"<div  class='finishImg' style='position: relative; width: 100%; height: 100%;'><img style='width: 100%; height: 100%;filter: blur(0.5rem);' src='img/level" +
			puzzleLevel +
			"/0.jpg' /><div style='position: absolute; width: 100%; height: 100%; z-indent: 2; left: 0; top: 0;font-size: 3.5rem; text-align: center; color: white; font-weight: 600; font-family: naiyou'><div>恭喜，(๑•̀ㅂ•́)و✧点击继续</div></div></div>";
		$("#puzzle-inner").html(finishHTML);
		// 成功数据写入localStorage;
		storage.setItem('record' + puzzleLevel, $('#puzzleTime').text());
		// 添加完成记录以及成就
		if (puzzleTime >= puzzleTimeTotal / 2) {
			storage.setItem('achievement' + puzzleLevel, puzzleLevel + '_1');
		} else {
			var achievement = storage.getItem('achievement' + puzzleLevel);
			if (achievement != puzzleLevel + '_1') {
				storage.setItem('achievement' + puzzleLevel,  puzzleLevel + '_0');
			}
		}
		// 完成后的拼图点击事件
		$(".finishImg").on('touchstart', function() {
			if (percent == 100) {
				Notiflix.Confirm.Show('闯关成功',
					'你成功写完了一个充满Bug的小程序，可喜可贺。',
					'返回首页', '继续闯关',
					function() {
						window.location.href = 'index.html';
					},
					function() {
						window.location.href = 'chapter.html';
					});
				return;
			}
		});
	}

	// 如果游戏未开始，则开始倒计时
	if (puzzleStartFlag == 0) {
		countdownTimer = setInterval(function() {
			if (puzzleTime == 0) {
				Notiflix.Confirm.Show('闯关失败',
					'没有在规定时间内写完程序，非常遗憾。',
					'返回', '重新开始',
					function() {
						window.location.href = 'index.html';
					},
					function() {
						window.location.reload();
					});
				clearInterval(countdownTimer);
			} else {
				puzzleTime--;
				$('#puzzleTime').text(puzzleTime + "s");
			}
		}, 1000);
		puzzleStartFlag = 1;
	}
};

// 绑定拼图点击事件
function bindPuzzleClick(puzzle) {
	puzzle.on('touchstart', function() {
		percent = percentComplete(puzzleRow, puzzleCol); // 获取完成度

		var puzzleId = $(this).attr("id"); // 获取拼图ID
		var puzzleIdArray = puzzleId.split('_'); // 分割ID
		var puzzleX = Number(puzzleIdArray[1]); // 获取拼图X轴坐标
		var puzzleY = Number(puzzleIdArray[2]); // 获取拼图Y轴坐标

		if ((puzzleX + 1 == blankX && puzzleY == blankY) || (puzzleX == blankX && puzzleY + 1 == blankY) || (puzzleX -
				1 == blankX && puzzleY == blankY) || (puzzleX == blankX && puzzleY - 1 == blankY)) {
			exchangePuzzle($('#' + puzzleId).children(), $('#puzzle_' + blankX + '_' + blankY).children());
			// cssInit();
			blankX = puzzleX;
			blankY = puzzleY;
		}
	});
}

// 拼图初始化算法，可去除不可解拼图
function puzzleInit(puzzleRow, puzzleCol) {
	var data = new Array();
	var maxnumber = puzzleRow * puzzleCol - 1;
	for (var i = 0; i < maxnumber; ++i) {
		data[i] = i;
		var replacei = parseInt(Math.random() * (i + 1));
		var t = data[i];
		data[i] = data[replacei];
		data[replacei] = t;
	}
	data[maxnumber] = maxnumber;
	//计算逆序对数
	var coverPairCount = 0;
	for (var i = 0; i < maxnumber; ++i) {
		for (var j = i + 1; j < maxnumber; ++j) {
			if (data[i] > data[j])
				coverPairCount++;
		}
	}
	if ((coverPairCount & 1) == 1) {
		var t = data[maxnumber - 1];
		data[maxnumber - 1] = data[maxnumber - 2];
		data[maxnumber - 2] = t;
	}
	return data;
}

// 计算拼图完成度
function percentComplete(puzzleRow, puzzleCol) {
	var puzzleImg = $('.puzzle_div').children();
	var puzzleRightNum = 0; // 正确位置的拼图个数
	for (var i = 0; i < puzzleImg.length; i++) {
		if (puzzleImg[i].id == i + 1) {
			puzzleRightNum++;
		}
	}
	var percentComplete = puzzleRightNum / (puzzleRow * puzzleCol - 1) * 100;
	return percentComplete.toFixed(2);
}
