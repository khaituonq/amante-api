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

	
	mybatisMapper.createMapper([ './sql-log-customer.xml' ]);
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

async function f10_log_insert_click (req, res) {
	
	var param = {};
	var paramIP = {};
	var log_date = decodeURIComponent(req.body.log_date); if (log_date == null || log_date == "" || log_date == "undefined" || log_date == undefined) log_date = "";
	var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
	var session_id = decodeURIComponent(req.body.session_id); if (session_id == null || session_id == "" || session_id == "undefined" || session_id == undefined) session_id = "";
	var click_div = decodeURIComponent(req.body.click_div); if (click_div == null || click_div == "" || click_div == "undefined" || click_div == undefined) click_div = "";
	var click_value = decodeURIComponent(req.body.click_value); if (click_value == null || click_value == "" || click_value == "undefined" || click_value == undefined) click_value = "";
	var page_url = decodeURIComponent(req.body.page_url); if (page_url == null || page_url == "" || page_url == "undefined" || page_url == undefined) page_url = "";
	var ip = decodeURIComponent(req.body.ip); if (ip == null || ip == "" || ip == "undefined" || ip == undefined) ip = null;

	if(session_id != null){
		paramIP.log_date = log_date;
		paramIP.ip = ip;
		paramIP.session_id = session_id;
		var sql = mybatisMapper.getStatement('log-customer', 'insert_ip', paramIP, fm);


		await pool.query(sql)
	}

    param.log_date = log_date;
	param.user_id = user_id;
	param.session_id = session_id;
	param.click_div = click_div;
	param.click_value = click_value;
	param.page_url = page_url;

    await pool.query(mybatisMapper.getStatement('log-customer', 'insert_click', param, fm))
    res.send({message: 'success'})
}
module.exports.f10_log_insert_click = f10_log_insert_click

async function f10_log_insert_time (req, res) {
	
	var param = {};

	var log_date = decodeURIComponent(req.body.log_date); if (log_date == null || log_date == "" || log_date == "undefined" || log_date == undefined) log_date = "";
	var staytime_sec = decodeURIComponent(req.body.staytime_sec); if (staytime_sec == null || staytime_sec == "" || staytime_sec == "undefined" || staytime_sec == undefined) staytime_sec = "";
	var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
	var session_id = decodeURIComponent(req.body.session_id); if (session_id == null || session_id == "" || session_id == "undefined" || session_id == undefined) session_id = "";
	var page_url = decodeURIComponent(req.body.page_url); if (page_url == null || page_url == "" || page_url == "undefined" || page_url == undefined) page_url = "";

    param.log_date = log_date;
	param.staytime_sec = staytime_sec;
	param.user_id = user_id;
	param.session_id = session_id;
	param.page_url = page_url;

	// var sql = "";
//  sql = mybatisMapper.getStatement('log-customer', 'insert_staytime', param, fm);

    await pool.query(mybatisMapper.getStatement('log-customer', 'insert_staytime', param, fm))
	
    res.send({message: 'success'})
}
module.exports.f10_log_insert_time = f10_log_insert_time