var mysql = require("mysql2/promise");
var fs = require('fs');


var request = require("request-promise-native");
var multer = require("multer");

const mybatisMapper = require('mybatis-mapper');
var fm = {language: 'sql', indent: '  '};
const crypto = require("crypto")

var path = require("path")


var pool = null;

//DB
function settingDb(poolConnect) {
	pool = poolConnect;

	//console.log("setting DB");

	mybatisMapper.createMapper([ './sql-member.xml', './sql-cart.xml', './sql-common.xml', './sql-mypage.xml', './sql-product.xml', './sql-event.xml' ]);
}
module.exports.settingDb = settingDb;





var pageCnt = 25;			//페이지별 갯수
var pageCnt10 = 10;			//페이지별 갯수(10개씩)

var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_<>@\#$%&\\\=\(\'\"]/gi;			// , +  는... 제외했음.




const jwt = require('jsonwebtoken');
const SECRET_KEY = '/dA43fnfe21Nme2ADR2jQ==';


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

/*
//DB 는 index.js 에서 가져온다.
function settingDb(poolConnect) {
	pool = poolConnect;

	//console.log("setting DB");

	
	//mybatisMapper.createMapper([ './sql-product-etc.xml' ]);
}
module.exports.settingDb = settingDb;
*/



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
module.exports.numF =  numF;


//랜덤 숫자 추출
var generateRandom = function (min, max) {
	var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
	return ranNum;
}
module.exports.generateRandom =  generateRandom;


//000001 같은 채우기 형태 만들어주는 함수
function numberPad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
module.exports.numberPad =  numberPad;





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
module.exports.dateDiff =  dateDiff;

//랜덤 스트링(대문자1 + 숫자5)
function randomAString(string_length = 1) {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var randomstring = '';
	for (var i = 0 ; i < string_length ; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	//document.randform.randomfield.value = randomstring;
	return randomstring;
}
module.exports.randomAString =  randomAString;



//랜덤 스트링(대문자1 + 숫자5)
function randomString(string_length = 1) {
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	var randomstring = '';
	for (var i = 0 ; i < string_length ; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		if(i == 0 && rnum > 50) rhum = Math.floor(Math.random() * (chars.length-15))
		randomstring += chars.substring(rnum,rnum+1);
	}
	//document.randform.randomfield.value = randomstring;
	return randomstring;
}
module.exports.randomString =  randomString;




//랜덤 스트링(숫자 6자리)
function random6String(string_length = 6) {
	var chars = "0123456789";
	var randomstring = '';
	for (var i = 0 ; i < string_length ; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	//document.randform.randomfield.value = randomstring;
	return randomstring;
}
module.exports.random6String =  random6String;



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
	//console.log("req.query.page : " + req.query.page);
	//var page = req.query.page; if(page != null) page = page.trim(); else page = 1;
	var page = decodeURIComponent(req.query.page); if(page == null || page == "" || page == "undefined" || page == undefined) page = 1; else page = page.trim();
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
	js.totalPage = 0;

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
		js.totalPage = Math.ceil(searchCnt / js.pageCnt);
		//res.send(js);
	}
	//console.log("list");
	//console.log(js);
	


	return js;
}
module.exports.getList =  getList;

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
module.exports.getData =  getData;






//product list 를 따로 분리하는 함수
async function getProductList(js) {
	//product_cd, product_code, product_type, product_state, brand_Cd
	for(var n = 0 ; n < js.length ; n++) {
		var pro = {};
		pro.product_code		= js.product_code;
		pro.product_type		= js.product_type;
		pro.product_state		= js.product_state;
		pro.brand_cd			= js.brand_cd;
		pro.group_yn			= js.group_yn;
		pro.product_nm			= js.product_nm1;
		pro.supply_price		= js.supply_price;
		pro.sale_price			= js.sale_price;
		pro.fee_rate			= js.fee_rate;
		pro.reserve_rate		= js.reserve_rate;
	}

	return js;
}
module.exports.getProductList =  getProductList;




//product 목록에서 기본적인 데이터 추출
async function getProductList_shot(pList) {
	var pStr = "";
	for(var n = 0 ; n < pList.length ; n++) {
		pStr += ", '" + pList[n] + "' ";
	}
	if(pStr != "") {

	} else {
	}
}
module.exports.getProductList_shot =  getProductList_shot;






async function tokenChecker(req, res) {
	let authHeader = req.headers["authorization"];
	if(authHeader == null || authHeader == "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"Please enter token!", errorCode:-500, data:null}));
		return "";
	}

	var token = authHeader.split('Bearer ')[1];

	if(token == null || token== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"Please enter token!", errorCode:-500, data:null}));
		return "";
	}

	try
	{
		var decoded = jwt.verify(token, SECRET_KEY);
		if(decoded) {
			return decoded;
		} else {
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"You do not have permission!", errorCode:-501, data:null}));
			return "";
		}
	}
	catch (exception)
	{
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:exception, errorCode:-502, data:null}));
		return "";
	}

}
module.exports.tokenChecker =  tokenChecker;




function getToday(sep = '-') {
	const date = new Date();

	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const day = ('0' + date.getDate()).slice(-2);
	const dateStr = year + sep + month + sep + day;


	return dateStr;
}
module.exports.getToday =  getToday;



function getToday2() {
	const date = new Date();

	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const day = ('0' + date.getDate()).slice(-2);

	let hours = ('0' + date.getHours()).slice(-2); // 시
	let minutes = ('0' + date.getMinutes()).slice(-2);  // 분
	let seconds = ('0' + date.getSeconds()).slice(-2);  // 초


	const dateStr = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;


	return dateStr;
}
module.exports.getToday2 =  getToday2;



function getDate() {
	const date = new Date();

	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const day = ('0' + date.getDate()).slice(-2);


	let hours = ('0' + date.getHours()).slice(-2); // 시
	let minutes = ('0' + date.getMinutes()).slice(-2);  // 분
	let seconds = ('0' + date.getSeconds()).slice(-2);  // 초
	let milliseconds = ('00' + date.getMilliseconds()).slice(-3); // 밀리초

	const dateStr = year + month + day + hours + minutes + seconds + milliseconds + randomString(3);






	return dateStr;
}
module.exports.getDate =  getDate;




function base64_encode(orginText) {
	return Buffer.from(orginText, "utf8").toString('base64');
}
module.exports.base64_encode =  base64_encode;



function base64_decode(orginText) {
	return Buffer.from(base64EncodedText, "base64").toString('utf8');
}
module.exports.base64_decode =  base64_decode;


function checkDeviceType(userAgent) {
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);

  if (isMobile) {
    return 'MOBILE';
  } else {
    return 'WEB';
  }
}
module.exports.checkDeviceType = checkDeviceType


















async function sendRequestPost(url, postData, header = null) {
	//TODO 보내면 문제가 생길듯 한데......
	/*
	await request.post(
		url,
		{
			headers : header,
			form: postData
		},
		(error, response, body) => {
			var js = {};
			js.error = error;
			js.response = response;
			js.body = body;
			return js;
        }
	);
	*/
	//TEST code
	var js = {};

	js.error = "";
	js.response = {};
	js.response.statusCode = "200";
	js.body = {
		status : "OK",
		message : "TEST"
	};
}
module.exports.sendRequestPost =  sendRequestPost;






async function reserve_public(array) {

	var cust_seq = array['cust_seq'];
	var user_id = array['user_id'];

	if(cust_seq != "" && array['reserve'] > 0) {
		var sql = "";
		var param1 = {};
		param1.cust_seq = cust_seq;
		
		sql = mybatisMapper.getStatement('member', 'get_mem_info', param1, fm);
		var [row] = await pool.query(sql);

		if(row != null && row.length > 0) {
			var mem_info = row[0];
			var nowmlg = mem_info['mb_reserve'];
			var is_newmlg = 0;

			if(array['state'] == "P") {
				is_newmlg = (nowmlg + array['reserve']);
			} else {
				is_newmlg = (nowmlg - array['reserve']);
			}
		} else {
			return false;
		}


		var param = {};
		param.cust_seq			= cust_seq;
		param.user_id			= user_id;
		param.from_mlg			= array['frommlg'];
		param.mlg				= array['reserve'];
		param.new_mlg			= is_newmlg;
		param.state				= array['state'];
		param.use_yn			= "Y";
		param.reference			= array['reference'];
		param.ocode				= array['ocode'];

		sql = mybatisMapper.getStatement('member', 'set_reserve_insert', param, fm);
		await pool.query(sql);

		param.mb_reserve = is_newmlg;

		sql = mybatisMapper.getStatement('member', 'set_member_update', param, fm);
		var [rowMU] = await pool.query(sql);

		return true;
	} else {
		return false;
	}
}
module.exports.reserve_public = reserve_public;






async function deposit_public(array) {

	var cust_seq = array['cust_seq'];
	var user_id = array['user_id'];

	if(cust_seq != "" && array['deposit'] > 0) {
		var sql = "";
		var param1 = {};
		param1.cust_seq = cust_seq;
		
		sql = mybatisMapper.getStatement('member', 'get_mem_info', param1, fm);
		var [row] = await pool.query(sql);

		if(row != null && row.length > 0) {
			var mem_info = row[0];
			var nowmlg = mem_info['mb_reserve'];
			var is_newmlg = 0;

			if(array['state'] == "P") {
				is_newmlg = (nowmlg + array['deposit']);
			} else {
				is_newmlg = (nowmlg - array['deposit']);
			}
		} else {
			return false;
		}


		var param = {};
		param.cust_seq			= cust_seq;
		param.user_id			= user_id;
		param.from_mlg			= array['frommlg'];
		param.mlg				= array['deposit'];
		param.new_mlg			= is_newmlg;
		param.state				= array['state'];
		param.use_yn			= "Y";
		param.reference			= array['reference'];
		param.ocode				= array['ocode'];

		sql = mybatisMapper.getStatement('member', 'set_deposit_insert', param, fm);
		await pool.query(sql);

		param.mb_deposit = is_newmlg;

		sql = mybatisMapper.getStatement('member', 'set_member_update', param, fm);
		var [rowMU] = await pool.query(sql);

		return true;
	} else {
		return false;
	}
}
module.exports.deposit_public = deposit_public;


async function codeList (req, res) {
	const code_cd1 = req.query.code_cd1
	const sql = mybatisMapper.getStatement('common', 'get_sort_code_list', { code_cd1 }, fm)
	const [row] = await pool.query(sql);

	res.json({success: true, message: 'SUCCESS', errorCode: 0, data: row})
}
module.exports.codeList = codeList;



async function wish_proc (req, res) {
	try {
		const {mode , product_cd, cust_seq} = req.body
		let result = null
		let msg = null
		let status = false


		if (mode === 'ADD') {
			const [exists] = await pool.query(mybatisMapper.getStatement('common', 'exists_wishlist', {product_cd, cust_seq}, fm))
			if (exists.length > 0) {
				result = false
				msg = "이미 관심상품으로 등록되어있습니다."
				status = false
			} else {
				await pool.query(mybatisMapper.getStatement('common', 'insert_wishlist', {product_cd, cust_seq}, fm))
				result = true
				msg = "관심상품에 추가되었습니다."
				status = true
			}
		} else {
			await pool.query(mybatisMapper.getStatement('common', 'del_wishlist', {product_cd, cust_seq}, fm))
			msg = '관심 제품으로 제거'
			status = true
		}

		res.send({msg, result, status})
	} catch (error) {
		res.send({success: false, message: error.message})
	}
}
module.exports.wishProc = wish_proc



async function getSessionId (req, res) {
	try {
		res.send({success: true, sessionId: req.sessionID})		
	} catch (error) {
		res.send({success: false, message: error.message})
	}
}
module.exports.getSessionId = getSessionId

async function updateViewCount (req, res) {
	try {
		await pool.query(mybatisMapper.getStatement('common', 'update_view_count', {concept_room_seq: req.body.concept_room_seq}, fm))
		res.send({success: true})
	} catch (error) {
		res.send({success: false, message: error.message})
	}
}
module.exports.updateViewCount = updateViewCount


async function updateDownloadImageCount (req, res) {
	try {
		await pool.query(mybatisMapper.getStatement('common', 'update_download_image_count', {concept_room_seq: req.body.concept_room_seq}, fm))
		res.send({success: true})
	} catch (error) {
		res.send({success: false, message: error.message})
	}
}
module.exports.updateDownloadImageCount = updateDownloadImageCount


function hash(algo, str) {
	const string = crypto.createHash(algo).update(str).digest("hex")
	return string.toString()
}
module.exports.hash = hash

function md5(inputString) {
	var hc="0123456789abcdef";
	function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
	function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
	function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
	function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
	function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
	function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
	function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
	function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
	function sb(x) {
		var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
		for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
		blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
	}
	var i,x=sb(inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
	for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
		a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
		b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
		c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
		d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
		a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
		b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
		c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
		d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
		a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
		b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
		c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
		d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
		a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
		b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
		c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
		d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
		a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
		b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
		c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
		d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
		a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
		b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
	}
	return rh(a)+rh(b)+rh(c)+rh(d);
}
module.exports.md5 = md5



async function likeInfoProc (req, res) {
	try {
		if (req.body.mode === 'ADD') {
			await pool.query(mybatisMapper.getStatement('event', 'insert_like_info', req.body, fm))
		} else {
			await pool.query(mybatisMapper.getStatement('event', 'delete_like_info', req.body, fm))
		}
		res.send({success: true})
	} catch (error) {
		res.send({success: false, message: error.message})
	}
}
module.exports.likeInfoProc = likeInfoProc





