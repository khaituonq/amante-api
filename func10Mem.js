var mysql = require("mysql2/promise");
var fs = require('fs');
const xlsx = require("xlsx");
var path = require('path');
const querystring = require("querystring");

const date = require('date-and-time');
var kakaoManager = require("./kakaoManager")

var crypto = require('crypto');


var requestOld = require("request");
var request = require("request-promise-native");



const mybatisMapper = require('mybatis-mapper');
var fm = { language: 'sql', indent: '  ' };

const jwt = require('jsonwebtoken');
const SECRET_KEY = '/dA43fnfe21Nme2ADR2jQ==';


//설정 정보
const configFile = fs.readFileSync('./config.json', 'utf8');
const config = JSON.parse(configFile);

//공통 함수용
var fc = require("./funcComm.js");



var pageCnt = 25;			//페이지당 글 수
var pageCnt10 = 10;			//페이지당 글 수(10개)

var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_<>@\#$%&\\\=\(\'\"]/gi;			// , +  ��... ��������.
var KR_TIME_DIFF = 9 * 60 * 60 * 1000;
//KR_TIME_DIFF = 0;

var axios = require("axios");
const { stopCoverage } = require("v8");


String.prototype.addSlashes = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

String.prototype.EM = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    if (this == 'TRUE' || this == 'true' || this == true) return '1';
    else return '0';
};

String.prototype.EM2 = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    if (this == 'NULL') return '';
    else return this;
};

function EM3(data) {
    if (data == "1" || data == "0") return data;
    if (data == null) return null;
    if (data == false || data == "FALSE" || data == "false") return "'0'";
    else return "'1'";
}

function isNullCheck(str) {
    if (str == null || str == "" || str == "null") return null;
    else return str;
}

var pool = null;

//DB
function settingDb(poolConnect) {
    pool = poolConnect;

    //console.log("setting DB");

    mybatisMapper.createMapper(['./sql-member.xml', './sql-cart.xml', './sql-common.xml', './sql-mypage.xml', './sql-product.xml',]);


    fc.settingDb(pool);
}
module.exports.settingDb = settingDb;





//login
async function f10_login_post(req, res) {
    var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
    var passwd = decodeURIComponent(req.body.passwd); if (passwd == null || passwd == "" || passwd == "undefined" || passwd == undefined) passwd = "";
    var login_gb = decodeURIComponent(req.body.login_gb); if (login_gb == "undefined" || login_gb == null || login_gb == undefined || login_gb == "") login_gb = "A";

    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "사용자 이름은 필수입니다.", errorCode: -100, data: null }));
        return;
    }
    if (passwd == null || passwd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "비밀번호는 필수입니다.", errorCode: -100, data: null }));
        return;
    }

    var sql = "";

    var param = {};

    var passhash = crypto.createHash('md5').update(passwd).digest("hex");
    var hash = crypto.createHash('sha512').update(passhash + 'pyungan' + user_id).digest('hex');

    param.user_id = user_id;
    param.passwd = hash;


    sql = mybatisMapper.getStatement('member', 'memberInfo', param, fm);
    var [rowI] = await pool.query(sql);

    if (rowI == null || rowI.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "가입된 정보가 없습니다.", errorCode: -900, data: null }));
        return;
    }


    sql = mybatisMapper.getStatement('member', 'login', param, fm);

    //console.log(sql);



    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "패스워드가 틀립니다.", errorCode: -901, data: null }));
        return;
    }
    var js = {};
    js = row[0];

    //TODO JWT token 
    var token = jwt.sign({
        "cust_seq": js.cust_seq,
        "user_id": js.user_id,
        "user_nm": js.user_nm,
        "phone": js.phone,
        "member_grp_cd": js.member_grp_cd,
        "email": js.email
    }, SECRET_KEY, {
        algorithm: 'HS256'
        /*
        algorithm:'HS256',
    	
        audience:'ojin.infomine.kr',
        //expiresIn: '15m', // 15분 유효
        issuer: 'msstore',
        */
        , expiresIn: '24h', // 24시간 유효
    });

    js.token = token;

    await pool.query(mybatisMapper.getStatement("member", "log_login", {
        login_gb: login_gb,
        login_id: js.user_id,
        login_nm: js.user_nm,
        reg_ip: req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp,
        user_agent: req.headers["user-agent"]
    }, fm))


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_login_post = f10_login_post;













async function f10_member_findId_post(req, res) {
    var user_nm = decodeURIComponent(req.body.user_nm); if (user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";
    var email = decodeURIComponent(req.body.email); if (email == null || email == "" || email == "undefined" || email == undefined) email = "";
    var phone = decodeURIComponent(req.body.phone); if (phone == null || phone == "" || phone == "undefined" || phone == undefined) phone = "";

    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";


    if (user_nm == null || user_nm == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "user_nm is empty!", errorCode: -100, data: null }));
        return;
    }

    if (mode == "E") {
        if (email == null || email == "") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "email is empty!", errorCode: -100, data: null }));
            return;
        }
    } else if (mode == "P") {
        if (phone == null || phone == "") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "phone is empty!", errorCode: -100, data: null }));
            return;
        }
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "mode(E or P) is empty!", errorCode: -100, data: null }));
        return;
    }



    var sql = "";

    var param = {};


    param.user_nm = user_nm;
    param.email = email;
    param.phone = phone;


    if (mode == "E") {
        sql = mybatisMapper.getStatement('member', 'findId', param, fm);
    } else if (mode == "P") {
        sql = mybatisMapper.getStatement('member', 'findIdPhone', param, fm);
    }

    //console.log(sql);


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }
    var js = {};
    js = row[0];



    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_findId_post = f10_member_findId_post;








async function f10_member_findPw_post(req, res) {
    var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
    var user_nm = decodeURIComponent(req.body.user_nm); if (user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";
    var email = decodeURIComponent(req.body.email); if (email == null || email == "" || email == "undefined" || email == undefined) email = "";
    var phone = decodeURIComponent(req.body.phone); if (phone == null || phone == "" || phone == "undefined" || phone == undefined) phone = "";

    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "user_id is empty!", errorCode: -100, data: null }));
        return;
    }


    if (user_nm == null || user_nm == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "user_nm is empty!", errorCode: -100, data: null }));
        return;
    }

    if (mode == "E") {
        if (email == null || email == "") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "email is empty!", errorCode: -100, data: null }));
            return;
        }
    } else if (mode == "P") {
        if (phone == null || phone == "") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "phone is empty!", errorCode: -100, data: null }));
            return;
        }
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "mode(E or P) is empty!", errorCode: -100, data: null }));
        return;
    }



    var sql = "";

    var param = {};

    param.user_id = user_id;
    param.user_nm = user_nm;
    param.email = email;
    param.phone = phone;


    if (mode == "E") {
        sql = mybatisMapper.getStatement('member', 'findId', param, fm);
    } else if (mode == "P") {
        sql = mybatisMapper.getStatement('member', 'findIdPhone', param, fm);
    }




    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }
    var js = {};
    js = row[0];


    //random string 로 셋팅
    var passwd = fc.randomString(8);
    var passhash = crypto.createHash('md5').update(passwd).digest("hex");
    var hash = crypto.createHash('sha512').update(passhash + 'pyungan' + js.user_id).digest('hex');

    param.cust_seq = js.cust_seq;
    param.passwd = hash;
    sql = mybatisMapper.getStatement('member', 'updateMemberPass', param, fm);

    await pool.query(sql);

    js.passwd = passwd;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "비밀번호를 [" + passwd + "] 로 변경하였습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_findPw_post = f10_member_findPw_post;














async function f10_member_changePassword_post(req, res) {
    var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
    var passwd = decodeURIComponent(req.body.passwd); if (passwd == null || passwd == "" || passwd == "undefined" || passwd == undefined) passwd = "";
    var newPasswd = decodeURIComponent(req.body.newPasswd); if (newPasswd == null || newPasswd == "" || newPasswd == "undefined" || newPasswd == undefined) newPasswd = "";


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "user_id is empty!", errorCode: -100, data: null }));
        return;
    }
    if (passwd == null || passwd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "passwd is empty!", errorCode: -100, data: null }));
        return;
    }
    if (newPasswd == null || newPasswd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "newPasswd is empty!", errorCode: -100, data: null }));
        return;
    }

    var sql = "";

    var param = {};


    param.user_id = user_id;


    sql = mybatisMapper.getStatement('member', 'memberInfo', param, fm);




    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "가입되지 않은 아이디입니다.", errorCode: -200, data: [] }));
        return;
    }



    var passhash = crypto.createHash('md5').update(passwd).digest("hex");
    var hash = crypto.createHash('sha512').update(passhash + 'pyungan' + user_id).digest('hex');


    param.passwd = hash;



    sql = mybatisMapper.getStatement('member', 'login', param, fm);


    var [rowP] = await pool.query(sql);

    if (rowP == null || rowP.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }




    if (passwd == newPasswd) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "기존의 암호와 같습니다.", errorCode: -200, data: [] }));
        return;
    }


    param.cust_seq = row[0].cust_seq;

    passhash = crypto.createHash('md5').update(newPasswd).digest("hex");
    hash = crypto.createHash('sha512').update(passhash + 'pyungan' + user_id).digest('hex');

    param.passwd = hash;




    sql = mybatisMapper.getStatement('member', 'updateMemberPass', param, fm);
    await pool.query(sql);


    var js = {};
    js.cust_seq = row[0].cust_seq;
    js.user_id = row[0].user_id;
    js.user_nm = row[0].user_nm;
    js.email = row[0].email;



    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "비밀번호가 변경되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_changePassword_post = f10_member_changePassword_post;






//아이디 중복 체크
async function f10_member_idCheck_post(req, res) {
    var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";



    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "user_id is empty!", errorCode: -100, data: null }));
        return;
    }

    var sql = "";

    var param = {};


    param.user_id = user_id;

    sql = mybatisMapper.getStatement('member', 'idCheck', param, fm);

    var [row] = await pool.query(sql);


    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "가입되지 않은 아이디입니다.", errorCode: -200, data: [] }));
        return;
    }

    if (row[0].cnt == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "사용할 수 있는 아이디입니다..", errorCode: 0, data: [] }));
        return;
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "중복된 아이디 입니다.", errorCode: -300, data: [] }));
        return;
    }

}
module.exports.f10_member_idCheck_post = f10_member_idCheck_post;






//회원가입
async function f10_member_join_post(req, res) {
    //회원가입
    console.log(req.body);
    //체크 할것 - 이메일 중복 안됨, 패스워드 있어야 함. hType, hCode 중복 안됨, 전화번호 중복 안됨
    var user_id = decodeURIComponent(req.body.user_id); if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
    var passwd = decodeURIComponent(req.body.passwd); if (passwd == null || passwd == "" || passwd == "undefined" || passwd == undefined) passwd = "";

    var user_nm = decodeURIComponent(req.body.user_nm); if (user_nm == null || user_nm == "" || user_nm == "undefined" || user_nm == undefined) user_nm = "";

    var gender = decodeURIComponent(req.body.gender); if (gender == null || gender == "" || gender == "undefined" || gender == undefined) gender = "";
    var birthday = decodeURIComponent(req.body.birthday); if (birthday == null || birthday == "" || birthday == "undefined" || birthday == undefined) birthday = "";

    var phone = decodeURIComponent(req.body.phone); if (phone == null || phone == "" || phone == "undefined" || phone == undefined) phone = "";
    var email = decodeURIComponent(req.body.email); if (email == null || email == "" || email == "undefined" || email == undefined) email = "";
    var etc_check = decodeURIComponent(req.body.etc_check); if (etc_check == null || etc_check == "" || etc_check == "undefined" || etc_check == undefined) etc_check = "";

    var join_gb = decodeURIComponent(req.body.join_gb); if (join_gb == null || join_gb == "undefined" || join_gb == undefined) join_gb = "";
    var join_path = decodeURIComponent(req.body.join_path); if (join_path == null || join_path == "undefined" || join_path == undefined) join_path = "";

    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "사용자 아이디를 입력해주세요.", errorCode: -100, data: null }));
        return;
    }
    if (passwd == null || passwd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "암호가 필요합니다.", errorCode: -100, data: null }));
        return;
    }
    if (gender == null || gender == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "gender is empty!", errorCode: -100, data: null }));
        return;
    }
    if (birthday == null || birthday == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "유효한 생년월일을 입력하세요.", errorCode: -100, data: null }));
        return;
    }
    if (phone == null || phone == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "올바른 휴대폰 번호를 입력해주세요.", errorCode: -100, data: null }));
        return;
    }
    if (email == null || email == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "유효한 이메일 주소를 입력하세요.", errorCode: -100, data: null }));
        return;
    }

    if (join_gb == null || join_gb == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "가입 구분을 입력해 주세요", errorCode: -100, data: null }));
        return;
    }

    if (etc_check == "") {
        etc_check = "N";
    }

    switch (join_gb) {
        case "A":
        case "N":
        case "K":
            break;

        default:
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "가입 구분은 A(아망떼), N(네이버), K(카카오)만 입력 가능합니다!", errorCode: -100, data: null }));
            break;
    }

    //TODO wt_member 에 등록
    //TODO wt_coupon_member 에 쿠폰 등록(신규가입 쿠폰 발급)


    var sql = "";
    var param = {};

    param.user_id = user_id;
    param.passwd = passwd;
    param.user_nm = user_nm;
    param.gender = gender;
    param.birthday = birthday;
    param.phone = phone;
    param.email = email;
    param.etc_check = etc_check;


    sql = mybatisMapper.getStatement('member', 'idCheckP', param, fm);

    var [rowID] = await pool.query(sql);

    if (rowID[0].cnt > 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "중복된 아이디 입니다.", errorCode: -300, data: [] }));
        return;
    }


    //이메일 체크
    sql = mybatisMapper.getStatement('member', 'emailCheck', param, fm);

    var [rowE] = await pool.query(sql);

    if (rowE[0].cnt > 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "이미 가입된 이메일 입니다.", errorCode: -300, data: [] }));
        return;
    }


    //연락처 체크
    sql = mybatisMapper.getStatement('member', 'phoneCheck', param, fm);

    var [rowP] = await pool.query(sql);

    if (rowP[0].cnt > 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "이미 가입된 연락처 입니다.", errorCode: -300, data: [] }));
        return;
    }

    param.mailing_yn = etc_check;
    param.sms_yn = etc_check;
    param.out_yn = "N";

    var passhash = crypto.createHash('md5').update(passwd).digest("hex");
    var hash = crypto.createHash('sha512').update(passhash + 'pyungan' + user_id).digest('hex');

    param.passwd = hash;
    param.member_grp_cd = "100";
    param.ip = req.ip;
    param.join_gb = join_gb;
    param.join_path = join_path == "" ? "APP" : join_path;

    sql = mybatisMapper.getStatement('member', 'joinMember', param, fm);
    //console.log(sql);	

    //가입
    var [row] = await pool.query(sql);
    //console.log(row);

    //console.log(row.insertId);

    param.cust_seq = row.insertId;

    //신규가입 쿠폰 발급
    sql = mybatisMapper.getStatement('member', 'memberJoinCoupon', param, fm);
    await pool.query(sql);


    if (join_gb == 'K' || join_gb == 'N') {
        console.log(join_gb);
        const sns = req.body.sns_data;
        console.log(sns);
        let sns_data = {}
        sns_data.cust_seq = row.insertId;
        sns_data.member_gb = join_gb;
        sns_data.sns_id = sns.sns_id;
        sns_data.sns_email = sns.sns_email;
        sns_data.sns_nm = sns.sns_nickname;

        sql = mybatisMapper.getStatement('member', 'sns_insert', sns_data, fm);
        console.log(sql);
        await pool.query(sql);

    }
    sql = mybatisMapper.getStatement('member', 'memberSInfo', param, fm);
    var [rowSI] = await pool.query(sql);

    var js = {};

    js = rowSI[0];

    /*
    TODO
    if($this->session->userdata('sns_id')){  // sns 아이디 값이 있을경우
                $sns_data = [
                    'cust_seq' => $result['LoginData']['cust_seq'],
                    'member_gb' => $this->session->userdata('sns_gb'),
                    'sns_id' => $this->session->userdata('sns_id'),
                    'sns_email' => $this->session->userdata('sns_email'),
                    'sns_nm' => $this->session->userdata('sns_nm'),
                    'reg_date' => Date('Y-m-d H:i:s')
                ];

                $this->join->sns_insert($sns_data);

                $sns_item_arr = array('sns_nm', 'sns_email', 'sns_phone', 'sns_birth_year', 'sns_birth', 'sns_gb', 'join_gb', 'sns_redirect', 'prev_url');
                $this->session->unset_userdata($sns_item_arr); // sns 관련 세션정보 삭제
            }
    */





    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "회원가입이 완료되었습니다.", errorCode: 0, data: js }));


}
module.exports.f10_member_join_post = f10_member_join_post;













//회원 탈퇴
async function f10_member_leave_post(req, res) {

    var cust_seq = decodeURIComponent(req.body.cust_seq); if (cust_seq == null || cust_seq == "" || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";


    var param = {};


    param.cust_seq = cust_seq;




    sql = mybatisMapper.getStatement('member', 'memberSInfo', param, fm);
    var [row] = await pool.query(sql);


    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "회원정보를 찾을 수 없습니다.", errorCode: -300, data: null }));
        return;
    }



    sql = mybatisMapper.getStatement('member', 'leave', param, fm);
    await pool.query(sql);


    sql = mybatisMapper.getStatement('member', 'leaveSns', param, fm);
    await pool.query(sql);






    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "회원가입이 완료되었습니다.", errorCode: 0, data: js }));


}
module.exports.f10_member_leave_post = f10_member_leave_post;










//회원 정보 조회
async function f10_member_info_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";


    var param = {};


    param.cust_seq = cust_seq;





    sql = mybatisMapper.getStatement('member', 'memberSInfo', param, fm);
    var [row] = await pool.query(sql);


    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "회원정보를 찾을 수 없습니다.", errorCode: -300, data: null }));
        return;
    }

    /*
    var js = {};
    js.success = true;
    js.message = "";
    js.errorCode = 0;
    if(row.length > 0) {
        js.data = row[0];
    } else {
        js.data = {};
    }
    */

    var js = {};
    if (row.length > 0) {
        js = row[0];
    }

    //console.log(js);
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));


}
module.exports.f10_member_info_get = f10_member_info_get;








//카트 목록
async function f10_member_cart_lists_get(req, res) {

    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];

    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    // var cust_seq = "1062903";
    var cust_seq = tc.cust_seq;

    if (cust_seq == null || cust_seq == "") {
        /*
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
        */
        return;
    }


    var sql = "";


    var param = {};


    param.cust_seq = cust_seq;



    var js = {};

    js.success = true;
    js.message = "";
    js.errorCode = 0;




    sql = mybatisMapper.getStatement('cart', 'get_total', param, fm);
    var [rowT] = await pool.query(sql);
    js.total_count = rowT[0].count;


    // sql = mybatisMapper.getStatement('cart', 'get_list', param, fm);
    // var [rowL] = await pool.query(sql);
    // js.cart = rowL;
    
     // Phuoc Loi
var cartArr = [];
sql = mybatisMapper.getStatement('cart', 'get_list_1', param, fm);
console.log(sql);
var [cartList] = await pool.query(sql);
for (var i = 0; i < cartList.length; i++) {
    param.product_cd = cartList[i].product_cd
    sql = mybatisMapper.getStatement('cart', 'get_list_cart_by_product', param, fm);
    var [cartList1] = await pool.query(sql);
   
    // 1
    js.single_fee = 0;


    var single_fee = [];

    js.free_delivery = false;

    for (var n = 0; n < cartList1.length; n++) {
        cartList1[n].total_price = cartList1[n].sale_price;

        param.const_trans_cd = cartList1[n].free_trans_yn;

        sql = mybatisMapper.getStatement('cart', 'getTrans', param, fm);
        var [rowTran] = await pool.query(sql);

        cartList1[n].trans_bigo = rowTran[0].bigo;

        //## 무료배송 상품 체크
        if (cartList1.free_trans_yn == "2002") {
            js.free_delivery = true;
        }

        //## 무료배송일 경우 배송비가 0원이므로 계산 x
        if (js.free_delivery == false) {
            //##단일상품 배송비 계산
            if (cartList1.free_trans_yn != "2001" && cartList1[n].free_trans_yn != "2002") {
                //##카트 리스트에 단일 상품이 여러개일 경우 최대값으로 출력
                param.free_trans_yn = cartList1[n].free_trans_yn;
                sql = mybatisMapper.getStatement('common', 'get_single_trans_info', param, fm);
                var [rowF] = await pool.query(sql);

                single_fee.push(rowF[0].fee);
                for (var m = 0; m < single_fee.length; m++) {
                    if (js.single_fee < single_fee[m]) js.single_fee = single_fee[m];
                }
            }
        }


        cartList1[n].i_options = await getCartOptionList(cartList1[n].cart_seq, 'I');
        if (cartList1[n].i_options != null) {
            cartList1[n].i_options_price = 0;
            for (var m = 0; m < cartList1[n].i_options.length; m++) {
                cartList1[n].i_options_price += (cartList1[n].i_options[m].opt_price * cartList1[n].i_options[m].qty);
            }
        }


        cartList1[n].c_options = await getCartOptionList(cartList1[n].cart_seq, 'C');
        if (cartList1[n].c_options != null) {
            cartList1[n].c_options_price = 0;
            for (var m = 0; m < cartList1[n].c_options.length; m++) {
                cartList1[n].c_options_price += (cartList1[n].c_options[m].opt_price * cartList1[n].c_options[m].qty);
            }

            /* 조합 추가 옵션가 */
            var c_options_stock_price = cartList1[n].c_options[0]['stock_opt_price'];
            if (c_options_stock_price > 0) {
                cartList1[n]['c_options_price'] += (c_options_stock_price * cartList1[n]['qty']);
            }
        }


        cartList1[n].s_options = await getCartOptionList(cartList1[n].cart_seq, 'S');
        if (cartList1[n].s_options != null) {
            cartList1[n].s_options_price = 0;
            for (var m = 0; m < cartList1[n].s_options.length; m++) {
                cartList1[n].s_options_price += (cartList1[n].s_options[m].opt_price * cartList1[n].s_options[m].qty);
            }
        }

        cartList1[n].total_price *= cartList1[n].qty;
        cartList1[n].total_price += cartList1[n].i_options_price;
        cartList1[n].total_price += cartList1[n].c_options_price;
        cartList1[n].total_price += cartList1[n].s_options_price;
    }
    //1




    var group_product_list =  {
        "product_cd": cartList[i].product_cd,
        "product_nm": cartList[i].product_nm,
        "product_main_img": cartList[i].product_main_img,
        "sale_price": cartList[i].sale_price,
        "trans_bigo": cartList[i].trans_bigo,
        "cart_data" :cartList1
    }
    cartArr.push(group_product_list);
     
}
js.cart = cartArr;

    
// End

    // js.single_fee = 0;


    // var single_fee = [];

    // js.free_delivery = false;

    // for (var n = 0; n < js.cart.length; n++) {
    //     js.cart[n].total_price = js.cart[n].sale_price;

    //     param.const_trans_cd = js.cart[n].free_trans_yn;

    //     sql = mybatisMapper.getStatement('cart', 'getTrans', param, fm);
    //     var [rowTran] = await pool.query(sql);

    //     js.cart[n].trans_bigo = rowTran[0].bigo;

    //     //## 무료배송 상품 체크
    //     if (js.cart[n].free_trans_yn == "2002") {
    //         js.free_delivery = true;
    //     }

    //     //## 무료배송일 경우 배송비가 0원이므로 계산 x
    //     if (js.free_delivery == false) {
    //         //##단일상품 배송비 계산
    //         if (js.cart[n].free_trans_yn != "2001" && js.cart[n].free_trans_yn != "2002") {
    //             //##카트 리스트에 단일 상품이 여러개일 경우 최대값으로 출력
    //             param.free_trans_yn = js.cart[n].free_trans_yn;
    //             sql = mybatisMapper.getStatement('common', 'get_single_trans_info', param, fm);
    //             var [rowF] = await pool.query(sql);

    //             single_fee.push(rowF[0].fee);
    //             for (var m = 0; m < single_fee.length; m++) {
    //                 if (js.single_fee < single_fee[m]) js.single_fee = single_fee[m];
    //             }
    //         }
    //     }


    //     js.cart[n].i_options = await getCartOptionList(js.cart[n].cart_seq, 'I');
    //     if (js.cart[n].i_options != null) {
    //         js.cart[n].i_options_price = 0;
    //         for (var m = 0; m < js.cart[n].i_options.length; m++) {
    //             js.cart[n].i_options_price += (js.cart[n].i_options[m].opt_price * js.cart[n].i_options[m].qty);
    //         }
    //     }


    //     js.cart[n].c_options = await getCartOptionList(js.cart[n].cart_seq, 'C');
    //     if (js.cart[n].c_options != null) {
    //         js.cart[n].c_options_price = 0;
    //         for (var m = 0; m < js.cart[n].c_options.length; m++) {
    //             js.cart[n].c_options_price += (js.cart[n].c_options[m].opt_price * js.cart[n].c_options[m].qty);
    //         }

    //         /* 조합 추가 옵션가 */
    //         var c_options_stock_price = js.cart[n].c_options[0]['stock_opt_price'];
    //         if (c_options_stock_price > 0) {
    //             js.cart[n]['c_options_price'] += (c_options_stock_price * js.cart[n]['qty']);
    //         }
    //     }


    //     js.cart[n].s_options = await getCartOptionList(js.cart[n].cart_seq, 'S');
    //     if (js.cart[n].s_options != null) {
    //         js.cart[n].s_options_price = 0;
    //         for (var m = 0; m < js.cart[n].s_options.length; m++) {
    //             js.cart[n].s_options_price += (js.cart[n].s_options[m].opt_price * js.cart[n].s_options[m].qty);
    //         }
    //     }

    //     js.cart[n].total_price *= js.cart[n].qty;
    //     js.cart[n].total_price += js.cart[n].i_options_price;
    //     js.cart[n].total_price += js.cart[n].c_options_price;
    //     js.cart[n].total_price += js.cart[n].s_options_price;
    // }


    // 무료배송 추천상품 (4001 코드 : wt_group_product )
    sql = mybatisMapper.getStatement('cart', 'get_group_product', param, fm);
    var [rowG] = await pool.query(sql);
    var group_products;
    var product_list = [];

    var sub = [];
    if (rowG != null && rowG.length > 0) {
        var group_cd = "";
        var num = -1;
        var num2 = 0;
        var group_nm = "";





        for (var m = 0; m < rowG.length; m++) {
            if (rowG[m].group_cd != 6001) {
                if (group_cd != rowG[m].group_cd) {
                    num2 = 0;
                    num++;


                    if (m == 0) {

                    } else {
                        // group_products.push(sub);
                        var list_pr = {
                            "group_nm": group_nm,
                            "group_cd": group_cd,
                            "product_list": sub,

                        }
                        product_list.push(list_pr);
                        sub = [];
                    }
                    group_cd = rowG[m].group_cd;
                    group_nm = rowG[m].group_nm;
                    sub.push(rowG[m]);
                    //js.group_products[num][num2] = rowG[m];
                    num2++;
                } else {
                    //js.group_products[num][num2] = rowG[m];
                    sub.push(rowG[m]);
                    num2++;
                }
            }
        }
        // if (sub.length > 0) {
        //     group_products.push(sub);
        // }
        group_products = product_list;
        js.group_products = product_list;
    } else {
        js.group_products = null;
    }


    //#회원정보
    sql = mybatisMapper.getStatement('member', 'get_mem_info_cart', param, fm);


    var [rowM] = await pool.query(sql);

    js.mem_info = rowM[0];



    //#일반 배송비
    //기본값 free_trans_yn = 2001
    param.free_trans_yn = "2001";
    sql = mybatisMapper.getStatement('common', 'get_trans_info', param, fm);
    var [rowTI] = await pool.query(sql);
    js.const_trans_info = rowTI[0];


    param.code_cd1 = "3200";
    sql = mybatisMapper.getStatement('common', 'get_code_list', param, fm);
    var [rowCL] = await pool.query(sql);
    js.code_trans_msg_info = rowCL;




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));


}
module.exports.f10_member_cart_lists_get = f10_member_cart_lists_get;


async function getCartOptionList(cart_seq, opt_gb) {
    var sql = "";
    var param = {};

    param.cart_seq = cart_seq;
    param.opt_gb = opt_gb;


    sql = mybatisMapper.getStatement('cart', 'cartInfo', param, fm);
    var [rowC] = await pool.query(sql);

    if (rowC == null || rowC.length == 0) {
        return null;
    }

    param.product_cd = rowC[0].product_cd;

    sql = mybatisMapper.getStatement('cart', 'get_combine_option_price', param, fm);
    var [rowO] = await pool.query(sql);

    if (rowO == null || rowO.length == 0) {
        return null;
    } else {
        var idx = 1;

        var sh_sql = "";

        for (var m = 0; m < rowO.length; m++) {

            sh_sql += " AND opt_val" + idx + " = '" + rowO[m].opt_cd + "' ";

            idx++;
        }

        param.sh_sql = sh_sql;


        sql = mybatisMapper.getStatement('cart', 'get_cart_option_list', param, fm);

        var [row] = await pool.query(sql);
        return row;
    }

}












//cart 삭제
async function f10_member_cart_del_delete(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var cart_seq = decodeURIComponent(req.body.cart_seq); if (cart_seq == null || cart_seq == "" || cart_seq == "undefined" || cart_seq == undefined) cart_seq = "";


    if (cart_seq == null || cart_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.cart_seq = cart_seq;

    sql = mybatisMapper.getStatement('cart', 'del_cart', param, fm);
    console.log(sql);
    await pool.query(sql);
    sql = mybatisMapper.getStatement('cart', 'del_cartOpt', param, fm);
    await pool.query(sql);




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "장바구니 삭제가 완료되었습니다.", errorCode: 0, data: null }));
}
module.exports.f10_member_cart_del_delete = f10_member_cart_del_delete;




//cart 삭제2
async function f10_member_cart_del2_delete(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var cart_seq = decodeURIComponent(req.body.cart_seq); if (cart_seq == null || cart_seq == "" || cart_seq == "undefined" || cart_seq == undefined) cart_seq = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";


    if (cart_seq == null || cart_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.cart_seq = cart_seq;
    param.product_cd = product_cd;

    sql = mybatisMapper.getStatement('cart', 'del_cart2', param, fm);
    await pool.query(sql);
    sql = mybatisMapper.getStatement('cart', 'del_cart2Opt', param, fm);
    await pool.query(sql);




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "장바구니 삭제가 완료되었습니다.", errorCode: 0, data: null }));
}
module.exports.f10_member_cart_del2_delete = f10_member_cart_del2_delete;






//cart 수량 변경
async function f10_member_cart_updQty_post(req, res) {
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    var cust_seq = tc.cust_seq;

    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var cart_seq = decodeURIComponent(req.body.cart_seq); if (cart_seq == null || cart_seq == "" || cart_seq == "undefined" || cart_seq == undefined) cart_seq = "";
    var opt_cd = decodeURIComponent(req.body.opt_cd); if (opt_cd == null || opt_cd == "" || opt_cd == "undefined" || opt_cd == undefined) opt_cd = "";
    var opt_val1 = decodeURIComponent(req.body.opt_val1); if (opt_val1 == null || opt_val1 == "" || opt_val1 == "undefined" || opt_val1 == undefined) opt_val1 = "";
    var opt_val2 = decodeURIComponent(req.body.opt_val2); if (opt_val2 == null || opt_val2 == "" || opt_val2 == "undefined" || opt_val2 == undefined) opt_val2 = "";
    var opt_val3 = decodeURIComponent(req.body.opt_val3); if (opt_val3 == null || opt_val3 == "" || opt_val3 == "undefined" || opt_val3 == undefined) opt_val3 = "";
    var qty = decodeURIComponent(req.body.qty); if (qty == null || qty == "" || qty == "undefined" || qty == undefined) qty = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";



    if (cart_seq == null || cart_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }
    if (qty == null || qty == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "qty is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.cart_seq = cart_seq;
    param.product_cd = product_cd;
    param.opt_cd = opt_cd;
    param.opt_val1 = opt_val1;
    param.opt_val2 = opt_val2;
    param.opt_val3 = opt_val3;
    param.qty = qty;

    sql = mybatisMapper.getStatement('cart', 'product_stock_check', param, fm);
    var [rowPC] = await pool.query(sql);

    if (rowPC == null || rowPC.length == 0) {
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "재고부족", errorCode: -1000, data: null }));
        return;
    }


    sql = mybatisMapper.getStatement('cart', 'update_cartOpt', param, fm);
    await pool.query(sql);
    sql = mybatisMapper.getStatement('cart', 'update_cart', param, fm);
    await pool.query(sql);


    sql = mybatisMapper.getStatement('cart', 'cartInfo', param, fm);
    var [rowC] = await pool.query(sql);

    var js = {};
    if (rowC == null || rowC.length == 0) {
    } else {
        js = rowC[0];
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "장바구니 수량 변경이 완료되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_cart_updQty_post = f10_member_cart_updQty_post;









//cart 옵션 수량 변경

async function f10_member_cart_updOptQty_post(req, res) {
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    var cust_seq = tc.cust_seq;

    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }



    var cart_seq = decodeURIComponent(req.body.cart_seq); if (cart_seq == null || cart_seq == "" || cart_seq == "undefined" || cart_seq == undefined) cart_seq = "";
    var cart_opt_seq = decodeURIComponent(req.body.cart_opt_seq); if (cart_opt_seq == null || cart_opt_seq == "" || cart_opt_seq == "undefined" || cart_opt_seq == undefined) cart_opt_seq = "";
    var opt_cd = decodeURIComponent(req.body.opt_cd); if (opt_cd == null || opt_cd == "" || opt_cd == "undefined" || opt_cd == undefined) opt_cd = "";
    var opt_val1 = decodeURIComponent(req.body.opt_val1); if (opt_val1 == null || opt_val1 == "" || opt_val1 == "undefined" || opt_val1 == undefined) opt_val1 = "";
    var opt_val2 = decodeURIComponent(req.body.opt_val2); if (opt_val2 == null || opt_val2 == "" || opt_val2 == "undefined" || opt_val2 == undefined) opt_val2 = "";
    var opt_val3 = decodeURIComponent(req.body.opt_val3); if (opt_val3 == null || opt_val3 == "" || opt_val3 == "undefined" || opt_val3 == undefined) opt_val3 = "";
    var qty = decodeURIComponent(req.body.qty); if (qty == null || qty == "" || qty == "undefined" || qty == undefined) qty = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";



    if (cart_seq == null || cart_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    if (cart_opt_seq == null || cart_opt_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_opt_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }
    if (qty == null || qty == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "qty is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.cart_seq = cart_seq;
    param.cart_opt_seq = cart_opt_seq;
    param.product_cd = product_cd;
    param.opt_cd = opt_cd;
    param.opt_val1 = opt_val1;
    param.opt_val2 = opt_val2;
    param.opt_val3 = opt_val3;
    param.qty = qty;

    sql = mybatisMapper.getStatement('cart', 'product_stock_check', param, fm);
    var [rowPC] = await pool.query(sql);

    if (rowPC == null || rowPC.length == 0) {
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "재고부족", errorCode: -1000, data: null }));
        return;
    }


    sql = mybatisMapper.getStatement('cart', 'upd_cart_opt_qty', param, fm);
    var r1 = await pool.query(sql);

    console.log("update result : " + r1);


    sql = mybatisMapper.getStatement('cart', 'cartInfo', param, fm);
    var [rowC] = await pool.query(sql);

    var js = {};
    if (rowC == null || rowC.length == 0) {
    } else {
        js = rowC[0];
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "장바구니 옵션 수량 변경이 완료되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_cart_updOptQty_post = f10_member_cart_updOptQty_post;






//cart 주문하기
async function f10_member_cart_order_post(req, res) {
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }

    var cust_seq = tc.cust_seq;

    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }


    var cart_seq = decodeURIComponent(req.body.cart_seq); if (cart_seq == null || cart_seq == "" || cart_seq == "undefined" || cart_seq == undefined) cart_seq = "";
    var cart_opt_seq = decodeURIComponent(req.body.cart_opt_seq); if (cart_opt_seq == null || cart_opt_seq == "" || cart_opt_seq == "undefined" || cart_opt_seq == undefined) cart_opt_seq = "";
    var opt_cd = decodeURIComponent(req.body.opt_cd); if (opt_cd == null || opt_cd == "" || opt_cd == "undefined" || opt_cd == undefined) opt_cd = "";
    var opt_val1 = decodeURIComponent(req.body.opt_val1); if (opt_val1 == null || opt_val1 == "" || opt_val1 == "undefined" || opt_val1 == undefined) opt_val1 = "";
    var opt_val2 = decodeURIComponent(req.body.opt_val2); if (opt_val2 == null || opt_val2 == "" || opt_val2 == "undefined" || opt_val2 == undefined) opt_val2 = "";
    var opt_val3 = decodeURIComponent(req.body.opt_val3); if (opt_val3 == null || opt_val3 == "" || opt_val3 == "undefined" || opt_val3 == undefined) opt_val3 = "";
    var qty = decodeURIComponent(req.body.qty); if (qty == null || qty == "" || qty == "undefined" || qty == undefined) qty = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";

    var nomem_or_name = decodeURIComponent(req.body.nomem_or_name); if (nomem_or_name == null || nomem_or_name == "" || nomem_or_name == "undefined" || nomem_or_name == undefined) nomem_or_name = "";
    var nomem_or_pass = decodeURIComponent(req.body.nomem_or_pass); if (nomem_or_pass == null || nomem_or_pass == "" || nomem_or_pass == "undefined" || nomem_or_pass == undefined) nomem_or_pass = "";





    if (cart_seq == null || cart_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cart_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    /*
    if(cart_opt_seq == null || cart_opt_seq== "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({success:false, message:"cart_opt_seq is empty!", errorCode:-100, data:null}));
        return;
    }
    */
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }
    if (qty == null || qty == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "qty is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.cart_seq = cart_seq;
    param.cart_opt_seq = cart_opt_seq;
    param.product_cd = product_cd;
    param.opt_cd = opt_cd;
    param.opt_val1 = opt_val1;
    param.opt_val2 = opt_val2;
    param.opt_val3 = opt_val3;
    param.qty = qty;

    sql = mybatisMapper.getStatement('cart', 'product_stock_check', param, fm);
    var [rowPC] = await pool.query(sql);

    if (rowPC == null || rowPC.length == 0) {
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "재고부족", errorCode: -1000, data: null }));
        return;
    }


    sql = mybatisMapper.getStatement('cart', 'upd_cart_tmp', param, fm);
    var r1 = await pool.query(sql);
    sql = mybatisMapper.getStatement('cart', 'upd_cart_tmp2', param, fm);
    await pool.query(sql);

    console.log("update result : " + r1);


    sql = mybatisMapper.getStatement('cart', 'cartInfo', param, fm);
    var [rowC] = await pool.query(sql);

    var js = {};
    if (rowC == null || rowC.length == 0) {
    } else {
        js = rowC[0];
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "주문하기 상태변경이 완료되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_cart_order_post = f10_member_cart_order_post;





//카트에 넣기
/*
products
    - limit_check, product_cd, qty, stock_seq, option_yn, options(목록)
    options - value_cd, option_gb, option_qty, w_opt

*/
async function f10_member_cart_insert_post(req, res) {
    var tc = "";
    const authHeader = req.headers["authorization"]
    const token = authHeader?.split('Bearer ')[1];
    const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null
    const cust_seq = userData?.cust_seq || null;
    const user_id = userData?.user_id || null

    // tc = await fc.tokenChecker(req, res);
    // if (tc == "") {
    //     return;
    // }

    // if (cust_seq == null || cust_seq == "") {
    //     res.set({
    //         'content-type': 'application/json'
    //     }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
    //     return;
    // }

    var products = req.body.products
    var qty = decodeURIComponent(products[0].qty); if (qty == null || qty == "" || qty == "undefined" || qty == undefined) qty = "";
    //var products = decodeURIComponent(req.body.products); if(products == null || products == "" || products == "undefined" || products == undefined) products = "";
    var iscurr = decodeURIComponent(req.body.iscurr); if (iscurr == null || iscurr == "" || iscurr == "undefined" || iscurr == undefined) iscurr = "";
    var path_gb = decodeURIComponent(req.body.path_gb); if (path_gb == null || path_gb == "" || path_gb == "undefined" || path_gb == undefined) path_gb = "";




    if (products == null || products == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "옵션이 선택되지 않았습니다(products is empty!)", errorCode: -100, data: null }));
        return;
    }
    if (qty == null || qty == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "qty is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    param.cust_seq = cust_seq;
    param.session_id = req.body.sessionId
    param.qty = qty;


    if (iscurr == "T") {
        /** 바로구매 내역 삭제 */
        sql = mybatisMapper.getStatement('cart', 'direct_cart_del', param, fm);
        await pool.query(sql);

        /** 장바구니에 담긴 상품은 tmp_order_yn 상태 변경  */
        sql = mybatisMapper.getStatement('cart', 'direct_cart_delStatus', param, fm);
        await pool.query(sql);
    }

    var result = true;
    for (var n = 0; n < products.length; n++) {
        var product = products[n];


        var cart = {};
        if (product['limit_check'] == "Y") {

            param.product_cd = product['product_cd'];

            sql = mybatisMapper.getStatement('cart', 'checkExistLimitProduct', param, fm);
            var [rowCLP] = await pool.query(sql);
            if (rowCLP.length > 0) {
                res.set({
                    'content-type': 'application/json'
                }).send(JSON.stringify({ success: false, message: "해당 상품은 이미 장바구니에 존재합니다.", errorCode: -1001, data: null }));
                return;
            }
        }


        cart.product_cd = product.product_cd;
        cart.iscurr = iscurr;
        cart.qty = product.qty;
        cart.tmp_order_yn = (iscurr == "F") ? "N" : "Y";
        cart.opt_cd = null;
        cart.cust_seq = cust_seq
        cart.user_id = user_id
        cart.session_id = req.body.sessionId




        /* 재고 체크 */
        if (product.stock_seq != '') {	//재고 seq가 있을 경우 재고 체크를 해준다
            param.stock_seq = product.stock_seq;
            sql = mybatisMapper.getStatement('cart', 'get_product_stock', param, fm);
            var [rowS] = await pool.query(sql);
            var stock_cnt = Number(rowS[0].stock);
            var limit_cnt = Number(rowS[0].limit_cnt);
            var remain_stock = stock_cnt - limit_cnt;

            var eos_yn = rowS[0].eos_yn;

            if (eos_yn == 'Y') {
                var stock_product_nm = rowS[0].stock_product_nm;

                var opt_nm = "";

                if (rowS[0]['opt_nm2_1'] != '') {
                    opt_nm = rowS[0]['opt_nm2_1'];
                }
                if (rowS[0]['opt_nm2_2'] != '') {
                    opt_nm += " / " + rowS[0]['opt_nm2_2'];
                }
                if (rowS[0]['opt_nm2_3'] != '') {
                    opt_nm += " / " + rowS[0]['opt_nm2_3'];
                }

                if ($opt_nm == "") {
                    opt_nm = rowS[0]['opt_nm2_4'];
                }

                res.set({
                    'content-type': 'application/json'
                }).send(JSON.stringify({ success: false, message: "현재 " + stock_product_nm + "( " + opt_nm + " ) 의 품목은 판매종료되었습니다.", errorCode: -1002, data: null }));
                return;
            }

            if (stock_cnt > 0) {
                if (cart.qty > (stock_cnt - limit_cnt)) {
                    var stock_product_nm = rowS[0].stock_product_nm;

                    var opt_nm = "";

                    if (rowS[0]['opt_nm2_1'] != '') {
                        opt_nm = rowS[0]['opt_nm2_1'];
                    }
                    if (rowS[0]['opt_nm2_2'] != '') {
                        opt_nm += " / " + rowS[0]['opt_nm2_2'];
                    }
                    if (rowS[0]['opt_nm2_3'] != '') {
                        opt_nm += " / " + rowS[0]['opt_nm2_3'];
                    }

                    if ($opt_nm == "") {
                        opt_nm = rowS[0]['opt_nm2_4'];
                    }

                    res.set({
                        'content-type': 'application/json'
                    }).send(JSON.stringify({ success: false, message: "현재 " + stock_product_nm + "( " + opt_nm + " ) 의 구매 가능한 재고 수량은 '.$remain_stock.'개 입니다.", errorCode: -1003, data: null }));
                    return;

                }
            }
        }

        /* 재고 체크 */
        if (product['option_yn'] == 'Y') {
            cart.opt_cd = '';
            if (product.options == null || product.options.length == 0) {
            } else {
                for (var m = 0; m < product.options.length; m++) {
                    var option = product.options[m];
                    const sql = mybatisMapper.getStatement("cart", "check_option", { product_cd: cart.product_cd, opt_cd2: option.value_cd.trim() }, fm)
                    const sql2 = mybatisMapper.getStatement("cart", "check_gb", {product_cd: cart.product_cd, opt_cd: option.option_cd}, fm)
                    const [result, ] = await pool.query(sql)
                    const [result2, ] = await pool.query(sql2)
                    if (result.length && result2.length) {
                        cart.opt_cd += option.value_cd.trim() + "/";
                    } else {
                        return res.json({
                            success: false,
                            msg: "invalid opt_cd"
                        })
                    }
                }
            }
        }

        var cart_result = null;
        var exist_cart = null;

        if (iscurr == "F") {
            cart.use_yn = "Y";
            cart.cust_seq = cust_seq;
            cart.user_id = user_id;
            cart.session_id = req.body.sessionId


            sql = mybatisMapper.getStatement('cart', 'exists_cart', cart, fm);

            var [rowEC] = await pool.query(sql);
            exist_cart = rowEC;
            
            if (rowEC == null || rowEC.length == 0) {
            } else {
                cart.cart_seq = rowEC[0].cart_seq;
               
                sql = mybatisMapper.getStatement('cart', 'update_cartOpt', cart, fm);
                console.log(sql);
                await pool.query(sql);


                sql = mybatisMapper.getStatement('cart', 'update_cart', cart, fm);
                var [rowC1] = await pool.query(sql);

                cart_result = rowC1.affectedRows;
            }
        }
       
        if (cart_result == null) {
            //insert
           
            if (path_gb == "") {
                path_gb = fc.checkDeviceType(req.headers['user-agent']);
            }
            cart.path_gb = path_gb;
          
            sql = mybatisMapper.getStatement('cart', 'insert_cart', cart, fm);
            var [rowC] = await pool.query(sql);

            cart.cart_seq = rowC.insertId;

            cart_result = cart.cart_seq;

            if (product.product_gb == "P") {
                cart.gift_main_cart_seq = cart.cart_seq;
            }
        }

        if (cart_result == null) {
            result = false;
            console.log("cart_result == null.... 111");
            continue;
        }

      
        
        if (product.option_yn == "Y" && (exist_cart == null || exist_cart.length == 0)) {
           
            var options_result = true;
            option_c_value_list = [];
            for (var m = 0; m < product.options.length; m++) {
                var option = product.options[m];
                const [check,] = await pool.query(mybatisMapper.getStatement("cart", "check_gb", { opt_cd: option.value_cd, product_cd: cart.product_cd }))
                if (check && check.length) {
                    if (option.option_gb == "I") {
                        var paramO = {};
                        paramO.cart_seq = cart.cart_seq;
                        paramO.opt_gb = option.option_gb;
                        paramO.opt_cd = option.value_cd;
                        paramO.qty = (cart.qty > 0) ? cart.qty : 1;
                        paramO.w_opt = option.w_opt;

                        sql = mybatisMapper.getStatement('cart', 'insert_cart_opt', paramO, fm);
                        var [rowCO] = await pool.query(sql);

                        options_result = (rowCO.insertId >= 0) ? true : false;

                    } else {
                        var paramO = {};
                        paramO.cart_seq = cart.cart_seq;
                        paramO.opt_gb = option.option_gb;
                        paramO.opt_cd = option.value_cd;
                        paramO.qty = (cart.qty > 0) ? cart.qty : 1;
                        paramO.w_opt = option.w_opt;

                        sql = mybatisMapper.getStatement('cart', 'insert_cart_opt', paramO, fm);
                        var [rowCO] = await pool.query(sql);

                        options_result = (rowCO.insertId >= 0) ? true : false;
                    }
                }
            }

            if (!options_result) {
                result = false;
                sql = mybatisMapper.getStatement('cart', 'del_cart', cart, fm);
                await pool.query(sql);

                sql = mybatisMapper.getStatement('cart', 'del_cartOpt', cart, fm);
                await pool.query(sql);

                console.log("!options_result .... 222");
                continue;
            }
        }

    }	//products - for



    if (result) {
        var js = {};
        js = req.body;
        js.cart_cnt = products.length;


        //TODO 회원 비회원 구분은???!!!! 세션 처리는 어떻게?
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "카트에 추가되었습니다.", errorCode: 0, data: js }));
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "장바구니에 담는 도중 에러가 발생하였습니다.", errorCode: -1005, data: result }));
        return;
    }


}
module.exports.f10_member_cart_insert_post = f10_member_cart_insert_post;































//coupon 목록 조회
async function f10_member_mypage_coupon_coupon_lists_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.cust_seq = cust_seq;


    sql = mybatisMapper.getStatement('mypage', 'coupon-update_chk', param, fm);
    await pool.query(sql);


    sql = mybatisMapper.getStatement('mypage', 'coupon-getList', param, fm);
    var [row] = await pool.query(sql);

    var js = row;






    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_coupon_coupon_lists_get = f10_member_mypage_coupon_coupon_lists_get;






//쿠폰 발급
async function f10_member_mypage_coupon_coupon_proc_post(req, res) {

    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;




    var coupon_number = decodeURIComponent(req.body.coupon_number); if (coupon_number == null || coupon_number == "" || coupon_number == "undefined" || coupon_number == undefined) coupon_number = "";

    // 우측의 분홍글씨를 등록하면 해당 쿠폰으로 등록되어 사용될수 있도록 개발필요. 종이쿠폰 적용요청
    //11월 감사편지 쿠폰 91716144
    //==>955E6638AAB1D11EC   →  AMANTE215844DBDB
    if (coupon_number.toUpperCase() == 'AMANTE215844DBDB') {
        coupon_number = '955E6638AAB1D11EC';
    }

    //카톡플친쿠폰(35,000원이상구매) 91138200
    //==>3DB71B238A78311EC   →   3EFC3F4536981E37
    if (coupon_number.toUpperCase() == '3EFC3F4536981E37') {
        coupon_number = '3DB71B238A78311EC';
    }

    //카톡플친쿠폰(30,000원이상구매) 54173722
    //==>120C06E57A78411EC   → 18E4149DD0185351
    if (coupon_number.toUpperCase() == '18E4149DD0185351') {
        coupon_number = '120C06E57A78411EC';
    }

    var sql = "";
    var param = {};
    param.coupon_number = coupon_number;


    sql = mybatisMapper.getStatement('mypage', 'coupon-getCuponNumberData', param, fm);

    var [rowC] = await pool.query(sql);

    if (rowC == null || rowC.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "존재하지 않는 쿠폰번호 입니다.", errorCode: -1100, data: [] }));
        return;
    }

    var coupon_data = rowC[0];





    param.coupon_master_seq = coupon_data.coupon_master_seq;



    sql = mybatisMapper.getStatement('mypage', 'coupon-getUseGb', param, fm);
    var [rowCU] = await pool.query(sql);

    var use_gb = rowCU[0].coupon_use_gb;

    if (use_gb == 0 && coupon_data['use_yn'] == 'Y') {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "이미 발급된 쿠폰입니다.", errorCode: -1101, data: [] }));
        return;
    }


    param.coupon_seq = coupon_data['coupon_seq'];

    param.cust_seq = cust_seq;


    sql = mybatisMapper.getStatement('mypage', 'coupon-isMemberIssued', param, fm);
    var [rowIMI] = await pool.query(sql);


    var my_coupon_yn = rowIMI[0];

    if (use_gb == "1" && (rowIMI != null && rowIMI.length > 0)) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "이미 발급된 쿠폰입니다.", errorCode: -1102, data: [] }));
        return;
    }


    sql = mybatisMapper.getStatement('mypage', 'coupon-getDatePeriod', param, fm);
    var [rowDP] = await pool.query(sql);

    var date_period = rowDP[0];
    var dateT = new Date();
    var edt = new Date(date_period['e_date']);

    if (edt < dateT) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "사용기간이 만료된 쿠폰입니다.", errorCode: -1103, data: [] }));
        return;
    }

    var paramI = {};
    /*
        var todayDate = new Date().toISOString().
                        replace(/T/, ' ').      // replace T with a space
                        replace(/\..+/, '')  ;
    
        console.log(todayDate);
     */
    paramI.coupon_master_seq = coupon_data['coupon_master_seq'];
    paramI.coupon_seq = coupon_data['coupon_seq'];
    paramI.cust_seq = cust_seq;
    paramI.user_id = user_id;
    paramI.use_yn = "N";
    paramI.s_date = date_period['s_date'];
    paramI.e_date = date_period['e_date'];
    paramI.coupon_number = coupon_number;
    //paramI.reg_date						= todayDate;

    // var isR = coupon_issue(paramI, use_gb);
    // console.log(isR);
    coupon_issue(paramI, use_gb).then((json) => {

        if (json.insertId > 0) {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "쿠폰이 발급되었습니다.", errorCode: 0, data: null }));
            return;
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "오류가 발생하였습니다. 잠시 후 다시 시도해주세요.", errorCode: -1104, data: [] }));
            return;
        }
    });

}
module.exports.f10_member_mypage_coupon_coupon_proc_post = f10_member_mypage_coupon_coupon_proc_post;








async function coupon_issue(param, use_gb) {
    var sql = "";

    if (use_gb == "0") {
        var paramU = {};
        paramU.use_yn = "Y";
        paramU.coupon_number = param.coupon_number;


        sql = mybatisMapper.getStatement('mypage', 'coupon-issue', param, fm);
        await pool.query(sql);
    }

    sql = mybatisMapper.getStatement('mypage', 'coupon-issue2', param, fm);

    var [rowI] = await pool.query(sql);

    return rowI;

}




















async function f10_member_mypage_deposit_total_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.cust_seq = cust_seq;




    sql = mybatisMapper.getStatement('mypage', 'deposit-getTotal', param, fm);
    var [rowT] = await pool.query(sql);

    //console.log(sql);

    if (rowT == null || rowT.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: -100, data: null }));
        return;
    }


    var js = rowT[0];


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_deposit_total_get = f10_member_mypage_deposit_total_get;
















async function f10_member_mypage_deposit_list_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.cust_seq = cust_seq;



    var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";

    var row_count = 10;
    var start_num = (page - 1) * row_count;

    param.row_count = row_count;
    param.start_num = start_num;



    sql = mybatisMapper.getStatement('mypage', 'deposit-getList', param, fm);
    var [row] = await pool.query(sql);

    var js = row;



    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_deposit_list_get = f10_member_mypage_deposit_list_get;

























async function f10_member_mypage_mileage_total_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.cust_seq = cust_seq;




    sql = mybatisMapper.getStatement('mypage', 'mileage-getTotal', param, fm);
    var [rowT] = await pool.query(sql);

    //console.log(sql);

    if (rowT == null || rowT.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: -100, data: null }));
        return;
    }


    var js = rowT[0];


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_mileage_total_get = f10_member_mypage_mileage_total_get;
















async function f10_member_mypage_mileage_list_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.cust_seq = cust_seq;



    var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";

    var row_count = 10;
    var start_num = (page - 1) * row_count;

    param.row_count = row_count;
    param.start_num = start_num;



    sql = mybatisMapper.getStatement('mypage', 'mileage-getList', param, fm);
    var [row] = await pool.query(sql);

    var js = row;



    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_mileage_list_get = f10_member_mypage_mileage_list_get;













//push_list 가져오기
async function f10_member_mypage_push_list_get(req, res) {
    //device_id 를 가져와야 함
    var device_id = decodeURIComponent(req.query.device_id); if (device_id == null || device_id == "" || device_id == "undefined" || device_id == undefined) device_id = "";

    if (device_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "device_id is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.device_id = device_id;

    sql = mybatisMapper.getStatement('mypage', 'info-get_push_list', param, fm);
    var [row] = await pool.query(sql);



    var js = row;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}
module.exports.f10_member_mypage_push_list_get = f10_member_mypage_push_list_get;




async function f10_member_mypage_push_setting_get(req, res) {
    //device_id 를 가져와야 함
    var device_id = decodeURIComponent(req.query.device_id); if (device_id == null || device_id == "" || device_id == "undefined" || device_id == undefined) device_id = "";

    if (device_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "device_id is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.device_id = device_id;

    sql = mybatisMapper.getStatement('mypage', 'info-get_push_state', param, fm);
    var [row] = await pool.query(sql);



    var js = row[0];


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}
module.exports.f10_member_mypage_push_setting_get = f10_member_mypage_push_setting_get;






async function f10_member_mypage_push_setting_post(req, res) {
    //device_id 를 가져와야 함
    var device_id = decodeURIComponent(req.body.device_id); if (device_id == null || device_id == "" || device_id == "undefined" || device_id == undefined) device_id = "";
    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";
    var yn = decodeURIComponent(req.body.yn); if (yn == null || yn == "" || yn == "undefined" || yn == undefined) yn = "";

    if (device_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "device_id is empty!", errorCode: -100, data: null }));
        return;
    }
    if (mode == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "mode is empty!", errorCode: -100, data: null }));
        return;
    }
    if (yn == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "yn is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.pd_device_id = device_id;

    if (mode = "push") {
        param.pd_push_yn = yn;
        sql = mybatisMapper.getStatement('mypage', 'info-push_refusal', param, fm);
        await pool.query(sql);

        if (yn == "Y") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "푸시알림이 설정되었습니다.", errorCode: 0, data: null }));
            return;
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "푸시알림 동의거부 일자 : " + fc.getToday2(), errorCode: 0, data: null }));
            return;
        }
    } else if (mode == "ad") {
        param.pd_ad_yn = yn;
        sql = mybatisMapper.getStatement('mypage', 'info-ad_refusal', param, fm);
        await pool.query(sql);

        if (yn == "Y") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "광고성 정보 수신이 설정되었습니다.", errorCode: 0, data: null }));
            return;
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "광고성 정보 수신거부 일자 : " + fc.getToday2(), errorCode: 0, data: null }));
            return;
        }
    } else if (mode == "night") {
        param.pd_night_yn = yn;
        sql = mybatisMapper.getStatement('mypage', 'info-night_refusal', param, fm);
        await pool.query(sql);

        if (yn == "Y") {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "야간 수신이 설정되었습니다.", errorCode: 0, data: null }));
            return;
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "야간 수신거부 일자 : " + fc.getToday2(), errorCode: 0, data: null }));
            return;
        }
    }



    var js = row[0];


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}
module.exports.f10_member_mypage_push_setting_post = f10_member_mypage_push_setting_post;
















async function f10_member_mypage_wish_list_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        /*
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({success:false, message:"authorization is empty!", errorCode:-100, data:null}));
        */
        return;
    }


    var cust_seq = tc.cust_seq;
    // var cust_seq = "107290920";

    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};

    param.cust_seq = cust_seq;



    var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
    var sh_s_date = decodeURIComponent(req.query.sh_s_date); if (sh_s_date == null || sh_s_date == "" || sh_s_date == "undefined" || sh_s_date == undefined) sh_s_date = "";
    var sh_e_date = decodeURIComponent(req.query.sh_e_date); if (sh_e_date == null || sh_e_date == "" || sh_e_date == "undefined" || sh_e_date == undefined) sh_e_date = "";
    var sh_stock_yn = decodeURIComponent(req.query.sh_stock_yn); if (sh_stock_yn == null || sh_stock_yn == "" || sh_stock_yn == "undefined" || sh_stock_yn == undefined) sh_stock_yn = "";
    var sh_order_by = decodeURIComponent(req.query.sh_order_by); if (sh_order_by == null || sh_order_by == "" || sh_order_by == "undefined" || sh_order_by == undefined) sh_order_by = "";

    var row_count = 6;
    var start_num = (page - 1) * row_count;

    param.row_count = row_count;
    param.start_num = start_num;
    param.group_cd = "3001";
    param.sh_s_date = sh_s_date;
    param.sh_e_date = sh_e_date;
    param.sh_stock_yn = sh_stock_yn;
    param.sh_order_by = sh_order_by;



    sql = mybatisMapper.getStatement('mypage', 'wish-get_list', param, fm);
    var [row] = await pool.query(sql);


    js.wish_list = row;

    var option1_count = [];

    for (var n = 0; n < row.length; n++) {
        var wish_list = row[n];

        var paramP = {};
        paramP.product_cd = wish_list['product_cd'];
        paramP.opt_gb = "C";


        sql = mybatisMapper.getStatement('product', 'get_product_option1_list', paramP, fm);
        var [rowPO] = await pool.query(sql);
        row[n].product_option = rowPO;

        row[n].option1_count = rowPO.length;

        option1_count.push(rowPO.length);
    }

    js.option1_count = option1_count;



    //## 함께 연출할 코디 전체 갯수
    sql = mybatisMapper.getStatement('product', 'get_shop_total', param, fm);

    var [rowPT] = await pool.query(sql);

    js.total_count = rowPT[0]['count'];


    if (js.total_count > 0 && row_count > 0) {
        js.total_page = Math.ceil(js.total_count / row_count);
    } else {
        js.page = page;
        js.row_count = 6;
        js.start_num = 0;		//limit 시작위치
        js.total_page = Math.ceil(js.total_count / js.row_count);
    }




    // 함께 연출할 코디
    sql = mybatisMapper.getStatement('product', 'get_shop_list', param, fm);
    var [rowP] = await pool.query(sql);

    js.group_list = rowP;

    var group_option1_count = [];

    for (var n = 0; n < row.length; n++) {
        var group_list = row[n];

        var paramP = {};
        paramP.product_cd = group_list['product_cd'];
        paramP.opt_gb = "C";


        sql = mybatisMapper.getStatement('product', 'get_product_option1_list', paramP, fm);
        var [rowPO] = await pool.query(sql);
        row[n].product_option = rowPO;

        row[n].group_option1_count = rowPO.length;

        group_option1_count.push(rowPO.length);
    }
    js.group_option1_count = group_option1_count;




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_wish_list_get = f10_member_mypage_wish_list_get;










async function f10_member_mypage_wish_proc_post(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    if (product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }
    if (mode == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "mode is empty!", errorCode: -100, data: null }));
        return;
    }




    var sql = "";


    var param = {};
    param.cust_seq = cust_seq;
    param.product_cd = product_cd;





    if (mode == "ADD") {
        sql = mybatisMapper.getStatement('mypage', 'wish-exists_wishlist', param, fm);
        var [rowW] = await pool.query(sql);
        if (rowW != null && rowW.length > 0) {
            //이미 등록
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "이미 관심상품으로 등록되어있습니다.", errorCode: -1105, data: null }));
            return;
        } else {
            sql = mybatisMapper.getStatement('mypage', 'wish-insert_wishlist', param, fm);
            var [rowWI] = await pool.query(sql);
        }
    } else if (mode == "DEL") {
        sql = mybatisMapper.getStatement('mypage', 'wish-del_wishlist', param, fm);
        var [rowWD] = await pool.query(sql);
    }



    sql = mybatisMapper.getStatement('mypage', 'wish-get_total', param, fm);
    var [rowT] = await pool.query(sql);

    var js = {};
    js.count = rowT[0].count;


    if (mode == "ADD") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "관심상품에 추가되었습니다.", errorCode: 0, data: js }));
    } else if (mode == "DEL") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "관심상품에 삭제되었습니다.", errorCode: 0, data: js }));
    }

}
module.exports.f10_member_mypage_wish_proc_post = f10_member_mypage_wish_proc_post;







async function f10_member_mypage_index_review_list(req, res) {
    var sql = "";
    var param = {};

    sql = mybatisMapper.getStatement('mypage', 'review-index_review_list', param, fm);

    var [row] = await pool.query(sql);


    var js = row;

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "SUCCESS", errorCode: 0, data: js }));

}
module.exports.f10_member_mypage_index_review_list = f10_member_mypage_index_review_list;




// async function f10_member_mypage_review_list_get(req, res) {
//     var token = "";
//     var tc = "";
//     let authHeader = req.headers["authorization"];
//     tc = await fc.tokenChecker(req, res);
//     if (tc == "") {
//         return;
//     }


//     var cust_seq = tc.cust_seq;
//     var user_id = tc.user_id;


//     if (user_id == null || user_id == "") {
//         res.set({
//             'content-type': 'application/json'
//         }).send(JSON.stringify({ success: false, message: "user_id is empty!", errorCode: -100, data: null }));
//         return;
//     }

//     var param = {};
//     var sql = "";


//     param.cust_seq = cust_seq;
//     param.user_id = user_id;



//     var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
//     var row_count = 5;
//     var start_num = (page - 1) * row_count;


//     var keyword = decodeURIComponent(req.query.keyword); if (keyword == null || keyword == "" || keyword == "undefined" || keyword == undefined) keyword = "";
//     var category = decodeURIComponent(req.query.category); if (category == null || category == "" || category == "undefined" || category == undefined) category = "";
//     var sorting = decodeURIComponent(req.query.sorting); if (sorting == null || sorting == "" || sorting == "undefined" || sorting == undefined) sorting = "";
//     var photo = decodeURIComponent(req.query.photo); if (photo == null || photo == "" || photo == "undefined" || photo == undefined) photo = "";


//     param.start_num = start_num;
//     param.row_count = row_count;
//     param.keyword = keyword;
//     param.category = category;
//     param.sorting = sorting;
//     param.photo = photo;

//     sql = mybatisMapper.getStatement('mypage', 'review-getList', param, fm);
//     var [row] = await pool.query(sql);

//     var js = row;


//     res.set({
//         'content-type': 'application/json'
//     }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

// }
async function f10_member_mypage_review_list_get(req, res) {





    var param = {};
    var sql = "";


    // param.cust_seq = cust_seq;
    // param.user_id = user_id;



    var page = decodeURIComponent(req.query.page); if (page == null || page == "" || page == "undefined" || page == undefined) page = "1";
    var row_count = 5;
    var start_num = (page - 1) * row_count;


    var keyword = decodeURIComponent(req.query.keyword); if (keyword == null || keyword == "" || keyword == "undefined" || keyword == undefined) keyword = "";
    var category = decodeURIComponent(req.query.category); if (category == null || category == "" || category == "undefined" || category == undefined) category = "";
    var sorting = decodeURIComponent(req.query.sorting); if (sorting == null || sorting == "" || sorting == "undefined" || sorting == undefined) sorting = "";
    var photo = decodeURIComponent(req.query.photo); if (photo == null || photo == "" || photo == "undefined" || photo == undefined) photo = "";

    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == "" || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";


    param.start_num = start_num;
    param.row_count = row_count;
    param.keyword = keyword;
    param.category = category;
    param.sorting = sorting;
    param.photo = photo;
    param.cust_seq = cust_seq;

    sql = mybatisMapper.getStatement('mypage', 'review-getList', param, fm);
    var [row] = await pool.query(sql);

    var js = row;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}
module.exports.f10_member_mypage_review_list_get = f10_member_mypage_review_list_get;



async function f10_member_mypage_review_isWrite_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";


    var js = {};


    param.cust_seq = cust_seq;
    param.user_id = user_id;


    var product_cd = decodeURIComponent(req.query.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    var ocode = decodeURIComponent(req.query.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
    var use_review_seq = decodeURIComponent(req.query.use_review_seq); if (use_review_seq == null || use_review_seq == "" || use_review_seq == "undefined" || use_review_seq == undefined) use_review_seq = "";

    var mode = decodeURIComponent(req.query.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";

    param.product_cd = product_cd;
    param.ocode = ocode;
    param.use_review_seq = use_review_seq;


    sql = mybatisMapper.getStatement('mypage', 'review-ExistProduct', param, fm);
    var [rowPC] = await pool.query(sql);

    if (rowPC == null || rowPC.length == 0 || rowPC[0].cnt == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "해당 상품은 존재하지 않거나 구매하지 않으셨습니다.", errorCode: -1106, data: null }));
        return;
    }

    if (mode == "N") {
        //public function getOrderList($cust_seq){
        sql = mybatisMapper.getStatement('mypage', 'review-getOrderList1', param, fm);
        var [rowOL1] = await pool.query(sql);


        sql = mybatisMapper.getStatement('mypage', 'review-getOrderList2', param, fm);
        var [rowOL2] = await pool.query(sql);

        var productList = [];
        for (var n = 0; n < rowOL1.length; n++) {
            var isIn = false;
            for (var m = 0; m < rowOL2.length; m++) {
                if (rowOL1[n]['product_cd'] == rowOL2[m]['product_cd']) {
                    isIn = true;
                    break;
                }
            }

            if (isIn == false) {
                productList.push(rowOL1[n]);
            }
        }

        js.productList = productList;

        sql = mybatisMapper.getStatement('mypage', 'review-checkProduct', param, fm);
        var [rowCP] = await pool.query(sql);

        var review_cnt = rowCP[0]['cnt'];



        sql = mybatisMapper.getStatement('mypage', 'review-purchasedProduct', param, fm);
        var [rowPP] = await pool.query(sql);

        var purchased_cnt = rowPP.length;


        console.log("review_cnt : " + review_cnt + " / purchased_cnt : " + purchased_cnt);
        if (review_cnt >= purchased_cnt) {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "해당 상품은 이미 리뷰를 작성하셨습니다.", errorCode: -1107, data: null }));
            return;
        }


        sql = mybatisMapper.getStatement('mypage', 'review-chk_ocode', param, fm);
        var [rowCO] = await pool.query(sql);


        var chk_ocode = rowCO[0]['cnt'];

        if (chk_ocode > 0) {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "해당 주문코드의 상품은 이미 리뷰를 작성하셨습니다.", errorCode: -1108, data: null }));
            return;
        }
    } else if (mode == "U") {
        sql = mybatisMapper.getStatement('mypage', 'review-getView', param, fm);
        var [rowV] = await pool.query(sql);

        var view = rowV[0];

        js.view = view;


        sql = mybatisMapper.getStatement('mypage', 'review-getMyPoint', param, fm);
        var [rowMP] = await pool.query(sql);

        var point = rowMP;

        js.point = point;

        if (rowV == null || rowV.length == 0) {	// 수정해야 할 정보가 없을때
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "올바른 경로가 아닙니다.", errorCode: -1109, data: null }));
            return;
        }

        if (view['reserved_yn'] == 'Y') {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "적립금이 부여된 리뷰는 수정 및 삭제가 불가합니다.", errorCode: -1110, data: null }));
            return;
        }

    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "올바른 경로가 아닙니다.", errorCode: -1109, data: null }));
        return;
    }


    sql = mybatisMapper.getStatement('mypage', 'review-getProductName', param, fm);
    var [rowPN] = await pool.query(sql);

    var product = rowPN[0];
    js.product = product;


    param.code_cd1 = "3100";
    sql = mybatisMapper.getStatement('mypage', 'review-getCode', param, fm);
    var [rowC] = await pool.query(sql);
    var code = rowC[0];

    js.code = code;




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));


}
module.exports.f10_member_mypage_review_isWrite_get = f10_member_mypage_review_isWrite_get;






async function f10_member_mypage_review_proc_post(req, res) {


    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};


    param.cust_seq = cust_seq;
    param.user_id = user_id;
    param.user_nm = user_nm;
    param.phone = phone;





    var title = decodeURIComponent(req.body.title); if (title == null || title == "" || title == "undefined" || title == undefined) title = "";
    var content = decodeURIComponent(req.body.content); if (content == null || content == "" || content == "undefined" || content == undefined) content = "";

    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";

    if (mode == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "mode is empty!", errorCode: -100, data: null }));
        return;
    }
    if (title == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "title is empty!", errorCode: -100, data: null }));
        return;
    }
    if (content == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "content is empty!", errorCode: -100, data: null }));
        return;
    }

    param.title = title;
    param.content = content;

    param.file_nm1 = '';
    param.file_nm2 = '';
    param.file_nm3 = '';
    param.file_nm4 = '';
    param.file_nm5 = '';


    var hp = decodeURIComponent(req.body.hp); if (hp == null || hp == "" || hp == "undefined" || hp == undefined) hp = "";
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    var point = decodeURIComponent(req.body.point); if (point == null || point == "" || point == "undefined" || point == undefined) point = "";
    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";

    param.hp = hp;			//TODO phone 로 변경 가능(로그인시 token 에 묻어 넣음)
    param.product_cd = product_cd;
    param.point = point;
    param.ocode = ocode;




    if (mode == "N") {
        param.review_gb = "N";

        //var fileNameList = [];


        if (req.files == null || req.files == "" || req.files == "undefined" || req.files == undefined) {
        } else {
            for (var i = 0; i < req.files.length; i++) {
                var newFileName = config.reviewDir + req.files[i].filename + path.extname(req.files[i].originalname);
                //fileNameList.push("html/" + newFileName);

                fs.rename(req.files[i].path, "html/" + newFileName, function (err) {
                    if (err) {
                        console.log("err : "); console.log(err);
                    }
                });

                param.review_gb = "P";

                param['file_nm' + i] = req.files[i].filename + path.extname(req.files[i].originalname);
            }
        }
        param.code_cd1 = "3100";
        sql = mybatisMapper.getStatement('mypage', 'review-getCode', param, fm);
        var [rowC] = await pool.query(sql);
        var code = rowC[0];

        var avg = 0;
        var cnt = 0;
        for (var i = 0; i < rowC.length; i++) {
            avg += rowC[i]['code_cd2'];
            cnt++;
        }
        param.avg = avg / cnt;

        sql = mybatisMapper.getStatement('mypage', 'review-insert', param, fm);
        var [rowR] = await pool.query(sql);

        //console.log(sql);

        var use_review_seq = rowR.insertId;



        for (var n = 0; n < rowC.length; n++) {
            /*
            $pointInsert = array(
                            'product_cd'	=>	$data['product_cd'],
                            'code_cd2'		=>	$code['code_cd2'],
                            'point'			=>	$data[$code['code_cd2']],			//point 값이.. 배열 형태로 code_cd2 값 명칭으로 들어옴
                            'user_id'		=>	$data['user_id'],
                            'user_nm'		=>  $data['user_nm'],
                            'reg_date'		=>	date("Y-m-d H:i:s"),
                            'use_review_seq'=>  $use_review_seq
                    );
            */
            var paramP = {};
            paramP.product_cd = product_cd;
            paramP.code_cd2 = rowC[n]['code_cd2'];
            try {
                paramP.point = req.body[paramP.code_cd2];
            } catch (err) {
                paramP.point = 0;
            }
            if (paramP.point == undefined) paramP.point = 0;
            paramP.user_id = user_id;
            paramP.user_nm = user_nm;
            paramP.use_review_seq = use_review_seq;

            //console.log(paramP);


            sql = mybatisMapper.getStatement('mypage', 'review-pointInsert', paramP, fm);
            await pool.query(sql);
        }
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "등록되였습니다.", errorCode: 0, data: js }));
    } else if (mode == "U") {
        param.review_gb = "N";

        var use_review_seq = decodeURIComponent(req.body.use_review_seq); if (use_review_seq == null || use_review_seq == "" || use_review_seq == "undefined" || use_review_seq == undefined) use_review_seq = "";


        //var fileNameList = [];


        if (req.files == null || req.files == "" || req.files == "undefined" || req.files == undefined) {
            for (var i = 0; i < req.files.length; i++) {
                var newFileName = config.reviewDir + req.files[i].filename + path.extname(req.files[i].originalname);
                //fileNameList.push("html/" + newFileName);

                fs.rename(req.files[i].path, "html/" + newFileName, function (err) {
                    if (err) {
                        console.log("err : "); console.log(err);
                    }
                });

                param.review_gb = "P";

                param['file_nm' + i] = req.files[i].filename + path.extname(req.files[i].originalname);
            }
        }

        /*점수*/
        //기존 점수 항목 삭제
        sql = mybatisMapper.getStatement('mypage', 'review-deletePoint', param, fm);
        await pool.query(sql);

        param.code_cd1 = "3100";
        sql = mybatisMapper.getStatement('mypage', 'review-getCode', param, fm);
        var [rowC] = await pool.query(sql);
        var code = rowC[0];

        var avg = 0;
        var cnt = 0;
        for (var i = 0; i < rowC.length; i++) {
            avg += rowC[i]['code_cd2'];
            cnt++;
        }

        for (var n = 0; n < rowC.length; n++) {
            /*
            $pointInsert = array(
                            'product_cd'	=>	$data['product_cd'],
                            'code_cd2'		=>	$code['code_cd2'],
                            'point'			=>	$data[$code['code_cd2']],			//point 값이.. 배열 형태로 code_cd2 값 명칭으로 들어옴
                            'user_id'		=>	$data['user_id'],
                            'user_nm'		=>  $data['user_nm'],
                            'reg_date'		=>	date("Y-m-d H:i:s"),
                            'use_review_seq'=>  $use_review_seq
                    );
            */
            var paramP = {};
            paramP.product_cd = product_cd;
            paramP.code_cd2 = rowC[n]['code_cd2'];
            try {
                paramP.point = req.body[paramP.code_cd2];
            } catch (err) {
                paramP.point = 0;
            }
            paramP.user_id = user_id;
            paramP.user_nm = user_nm;
            paramP.use_review_seq = use_review_seq;


            sql = mybatisMapper.getStatement('mypage', 'review-pointInsert', paramP, fm);
            await pool.query(sql);
        }


        param.avg = avg / cnt;


        sql = mybatisMapper.getStatement('mypage', 'review-update', param, fm);
        await pool.query(sql);

        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "수정되었습니다.", errorCode: 0, data: js }));
    }
}
module.exports.f10_member_mypage_review_proc_post = f10_member_mypage_review_proc_post;






async function f10_member_mypage_review_del_delete(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};

    param.cust_seq = cust_seq;
    param.user_id = user_id;
    param.user_nm = user_nm;


    var use_review_seq = decodeURIComponent(req.body.use_review_seq); if (use_review_seq == null || use_review_seq == "" || use_review_seq == "undefined" || use_review_seq == undefined) use_review_seq = "";
    if (use_review_seq == null || use_review_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "use_review_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }
    param.use_review_seq = use_review_seq;
    param.product_cd = product_cd;


    sql = mybatisMapper.getStatement('mypage', 'review-getPhoto', param, fm);
    var [rowP] = await pool.query(sql);

    var photo = rowP[0];


    if (photo['file_nm1'] != null && photo['file_nm1'] != "") fs.unlinkSync("html/" + config.reviewDir + photo['file_nm1']);
    if (photo['file_nm2'] != null && photo['file_nm2'] != "") fs.unlinkSync("html/" + config.reviewDir + photo['file_nm2']);
    if (photo['file_nm3'] != null && photo['file_nm3'] != "") fs.unlinkSync("html/" + config.reviewDir + photo['file_nm3']);
    if (photo['file_nm4'] != null && photo['file_nm4'] != "") fs.unlinkSync("html/" + config.reviewDir + photo['file_nm4']);
    if (photo['file_nm5'] != null && photo['file_nm5'] != "") fs.unlinkSync("html/" + config.reviewDir + photo['file_nm5']);


    sql = mybatisMapper.getStatement('mypage', 'review-deleteReview', param, fm);
    await pool.query(sql);

    sql = mybatisMapper.getStatement('mypage', 'review-deletePoint', param, fm);
    await pool.query(sql);

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "삭제되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_review_del_delete = f10_member_mypage_review_del_delete;




async function f10_member_mypage_review_procComment_post(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;


    if (cust_seq == null || cust_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "cust_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};

    param.cust_seq = cust_seq;
    param.user_id = user_id;
    param.user_nm = user_nm;


    var use_review_seq = decodeURIComponent(req.body.use_review_seq); if (use_review_seq == null || use_review_seq == "" || use_review_seq == "undefined" || use_review_seq == undefined) use_review_seq = "";
    if (use_review_seq == null || use_review_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "use_review_seq is empty!", errorCode: -100, data: null }));
        return;
    }
    var comment = decodeURIComponent(req.body.comment); if (comment == null || comment == "" || comment == "undefined" || comment == undefined) comment = "";
    if (comment == null || comment == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "comment is empty!", errorCode: -100, data: null }));
        return;
    }

    param.use_review_seq = use_review_seq;
    param.comment = comment;

    sql = mybatisMapper.getStatement('mypage', 'review-InsertComment', param, fm);
    await pool.query(sql);

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "등록되었습니다.", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_review_procComment_post = f10_member_mypage_review_procComment_post;





async function f10_member_mypage_review_getComment_get(req, res) {
    var use_review_seq = decodeURIComponent(req.query.use_review_seq); if (use_review_seq == null || use_review_seq == "" || use_review_seq == "undefined" || use_review_seq == undefined) use_review_seq = "";
    if (use_review_seq == null || use_review_seq == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "use_review_seq is empty!", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    param.use_review_seq = use_review_seq;

    sql = mybatisMapper.getStatement('mypage', 'review-getComment', param, fm);
    var [row] = await pool.query(sql);

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: row }));
}
module.exports.f10_member_mypage_review_getComment_get = f10_member_mypage_review_getComment_get;


























































async function f10_member_mypage_order_order_lists_get(req, res) {
    /*
    ##검색조건 기본값 설정
    #if (count($data['sh_data']) === 0) {
    #	$sh_s_date = date("Y-m-d",strtotime ("-1 months"));
    #	$sh_e_date = date("Y-m-d");
    #    $data['sh_data'] = ['sh_s_date' => $sh_s_date,'sh_e_date' => $sh_e_date];
    #}
    */


    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};


    param.cust_seq = cust_seq;
    param.user_id = user_id;
    param.user_nm = user_nm;
    param.phone = phone;


    var sh_s_date = decodeURIComponent(req.query.sh_s_date); if (sh_s_date == null || sh_s_date == "" || sh_s_date == "undefined" || sh_s_date == undefined) sh_s_date = "";
    var sh_e_date = decodeURIComponent(req.query.sh_e_date); if (sh_e_date == null || sh_e_date == "" || sh_e_date == "undefined" || sh_e_date == undefined) sh_e_date = "";



    param.sh_s_date = sh_s_date;
    param.sh_e_date = sh_e_date;






    //## 주문상품 리스트
    var arr_list = [];
    sql = mybatisMapper.getStatement('mypage', 'morder-get_order_list', param, fm);

    var [rowO] = await pool.query(sql);


    for (var n = 0; n < rowO.length; n++) {
        var row = rowO[n];

        var arr_plist = [];


        var paramO = {};
        paramO.ocode = rowO[n]['ocode'];
        sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product', paramO, fm);
        var [rowOP] = await pool.query(sql);

        for (var m = 0; m < rowOP.length; m++) {
            var p_row = rowOP[m];
            paramO.product_ocode = p_row['product_ocode'];
            sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product', paramO, fm);
            var [rowOL] = await pool.query(sql);
            p_row.option_list = rowOL;

            arr_plist.push(p_row);
        }

        row.product_list = arr_plist;


        if (row['order_gb'] == "G") {
            sql = mybatisMapper.getStatement('order', 'get_order_info', paramO, fm);
            var [rowOI] = await pool.query(sql);
            if (rowOI != null && rowOI.length > 0) {
                //#카카오 선물하기 일경우
                var order_info = rowOI[0];
                if (order_info['order_gb'] == "G" && order_info['gift_gb'] == "K" && order_info['done_yn'] == "N" && order_info['order_state_cd'] == "20") {
                    var url = "https://" + config.PHP_SERVER + "/shop/order/gift_confirm?ocode=" + row['ocode'] + "&ran_cd=" + order_info['ran_cd'];
                    /**
                    * 카카오 링크 연동시 단축url은 인식못함
                    *$short_url = short_url($url);
                    **/
                    //var meg_info = fn_gift_msg_create(order_info, url);	 //#전달할 메시지 생성
                    //row['meg_info'] = meg_info;
                    row['meg_info'] = "";
                    row['order_info'] = order_info;
                }
            }
        }


        arr_list.push(row);


    }

    var js = {};
    js['order_list'] = arr_list;

    sql = mybatisMapper.getStatement('common', 'get_code_list', { "code_cd1": "1200" }, fm);
    var [rowRGL] = await pool.query(sql);
    js['refund_gb_list'] = rowRGL;

    sql = mybatisMapper.getStatement('common', 'get_code_list', { "code_cd1": "3400" }, fm);
    var [rowCGL] = await pool.query(sql);
    js['cancel_gb_list'] = rowCGL;

    js['kakao_config'] = config.social_login.kakao_login;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_order_order_lists_get = f10_member_mypage_order_order_lists_get;






async function f10_member_mypage_order_pre_order_lists_get(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";

    var js = {};


    param.cust_seq = cust_seq;
    param.user_id = user_id;
    param.user_nm = user_nm;
    param.phone = phone;



    param.ocode = "";



    sql = mybatisMapper.getStatement('mypage', 'morder-get_pre_order_list', param, fm);
    var [rowO] = await pool.query(sql);


    var arr_list = [];
    for (var n = 0; n < rowO.length; n++) {
        var row = rowO[n];

        var paramO = {};
        paramO = row['ocode'];
        paramO.user_id = user_id;


        sql = mybatisMapper.getStatement('mypage', 'morder-get_pre_order_list', paramO, fm);
        var [rowOP] = await pool.query(sql);

        row['product_list'] = rowOP;

        arr_list.push(row);
    }

    js.order_list = arr_list;



    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_order_pre_order_lists_get = f10_member_mypage_order_pre_order_lists_get;









/**
 * [AJAX] 주문 PROC
 * @return [type] [description]
 */
async function f10_member_mypage_order_cancel_proc_ajax_post(req, res) {

    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var email = tc.email;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";



    param.cust_seq = cust_seq;
    param.user_nm = user_nm;
    param.email = email;
    param.phone = phone;




    var js = {};









    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";

    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
    var vart_refund_depositor = decodeURIComponent(req.body.vart_refund_depositor); if (vart_refund_depositor == null || vart_refund_depositor == "" || vart_refund_depositor == "undefined" || vart_refund_depositor == undefined) vart_refund_depositor = "";
    var vact_refund_account = decodeURIComponent(req.body.vact_refund_account); if (vact_refund_account == null || vact_refund_account == "" || vact_refund_account == "undefined" || vact_refund_account == undefined) vact_refund_account = "";
    var vart_refund_bank_cd = decodeURIComponent(req.body.vart_refund_bank_cd); if (vart_refund_bank_cd == null || vart_refund_bank_cd == "" || vart_refund_bank_cd == "undefined" || vart_refund_bank_cd == undefined) vart_refund_bank_cd = "";


    var cancel_gb_txt = decodeURIComponent(req.body.cancel_gb_txt); if (cancel_gb_txt == null || cancel_gb_txt == "" || cancel_gb_txt == "undefined" || cancel_gb_txt == undefined) cancel_gb_txt = "";
    var cancel_gb = decodeURIComponent(req.body.cancel_gb); if (cancel_gb == null || cancel_gb == "" || cancel_gb == "undefined" || cancel_gb == undefined) cancel_gb = "";
    var cancel_txt = decodeURIComponent(req.body.cancel_txt); if (cancel_txt == null || cancel_txt == "" || cancel_txt == "undefined" || cancel_txt == undefined) cancel_txt = "";

    if (mode == "ORDER_CANCEL") {
        var status = "";
        var msg = "";
        var cust_ip = req.headers["X-FORWARDED-FOR"];
        if (cust_ip == null) {
            cust_ip = req.connection.remoteAddress;
        }


        param.ocode = ocode;




        sql = mybatisMapper.getStatement('mypage', 'morder-get_order_info', param, fm);
        var [row] = await pool.query(sql);



        if (row != null && row.length > 0) {
            var order_info = row[0];
            var order_state_cd = order_info['order_state_cd'];
            var otype_cd = order_info['otype_cd'];
            var tid = order_info['tid'];
            var order_price = order_info['order_price'];


            var res_cd = null;
            var res_msg = null;

            if (order_state_cd == "10" || order_state_cd == "20") {
                var upt_order_state_cd = "50";


                var template_cd = "";

                if (order_state_cd == "10") template_cd = "order_application";
                else template_cd = "deposit_cancellation";


                if (otype_cd == "10" || otype_cd == "20" || otype_cd == "30" || otype_cd == "40") {
                    //#토스 결제취소
                    //#toss config set
                    //TODO toss_config 정보가 없음.

                    var toss = {
                        "toss_secret": ""
                    };
                    var toss_url = "https://api.tosspayments.com/v1/payments/" + tid + "/cancel";

                    authHeader = fc.base64_encode(toss.toss_secret + ":");

                    var pay_data = {};
                    if (otype_cd == "10" && vact_refund_account != "") {
                        pay_data.cancelReason = "사용자취소";
                        pay_data.cancelAmount = order_price;
                        pay_data.refundReceiveAccount = {
                            "bank": vart_refund_bank_cd,
                            "accountNumber": vact_refund_account,
                            "holderName": vart_refund_depositor
                        }
                    } else {
                        pay_data.cancelReason = "사용자취소";
                        pay_data.cancelAmount = order_price;
                    }

                    var url = toss_url;

                    var header = [
                        "Authorization: Basic " + authHeader,
                        "Content-Type: application/json"
                    ];

                    //
                    var result = await fc.sendRequestPost(url, pay_data, header);
                    var rstJson = JSON.parse(result.body);

                    if (result.response.statusCode.toString() == "200") {
                        if (rstJson.status == "CANCELED") {
                            res_cd = "0000";
                        }
                    } else {
                        res_msg = rstJson.message;
                    }
                } else if (otype_cd == "70") {
                    //#카카오페이 취소
                    //TODO kakaopay_config 정보가 없음.
                    var kakaopay = {
                        "adminkey": "",
                        "cid": ""
                    };
                    var kakaopay_url = "https://kapi.kakao.com/v1/payment/cancel";
                    var pay_data = {
                        "cid": kakaopay.cid,
                        "tid": tid,
                        "cancel_amount": order_price,
                        "cancel_tax_free_amount": 0
                    };
                    var header = [
                        "Authorization: KakaoAK " + kakaopay.adminkey,
                        "Content-Type: application/x-www-form-urlencoded;charset=utf-8"
                    ];
                    var result = await fc.sendRequestPost(kakaopay_url, pay_data, header);
                    var rstJson = JSON.parse(result.body);
                    if (result.response.statusCode.toString() == "200") {
                        if (rstJson.status == "CANCEL_PAYMENT") {
                            res_cd = "0000";
                        }
                    }
                } else if (otype_cd == "100") {
                    //npay
                    //TODO npay_direct 정보 없음
                    var npay_direct = {
                        "npay_domain": "",
                        "client_id": "",
                        "client_secret": ""
                    };

                    var url = npay_direct.npay_domain + "/naverpay-partner/naverpay/payments/v1/cancel";

                    var header = [
                        "X-Naver-Client-Id: " + npay_direct.client_id,
                        "X-Naver-Client-Secret: " + npay_direct.client_secret,
                        "Content-Type: application/x-www-form-urlencoded"
                    ];

                    var pay_data = {
                        "paymentId": tid,
                        "cancelAmount": order_price,
                        "taxScopeAmount": order_price,
                        "cancelReason": "사용자 취소(" + cancel_gb_txt + ")",
                        "taxExScopeAmount": 0,
                        "cancelRequester": 1
                    };


                    var result = await fc.sendRequestPost(url, pay_data, header);
                    var rstJson = JSON.parse(result.body);
                    if (result.response.statusCode.toString() == "200") {
                        res_cd = rstJson.code;

                        if (res_cd == "Success" || res_cd == "CancelNotComplete") {
                            res_cd = "0000";
                        }
                    }
                } else if (otype_cd == "50" || otype_cd == "60") {
                    //#적립금, 무통장입금 결제일경우
                    res_cd = "0000";
                }


                if (res_cd == "0000") {
                    //#CARD UPDATE
                    if (vart_refund_depositor != "") {
                        var paramCU = {
                            vart_refund_bank_cd: vart_refund_bank_cd,
                            vact_refund_account: vact_refund_account,
                            vart_refund_depositor: vart_refund_depositor,
                            ocode: ocode
                        };

                        sql = mybatisMapper.getStatement('mypage', 'morder-order_card_update', paramCU, fm);
                        await pool.query(sql);
                    }




                    //#ORDER UPDATE
                    if (otype_cd == "10") {
                        //가상계좌 취소시엔 가상계좌 입금취소 사유(S:시스템, U:사용자) 추가 업데이트
                        var paramCU = {
                            order_state_cd: upt_order_state_cd,
                            cancel_gb: cancel_gb,
                            cancel_txt: cancel_txt,
                            vact_cancel_gb: 'U'
                        };

                        sql = mybatisMapper.getStatement('mypage', 'morder-order_update', paramCU, fm);
                        await pool.query(sql);
                    } else {
                        var paramCU = {
                            order_state_cd: upt_order_state_cd,
                            cancel_gb: cancel_gb,
                            cancel_txt: cancel_txt,
                            ocode: ocode
                        };
                        sql = mybatisMapper.getStatement('mypage', 'morder-order_update1-1', paramCU, fm);
                        await pool.query(sql);
                    }



                    //#COUPON UPDATE
                    if (order_info['coupon_member_seq'] != null) {
                        var paramCU = {
                            coupon_member_seq: order_info['coupon_member_seq']
                        };
                        sql = mybatisMapper.getStatement('mypage', 'morder-order_coupon_update', paramCU, fm);
                        await pool.query(sql);
                    }


                    //#RESERVE UPDATE
                    if (order_info['use_reserve'] > 0) {
                        var reserve_array = {
                            state: "P",
                            reserve: order_info['use_reserve'],
                            frommlg: "213",
                            reference: "사용자 주문취소",
                            ocode: '',
                            user_id: user_id,
                            cust_seq: cust_seq,
                        };
                        await fc.reserve_public(reserve_array);

                    }


                    //#DEPOSIT UPDATE
                    if (order_info['use_deposit'] > 0) {
                        var deposit_array = {
                            state: "P",
                            deposit: order_info['use_reserve'],
                            frommlg: "213",
                            reference: "사용자 주문취소",
                            ocode: '',
                            user_id: user_id,
                            cust_seq: cust_seq,
                        };
                        await fc.deposit_public(deposit_array);
                    }



                    //#수동발급한 현금영수증이 있을경우 취소
                    await cash_receipts_cancel_proc(order_info);



                    //#STOCK UPDATE
                    sql = mybatisMapper.getStatement('mypage', 'morder-order_stock_update', param, fm);
                    await pool.query(sql);



                    //#order history insert
                    var paramHI = {
                        ocode: ocode,
                        order_state_cd: order_state_cd
                    };
                    sql = mybatisMapper.getStatement('mypage', 'morder-order_history', paramHI, fm);
                    await pool.query(sql);



                    //#SMS_SEND			TODO 처리를 해야함.
                    //$this->kakao_manager->sendKakao($template_cd, $ocode);


                    status = "ok";
                    msg = "주문취소가 정상처리 되었습니다.";
                } else {
                    status = "err";
                    msg = "PG 통신중 오류가 발생했습니다. (" + res_msg + ")";
                }

            } else {
                status = "err";
                msg = "주문취소 가능한 상태가 아닙니다.";
            }

        } else {
            status = "err";
            msg = "주문정보가 잘못 되었습니다.";
        }



    }

    js.status = status;
    js.msg = msg;

    if (status == "ok") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: msg, errorCode: -600, data: null }));
    }


}
module.exports.f10_member_mypage_order_cancel_proc_ajax_post = f10_member_mypage_order_cancel_proc_ajax_post;





async function cash_receipts_cancel_proc(order_info) {
    var sql = "";


    sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_receipts_info', order_info, fm);
    var [row] = await pool.query(sql);

    if (row != null && row.length > 0) {
        var receipts_info = row[0];

        var pay_data = {
            receiptKey: receipts_info['receipt_key']
        };
        var toss = {
            "toss_secret": ""
        };
        var toss_url = "https://api.tosspayments.com/v1/payments/" + tid + "/cancel";

        authHeader = fc.base64_encode(toss.toss_secret + ":");

        var url = toss_url;

        var header = [
            "Authorization: Basic " + authHeader,
            "Content-Type: application/json"
        ];

        //
        var result = await fc.sendRequestPost(url, pay_data, header);
        var rstJson = JSON.parse(result.body);


        if (result.response.statusCode.toString() == "200") {
            var param1 = {
                state: "C",
                ocode: order_info['ocode'],
                receipt_key: rstJson['receiptKey'],
                receipt_url: rstJson['receiptUrl']
            };


            sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_receipts_insert', param1, fm);
            await pool.query(sql);





            var param2 = {
                ocode: order_info['ocode'],
                cash_yn: "N"
            };


            sql = mybatisMapper.getStatement('mypage', 'morder-cash_state_update', param2, fm);
            await pool.query(sql);
        }




    }

}







async function f10_member_mypage_order_order_proc_ajax_post(req, res) {
    var token = "";
    var tc = "";


    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var email = tc.email;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }

    var param = {};
    var sql = "";



    param.cust_seq = cust_seq;
    param.user_nm = user_nm;
    param.email = email;
    param.phone = phone;




    var js = {};











    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";


    if (mode == "RE_ORDER") {
        var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";

        //#장바구니 바로구매 담긴상품 삭제
        sql = mybatisMapper.getStatement('mypage', 'morder-delete_cart_prdouct', param, fm);
        await pool.query(sql);

        //#주문할 상품목록 조회
        param.ocode = ocode;
        sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product_list', param, fm);
        var [rowOC] = await pool.query(sql);

        var tot_cart_seq = "";

        for (var n = 0; n < rowOC.length; n++) {
            var row = rowOC[n];

            var paramCPI = {
                cust_seq: row['cust_seq'],
                user_id: row['user_id'],
                session_id: '',
                product_cd: row['product_cd'],
                iscurr: 'T',
                use_yn: 'N',
                opt_cd: row['opt_cd'],
                tmp_order_yn: 'Y',
                qty: row['qty'],
                path_gb: fc.checkDeviceType(req.headers['user-agent'])
            };

            sql = mybatisMapper.getStatement('mypage', 'morder-cart_product_insert', paramCPI, fm);
            var [rowCI] = await pool.query(sql);

            var cart_seq = rowCI.insertId;


            if (tot_cart_seq == "") {
                tot_cart_seq = cart_seq;
            } else {
                tot_cart_seq = tot_cart_seq + "," + cart_seq;
            }


            if (row['opt_cd'] != "") {
                var paramOPO = {
                    ocode: ocode,
                    product_ocode: row['product_ocode']
                };
                sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product_opt_list', paramOPO, fm);
                var [rowOPL] = await pool.query(sql);

                for (var m = 0; m < rowOPL.length; m++) {
                    var o_row = rowOPL[m];

                    var opt_arrays = {
                        cart_seq: cart_seq,
                        qty: o_row['opt_qty'],
                        opt_gb: o_row['opt_gb'],
                        opt_cd: o_row['opt_cd'],
                        w_opt: o_row['w_opt']
                    };

                    //#cart_opt_data_insret
                    sql = mybatisMapper.getStatement('mypage', 'morder-cart_product_opt_insert', opt_arrays, fm);
                    await pool.query(sql);
                }
            }
        }

        js.cart_seq = tot_cart_seq;

        //#담긴상품 재고확인
        param.cart_seq = tot_cart_seq;


        sql = mybatisMapper.getStatement('cart', 'cart_stock_check', param, fm);
        var [rowCL] = await pool.query(sql);

        if (rowCL != null && rowCL.length > 0) {
            //#장바구니 바로구매 담긴상품 삭제
            sql = mybatisMapper.getStatement('mypage', 'morder-delete_cart_prdouct', param, fm);
            await pool.query(sql);

            //재고 부족
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "재고부족", errorCode: -600, data: rowCL }));
            return;
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
            return;
        }
    } else if (mode == "REFUND_WRITE") {

        var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
        var product_ocode = decodeURIComponent(req.body.product_ocode); if (product_ocode == null || product_ocode == "" || product_ocode == "undefined" || product_ocode == undefined) product_ocode = "";
        var refund_gb = decodeURIComponent(req.body.refund_gb); if (refund_gb == null || refund_gb == "" || refund_gb == "undefined" || refund_gb == undefined) refund_gb = "";
        var refund_gb_msg = decodeURIComponent(req.body.refund_gb_msg); if (refund_gb_msg == null || refund_gb_msg == "" || refund_gb_msg == "undefined" || refund_gb_msg == undefined) refund_gb_msg = "";
        var content = decodeURIComponent(req.body.content); if (content == null || content == "" || content == "undefined" || content == undefined) content = "";

        var opt_cd = decodeURIComponent(req.body.opt_cd); if (opt_cd == null || opt_cd == "" || opt_cd == "undefined" || opt_cd == undefined) opt_cd = "";
        var qty = decodeURIComponent(req.body.qty); if (qty == null || qty == "" || qty == "undefined" || qty == undefined) qty = "";


        var state = "10";

        param.state = state;
        param.ocode = ocode;
        param.product_ocode = product_ocode;
        param.refund_gb = refund_gb;
        param.refund_gb_msg = refund_gb_msg;
        param.content = content;


        sql = mybatisMapper.getStatement('mypage', 'morder-refund_insert', param, fm);
        var [rowRI] = await pool.query(sql);



        if (rowRI.insertId >= 0) {
            var insert_seq = rowRI.insertId;
            //##반품신청
            if (refund_gb == "20") {
                //#SMS_SEND		TODO SMS SEND 처리 해야함.
                //$this->kakao_manager->sendKakao("order_return_receipt", $insert_seq);
            } else if (refund_gb == "10") {		//##교환신청
                var opt_cdList = opt_cd.split(",");

                for (var m = 0; m < opt_cdList.length; m++) {
                    var row1 = opt_cdList[m];
                    if (row1 != "") {
                        var opt = row1.split("/");
                        var order_opt = {
                            refund_seq: insert_seq,
                            qty: qty,
                            opt_cd: opt[0],
                            opt_gb: opt[1]
                        };

                        sql = mybatisMapper.getStatement('mypage', 'morder-change_opt_insert', order_opt, fm);
                        await pool.query(sql);
                    }
                }
            }

            //정상처리
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "정상처리되었습니다.", errorCode: 0, data: js }));
            return;

        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: "등록중 오류가 발생했습니다.", errorCode: -600, data: rowCL }));
            return;
        }

    }



}
module.exports.f10_member_mypage_order_order_proc_ajax_post = f10_member_mypage_order_order_proc_ajax_post;






/**
 * [AJAX] 교환/반품 할 상품정보 조회
 * @return [type] [description]
 */
async function f10_member_mypage_order_refund_product_ajax_post(req, res) {
    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
    var product_ocode = decodeURIComponent(req.body.product_ocode); if (product_ocode == null || product_ocode == "" || product_ocode == "undefined" || product_ocode == undefined) product_ocode = "";

    var sql = "";
    var param = {
        ocode: ocode,
        product_ocode: product_ocode
    };


    sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product', param, fm);
    var [rowOP] = await pool.query(sql);



    var arr_plist = [];

    for (var n = 0; n < rowOP.length; n++) {
        var p_row = rowOP[n];
        param.product_ocode = p_row.product_ocode;

        sql = mybatisMapper.getStatement('mypage', 'morder-get_order_product_option', param, fm);
        var [rowOL] = await pool.query(sql);

        p_row.option_list = rowOL;

        arr_plist.push(p_row);
    }

    var js = arr_plist;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "SUCCESS", errorCode: 0, data: js }));
}
module.exports.f10_member_mypage_order_refund_product_ajax_post = f10_member_mypage_order_refund_product_ajax_post;






/**
 * [AJAX] 교환/반품 할 환불 배송비 계산
 * @return [type] [description]
 */
async function f10_member_mypage_order_refund_trans_price_ajax_post(req, res) {
    var token = "";
    var tc = "";
    let authHeader = req.headers["authorization"];
    tc = await fc.tokenChecker(req, res);
    if (tc == "") {
        return;
    }


    var cust_seq = tc.cust_seq;
    var user_id = tc.user_id;
    var user_nm = tc.user_nm;
    var phone = tc.phone;


    if (user_id == null || user_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "로그인 후 이용할 수 있습니다.", errorCode: -100, data: null }));
        return;
    }


    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
    var product_ocode = decodeURIComponent(req.body.product_ocode); if (product_ocode == null || product_ocode == "" || product_ocode == "undefined" || product_ocode == undefined) product_ocode = "";

    var sql = "";
    var param = {
        cust_seq: cust_seq,
        user_id: user_id,
        user_nm: user_nm,
        phone: phone,
        ocode: ocode,
        product_ocode: product_ocode
    };


    sql = mybatisMapper.getStatement('mypage', 'morder-get_refund_trans_price_info', param, fm);
    var [rowOI] = await pool.query(sql);



    var refund_trans_price = 0;


    if (rowOI != null && rowOI.length > 0) {
        var order_info = rowOI[0];

        if (order_info['trans_price'] > 0) {
            refund_trans_price = 3500;
        } else {
            if (order_info['mod_product_price'] >= 50000) {
                refund_trans_price = 3500;
            } else {
                refund_trans_price = 7000;
            }
        }

        var js = {};
        js.refund_trans_price = refund_trans_price;
        js.refund_product_price = order_info['refund_product_price'];

        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "SUCCESS", errorCode: 0, data: js }));
        return;
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "SUCCESS", errorCode: 0, data: null }));
}
module.exports.f10_member_mypage_order_refund_trans_price_ajax_post = f10_member_mypage_order_refund_trans_price_ajax_post;



















/**
 * [AJAX] 교환 할 상품 옵션 리스트
 * @return [type] [description]
 */
async function f10_member_mypage_order_refund_product_opt_ajax_post(req, res) {
    var product_cd = decodeURIComponent(req.body.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";

    var sql = "";

    var js = {};

    var param = {
        product_cd: product_cd,
        opt_gb: "C"
    };


    //## 조합옵션
    sql = mybatisMapper.getStatement('product', 'get_product_option1_list', param, fm);
    var [product_option1_c_arr] = await pool.query(sql);

    js.product_option1_c_arr = product_option1_c_arr;


    if (product_option1_c_arr != null && product_option1_c_arr.length > 0) {
        for (var n = 0; n < product_option1_c_arr.length; n++) {
            var opt1_row = product_option1_c_arr[n];

            sql = mybatisMapper.getStatement('product', 'get_product_option2_list', opt1_row, fm);

            var [rowO] = await pool.query(sql);

            js['product_option2_arr_' + opt1_row['opt_cd1']] = rowO;

        }
    }


    //## 개별옵션
    param.opt_gb = "S";
    sql = mybatisMapper.getStatement('product', 'get_product_option1_list', param, fm);
    var [product_option1_s_arr] = await pool.query(sql);

    js.product_option1_s_arr = product_option1_s_arr;


    if (product_option1_s_arr != null && product_option1_s_arr.length > 0) {
        for (var n = 0; n < product_option1_s_arr.length; n++) {
            var opt1_row = product_option1_s_arr[n];

            sql = mybatisMapper.getStatement('product', 'get_product_option2_list', opt1_row, fm);

            var [rowO] = await pool.query(sql);

            js['product_option2_arr_' + opt1_row['opt_cd1']] = rowO;

        }
    }


    //## 독립옵션(추가옵션)
    param.opt_gb = "I";
    sql = mybatisMapper.getStatement('product', 'get_product_option1_list', param, fm);
    var [product_option1_i_arr] = await pool.query(sql);

    js.product_option1_i_arr = product_option1_i_arr;


    if (product_option1_i_arr != null && product_option1_i_arr.length > 0) {
        for (var n = 0; n < product_option1_i_arr.length; n++) {
            var opt1_row = product_option1_i_arr[n];

            sql = mybatisMapper.getStatement('product', 'get_product_option2_list', opt1_row, fm);

            var [rowO] = await pool.query(sql);

            js['product_option2_arr_' + opt1_row['opt_cd1']] = rowO;

        }
        js.product_view = {};
        js.product_view.product_soldout_yn = "N";			//옵션이 있을 경우 별도로 체크하기에 여기선 N으로 표시
        js.product_view.product_stock = 1;					//옵션이 있을 경우 별도로 체크하기에 여기선 1로 표시
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "SUCCESS.", errorCode: 0, data: js }));
    return;
}
module.exports.f10_member_mypage_order_refund_product_opt_ajax_post = f10_member_mypage_order_refund_product_opt_ajax_post;






















async function f10_member_mypage_order_cash_receipts_proc_post(req, res) {
    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";
    var registrationNumber = decodeURIComponent(req.body.registrationNumber); if (registrationNumber == null || registrationNumber == "" || registrationNumber == "undefined" || registrationNumber == undefined) registrationNumber = "";
    var receipt_type = decodeURIComponent(req.body.receipt_type); if (receipt_type == null || receipt_type == "" || receipt_type == "undefined" || receipt_type == undefined) receipt_type = "";


    var sql = "";
    var param = {};
    param.ocode = ocode;


    sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_order_info', param, fm);
    var [rowOI] = await pool.query(sql);


    var order_info = rowOI[0];

    var product_nm = order_info['product_nm'];


    if (order_info['p_cnt'] > 1) {
        product_nm += " 외" + order_info['p_cnt'];
    }


    var pay_data = {};
    pay_data.amount = order_info['order_price'];
    pay_data.orderId = ocode;
    pay_data.orderName = product_nm;
    pay_data.registrationNumber = registrationNumber;
    pay_data.type = receipt_type;


    //TODO toss_config 정보가 없음.

    var toss = {
        "toss_secret": ""
    };
    var toss_url = "https://api.tosspayments.com/v1/cash-receipts";
    var authHeader = fc.base64_encode(toss.toss_secret + ":");
    var header = [
        "Authorization: Basic " + authHeader,
        "Content-Type: application/json"
    ];


    var result = await fc.sendRequestPost(toss_url, pay_data, header);
    var rstJson = JSON.parse(result.body);



    if (result.response.statusCode.toString() == "200") {
        var paramCRI = {};
        paramCRI.state = "W";
        paramCRI.ocode = ocode;
        paramCRI.receipt_key = rstJson.receiptKey;
        paramCRI.receipt_url = rstJson.receiptUrl;

        sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_receipts_insert', paramCRI, fm);
        await pool.query(sql);

        paramCRI.cash_yn = "Y";
        sql = mybatisMapper.getStatement('mypage', 'morder-cash_state_update', paramCRI, fm);
        await pool.query(sql);


        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: "정상적으로 처리되었습니다.", errorCode: 0, data: rstJson }));
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: rstJson.message, errorCode: -600, data: rstJson }));
    }


}
module.exports.f10_member_mypage_order_cash_receipts_proc_post = f10_member_mypage_order_cash_receipts_proc_post;






async function f10_member_mypage_order_cash_receipts_cancel_proc_post(req, res) {
    var ocode = decodeURIComponent(req.body.ocode); if (ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) ocode = "";

    var sql = "";
    var param = {};
    param.ocode = ocode;


    sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_receipts_info', param, fm);
    var [rowRI] = await pool.query(sql);




    if (rowRI != null && rowRI.length > 0) {
        var receipts_info = rowRI[0];

        var pay_data = {};
        pay_data.receiptKey = receipts_info['receiptKey'];

        //#toss config set
        //TODO toss_config 정보가 없음.

        var toss = {
            "toss_secret": ""
        };
        var toss_url = "https://api.tosspayments.com/v1/cash-receipts/" + receipts_info['receipt_key'] + "/cancel";
        var authHeader = fc.base64_encode(toss.toss_secret + ":");
        var header = [
            "Authorization: Basic " + authHeader,
            "Content-Type: application/json"
        ];


        var result = await fc.sendRequestPost(toss_url, pay_data, header);
        var rstJson = JSON.parse(result.body);


        if (result.response.statusCode.toString() == "200") {
            var paramCRI = {};
            paramCRI.state = "C";
            paramCRI.ocode = ocode;
            paramCRI.receipt_key = rstJson.receiptKey;
            paramCRI.receipt_url = rstJson.receiptUrl;

            sql = mybatisMapper.getStatement('mypage', 'morder-get_cash_receipts_insert', paramCRI, fm);
            await pool.query(sql);

            paramCRI.cash_yn = "N";
            sql = mybatisMapper.getStatement('mypage', 'morder-cash_state_update', paramCRI, fm);
            await pool.query(sql);

            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: true, message: "정상적으로 처리되었습니다.", errorCode: 0, data: rstJson }));
        } else {
            res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({ success: false, message: rstJson.message, errorCode: -600, data: rstJson }));
        }
    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "주문 정보를 찾을 수 없습니다.", errorCode: -700, data: null }));
    }
}
module.exports.f10_member_mypage_order_cash_receipts_cancel_proc_post = f10_member_mypage_order_cash_receipts_cancel_proc_post;




function f10_naver_login_get(req, res) {
    // uncomment these code when production
    // const {client_id, client_secret, redirect_uri, authorize_url} = config.social_login.naver_login 
    //---------------------------------

    //Comment these code when production
    const client_id = "3Z89ZQNHmmCvEUXw0USd" //for testing only
    const redirect_uri = 'http://localhost:3010/v1.0/login/naver/callback' //for testing only 
    const authorize_url = 'https://nid.naver.com/oauth2.0/authorize' //for testing only 
    //---------------------------------

    const url = `${authorize_url}?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&state=123`;
    return res.redirect(url);
    // res.set({
    //     'content-type': 'application/json'
    // }).send(JSON.stringify({ success: true, data: url }));
}


module.exports.f10_naver_login_get = f10_naver_login_get

async function f10_naver_login_callback_get(req, res) {
    // uncomment these code when production
    // const {client_id, client_secret, redirect_uri, authorize_url, info_url, token_url } = config.social_login.naver_login
    //-------------------

    // comment these code when production
    const client_id = "3Z89ZQNHmmCvEUXw0USd" //for testing only
    const client_secret = "__6157Z9A_" //for testing only
    const redirect_uri = 'http://localhost:3010/v1.0/login/naver/callback' //for testing only
    const token_url = 'https://nid.naver.com/oauth2.0/token' //for testing only
    const info_url = 'https://openapi.naver.com/v1/nid/me' //for testing only
    //-------------------

    const { code } = req.query;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('code', code);
    params.append('state', '123');
    params.append('redirect_uri', redirect_uri);
    const response = await axios.post(`${token_url}`, params);
    const { access_token } = response.data;

    // Use access token to make API requests to Naver
    const profileResponse = await axios.get(info_url, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });

    const { response: profile } = profileResponse.data;

    var paramInfo = {};
    paramInfo.sns_id = profileResponse.data.id;
    sql = mybatisMapper.getStatement('member', 'get_mem_sns_info', paramInfo, fm);
    const [sns_info] = await pool.query(sql);
    if (sns_info.length > 0) {
        var paramCust = {};

        paramCust.cust_seq = sns_info[0].cust_seq;
        sql = mybatisMapper.getStatement('member', 'get_mem_info1', paramCust, fm);

        const [mem_info] = await pool.query(sql);
        let login_gb = 'U';

        var js = {};
        js = mem_info[0];
        var token = jwt.sign({
            "cust_seq": js.cust_seq,
            "user_id": js.user_id,
            "user_nm": js.user_nm,
            "phone": js.phone,
            "member_grp_cd": js.member_grp_cd,
            "email": js.email
        }, SECRET_KEY, {
            algorithm: 'HS256'
            /*
            algorithm:'HS256',
            
            audience:'ojin.infomine.kr',
            //expiresIn: '15m', // 15분 유효
            issuer: 'msstore',
            */
            , expiresIn: '24h', // 24시간 유효
        });

        js.token = token;

        await pool.query(mybatisMapper.getStatement("member", "log_login", {
            login_gb: login_gb,
            login_id: mem_info[0].user_id,
            login_nm: mem_info[0].user_nm,
            reg_ip: req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp,
            user_agent: req.headers["user-agent"]
        }, fm))

        // Return profile data as JSON response
        return res.redirect(`http://localhost:3000/shop/login/login/?token=${token}&user_id=${mem_info[0].user_id}`);

    } else {
        return res.redirect(`http://localhost:3000/shop/join/join/?token=${access_token}&social=N`);
    }

    // res.set({
    //     'content-type': 'application/json'
    // }).send(JSON.stringify({ success: true, data: profile, access_token }));
}

module.exports.f10_naver_login_callback_get = f10_naver_login_callback_get

async function f10_kakao_login_get(req, res) {
    // const { client_id, redirect_uri, authorize_url } = config.social_login.kakao_login
    let url_callback = req.query.url;
    let paramInfo = {}
    paramInfo.url = url_callback;

    await pool.query(mybatisMapper.getStatement('member', 'create_temporary', paramInfo, fm));


    const client_id = 'ff993824fe91225b04cebee4afd3b192';
    const redirect_uri = 'http://localhost:3010/v1.0/login/kakao/callback';
    const authorize_url = 'https://kauth.kakao.com/oauth/authorize';


    const url = `${authorize_url}?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`;
    return res.redirect(url);
    // res.set({
    //     'content-type': 'application/json'
    // }).send(JSON.stringify({ success: true, data: url }));
}

module.exports.f10_kakao_login_get = f10_kakao_login_get


async function f10_kakao_login_callback(req, res) {
    const { code } = req.query;
    const client_id = 'ff993824fe91225b04cebee4afd3b192';
    const redirect_uri = 'http://localhost:3010/v1.0/login/kakao/callback';
    const token_url = 'https://kauth.kakao.com/oauth/token';
    const info_url = 'https://kapi.kakao.com/v2/user/me';

    // Exchange authorization code for access token
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', client_id);
    params.append('redirect_uri', redirect_uri);
    params.append('code', code);

    const response = await axios.post(token_url, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
    });

    const { access_token } = response.data;
    console.log(access_token);
    //     const  [result] = await pool.query(mybatisMapper.getStatement('member', 'get_temporary',  fm));

    // await pool.query(mybatisMapper.getStatement('member', 'detete_temporary',  fm));

    // // Use access token to make API requests to Kakao
    const profileResponse = await axios.get(info_url, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    var paramInfo = {};
    paramInfo.sns_id = profileResponse.data.id;
    sql = mybatisMapper.getStatement('member', 'get_mem_sns_info', paramInfo, fm);
    const [sns_info] = await pool.query(sql);

    if (sns_info.length > 0) {
        var paramCust = {};

        paramCust.cust_seq = sns_info[0].cust_seq;
        sql = mybatisMapper.getStatement('member', 'get_mem_info', paramCust, fm);

        const [mem_info] = await pool.query(sql);
        let login_gb = 'U';

        var js = {};
        js = mem_info[0];
        var token = jwt.sign({
            "cust_seq": js.cust_seq,
            "user_id": js.user_id,
            "user_nm": js.user_nm,
            "phone": js.phone,
            "member_grp_cd": js.member_grp_cd,
            "email": js.email
        }, SECRET_KEY, {
            algorithm: 'HS256'
            /*
            algorithm:'HS256',
            
            audience:'ojin.infomine.kr',
            //expiresIn: '15m', // 15분 유효
            issuer: 'msstore',
            */
            , expiresIn: '24h', // 24시간 유효
        });

        js.token = token;

        await pool.query(mybatisMapper.getStatement("member", "log_login", {
            login_gb: login_gb,
            login_id: mem_info[0].user_id,
            login_nm: mem_info[0].user_nm,
            reg_ip: req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp,
            user_agent: req.headers["user-agent"]
        }, fm))

        // Return profile data as JSON response
        return res.redirect(`http://localhost:3000/shop/login/login/?token=${token}&user_id=${mem_info[0].user_id}`);

    } else {
        return res.redirect(`http://localhost:3000/shop/join/join/?token=${access_token}&social=K`);
    }

    // return res.redirect(`${result[0].url}?token=${access_token}&social=K`);

}

module.exports.f10_kakao_login_callback_get = f10_kakao_login_callback

async function f10_naver_logout_get(req, res) {
    const access_token = req.headers["naver-authorization"]
    if (access_token) {
        const response = await axios({
            method: 'POST',
            url: 'https://kapi.kakao.com/v1/user/logout',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
        });
        return res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, data: response.data }))
    }
    return res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: false }));
}

module.exports.f10_naver_logout_get = f10_naver_logout_get



async function f10_kakao_logout_get(req, res) {
    const access_token = req.headers["kakao-authorization"]
    if (access_token) {
        const response = await axios({
            method: 'POST',
            url: 'https://kapi.kakao.com/v1/user/logout',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
        });
        return res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, data: response.data }))
    }
    return res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: false }));
}
module.exports.f10_kakao_logout_get = f10_kakao_logout_get

async function verify_access_token(req, res) {
    try {
        var token = req.headers["authorization"]
        var auto_login = decodeURIComponent(req.query.auto_login); if (auto_login == null || auto_login == "undefined" || auto_login == undefined) auto_login = "N"
        if (token != "" || token != undefined || token != null) {
            let access_token = token.split(" ")[1]
            var decoded = jwt.verify(access_token, SECRET_KEY, { algorithms: 'HS256' })
            var current_time = Math.floor(Date.now() / 1000)
            if (decoded.exp < current_time && auto_login == "Y") {
                access_token = jwt.sign({
                    cust_seq: decoded.cust_seq,
                    user_id: decoded.user_id,
                    user_nm: decoded.user_nm,
                    email: decoded.e_date,
                    pass_change_date: decoded.pass_change_date,
                    member_grp_cd: decoded.member_grp_cd
                }, SECRET_KEY, { algorithm: 'HS256' })
            }

            return res.send({
                success: true,
                expires: decoded.exp < current_time,
                token: access_token
            })
        }

        return res.send({ success: false, message: "token is empty!" })
    } catch (error) {
        console.log(error)
        return res.send({
            success: false,
            message: "Error"
        })

    }
}

module.exports.verify_access_token = verify_access_token



async function get_cart_num_by_cust_seq(req, res) {
    try {
        const session_id = req.query.sessionId

        const [result] = await pool.query(mybatisMapper.getStatement('cart', 'get_cart_num_by_cust_seq', { session_id }, fm))
        res.send({ success: true, cartCount: result[0].count })

    } catch (error) {
        res.send({ success: false, message: error.message })
    }
}
module.exports.get_cart_num_by_cust_seq = get_cart_num_by_cust_seq

async function f10_member_phone_check(req, res) {
    var phone = decodeURIComponent(req.body.phone); if (phone == null || phone == undefined || phone == "undefined") phone = ""
    var name = decodeURIComponent(req.body.name); if (name == null || name == undefined || name == "undefined") name = ""
    var mode = decodeURIComponent(req.body.mode); if (mode == null || mode == undefined || mode == "undefined") mode = ""

    if (mode == "") {
        return res.set({
            'content-type': 'application/json'
        }).send({ success: false, msg: "mode is empty!" })
    }

    if (name == "") {
        return res.send({
            'content-type': 'application/json'
        }).send({ success: false, msg: "회원명을 입력해주세요." })
    }


    if (phone == "") {
        return res.set({
            'content-type': 'application/json'
        }).send({ success: false, msg: "전화번호가 필요합니다" })
    }

    var cert_num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    var ip = req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp

    if (mode == "mod") {
        var [checkMem,] = await pool.query(mybatisMapper.getStatement("member", "check_phone_name", { user_nm: name, phone }, fm))
        if (checkMem[0].cnt) {
            return res.set({
                'content-type': 'application/json'
            }).send({ success: false, msg: "이미 가입정보가 있는 회원입니다. 아이디 찾기를 진행하시겠습니까?" })
        }

        var certResult = await pool.query(mybatisMapper.getStatement("member", "cert_insert", {
            hp: phone,
            cert_num,
            ip
        }, fm))

        if (certResult[0].insertId) {
            await kakaoManager.send_msg(phone, "[아망떼] 회원가입 인증번호", `[아망떼] \\r\\n 인증번호 ${cert_num} 를 입력해 주세요.`)
            return res.set({
                'content-type': 'application/json'
            }).send({
                success: true,
                msg: '인증번호가 발송되었습니다.'
            })
        }
        return res.set({
            'content-type': 'application/json'
        }).send({
            success: false,
            msg: "인증번호 발송 중 오류가 발생했습니다."
        })

    } else {
        var certResult = await pool.query(mybatisMapper.getStatement("member", "cert_insert", {
            hp: phone,
            cert_num,
            ip
        }, fm))

        if (certResult[0].insertId) {
            await kakaoManager.send_msg(phone, "[아망떼] 마이페이지 연락처 수정", `[아망떼] \\r\\n 인증번호 ${cert_num} 를 입력해 주세요.`)
            return res.set({
                'content-type': 'application/json'
            }).send({
                success: true,
                msg: '인증번호가 발송되었습니다.'
            })
        }

        return res.set({
            'content-type': 'application/json'
        }).send({
            success: false,
            msg: "인증번호 발송 중 오류가 발생했습니다."
        })
    }
}
module.exports.f10_member_phone_check = f10_member_phone_check

async function f10_phone_code_check(req, res) {
    var hp = decodeURIComponent(req.body.phone); if (hp == "undefined" || hp == undefined || hp == null) hp = "";
    var cert_num = decodeURIComponent(req.body.cert_num); if (cert_num == "undefined" || cert_num == undefined || cert_num == null) cert_num = ""
    if (hp == "") {
        return res.send({
            success: false,
            msg: "phone is empty!"
        })
    }

    if (cert_num == "") {
        return res.send({
            success: false,
            msg: "cert_num is empty!"
        })
    }

    var sql = mybatisMapper.getStatement("member", "cert_num_check", { hp, cert_num }, fm)
    var [result,] = await pool.query(sql)
    if (result[0].count) {
        await pool.query(mybatisMapper.getStatement("member", "cert_update", { hp, cert_num }, fm))
        return res.send({
            success: true,
            msg: "인증이 완료되었습니다."
        })
    }

    return res.send({
        success: false,
        msg: "인증번호가 일치하지 않습니다."
    })
}

module.exports.f10_phone_code_check = f10_phone_code_check

async function f10_wishlist_click_on_post(req, res) {
    var product_cd = decodeURIComponent(req.body.product_cd);
    var custseq = decodeURIComponent(req.query.cust_seq);

    if (product_cd == "" || product_cd == undefined || product_cd == "undefined" || product_cd == "null") {
        return res.send({
            success: false,
            message: 'product_cd is empty'
        })
    }

    if (custseq == "" || custseq == undefined || custseq == "undefined" || custseq == "null") {
        return res.send({
            success: false,
            message: 'cust_seq is empty'
        })
    }

    await pool.query(mybatisMapper.getStatement("member", "insert_wishlist", { custseq, product_cd, opt_cd: "" }, fm));

    return res.send({
        success: true,
        message: 'success'
    })
}

module.exports.f10_wishlist_click_on_post = f10_wishlist_click_on_post

async function f10_wishlist_click_off_post(req, res) {
    var product_cd = decodeURIComponent(req.body.product_cd);
    var custseq = decodeURIComponent(req.query.cust_seq);

    if (product_cd == "" || product_cd == undefined || product_cd == "undefined" || product_cd == "null") {
        return res.send({
            success: false,
            message: 'product_cd is empty'
        })
    }

    if (custseq == "" || custseq == undefined || custseq == "undefined" || custseq == "null") {
        return res.send({
            success: false,
            message: 'cust_seq is empty'
        })
    }

    await pool.query(mybatisMapper.getStatement("member", "remove_wishlist", { custseq, product_cd }, fm));

    return res.send({
        success: true,
        message: 'success'
    })
}

module.exports.f10_wishlist_click_off_post = f10_wishlist_click_off_post


async function f10_cart_price_get(req, res) {


    let custseq1 = req.query.cart_seq;

    var custseq = "";

    for (var n = 0; n < custseq1.length; n++) {

        custseq += " , '" + custseq1[n] + "' ";
    }
    custseq = custseq.substr(3);
    param = { custseq: custseq };
    let sql = mybatisMapper.getStatement("cart", "getTransNew", param, fm);
    var [row] = await pool.query(sql);
    var js = row;
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}

module.exports.f10_cart_price_get = f10_cart_price_get


async function f10_cart_check_overlap_product(req, res) {


    let param = req.query;

    let sql = mybatisMapper.getStatement("cart", "check_overlap_product", param, fm);

    var [row] = await pool.query(sql);
    var js = row;

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}

module.exports.f10_cart_check_overlap_product = f10_cart_check_overlap_product


async function f10_cart_member_grp_info(req, res) {


    let param = req.query;

    let sql = mybatisMapper.getStatement("cart", "member_grp_info", param, fm);

    var [row] = await pool.query(sql);
    var js = row;

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}

module.exports.f10_cart_member_grp_info = f10_cart_member_grp_info


async function f10_cart_proc_post(req, res) {
    let data = req.body;

    if (data.ajax_mode == "ORDER") {

        let param = req.body;

        // let sql = mybatisMapper.getStatement("cart", "checkQty",  param, fm);

        let qty_cart_check = await pool.query(mybatisMapper.getStatement("cart", "checkQty", param, fm));

        if (qty_cart_check.length == 0) {
            return res.send({
                success: true,
                message: '장바구니 갯수가 1개 미만인 데이터가 있습니다',
                data: ''
            })
        }

        let cart_list = await pool.query(mybatisMapper.getStatement("cart", "cart_stock_check", param, fm));

        let result
        if (cart_list.length == 0) {
            return res.send({
                success: true,
                message: '재고부족',
                data: cart_list
            })

        } else {

            // let sql = mybatisMapper.getStatement("cart", "upd_cart_tmp2",  param, fm);
            // console.log(sql);
            await pool.query(mybatisMapper.getStatement("cart", "upd_cart_tmp", param, fm));
            result = await pool.query(mybatisMapper.getStatement("cart", "upd_cart_tmp2", param, fm));

        }

        if (result.length = 0) {
            return res.send({
                success: true,
                message: '',
                data: ''
            })
        } else {
            return res.send({
                success: true,
                message: '에러가 발생했습니다',
                data: data
            })
        }
    }




    return res.send({
        success: true,
        message: 'success'
    })
}

module.exports.f10_cart_proc_post = f10_cart_proc_post



//login
async function f10_snslogin_post(req, res) {

    // var access_token = decodeURIComponent(req.body.token); if (token == null || token == "" || token == "undefined" || token == undefined) token = "";
    var join_type = decodeURIComponent(req.body.join_type); if (join_type == null || join_type == "" || join_type == "undefined" || join_type == undefined) join_type = "";
    var sns_id = decodeURIComponent(req.body.sns_id); if (sns_id == null || sns_id == "" || sns_id == "undefined" || sns_id == undefined) sns_id = "";
    if (sns_id == null || sns_id == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "사용자 이름은 필수입니다.", errorCode: -100, data: null }));
        return;
    }
    var info_url = "";
    if (join_type == 'K') {
        info_url = 'https://kapi.kakao.com/v2/user/me';
    }
    if (join_type == 'N') {
        info_url = 'https://openapi.naver.com/v1/nid/me';
    }
    var js = {};
    let ref = {};
    var ms = "";
    if (info_url != "") {

        var paramInfo = {};
        paramInfo.sns_id = sns_id;
        paramInfo.join_type = join_type;
        sql = mybatisMapper.getStatement('member', 'get_mem_sns_info', paramInfo, fm);

        const [sns_info] = await pool.query(sql);

        if (sns_info.length > 0) {
            var paramCust = {};

            paramCust.cust_seq = sns_info[0].cust_seq;

            sql = mybatisMapper.getStatement('member', 'get_mem_info', paramCust, fm);

            const [mem_info] = await pool.query(sql);

            if (mem_info.length == 0) {

                await pool.query(mybatisMapper.getStatement('member', 'direct_member_sns_info', paramCust, fm));
                if (join_type == 'K') {
                    ms = "카카오로 가입된 정보가 없습니다. 회원가입 페이지로 이동합니다";
                }
                if (join_type == 'N') {
                    ms = "네이버로 가입된 정보가 없습니다. 회원가입 페이지로 이동합니다";
                }

                res.set({
                    'content-type': 'application/json'
                }).send(JSON.stringify({ success: true, message: ms, errorCode: 0, data: ref }));

                return;
                // direct_member_sns_info
            }
            let login_gb = 'U';


            js = mem_info[0];
            var token = jwt.sign({
                "cust_seq": js.cust_seq,
                "user_id": js.user_id,
                "user_nm": js.user_nm,
                "phone": js.phone,
                "member_grp_cd": js.member_grp_cd,
                "email": js.email
            }, SECRET_KEY, {
                algorithm: 'HS256'
                /*
                algorithm:'HS256',
                
                audience:'ojin.infomine.kr',
                //expiresIn: '15m', // 15분 유효
                issuer: 'msstore',
                */
                , expiresIn: '24h', // 24시간 유효
            });

            js.token = token;

            await pool.query(mybatisMapper.getStatement("member", "log_login", {
                login_gb: login_gb,
                login_id: mem_info[0].user_id,
                login_nm: mem_info[0].user_nm,
                reg_ip: req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp,
                user_agent: req.headers["user-agent"]
            }, fm))


            ref.cust_seq = js.cust_seq;
            ref.user_id = js.user_id;
            ref.user_nm = js.user_nm;
            ref.email = js.email;
            ref.phone = js.phone;
            ref.pass_change_date = null;
            ref.member_grp_cd = js.member_grp_cd;
            ref.token = js.token;

            ms = "로그인 되었습니다";
        } else {

            if (join_type == 'K') {
                ms = "카카오로 가입된 정보가 없습니다. 회원가입 페이지로 이동합니다";
            }
            if (join_type == 'N') {
                ms = "네이버로 가입된 정보가 없습니다. 회원가입 페이지로 이동합니다";
            }

            ref = null;
        }

        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: true, message: ms, errorCode: 0, data: ref }));
        return;

    } else {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "오류. 요청을 다시 확인하십시오..", errorCode: -100, data: null }));
        return;
    }

}
module.exports.f10_snslogin_post = f10_snslogin_post;






































