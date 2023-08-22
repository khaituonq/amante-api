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

	
	mybatisMapper.createMapper([ './sql-board.xml' ]);
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





async function f10_board_index_winner_list(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'indexWinnerList', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_index_winner_list =  f10_board_index_winner_list;





async function f10_board_event_list_get(req, res) {
	var event_type = decodeURIComponent(req.query.event_type); if(event_type == null || event_type == "" || event_type == "undefined" || event_type == undefined) event_type = "";

	var event_state = decodeURIComponent(req.query.event_state); if(event_state == null || event_state == "" || event_state == "undefined" || event_state == undefined) event_state = "";

	




	var csql = "";
	var sql = "";


	var param = {event_type : event_type, event_state : event_state};

	csql = mybatisMapper.getStatement('board', 'eventCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'eventList', param, fm);

	//console.log(sql);

	var js = await fc.getList(req, res, csql, sql);



	var eStr = "";
	for(var n = 0 ; n < js.data.length ; n++) {
		eStr += " , '" + js.data[n].event_seq + "' ";
	}
	if(eStr != "") {
		eStr = eStr.substr(3);
		
		param = {eStr : eStr};
		sql = mybatisMapper.getStatement('board', 'eventRelationList', param, fm);

		var [rowR] = await pool.query(sql);
		for(var n = 0 ; n < js.data.length ; n++) {
			var relationList = [];

			for(var m = 0 ; m < rowR.length ; m++) {
				if(js.data[n].event_seq == rowR[m].event_seq) {
					relationList.push(rowR[m]);
				}
			}
			js.data[n].relationList = relationList;
		}
	}


	
	res.send(js);
}

module.exports.f10_board_event_list_get =  f10_board_event_list_get;






async function f10_board_event_after_list_get(req, res) {
	var event_seq = decodeURIComponent(req.query.event_seq); if(event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";
	

	
	if(event_seq == null || event_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"event_seq is empty!", errorCode:-100, data:null}));
		return;
	}


	var csql = "";
	var sql = "";


	var param = {event_seq : event_seq};

	csql = mybatisMapper.getStatement('board', 'eventAfterCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'eventAfterList', param, fm);



	var js = await fc.getList(req, res, csql, sql);

	
	res.send(js);
}

module.exports.f10_board_event_after_list_get =  f10_board_event_after_list_get;






async function f10_board_event_board_list_get(req, res) {
	var event_seq = decodeURIComponent(req.query.event_seq); if(event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";
	var admin_reply_yn = decodeURIComponent(req.query.admin_reply_yn); if(admin_reply_yn == null || admin_reply_yn == "" || admin_reply_yn == "undefined" || admin_reply_yn == undefined) admin_reply_yn = "";
	var winner_yn = decodeURIComponent(req.query.winner_yn); if(winner_yn == null || winner_yn == "" || winner_yn == "undefined" || winner_yn == undefined) winner_yn = "";
	

	
	if(event_seq == null || event_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"event_seq is empty!", errorCode:-100, data:null}));
		return;
	}


	var csql = "";
	var sql = "";


	var param = {event_seq : event_seq, admin_reply_yn:admin_reply_yn, winner_yn : winner_yn};

	csql = mybatisMapper.getStatement('board', 'eventBoardCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'eventBoardList', param, fm);


	var js = await fc.getList(req, res, csql, sql);

	
	res.send(js);
}

module.exports.f10_board_event_board_list_get =  f10_board_event_board_list_get;









async function f10_board_event_recomm_list_get(req, res) {
	var event_seq = decodeURIComponent(req.query.event_seq); if(event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";
	var event_board_seq = decodeURIComponent(req.query.event_board_seq); if(event_board_seq == null || event_board_seq == "" || event_board_seq == "undefined" || event_board_seq == undefined) event_board_seq = "";
	var admin_reply_yn = decodeURIComponent(req.query.admin_reply_yn); if(admin_reply_yn == null || admin_reply_yn == "" || admin_reply_yn == "undefined" || admin_reply_yn == undefined) admin_reply_yn = "";
	var user_id = decodeURIComponent(req.query.user_id); if(user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
	var user_nm = decodeURIComponent(req.query.user_nm); if(user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";
	var email = decodeURIComponent(req.query.email); if(email == null || email == "" || email == "undefined" || email == undefined) email = "";
	

	
	if(event_seq == null || event_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"event_seq is empty!", errorCode:-100, data:null}));
		return;
	}


	var csql = "";
	var sql = "";


	var param = {event_seq : event_seq, event_board_seq:event_board_seq, admin_reply_yn : admin_reply_yn, user_id:user_id, user_nm:user_nm, email:email};

	csql = mybatisMapper.getStatement('board', 'eventRecommCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'eventRecommList', param, fm);


	var js = await fc.getList(req, res, csql, sql);

	
	res.send(js);
}

module.exports.f10_board_event_recomm_list_get =  f10_board_event_recomm_list_get;
















async function f10_board_concept_room_list_get(req, res) {
	var brand_cd = decodeURIComponent(req.query.brand_cd); if(brand_cd == null || brand_cd == "" || brand_cd == "undefined" || brand_cd == undefined) brand_cd = "";
	var state = decodeURIComponent(req.query.state); if(state == null || state == "" || state == "undefined" || state == undefined) state = "";
	var house_type = decodeURIComponent(req.query.house_type); if(house_type == null || house_type == "" || house_type == "undefined" || house_type == undefined) house_type = "";
	var space = decodeURIComponent(req.query.space); if(space == null || space == "" || space == "undefined" || space == undefined) space = "";
	var style = decodeURIComponent(req.query.style); if(style == null || style == "" || style == "undefined" || style == undefined) style = "";
	var size = decodeURIComponent(req.query.size); if(size == null || size == "" || size == "undefined" || size == undefined) size = "";
	

	


	var csql = "";
	var sql = "";


	var param = {brand_cd : brand_cd, state:state, house_type : house_type, space:space, style:style, size:size};

	csql = mybatisMapper.getStatement('board', 'conceptRommCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'conceptRommList', param, fm);


	var js = await fc.getList(req, res, csql, sql);




	var crpStr = "";
	for(var n = 0 ; n < js.data.length ; n++) {
		crpStr += " , '" + js.data[n].concept_room_seq + "' ";
	}
	if(crpStr != "") {
		crpStr = crpStr.substr(3);
		
		param = {crpStr : crpStr};
		sql = mybatisMapper.getStatement('board', 'conceptRommProductList', param, fm);

		var [rowRP] = await pool.query(sql);
		for(var n = 0 ; n < js.data.length ; n++) {
			var productList = [];

			for(var m = 0 ; m < rowRP.length ; m++) {
				if(js.data[n].concept_room_seq == rowRP[m].concept_room_seq) {
					var sf = {};
					sf.seq									= rowRP[m].seq;
					sf.relation_product_cd					= rowRP[m].relation_product_cd;
					sf.relation_product_cd2					= rowRP[m].relation_product_cd2;
					sf.relation_product_cd3					= rowRP[m].relation_product_cd3;
					sf.relation_product_cd4					= rowRP[m].relation_product_cd4;
					sf.relation_product_cd5					= rowRP[m].relation_product_cd5;
					sf.position_x							= rowRP[m].position_x;
					sf.position_y							= rowRP[m].position_y;
					sf.position_x_pc						= rowRP[m].position_x_pc;
					sf.position_y_pc						= rowRP[m].position_y_pc;
					sf.file_nm1								= rowRP[m].file_nm1;
					productList.push(sf);
				}
			}
			js.data[n].productList = productList;
		}
	}

	
	res.send(js);
}

module.exports.f10_board_concept_room_list_get =  f10_board_concept_room_list_get;









async function f10_board_concept_room_recomm_list_get(req, res) {
	var concept_room_seq = decodeURIComponent(req.query.concept_room_seq); if(concept_room_seq == null || concept_room_seq == "" || concept_room_seq == "undefined" || concept_room_seq == undefined) concept_room_seq = "";
	var event_board_seq = decodeURIComponent(req.query.event_board_seq); if(event_board_seq == null || event_board_seq == "" || event_board_seq == "undefined" || event_board_seq == undefined) event_board_seq = "";
	var recomm_yn = decodeURIComponent(req.query.recomm_yn); if(recomm_yn == null || recomm_yn == "" || recomm_yn == "undefined" || recomm_yn == undefined) recomm_yn = "";
	var user_id = decodeURIComponent(req.query.user_id); if(user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
	var user_nm = decodeURIComponent(req.query.user_nm); if(user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";
	var email = decodeURIComponent(req.query.email); if(email == null || email == "" || email == "undefined" || email == undefined) email = "";
	

	
	if(concept_room_seq == null || concept_room_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"concept_room_seq is empty!", errorCode:-100, data:null}));
		return;
	}


	var csql = "";
	var sql = "";


	var param = {concept_room_seq : concept_room_seq, event_board_seq:event_board_seq, recomm_yn : recomm_yn, user_id:user_id, user_nm:user_nm, email:email};

	csql = mybatisMapper.getStatement('board', 'conceptRoomRecommCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'conceptRoomRecommList', param, fm);


	var js = await fc.getList(req, res, csql, sql);

	
	res.send(js);
}

module.exports.f10_board_concept_room_recomm_list_get =  f10_board_concept_room_recomm_list_get;









async function f10_board_housewarming_list_get(req, res) {
	var event_nm = decodeURIComponent(req.query.event_nm); if(event_nm == null || event_nm == "" || event_nm == "undefined" || event_nm == undefined) event_nm = "";
	var event_con = decodeURIComponent(req.query.event_con); if(event_con == null || event_con == "" || event_con == "undefined" || event_con == undefined) event_con = "";
	var site_gb = decodeURIComponent(req.query.site_gb); if(site_gb == null || site_gb == "" || site_gb == "undefined" || site_gb == undefined) site_gb = "";
	var event_type = decodeURIComponent(req.query.event_type); if(event_type == null || event_type == "" || event_type == "undefined" || event_type == undefined) event_type = "";
	var main_yn = decodeURIComponent(req.query.main_yn); if(main_yn == null || main_yn == "" || main_yn == "undefined" || main_yn == undefined) main_yn = "";

	// console.log(main_yn)

	var csql = "";
	var sql = "";


	var param = {event_nm : event_nm, event_con:event_con, site_gb : site_gb, event_type:event_type, main_yn: main_yn};

	csql = mybatisMapper.getStatement('board', 'housewarmingCount', param, fm);
	
	sql = mybatisMapper.getStatement('board', 'housewarmingList', param, fm);


	var js = await fc.getList(req, res, csql, sql);


	var eStr = "";
	for(var n = 0 ; n < js.data.length ; n++) {
		eStr += " , '" + js.data[n].event_seq + "' ";
	}

	
	if(eStr != "") {
		eStr = eStr.substr(3);
		
		param = {eStr : eStr};
		sql = mybatisMapper.getStatement('board', 'housewarmingRelationList', param, fm);

		var [rowR] = await pool.query(sql);
		for(var n = 0 ; n < js.data.length ; n++) {
			var relationList = [];

			for(var m = 0 ; m < rowR.length ; m++) {
				if(js.data[n].event_seq == rowR[m].event_seq) {
					relationList.push(rowR[m].relation_product_cd);
				}
			}
			js.data[n].relationList = relationList;
		}
	}

	
	res.send(js);
}

module.exports.f10_board_housewarming_list_get =  f10_board_housewarming_list_get;























async function f10_board_theme_list_get(req, res) {
	var theme_type = decodeURIComponent(req.query.theme_type); if(theme_type == null || theme_type == "" || theme_type == "undefined" || theme_type == undefined) theme_type = "";

	var theme_state = decodeURIComponent(req.query.theme_state); if(theme_state == null || theme_state == "" || theme_state == "undefined" || theme_state == undefined) theme_state = "";

	var site_gb = decodeURIComponent(req.query.site_gb); if(site_gb == null || site_gb == "" || site_gb == "undefined" || site_gb == undefined) site_gb = "";

	var main_yn = decodeURIComponent(req.query.main_yn); if(main_yn == null || main_yn == "" || main_yn == "undefined" || main_yn == undefined) main_yn = "";

	var shopping_yn = decodeURIComponent(req.query.shopping_yn); if(shopping_yn == null || shopping_yn == "" || shopping_yn == "undefined" || shopping_yn == undefined) shopping_yn = "";

	var gubun_yn = decodeURIComponent(req.query.gubun_yn); if(gubun_yn == null || gubun_yn == "" || gubun_yn == "undefined" || gubun_yn == undefined) gubun_yn = "";
	
	// console.log(req.query);




	var csql = "";
	var sql = "";


	var param = {theme_type : theme_type, theme_state : theme_state, site_gb : site_gb, main_yn : main_yn, shopping_yn : shopping_yn, gubun_yn : gubun_yn};

	csql = mybatisMapper.getStatement('board', 'themeCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'themeList', param, fm);



	var js = await fc.getList(req, res, csql, sql);



	var tStr = "";
	for(var n = 0 ; n < js.data.length ; n++) {
		tStr += " , '" + js.data[n].theme_seq + "' ";
	}
	if(tStr != "") {
		tStr = tStr.substr(3);
		
		param = {tStr : tStr};
		sql = mybatisMapper.getStatement('board', 'themeRelationList', param, fm);

		var [rowR] = await pool.query(sql);
		for(var n = 0 ; n < js.data.length ; n++) {
			var relationList = [];

			for(var m = 0 ; m < rowR.length ; m++) {
				if(js.data[n].theme_seq == rowR[m].theme_seq) {
					relationList.push(rowR[m]);
				}
			}
			js.data[n].relationList = relationList;
		}
	}


	
	res.send(js);
}

module.exports.f10_board_theme_list_get =  f10_board_theme_list_get;






async function f10_board_theme_recomm_list_get(req, res) {
	var theme_seq = decodeURIComponent(req.query.theme_seq); if(theme_seq == null || theme_seq == "" || theme_seq == "undefined" || theme_seq == undefined) theme_seq = "";
	var theme_board_seq = decodeURIComponent(req.query.theme_board_seq); if(theme_board_seq == null || theme_board_seq == "" || theme_board_seq == "undefined" || theme_board_seq == undefined) theme_board_seq = "";
	var recomm_yn = decodeURIComponent(req.query.recomm_yn); if(recomm_yn == null || recomm_yn == "" || recomm_yn == "undefined" || recomm_yn == undefined) recomm_yn = "";
	var user_id = decodeURIComponent(req.query.user_id); if(user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
	var user_nm = decodeURIComponent(req.query.user_nm); if(user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";
	var email = decodeURIComponent(req.query.email); if(email == null || email == "" || email == "undefined" || email == undefined) email = "";
	

	
	if(theme_seq == null || theme_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"theme_seq is empty!", errorCode:-100, data:null}));
		return;
	}


	var csql = "";
	var sql = "";


	var param = {theme_seq : theme_seq, theme_board_seq:theme_board_seq, recomm_yn : recomm_yn, user_id:user_id, user_nm:user_nm, email:email};

	csql = mybatisMapper.getStatement('board', 'themeRecommCount', param, fm);
	
	//console.log(csql);
	sql = mybatisMapper.getStatement('board', 'themeRecommList', param, fm);


	var js = await fc.getList(req, res, csql, sql);

	
	res.send(js);
}

module.exports.f10_board_theme_recomm_list_get =  f10_board_theme_recomm_list_get;


































//FAQ
async function f10_board_faq_faq_lists_get(req, res) {
	var sql = "";
	var row_count = 5;
	var page = decodeURIComponent(req.query.page); if(page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var start_num = (page -1) * row_count;

	var param = {};
	param.row_count = row_count;
	param.start_num = start_num;

	sql = mybatisMapper.getStatement('board', 'faq-get_list', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_faq_faq_lists_get =  f10_board_faq_faq_lists_get;


async function f10_board_faq_faq_index_lists_get(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'faq-index_faq_list', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_faq_faq_index_lists_get =  f10_board_faq_faq_index_lists_get;


async function f10_board_faq_faq_lists_ajax_get(req, res) {

	var row_count = 5;
	var page = decodeURIComponent(req.query.page); if(page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var start_num = (page -1) * row_count;

	var param = {};
	param.row_count = row_count;
	param.start_num = start_num;

	
	var key = decodeURIComponent(req.query.key); if(key == null || key == "" || key == "undefined" || key == undefined) key = "";
	var keyword = decodeURIComponent(req.query.keyword); if(keyword == null || keyword == "" || keyword == "undefined" || keyword == undefined) keyword = "";
	var category = decodeURIComponent(req.query.category); if(category == null || category == "" || category == "undefined" || category == undefined) category = "";

	param.key = key;
	param.keyword = keyword;
	param.category = category;


	sql = mybatisMapper.getStatement('board', 'faq-get_list', param, fm);

	var [row] = await pool.query(sql);


	var js = {};
	js.page = page;
	js.row_count = row_count;
	js.list = row;


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_faq_faq_lists_ajax_get =  f10_board_faq_faq_lists_ajax_get;

async function f10_board_faq_code_lists_get(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'faq-getCode', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_faq_code_lists_get =  f10_board_faq_code_lists_get;











//QNA
async function f10_board_qna_qna_lists_get(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'qna-getCode', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_qna_qna_lists_get =  f10_board_qna_qna_lists_get;






async function f10_board_qna_index_qna_lists_get(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'qna-index_qna_list', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_qna_index_qna_lists_get =  f10_board_qna_index_qna_lists_get;




async function f10_board_qna_qna_lists_ajax_get(req, res) {

	var row_count = 5;
	var page = decodeURIComponent(req.query.page); if(page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var start_num = (page -1) * row_count;

	var param = {};
	param.row_count = row_count;
	param.start_num = start_num;

	
	var key = decodeURIComponent(req.query.key); if(key == null || key == "" || key == "undefined" || key == undefined) key = "";
	var keyword = decodeURIComponent(req.query.keyword); if(keyword == null || keyword == "" || keyword == "undefined" || keyword == undefined) keyword = "";
	var category = decodeURIComponent(req.query.category); if(category == null || category == "" || category == "undefined" || category == undefined) category = "";

	param.key = key;
	param.keyword = keyword;
	param.category = category;


	sql = mybatisMapper.getStatement('board', 'qna-get_list', param, fm);

	var [row] = await pool.query(sql);

	

	var js = {};
	js.page = page;
	js.row_count = row_count;
	js.list = row;


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_qna_qna_lists_ajax_get =  f10_board_qna_qna_lists_ajax_get;





async function f10_board_qna_qna_view_get(req, res) {
	var sql = "";
	var param = {};


	
	var no = decodeURIComponent(req.query.no); if(no == null || no == "" || no == "undefined" || no == undefined) no = "";

	param.no = no;
	if(no != "") {
		sql = mybatisMapper.getStatement('board', 'qna-update_hit', param, fm);

		await pool.query(sql);
	}

	sql = mybatisMapper.getStatement('board', 'qna-get_view', param, fm);

	var [row] = await pool.query(sql);

	
	var js = {};

	if(row != null && row.length > 0) {
		js = row[0];
	}

	
	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_qna_qna_view_get =  f10_board_qna_qna_view_get;





async function f10_board_qna_my_qna_lists_get(req, res) {
	var token = "";
	var tc = "";
	let authHeader = req.headers["authorization"];
	tc = await fc.tokenChecker(req, res);
	if(tc == "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"authorization is empty!", errorCode:-100, data:null}));
		return;
	}


	var cust_seq = tc.cust_seq;
	

	if(cust_seq == null || cust_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
		return;
	}

	var param = {};
	var sql = "";
	
	var js = {};

	param.cust_seq = cust_seq;





	sql = mybatisMapper.getStatement('board', 'qna-get_my_qna_list', param, fm);

	var [row] = await pool.query(sql);

	var js = row;
	
	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_qna_my_qna_lists_get =  f10_board_qna_my_qna_lists_get;











async function f10_board_qna_qna_del_ajax_delete(req, res) {
	var token = "";
	var tc = "";
	let authHeader = req.headers["authorization"];
	tc = await fc.tokenChecker(req, res);
	if(tc == "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"authorization is empty!", errorCode:-100, data:null}));
		return;
	}


	var cust_seq = tc.cust_seq;
	

	if(cust_seq == null || cust_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
		return;
	}

	var param = {};
	var sql = "";
	
	var js = {};

	param.cust_seq = cust_seq;




	var no = decodeURIComponent(req.body.no); if(no == null || no == "" || no == "undefined" || no == undefined) no = "";

	if(no == null || no== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"no is empty!", errorCode:-100, data:null}));
		return;
	}


	param.no = no;


	sql = mybatisMapper.getStatement('board', 'qna-del_qna', param, fm);

	await pool.query(sql);




	
	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"삭제되었습니다.", errorCode:0, data:null}));
}
module.exports.f10_board_qna_qna_del_ajax_delete =  f10_board_qna_qna_del_ajax_delete;




























async function f10_board_tip_tip_lists_get(req, res) {

	var page = decodeURIComponent(req.query.page); if(page == null || page == "" || page == "undefined" || page == undefined) page = "1";
	var row_count = decodeURIComponent(req.query.pageCnt); if (row_count == null || row_count == "" || row_count == "undefined" || row_count == undefined) row_count = 6;
	var start_num = 0;

	
	var param = {};
	param.row_count = row_count;
	param.start_num = start_num;



	sql = mybatisMapper.getStatement('board', 'tip-get_total', param, fm);

	var [rowT] = await pool.query(sql);
	
	var total = rowT[0].count;



	sql = mybatisMapper.getStatement('board', 'tip-get_list', param, fm);

	var [row] = await pool.query(sql);

	var js = {};

	js.total_count = total;
	js.tip_list = row;
	js.page = page;
	js.pageCnt = row_count;


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_tip_tip_lists_get =  f10_board_tip_tip_lists_get;





async function f10_board_tip_tip_view_get(req, res) {
	
	
	var param = {};
	var sql = "";
	
	var js = {};

	var event_seq = decodeURIComponent(req.query.event_seq); if(event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";

	var cust_seq = decodeURIComponent(req.query.cust_seq); if(cust_seq == null || cust_seq == "" || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";

	param.sort = 'tip';
	param.event_seq = event_seq;
	param.ref_seq = event_seq;
	param.cust_seq = cust_seq;

	sql = mybatisMapper.getStatement('board', 'tip-user_like_yn', param, fm);
	var [rowU] = await pool.query(sql);





	var js = {};

	
	js.like_yn = rowU[0].cnt;



	sql = mybatisMapper.getStatement('board', 'tip-get_view1', param, fm);
	await pool.query(sql);

	

	sql = mybatisMapper.getStatement('board', 'tip-get_view', param, fm);
	var [row] = await pool.query(sql);

	js.view = row[0];


	
	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
}
module.exports.f10_board_tip_tip_view_get =  f10_board_tip_tip_view_get;

// async function f10_board_tip_tip_view_get(req, res) {
// 	var token = "";
// 	var tc = "";
// 	let authHeader = req.headers["authorization"];
// 	tc = await fc.tokenChecker(req, res);
// 	if(tc == "") {
// 		res.set({
// 			'content-type': 'application/json'
// 		}).send(JSON.stringify({success:false, message:"authorization is empty!", errorCode:-100, data:null}));
// 		return;
// 	}


// 	var cust_seq = tc.cust_seq;
	

// 	if(cust_seq == null || cust_seq== "") {
// 		res.set({
// 			'content-type': 'application/json'
// 		}).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
// 		return;
// 	}

// 	var param = {};
// 	var sql = "";
	
// 	var js = {};

// 	param.cust_seq = cust_seq;





	
// 	var event_seq = decodeURIComponent(req.query.event_seq); if(event_seq == null || event_seq == "" || event_seq == "undefined" || event_seq == undefined) event_seq = "";

// 	param.sort = 'tip';
// 	param.event_seq = event_seq;
// 	param.ref_seq = event_seq;


// 	sql = mybatisMapper.getStatement('board', 'tip-user_like_yn', param, fm);
// 	var [rowU] = await pool.query(sql);





// 	var js = {};

	
// 	js.like_yn = rowU[0].cnt;



// 	sql = mybatisMapper.getStatement('board', 'tip-get_view1', param, fm);
// 	await pool.query(sql);

	

// 	sql = mybatisMapper.getStatement('board', 'tip-get_view', param, fm);
// 	var [row] = await pool.query(sql);

// 	js.view = row[0];


	
// 	res.set({
// 		'content-type': 'application/json'
// 	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
// }
// module.exports.f10_board_tip_tip_view_get =  f10_board_tip_tip_view_get;



// Notice
async function f10_board_index_notice_list_get(req, res) {
	var sql = "";
	var param = {};

	sql = mybatisMapper.getStatement('board', 'index_notice_list', param, fm);

	var [row] = await pool.query(sql);


	var js = row;

	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"SUCCESS", errorCode:0, data:js}));
	
}
module.exports.f10_board_index_notice_list_get =  f10_board_index_notice_list_get;




// Review









































