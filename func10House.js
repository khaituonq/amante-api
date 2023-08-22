var mysql = require("mysql2/promise");
var fs = require('fs');
const xlsx = require( "xlsx" );
var path = require('path');


//공통 함수용
var fc = require("./funcComm.js");




const mybatisMapper = require('mybatis-mapper');
var fm = {language: 'sql', indent: '  '};







var pageCnt = 25;			//페이지별 갯수
var pageCnt10 = 10;			//페이지별 갯수(10개씩)

var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_<>@\#$%&\\\=\(\'\"]/gi;			// , +  는... 제외했음.




//특수문자 변환
String.prototype.addSlashes = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

//특수문자 변환
String.prototype.EM = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	if(this == 'TRUE' || this == 'true' || this == true) return '1';
	else return '0';
};

//특수문자 변환
String.prototype.EM2 = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	if(this == 'NULL') return '';
	else return this;
};

//특수문자 변환
function EM3(data) {
	if(data =="1" || data == "0") return data;
	if(data == null) return null;
	if(data == false || data == "FALSE" || data == "false") return "'0'";
	else return "'1'";
}

//널체크
function isNullCheck(str) {
	if(str == null || str == "" || str == "null") return null;
	else return str;
}

var pool = null;

//DB 는 index.js 에서 가져온다.
function settingDb(poolConnect) {
	pool = poolConnect;

	//console.log("setting DB");
	fc.settingDb(pool);

	
	mybatisMapper.createMapper([ './sql-house-warming.xml' ]);
}
module.exports.settingDb = settingDb;




//숫자 null 여부 체크
function numF(num) {
	var numI = 0;
	if(num == null) {
		return 0;
	}
	if(num == "") {
		return 0;
	}
	
	try {
		numI = parseInt(num);
		//console.log("num : " + num  + " / numI : " + numI);
	} catch(err) {
		//console.log("err : " + err);
		return 0;
	}
	//console.log(typeof(numI) );
	
	return numI;
}


//랜덤 숫자 추출
var generateRandom = function (min, max) {
	var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
	return ranNum;
}


//000001 같은 채우기 형태 만들어주는 함수
function numberPad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}





// 두개의 날짜를 비교하여 차이를 알려준다.
function dateDiff(_date1, _date2) {
    var diffDate_1 = _date1 instanceof Date ? _date1 :new Date(_date1);
    var diffDate_2 = _date2 instanceof Date ? _date2 :new Date(_date2);
 
    diffDate_1 =new Date(diffDate_1.getFullYear(), diffDate_1.getMonth()+1, diffDate_1.getDate());
    diffDate_2 =new Date(diffDate_2.getFullYear(), diffDate_2.getMonth()+1, diffDate_2.getDate());
 
    var diff = (diffDate_2.getTime() - diffDate_1.getTime());
    diff = Math.ceil(diff / (1000 * 3600 * 24));
 
    return diff;
}

//랜덤 스트링(대문자1 + 숫자5)
function randomAString(string_length = 1) {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
	var randomstring = '';
	for (var i = 0 ; i < string_length ; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	//document.randform.randomfield.value = randomstring;
	return randomstring;
}


async function poolQuery(sql) {
	var [row] = await pool.query(sql);
}




Date.prototype.getWeek = function (dowOffset) {
	/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

	dowOffset = typeof(dowOffset) == 'number' ? dowOffset : 0; //default dowOffset to zero
	var newYear = new Date(this.getFullYear(),0,1);
	var day = newYear.getDay() - dowOffset; //the day of week the year begins on
	day = (day >= 0 ? day : day + 7);
	var daynum = Math.floor((this.getTime() - newYear.getTime() - (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
	var weeknum;
	//if the year starts before the middle of a week
	//console.log("daynum : " + daynum);
	if(day < 4) {
		weeknum = Math.floor((daynum+day-1)/7) + 1;
		if(weeknum > 52) {
			let nYear = new Date(this.getFullYear() + 1,0,1);
			let nday = nYear.getDay() - dowOffset;
			nday = nday >= 0 ? nday : nday + 7;
			/*if the next year starts before the middle of
			the week, it is week #1 of that year*/
			weeknum = nday < 4 ? 1 : 53;
		}
	} else {
		weeknum = Math.floor((daynum+day-1)/7);
	}
	return weeknum;
};


//excel 용 날짜형태 변경 함수
function formatDate(numb, format="-") {
    let time = new Date((numb - 1) * 24 * 3600000 + 1);
    time.setYear(time.getFullYear() - 70);
    let year = time.getFullYear() + '';
    let month = time.getMonth() + 1 + '';
    let date = time.getDate() + '';
    if(format && format.length === 1) {
        return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date);
    }
    return year+(month < 10 ? '0' + month : month)+(date < 10 ? '0' + date : date)
}



//길이를 제한 하는 보조 함수(100 글자 이상이면 100 글자이상을 귾고 ... 으로 표현)
function sub(txt, len) {
	if(txt == null) {
		return "";
	} else if(txt.length > len) {
		return txt.substr(0, len) + "...";
	} else {
		return txt;
	}
}




//자동화 함수 - cSql, sql 을 이용하여 목록 리턴
async function getList(req, res, cSql, sql, isLimit = true) {
	var page = req.query.page; if(page != null) page = page.trim(); else page = 1;
	page = parseInt(page);
	
	var pageCntL = req.query.pageCnt; if(pageCntL != null) pageCntL = pageCntL.trim(); else pageCntL = pageCnt;
	pageCntL = parseInt(pageCntL);
	
	var nCnt = (page-1) * pageCntL;
	if(nCnt < 0) nCnt = 0;

	var searchCnt = 0;

	var [row] = await pool.query(cSql);

	searchCnt = row[0].cnt;

	var js = {};

	js.success = true;
	js.message = "";
	js.errorCode = 0;
	js.data = [];
	js.page = page;
	js.total = 0;
	js.pageCnt = pageCntL;

	if(searchCnt <= 0) {
		//res.send(js);
	} else {
		if(sql.indexOf("limit") > 0) {
		} else {
			if(isLimit == true) {
				sql += " limit " + nCnt + ", " + pageCntL;
			}
		}
		var [row2] = await pool.query(sql);

		js.data = row2;
		js.total = searchCnt;
		//res.send(js);
	}
	//console.log("list");
	//console.log(js);


	return js;
}

//자동화 스케줄러 - 1개의 데이터를 리턴
async function getData(req, res, sql) {
	var [row] = await pool.query(sql);

	var js = {};

	js.success = true;
	js.message = "";
	js.errorCode = 0;
	if(row.length > 0) {
		js.data = row[0];
	} else {
		js.data = {};
	}
	//console.log(js);
	return js;
}


async function f10_house_get_list(req, res) {
	var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var order_by = decodeURIComponent(req.query.order_by); if (order_by == null || order_by == "" || order_by == "undefined" || order_by == undefined) order_by = "A";
    var row_count = decodeURIComponent(req.query.pageCnt); if (row_count == null || row_count == "" || row_count == "undefined" || row_count == undefined) row_count = 10;
    var start_num = 0;
    var sql = "";
    var param = { 
			row_count : row_count
			,start_num : start_num
			,order_by : order_by
	};

	var [total] = await pool.query(mybatisMapper.getStatement('house-warming', 'get_total', param, fm));

	sql = mybatisMapper.getStatement('house-warming', 'get_list', param, fm);
    var [row] = await pool.query(sql);
	
    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: row , total : total[0].count, pageCnt : row_count}));
}
module.exports.f10_house_get_list =  f10_house_get_list;

async function f10_house_get_total(req, res) {
	var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var row_count = decodeURIComponent(req.query.pageCnt); if (row_count == null || row_count == "" || row_count == "undefined" || row_count == undefined) row_count = 10;
    var start_num = 0;
    var sql = "";
    var param = { 
			row_count : row_count
			,start_num : start_num
	};
	sql = mybatisMapper.getStatement('house-warming', 'get_total', param, fm);
    var [row] = await pool.query(sql);
	
    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: row }));
}
module.exports.f10_house_get_total =  f10_house_get_total;

async function f10_house_get_view(req, res) {
	var event_seq = decodeURIComponent(req.query.event_seq); if (event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";
	// var top = decodeURIComponent(req.query.top); if (top == null || top == "" || top == "undefined" || top == undefined) top = "";
    if (event_seq == null || event_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "Large Code is empty!", errorCode: -100, data: null }));
        return;
    }
    var sql = "";
    var param = { event_seq: event_seq };
	sql = mybatisMapper.getStatement('house-warming', 'get_view', param, fm);
    var [row] = await pool.query(sql);
	
	

	var js = {};

	if(row != null && row.length > 0) {
		js = row[1][0];
	}

	param.sort = 'housewarming';
	param.event_seq = event_seq;
	param.ref_seq = event_seq;
	param.cust_seq = null;

	sql = mybatisMapper.getStatement('board', 'tip-user_like_yn', param, fm);
	var [rowU] = await pool.query(sql);
	
	if(rowU != null && rowU.length > 0) {
		js.like_yn = rowU[0].cnt;
	}
	
	param.top = 'Y';
	sql = mybatisMapper.getStatement('house-warming', 'get_relation_product_list', param, fm);
	var [rowR] = await pool.query(sql);
	if(rowR != null && rowR.length > 0) {
			js.top_relation = rowR;
	}

	param.top = 'N';
	
	sql = mybatisMapper.getStatement('house-warming', 'get_relation_product_list', param, fm);
	var [rowN] = await pool.query(sql);
	if(rowN != null && rowN.length > 0) {
			js.relation_list = rowN;
	}

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_house_get_view =  f10_house_get_view;


async function f10_house_get_list_comment(req, res) {
	var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var event_seq = decodeURIComponent(req.query.event_seq); if (event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";
	var sort = decodeURIComponent(req.query.sort); if (sort == null || sort == "" || sort == "undefined" || sort == undefined) sort = "";
    
	var row_count = 10;
    var start_num = (page - 1) * row_count;
    var sql = "";
    var param = { 
			row_count : row_count
			,start_num : start_num
			,event_seq : event_seq
			,sort : sort
	};
	sql = mybatisMapper.getStatement('house-warming', 'get_comment_list', param, fm);

    var [row] = await pool.query(sql);
	
    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: row }));
}
module.exports.f10_house_get_list_comment =  f10_house_get_list_comment;

async function f10_house_insert_comment (req, res) {
    await pool.query(mybatisMapper.getStatement('house-warming', 'insert_comment', req.body, fm))
    res.send({message: 'success'})
}

module.exports.f10_house_insert_comment = f10_house_insert_comment