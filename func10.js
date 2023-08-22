var mysql = require("mysql2/promise");
var fs = require('fs');
const xlsx = require("xlsx");
var path = require('path');
const configFile = fs.readFileSync("./config.json", "utf-8")
const config = JSON.parse(configFile);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const jwt = require("jsonwebtoken")

//���� �Լ���
var fc = require("./funcComm.js");




const mybatisMapper = require('mybatis-mapper');
const { log, trace } = require("console");
const { verify_access_token } = require("./func10Mem.js");
var fm = { language: 'sql', indent: '  ' };





var pageCnt = 25;			//�������� ����
var pageCnt10 = 10;			//�������� ����(10����)

var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_<>@\#$%&\\\=\(\'\"]/gi;			// , +  ��... ��������.




//Ư������ ��ȯ
String.prototype.addSlashes = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

//Ư������ ��ȯ
String.prototype.EM = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    if (this == 'TRUE' || this == 'true' || this == true) return '1';
    else return '0';
};

//Ư������ ��ȯ
String.prototype.EM2 = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    if (this == null) return null;
    if (this == 'NULL') return '';
    else return this;
};

//Ư������ ��ȯ
function EM3(data) {
    if (data == "1" || data == "0") return data;
    if (data == null) return null;
    if (data == false || data == "FALSE" || data == "false") return "'0'";
    else return "'1'";
}

//��üũ
function isNullCheck(str) {
    if (str == null || str == "" || str == "null") return null;
    else return str;
}

var pool = null;

//DB �� index.js ���� �����´�.
function settingDb(poolConnect) {
    pool = poolConnect;

    //console.log("setting DB");
    fc.settingDb(pool);


    mybatisMapper.createMapper([
        './sql-product-etc.xml',
        './sql-product.xml',
        "./sql-main.xml",
        "./sql-product-search.xml",
        "./sql-theme.xml",
        "./sql-sale.xml",
        "./sql-cdn.xml",
        "./sql-pet.xml",
        "./sql-cart.xml",
        "./sql-coupon.xml",
        "./sql-mypage.xml",
        "./sql-event.xml",
        "./sql-qna.xml",
        "./sql-keyword.xml"
    ]);
}
module.exports.settingDb = settingDb;




//���� null ���� üũ
function numF(num) {
    var numI = 0;
    if (num == null) {
        return 0;
    }
    if (num == "") {
        return 0;
    }

    try {
        numI = parseInt(num);
        //console.log("num : " + num  + " / numI : " + numI);
    } catch (err) {
        //console.log("err : " + err);
        return 0;
    }
    //console.log(typeof(numI) );

    return numI;
}


//���� ���� ����
var generateRandom = function (min, max) {
    var ranNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return ranNum;
}


//000001 ���� ä��� ���� ������ִ� �Լ�
function numberPad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}





// �ΰ��� ��¥�� ���Ͽ� ���̸� �˷��ش�.
function dateDiff(_date1, _date2) {
    var diffDate_1 = _date1 instanceof Date ? _date1 : new Date(_date1);
    var diffDate_2 = _date2 instanceof Date ? _date2 : new Date(_date2);

    diffDate_1 = new Date(diffDate_1.getFullYear(), diffDate_1.getMonth() + 1, diffDate_1.getDate());
    diffDate_2 = new Date(diffDate_2.getFullYear(), diffDate_2.getMonth() + 1, diffDate_2.getDate());

    var diff = (diffDate_2.getTime() - diffDate_1.getTime());
    diff = Math.ceil(diff / (1000 * 3600 * 24));

    return diff;
}

//���� ��Ʈ��(�빮��1 + ����5)
function randomAString(string_length = 1) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    //document.randform.randomfield.value = randomstring;
    return randomstring;
}


async function poolQuery(sql) {
    var [row] = await pool.query(sql);
}




Date.prototype.getWeek = function (dowOffset) {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    dowOffset = typeof (dowOffset) == 'number' ? dowOffset : 0; //default dowOffset to zero
    var newYear = new Date(this.getFullYear(), 0, 1);
    var day = newYear.getDay() - dowOffset; //the day of week the year begins on
    day = (day >= 0 ? day : day + 7);
    var daynum = Math.floor((this.getTime() - newYear.getTime() - (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
    var weeknum;
    //if the year starts before the middle of a week
    //console.log("daynum : " + daynum);
    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
            let nYear = new Date(this.getFullYear() + 1, 0, 1);
            let nday = nYear.getDay() - dowOffset;
            nday = nday >= 0 ? nday : nday + 7;
            /*if the next year starts before the middle of
            the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53;
        }
    } else {
        weeknum = Math.floor((daynum + day - 1) / 7);
    }
    return weeknum;
};


//excel �� ��¥���� ���� �Լ�
function formatDate(numb, format = "-") {
    let time = new Date((numb - 1) * 24 * 3600000 + 1);
    time.setYear(time.getFullYear() - 70);
    let year = time.getFullYear() + '';
    let month = time.getMonth() + 1 + '';
    let date = time.getDate() + '';
    if (format && format.length === 1) {
        return year + format + (month < 10 ? '0' + month : month) + format + (date < 10 ? '0' + date : date);
    }
    return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
}



//���̸� ���� �ϴ� ���� �Լ�(100 ���� �̻��̸� 100 �����̻��� �D�� ... ���� ǥ��)
function sub(txt, len) {
    if (txt == null) {
        return "";
    } else if (txt.length > len) {
        return txt.substr(0, len) + "...";
    } else {
        return txt;
    }
}




//�ڵ�ȭ �Լ� - cSql, sql �� �̿��Ͽ� ��� ����
async function getList(req, res, cSql, sql, isLimit = true) {
    var page = req.query.page; if (page != null) page = page.trim(); else page = 1;
    page = parseInt(page);

    var pageCntL = req.query.pageCnt; if (pageCntL != null) pageCntL = pageCntL.trim(); else pageCntL = pageCnt;
    pageCntL = parseInt(pageCntL);

    var nCnt = (page - 1) * pageCntL;
    if (nCnt < 0) nCnt = 0;

    var searchCnt = 0;
    if (cSql) {
        var [result] = await pool.query(cSql);
        searchCnt = result[0].cnt;
    } else {
        searchCnt = 1
    }


    var js = {};

    js.success = true;
    js.message = "";
    js.errorCode = 0;
    js.data = [];
    js.page = page;
    js.total = 0;
    js.pageCnt = pageCntL;

    if (searchCnt <= 0) {
        //res.send(js);
    } else {
        if (sql.indexOf("limit") > 0) {
        } else {
            if (isLimit == true) {
                sql += " limit " + nCnt + ", " + pageCntL;
            }
        }
        var [row2] = await pool.query(sql);

        js.data = row2;
        js.total = searchCnt;
        //res.send(js);
    }
    // console.log(sql)
    //console.log("list");
    //console.log(js);


    return js;
}

//�ڵ�ȭ �����ٷ� - 1���� �����͸� ����
async function getData(req, res, sql) {
    var [row] = await pool.query(sql);

    var js = {};

    js.success = true;
    js.message = "";
    js.errorCode = 0;
    if (row.length > 0) {
        js.data = row[0];
    } else {
        js.data = {};
    }

    //console.log(js);

    return js;
}

















async function f10_shop_product_list_get(req, res) {
    //console.log(req.query);
    //projectName �ʵ� ���� ����
    var projectName = decodeURIComponent(req.query.projectName); if (projectName == null || projectName == "" || projectName == "undefined" || projectName == undefined) projectName = "";

    projectName = projectName.addSlashes();		//Ư�� ���� ����

    /*
    if(projectName == null || projectName== "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({success:false, message:"projectName is empty!", errorCode:-1, data:null}));
        return;
    }
    */


    var sql = "";
    /*
    var cSql = "";

    cSql = "select count(idx) cnt from NFT_PROJECT where Project_name = '"+projectName+"' ";
    sql = "SELECT * ";
    sql += "	FROM NFT_PROJECT pro, ";
    sql += "		NFT_PROJECT_LINK link";
    sql += "	WHERE pro.Project_name = link.Project_name ";

    console.log(cSql);
    console.log(sql);

	
    var js = await getList(req, res, cSql, sql);
    */

    /*
    console.log(formatDate(42909));
    console.log(formatDate(44315));
    console.log(formatDate(44437));
    console.log(formatDate(43881));
    console.log(formatDate(44238));
    console.log(formatDate(44492));
    */


    var js = [];

    sql = "SELECT ";
    sql += "		pro.idx as nftIdx, ";
    sql += "		pro.*, link.*, price.*, sub.*, sns.* ";
    sql += "	FROM NFT_PROJECT pro, ";
    sql += "		NFT_PROJECT_LINK link, ";
    sql += "		NFT_PROJECT_PRICE price, ";
    sql += "		NFT_PROJECT_SNS sns, ";
    sql += "		NFT_PROJECT_SUB sub ";
    sql += "	WHERE pro.Project_name = link.Project_name ";
    sql += "		and pro.Project_name = sub.Project_name ";
    sql += "		and pro.Project_name = price.Project_name ";
    sql += "		and pro.Project_name = sns.Project_name ";

    if (projectName != "") {		//�˻� ������ �ִٸ�...
        sql += "	and pro.Project_name = '" + projectName + "' ";
    }


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub.nftIdx = row[i].nftIdx;
        sub.projectName = row[i].Project_name;
        sub.marketVerfied = row[i].Market_verified;
        sub.bgImageLink = row[i].Bg_image_link;
        var pl = [];
        pl.push(row[i].Project_label_0);
        pl.push(row[i].Project_label_1);
        pl.push(row[i].Project_label_2);

        sub.projectLabel = pl;
        sub.imageLink = row[i].Image_link;

        var nt = [];
        //true �� ���� �־��ָ� ��(�ִ� 3��)
        if (row[i].NFT_type_new == '1' && nt.length < 3) nt.push('NFT_type_new');
        if (row[i].NFT_type_pfp == '1' && nt.length < 3) nt.push('NFT_type_pfp');
        if (row[i].NFT_type_game == '1' && nt.length < 3) nt.push('NFT_type_game');
        if (row[i].NFT_type_collectibles == '1' && nt.length < 3) nt.push('NFT_type_collectibles');
        if (row[i].NFT_type_art == '1' && nt.length < 3) nt.push('NFT_type_art');
        if (row[i].NFT_type_metaverse == '1' && nt.length < 3) nt.push('NFT_type_metaverse');
        if (row[i].NFT_type_defi == '1' && nt.length < 3) nt.push('NFT_type_defi');
        if (row[i].NFT_type_ip == '1' && nt.length < 3) nt.push('NFT_type_ip');
        if (row[i].NFT_type_social == '1' && nt.length < 3) nt.push('NFT_type_social');
        if (row[i].NFT_type_music == '1' && nt.length < 3) nt.push('NFT_type_music');
        if (row[i].NFT_type_utility == '1' && nt.length < 3) nt.push('NFT_type_utility');
        if (row[i].NFT_type_land == '1' && nt.length < 3) nt.push('NFT_type_land');
        if (row[i].NFT_type_sports == '1' && nt.length < 3) nt.push('NFT_type_sports');
        if (row[i].NFT_type_photography == '1' && nt.length < 3) nt.push('NFT_type_photography');
        sub.ntfType = nt;

        var pi = {};
        var items = {};
        items.lightItemsNum = row[i].Light_items_num;
        items.itemsNum = row[i].Items_num;
        pi.items = items;

        var owner = {};
        owner.lightHoldersNum = row[i].Light_holders_num;
        owner.holdersNum = row[i].Holders_num;
        pi.owner = owner;

        var floor = {};
        floor.floorPrice7d = row[i].Floor_price_7D;
        floor.floorPriceVariance7d = row[i].Floor_variance_7D;
        pi.floor = floor;

        var volume = {};
        volume.lightVolumePrice = row[i].Light_Volume_7D;
        volume.volumePrice7d = row[i].Volume_7D;
        pi.volume = volume;

        var whales = {};
        whales.lightWhalesNum = row[i].Light_whales_num_7D_ratio;
        whales.whalesNum = row[i].Whales_num;
        pi.whales = whales;

        var follower = {};
        follower.lightSnsFollower = row[i].Light_sns_follower;
        follower.twitterFollowerNum = row[i].Twitter_follower_num;
        sub.follower = follower;


        sub.priceInfo = pi;

        js.push(sub);

    }




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_product_list_get = f10_shop_product_list_get;









//ī�װ��� ��� api
async function f10_shop_category_main_list_get(req, res) {


    var sql = "";


    var param = {};


    sql = mybatisMapper.getStatement('product-etc', 'CategoryMainList', param, fm);


    var js = [];


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub.category_cd = row[i].category_cd;
        sub.category_m_cd = row[i].category_m_cd;
        sub.category_nm = row[i].category_nm;
        sub.category_eng_nm = row[i].category_eng_nm;
        sub.od = row[i].od;
        sub.use_yn = row[i].use_yn;
        sub.best_yn = row[i].best_yn;
        sub.new_yn = row[i].new_yn;
        sub.level = row[i].level;
        sub.file_nm1 = row[i].file_nm1;
        sub.file_nm2 = row[i].file_nm2;


        js.push(sub);

    }




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_category_main_list_get = f10_shop_category_main_list_get;





//ī�װ��� ��� api
async function f10_shop_category_best_list_get(req, res) {


    var sql = "";


    var param = {};


    sql = mybatisMapper.getStatement('product-etc', 'CategoryBestList', param, fm);


    var js = [];


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub.category_cd = row[i].category_cd;
        sub.category_m_cd = row[i].category_m_cd;
        sub.category_nm = row[i].category_nm;
        sub.category_eng_nm = row[i].category_eng_nm;
        sub.od = row[i].best_od;
        sub.use_yn = row[i].use_yn;
        sub.best_yn = row[i].best_yn;
        sub.new_yn = row[i].new_yn;
        sub.level = row[i].level;
        sub.file_nm1 = row[i].file_nm1;
        sub.file_nm2 = row[i].file_nm2;


        js.push(sub);

    }




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_category_best_list_get = f10_shop_category_best_list_get;



//ī�װ��� ��� api
async function f10_shop_category_new_list_get(req, res) {


    var sql = "";


    var param = {};


    sql = mybatisMapper.getStatement('product-etc', 'CategoryNewList', param, fm);


    var js = [];


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub.category_cd = row[i].category_cd;
        sub.category_m_cd = row[i].category_m_cd;
        sub.category_nm = row[i].category_nm;
        sub.category_eng_nm = row[i].category_eng_nm;
        sub.od = row[i].new_od;
        sub.use_yn = row[i].use_yn;
        sub.best_yn = row[i].best_yn;
        sub.new_yn = row[i].new_yn;
        sub.level = row[i].level;
        sub.file_nm1 = row[i].file_nm1;
        sub.file_nm2 = row[i].file_nm2;


        js.push(sub);

    }




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_category_new_list_get = f10_shop_category_new_list_get;












//���� ��� api
async function f10_shop_banner_list_get(req, res) {
    var banner_cd = decodeURIComponent(req.query.banner_cd); if (banner_cd == null || banner_cd == "" || banner_cd == "undefined" || banner_cd == undefined) banner_cd = "";

    await getBannerList(req, res, banner_cd);
}
module.exports.f10_shop_banner_list_get = f10_shop_banner_list_get;

async function f10_shop_banner_mainPopup_get(req, res) {
    await getBannerList(req, res, "101");
}
module.exports.f10_shop_banner_mainPopup_get = f10_shop_banner_mainPopup_get;

async function f10_shop_banner_mainTop_get(req, res) {
    await getBannerList(req, res, "102");
}
module.exports.f10_shop_banner_mainTop_get = f10_shop_banner_mainTop_get;
async function f10_shop_banner_mainVisual_get(req, res) {
    await getBannerList(req, res, "103");
}
module.exports.f10_shop_banner_mainVisual_get = f10_shop_banner_mainVisual_get;
async function f10_shop_banner_mainMiddle_get(req, res) {
    await getBannerList(req, res, "104");
}
module.exports.f10_shop_banner_mainMiddle_get = f10_shop_banner_mainMiddle_get;
async function f10_shop_banner_mainPopularKeyword_get(req, res) {
    await getBannerList(req, res, "105");
}
module.exports.f10_shop_banner_mainPopularKeyword_get = f10_shop_banner_mainPopularKeyword_get;
async function f10_shop_banner_topGNB_get(req, res) {
    await getBannerList(req, res, "106");
}
module.exports.f10_shop_banner_topGNB_get = f10_shop_banner_topGNB_get;
async function f10_shop_banner_mainPopularKeywordBanner_get(req, res) {
    await getBannerList(req, res, "107");
}
module.exports.f10_shop_banner_mainPopularKeywordBanner_get = f10_shop_banner_mainPopularKeywordBanner_get;

async function f10_shop_banner_shopping_home_get(req, res) {
    await getBannerList(req, res, "118");
}
module.exports.f10_shop_banner_shopping_home_get = f10_shop_banner_shopping_home_get;

async function f10_shop_banner_shopping_home_top_get(req, res) {
    await getBannerList(req, res, "119");
}
module.exports.f10_shop_banner_shopping_home_top_get = f10_shop_banner_shopping_home_top_get;




/*
�����˾�	101
���� ��ܹ��	102
���� �����	103
���� �߰�����	104
���� �α�Ű����	105
��� GNB�޴�	106
���� �α�Ű���� ���	107
������ ��ܹ��	111
��ǰī�װ����� ���	112
��ǰ�󼼹��	115
��ȹ�� �߰����	116
������ ��ǰ��ġ ������	117
����Ȩ �߰����	118
����Ȩ ��ܹ��	119
PET ��ܹ��	123
PET �߰����	122
��ǰ�������	126
��ǰ�������	127
��ǰ�ı� �Ұ� ���	131
�Ƹ��� ������ �Ұ����	132
ȸ������	133
*/
async function getBannerList(req, res, banner_cd) {
    var sql = "";
    var param = {};

    if (banner_cd != null && banner_cd != "") {
        param.banner_cd = banner_cd;
    }


    sql = mybatisMapper.getStatement('product-etc', 'BannerList', param, fm);


    var js = [];


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub = row[i];


        js.push(sub);

    }
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}















async function f10_shop_group_list_get(req, res) {


    var sql = "";


    var param = {};


    sql = mybatisMapper.getStatement('product-etc', 'GroupList', param, fm);


    var js = [];


    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }


    for (var i = 0; i < row.length; i++) {		//��� �迭 ���·� ����
        var sub = {};

        sub.group_cd = row[i].group_cd;
        sub.group_nm = row[i].group_nm;
        sub.file_nm1 = row[i].file_nm1;
        sub.file_nm2 = row[i].file_nm2;
        sub.file_nm3 = row[i].file_nm3;
        sub.content1 = row[i].content1;
        sub.content2 = row[i].content2;
        sub.url = row[i].url;
        sub.code_gb = row[i].code_gb;
        sub.use_yn = row[i].use_yn;
        sub.list_type = row[i].list_type;
        sub.type_gb = row[i].type_gb;
        sub.reg_date = row[i].reg_date;
        sub.s_date = row[i].s_date;
        sub.e_date = row[i].e_date;
        sub.od = row[i].od;



        js.push(sub);

    }




    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_group_list_get = f10_shop_group_list_get;









//�Ż�ǰ(1001)
async function f10_shop_product_new_list_get(req, res) {
    await getGroupProductList(req, res, "1001");
}
module.exports.f10_shop_product_new_list_get = f10_shop_product_new_list_get;

//BEST �ڳ�(1002)
async function f10_shop_product_best_list_get(req, res) {
    await getGroupProductList(req, res, "1002");
}
module.exports.f10_shop_product_best_list_get = f10_shop_product_best_list_get;

//SALE �ڳ�(1003)
async function f10_shop_product_sale_list_get(req, res) {
    await getGroupProductList(req, res, "1003");
}
module.exports.f10_shop_product_sale_list_get = f10_shop_product_sale_list_get;

//�Բ� ������ �ڵ�(3001)
async function f10_shop_product_together_list_get(req, res) {
    await getGroupProductList(req, res, "3001");
}
module.exports.f10_shop_product_together_list_get = f10_shop_product_together_list_get;

//BEST(2001 - �Ƹ� ��?)
async function f10_shop_product_pet_best_list_get(req, res) {
    await getGroupProductList(req, res, "2001");
}
module.exports.f10_shop_product_pet_best_list_get = f10_shop_product_pet_best_list_get;

//[��]ħ��/��Ʈ(2002)
async function f10_shop_product_pet_bedmat_list_get(req, res) {
    await getGroupProductList(req, res, "2002");
}
module.exports.f10_shop_product_pet_bedmat_list_get = f10_shop_product_pet_bedmat_list_get;

//[��]����(2003)
async function f10_shop_product_pet_furniture_list_get(req, res) {
    await getGroupProductList(req, res, "2003");
}
module.exports.f10_shop_product_pet_furniture_list_get = f10_shop_product_pet_furniture_list_get;

//[��]�峭��(2004)
async function f10_shop_product_pet_toy_list_get(req, res) {
    await getGroupProductList(req, res, "2004");
}
module.exports.f10_shop_product_pet_toy_list_get = f10_shop_product_pet_toy_list_get;

//������ �ֵ�(6001)
async function f10_shop_product_hotdeal_list_get(req, res) {
    await getGroupProductList(req, res, "6001");
}
module.exports.f10_shop_product_hotdeal_list_get = f10_shop_product_hotdeal_list_get;








async function f10_shop_group_product_list_get(req, res) {
    var group_cd = decodeURIComponent(req.query.group_cd); if (group_cd == null || group_cd == "" || group_cd == "undefined" || group_cd == undefined) group_cd = "";
    await getGroupProductList(req, res, group_cd);
}
module.exports.f10_shop_group_product_list_get = f10_shop_group_product_list_get;




async function f10_shop_category_list_get(req, res) {

    var category_m_cd = decodeURIComponent(req.query.category_m_cd); if (category_m_cd == null || category_m_cd == "" || category_m_cd == "undefined" || category_m_cd == undefined) category_m_cd = "";

    if (category_m_cd == null || category_m_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "category_m_cd is empty!", errorCode: -100, data: null }));
        return;
    }

    var sql = "";
    var param = { category_m_cd: category_m_cd };

    sql = mybatisMapper.getStatement('product-etc', 'CategoryList', param, fm);

    var js = [];
    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }

    for (var i = 0; i < row.length; i++) {
        var sub = {};

        sub.category_cd = row[i].category_cd;
        sub.category_m_cd = row[i].category_m_cd;
        sub.category_nm = row[i].category_nm;
        sub.category_eng_nm = row[i].category_eng_nm;
        sub.od = row[i].od;
        sub.use_yn = row[i].use_yn;
        sub.best_yn = row[i].best_yn;
        sub.new_yn = row[i].new_yn;
        sub.level = row[i].level;
        sub.file_nm1 = row[i].file_nm1;
        sub.file_nm2 = row[i].file_nm2;

        js.push(sub);
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_shop_category_list_get = f10_shop_category_list_get;


async function getGroupProductList(req, res, group_cd) {
    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == null || category1_cd == "" || category1_cd == "undefined" || category1_cd == undefined) category1_cd = "";
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == null || category2_cd == "" || category2_cd == "undefined" || category2_cd == undefined) category2_cd = "";
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == null || category3_cd == "" || category3_cd == "undefined" || category3_cd == undefined) category3_cd = "";
    
    if (group_cd == null || group_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "group_cd is empty!", errorCode: -100, data: null }));
        return;
    }

    const authHeader = req.headers["authorization"]
    const token = authHeader?.split('Bearer ')[1];
    const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null

    var csql = "";
    var sql = "";


    var param = { group_cd: group_cd, category1_cd: category1_cd, category2_cd: category2_cd, category3_cd: category3_cd, cust_seq: userData?.cust_seq || null };

    csql = mybatisMapper.getStatement('product-etc', 'GroupProductCount', param, fm);

    //console.log(csql);
    sql = mybatisMapper.getStatement('product-etc', 'GroupProductList', param, fm);

    

    var js = await fc.getList(req, res, csql, sql);
    for (const product of js.data) {
        const pr = {
            product_cd: product.product_cd,
            opt_cd2: '',
            file_gb: "P",
            page: ''
        }
        const mainList = mybatisMapper.getStatement('product', 'get_product_option_file', pr, fm)
        const [result] = await pool.query(mainList)
        product.product_main_list = result
    }

    res.send(js);
}











async function f10_shop_product_list(req, res) {
    await getProductList(req, res);
}
module.exports.f10_shop_product_list = f10_shop_product_list;




async function getProductList(req, res) {
    var group_cd = decodeURIComponent(req.query.group_cd); if (group_cd == null || group_cd == "" || group_cd == "undefined" || group_cd == undefined) group_cd = "";

    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == null || category1_cd == "" || category1_cd == "undefined" || category1_cd == undefined) category1_cd = "";
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == null || category2_cd == "" || category2_cd == "undefined" || category2_cd == undefined) category2_cd = "";
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == null || category3_cd == "" || category3_cd == "undefined" || category3_cd == undefined) category3_cd = "";

    var brand_cd = decodeURIComponent(req.query.brand_cd); if (brand_cd == null || brand_cd == "" || brand_cd == "undefined" || brand_cd == undefined) brand_cd = "";
    var product_nm = decodeURIComponent(req.query.product_nm); if (product_nm == null || product_nm == "" || product_nm == "undefined" || product_nm == undefined) product_nm = "";


    var sort = decodeURIComponent(req.query.sort); if (sort == null || sort == "" || sort == "undefined" || sort == undefined) sort = "";

    const { orderBy, inStock, keyword, sh_category1_cd, sh_category2_cd, sh_category3_cd } = req.query
    const replaceKeyword2 = keyword?.replaceAll(" ", "%")
    const replaceKeyword = keyword?.replaceAll(",", "|")

    var csql = "";
    var sql = "";

    const authHeader = req.headers["authorization"]
    const token = authHeader?.split('Bearer ')[1];
    const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null


    var param = {
        group_cd: group_cd,
        category1_cd: category1_cd,
        category2_cd: category2_cd,
        category3_cd: category3_cd,
        brand_cd: brand_cd,
        product_nm: product_nm,
        sort: sort,
        orderBy,
        inStock,
        replaceKeyword2: replaceKeyword2 ? replaceKeyword2 : '',
        replaceKeyword: replaceKeyword ? replaceKeyword : '',
        keyword: keyword || null,
        shCate1Cd: sh_category1_cd || null,
        shCate2Cd: sh_category2_cd || null,
        shCate3Cd: sh_category3_cd || null,
        cust_seq: userData?.cust_seq || null

    };
    csql = mybatisMapper.getStatement('product', 'ProductCount', param, fm);

    sql = mybatisMapper.getStatement('product', 'ProductList', param, fm);

    
    
    // ifnull((SELECT 'on' FROM wt_wishlist WHERE product_cd = pro.product_cd AND cust_seq = #{cust_seq} LIMIT 1 ),'') AS wish_click_on
    var js = await fc.getList(req, res, csql, sql);

    var pStr = "";
    for (var n = 0; n < js.data.length; n++) {
        pStr += " , '" + js.data[n].product_cd + "' ";
    }
    if (pStr != "") {
        pStr = pStr.substr(3);


        param = { pStr: pStr };
        console.log(param);
        sql = mybatisMapper.getStatement('product', 'ProductFileList', param, fm);

        var [rowF] = await pool.query(sql);
        for (var n = 0; n < js.data.length; n++) {
            var f = [];

            for (var m = 0; m < rowF.length; m++) {
                if (js.data[n].product_cd == rowF[m].product_cd) {
                    var sf = {};
                    sf.product_file_seq = rowF[m].product_file_seq;
                    sf.product_cd = rowF[m].product_cd;
                    sf.file_gb = rowF[m].file_gb;
                    sf.file_nm = rowF[m].file_nm;
                    sf.od = rowF[m].od;
                    f.push(sf);
                }
            }
            js.data[n].file = f;
        }
    }

    res.send(js);
}















async function f10_shop_product_detail_get(req, res) {
    await getProductDetail(req, res);
}
module.exports.f10_shop_product_detail_get = f10_shop_product_detail_get;

async function f10_shop_product_detail_app_get(req, res) {
    await getProductDetailApp(req, res);
}
module.exports.f10_shop_product_detail_app_get = f10_shop_product_detail_app_get;


async function getProductDetail(req, res) {
    var product_cd = decodeURIComponent(req.query.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    var js = {};

    var cateSql = "";

    const authHeader = req.headers["authorization"]
    const token = authHeader?.split('Bearer ')[1];
    const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null

    param.product_cd = product_cd;
    param.cust_seq = userData?.cust_seq || null




    sql = mybatisMapper.getStatement('product', 'Product', param, fm);
    console.log(sql);
    var [row] = await pool.query(sql);


    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }

    js.product_cd = row[0].product_cd;
    js.product_code = row[0].product_code;
    js.product_type = row[0].product_type;
    js.product_state = row[0].product_state;
    js.brand_cd = row[0].brand_cd;
    js.group_yn = row[0].group_yn;
    js.group_cd = row[0].group_cd;
    js.product_nm = row[0].product_nm;
    js.product_etc_nm = row[0].product_etc_nm;
    js.product_deal_nm = row[0].product_deal_nm;
    js.product_nm_eng = row[0].product_nm_eng;
    js.product_nm_mb = row[0].product_nm_mb;
    js.model_name = row[0].model_name;
    js.product_stock = row[0].product_stock;
    js.coupon_use_yn = row[0].coupon_use_yn;
    js.reserve_use_yn = row[0].reserve_use_yn;
    js.reserve_give_yn = row[0].reserve_give_yn;
    js.supply_price = row[0].supply_price;
    js.sale_price = row[0].sale_price;
    js.fee_rate = row[0].fee_rate;
    js.reserve_rate = row[0].reserve_rate;
    js.keywd = row[0].keywd;
    js.product_content = row[0].product_content;
    js.icon = row[0].icon;
    js.gid = row[0].gid;
    js.main_img = row[0].main_img;
    js.sub_img1 = row[0].sub_img1;
    js.sub_img2 = row[0].sub_img2;
    js.sub_img3 = row[0].sub_img3;
    js.sub_img4 = row[0].sub_img4;
    js.free_trans_yn = row[0].free_trans_yn;
    js.discount_gb = row[0].discount_gb;
    js.product_national_cd = row[0].product_national_cd;
    js.mov_code = row[0].mov_code;
    js.product_relation_yn = row[0].product_relation_yn;
    js.best_product_display = row[0].best_product_display;
    js.best_review_display = row[0].best_review_display;
    js.product_url = row[0].product_url;
    js.write_use_yn = row[0].write_use_yn;
    js.write_title = row[0].write_title;
    js.order_limit_cnt = row[0].order_limit_cnt;
    js.order_mini_quantiry = row[0].order_mini_quantiry;
    js.shipping_yn = row[0].shipping_yn;
    js.shipping_gudie = row[0].shipping_gudie;
    js.return_yn = row[0].return_yn;
    js.return_guide = row[0].return_guide;
    js.exchange_yn = row[0].exchange_yn;
    js.exchange_guide = row[0].exchange_guide;
    js.od = row[0].od;
    js.vw_cnt = row[0].vw_cnt;
    js.hits = row[0].hits;
    js.review_cnt = row[0].review_count;
    js.order_cnt = row[0].order_cnt;
    js.del_yn = row[0].del_yn;
    js.reg_date = row[0].reg_date;
    js.mod_date = row[0].mod_date;
    js.mod_id = row[0].mod_id;
    js.point = row[0].point;
    js.review_pt_yn = row[0].review_pt_yn;
    js.hidden_yn = row[0].hidden_yn;
    js.stock_soldout_yn = row[0].stock_soldout_yn;
    js.wish_click_on = row[0].wish_click_on;
    js.order_qty = row[0].order_qty ? row[0].order_qty : 0


    //��ǰ�� �߰�������ǰ����(wt_product_addition)
    sql = mybatisMapper.getStatement('product', 'get_addition_product_list', param, fm);

    var [rowA] = await pool.query(sql);
    js.additionList = rowA;



    //��ǰ��ī�װ���(wt_product_category)
    sql = mybatisMapper.getStatement('product', 'ProductCategoryList', param, fm);

    var [rowCa] = await pool.query(sql);

    var categoryList = [];
    if (rowCa != null && rowCa.length != 0) {
        for (var n = 0; n < rowCa.length; n++) {
            categoryList.push(rowCa[n]);

            //ī�װ��� ������ ����
            var cateS = "";
            cateS += "   and ((category1_cd = '" + rowCa[n].category1_cd + "' and category2_cd = '" + rowCa[n].category2_cd + "' and category3_cd = '" + rowCa[n].category3_cd + "')";
            cateS += "     or (category1_cd = '" + rowCa[n].category1_cd + "' and category2_cd = '" + rowCa[n].category2_cd + "' and ifnull(category3_cd, '') = '')";
            cateS += "     or (category1_cd = '" + rowCa[n].category1_cd + "' and ifnull(category2_cd, '') = '' and ifnull(category3_cd, '') = '')";
            cateS += "       )";

            if (cateS != "") {
                cateSql += " or  ( ";
                cateSql += cateS.substr(5);
                cateSql += " ) ";
            }
        }
    } else {
    }
    js.categoryList = categoryList;

    if (cateSql != "") {
        cateSql = " and ( " + cateSql.substr(4) + " ) ";
    }


    //��ǰ���������������̺�(wt_product_con)
    sql = mybatisMapper.getStatement('product', 'ProductCon', param, fm);

    var [rowCon] = await pool.query(sql);

    if (rowCon != null && rowCon.length != 0) {
        js.productCon = rowCon[0];
    } else {
        js.productCon = null;
    }


    //��ǰ ���� ���̺�(wt_product_detail)
    sql = mybatisMapper.getStatement('product', 'ProductDetailList', param, fm);

    var [rowDetail] = await pool.query(sql);

    if (rowDetail != null && rowDetail.length != 0) {
        js.productDetail = rowDetail[0];
    } else {
        js.productDetail = null;
    }


    //��ǰ �̹���/���� ����(wt_product_file)	
    sql = mybatisMapper.getStatement('product', 'ProductFileList', param, fm);
    var [rowF] = await pool.query(sql);

    var file = [];
    if (rowF != null && rowF.length != 0) {
        for (var n = 0; n < rowF.length; n++) {
            var sf = {};
            sf.product_file_seq = rowF[n].product_file_seq;
            sf.product_cd = rowF[n].product_cd;
            sf.file_gb = rowF[n].file_gb;
            sf.file_nm = rowF[n].file_nm;
            sf.od = rowF[n].od;
            file.push(sf);
        }
    }
    js.file = file;


    sql = mybatisMapper.getStatement('common', 'get_banner', { banner_cd: '126' }, fm);
    const [lineBanner] = await pool.query(sql);
    js.line_banner = lineBanner


    sql = mybatisMapper.getStatement('common', 'get_banner', { banner_cd: '127' }, fm);
    const [couponBanner] = await pool.query(sql);
    js.coupon_banner = couponBanner[0]


    sql = mybatisMapper.getStatement('common', 'getProductAvgPoint', { product_cd: row[0].product_cd }, fm);
    const [totalAvg] = await pool.query(sql);
    js.total_avg_review = totalAvg[0].total_avg


    sql = mybatisMapper.getStatement('cart', 'getTrans', { const_trans_cd: row[0].free_trans_yn }, fm);
    const [trans] = await pool.query(sql);
    js.trans = trans[0]


    sql = mybatisMapper.getStatement('product', 'get_product_alram_list', { product_cd: row[0].product_cd }, fm);
    const [alram] = await pool.query(sql);
    js.alram_list = alram


    sql = mybatisMapper.getStatement('product', 'get_review_photo', { product_cd: row[0].product_cd, cust_seq: param.cust_seq }, fm);
    const [reviewPhoto] = await pool.query(sql);
    js.review_photo = reviewPhoto


    sql = mybatisMapper.getStatement('mypage', 'check_product', { product_cd: row[0].product_cd, user_id: 'khaituonq' }, fm);
    const [checkProduct] = await pool.query(sql);
    js.review_public_yn = checkProduct


    sql = mybatisMapper.getStatement('mypage', 'get_code', { code_cd1: '3100' }, fm);
    const [pointCode] = await pool.query(sql);
    js.point_code = pointCode

    js['avg'] = {}
    pointCode.forEach(async item => {
        const [pointDetail] = await pool.query(mybatisMapper.getStatement('mypage', 'get_point', { product_cd: row[0].product_cd, code_cd2: item.code_cd2, count: pointCode.length }, fm))
        js['avg'][item['code_cd2']] = pointDetail[0].point
    })
    const [tmpavg] = await pool.query(mybatisMapper.getStatement('mypage', 'get_product_avg_point', { product_cd: row[0].product_cd }, fm))
    js['avg']['total_avg'] = tmpavg[0].total_avg


    const commonCateBanner = async (category, level) => {
        let category1 = 'AND category1_cd = ""'
        let category2 = 'AND category2_cd = ""'
        let category3 = 'AND category3_cd = ""'

        if (category?.category1_cd) {
            category1 = `AND category1_cd = ${category?.category1_cd}`
        }

        if (level === 3) {
            if (category?.category2_cd) {
                category2 = `AND category2_cd = ${category?.category2_cd}`
            }
            if (category?.category3_cd) {
                category2 = `AND category3_cd = ${category?.category3_cd}`
            }
        }

        if (level === 2) {
            if (category?.category2_cd) {
                category2 = `AND category2_cd = ${category?.category2_cd}`
            }
        }

        if (level === 1) {
            category2 = `AND category2_cd = ''`
            category3 = `AND category3_cd = ''`
        }


        const [list] = await pool.query(mybatisMapper.getStatement('product', 'common_cate_banner', { category1, category2, category3 }, fm))
        return list
    }


    const commonBuyGuide = async (category, level, mode) => {
        let category1 = ''
        let category2 = ''
        let category3 = ''


        if (category?.category1_cd) {
            category1 = `AND category1_cd = ${category?.category1_cd}`
        }
        if (level === 3) {
            if (category?.category2_cd) {
                category2 = `AND category2_cd = ${category?.category2_cd}`
            } else if (category?.category3_cd) {
                category3 = `AND category3_cd = ${category?.category3_cd}`
            }
        }

        if (level === 2) {
            if (category?.category2_cd) {
                category2 = `AND category2_cd = ${category?.category2_cd}`
            }
        }

        if (level === 1) {
            category2 = `AND category2_cd = ''`
            category3 = `AND category3_cd = ''`
        }
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'common_buy_guide', { category1, category2, category3, mode }, fm))
        return result[0]
    }


    let detailBanner = null
    const [list] = await pool.query(mybatisMapper.getStatement('product', 'individual_banner', { product_cd: row[0].product_cd }, fm))
    const [category] = await pool.query(mybatisMapper.getStatement('product', 'get_category', { product_cd: row[0].product_cd, mode: 'DESC' }, fm))
    if (list.length > 0) {
        detailBanner = list
    } else if (category.length > 0) {

        const list1 = await commonCateBanner(category[0], 3)
        const list2 = await commonCateBanner(category[0], 2)
        const list3 = await commonCateBanner(category[0], 1)

        if (list1.length > 0) {
            detailBanner = list1
        } else if (list2.length > 0) {
            detailBanner = list2
        } else if (list3.length > 0) {
            detailBanner = list3
        } else {
            const [banner] = await pool.query(mybatisMapper.getStatement('product', 'common_banner', {}, fm))
            detailBanner = banner
        }
    } else {
        const [banner] = await pool.query(mybatisMapper.getStatement('product', 'common_banner', {}, fm))
        detailBanner = banner
    }


    js.detail_banner = detailBanner


    let buy_guide_con = null
    const [category1] = await pool.query(mybatisMapper.getStatement('product', 'get_category', { product_cd: row[0].product_cd, mode: 'ASC' }, fm))
    if (category1) {
        const result = await commonBuyGuide(category1[0], 3, '')
        const result2 = await commonBuyGuide(category1[0], 2, '')
        const result3 = await commonBuyGuide(category1[0], 1, '')
        if (result?.content) {
            buy_guide_con = result
        } else if (result2?.content) {
            buy_guide_con = result2
        } else if (result3?.content) {
            buy_guide_con = result3
        } else {
            buy_guide_con = await commonBuyGuide(null, null, 'no-cate')
        }

    } else {
        buy_guide_con = await commonBuyGuide(null, null, 'no-cate')
    }
    js.buy_guide_con = buy_guide_con





    sql = mybatisMapper.getStatement('coupon', 'getCoupon', { product_cd: row[0].product_cd }, fm);
    const [couponList] = await pool.query(sql)
    const coupon_master_seq = []
    const coupon_seq = []
    for (let coupon of couponList) {
        const [checkYn] = await pool.query(mybatisMapper.getStatement('coupon', 'isMemberIssued', { master_seq: coupon.coupon_master_seq, coupon_seq: coupon.coupon_seq, cust_seq: param.cust_seq }))
        coupon.check = checkYn.length === 0 ? 'N' : 'Y' 
        if (coupon.check === 'N') {
            coupon_master_seq.push(coupon.coupon_master_seq)
            coupon_seq.push(coupon.coupon_seq)
        }
    }
    js.coupon_master_seq = coupon_master_seq
    js.coupon_seq = coupon_seq
    js.coupon_list = couponList


    const [productOpt1C] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'C' }, fm));
    js.product_opt1_c = productOpt1C
    for (let opt1C of productOpt1C) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1C.opt_db, product_cd: opt1C.product_cd, opt_cd1: opt1C.opt_cd1 }))
        js[`product_opt2_${opt1C.opt_cd1}`] = result
        js.product_soldout_yn = 'N'
        js.product_stock = 1
    }

    const [productOpt1S] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'S' }, fm));
    js.product_opt1_s = productOpt1S
    for (let opt1S of productOpt1S) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1S.opt_db, product_cd: opt1S.product_cd, opt_cd1: opt1S.opt_cd1 }))
        js[`product_opt2_${opt1S.opt_cd1}`] = result
        js.product_soldout_yn = 'N'
        js.product_stock = 1
    }

    const [productOpt1I] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'I' }, fm));
    js.product_opt1_i = productOpt1I
    for (let opt1I of productOpt1I) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1I.opt_db, product_cd: opt1I.product_cd, opt_cd1: opt1I.opt_cd1 }))
        js[`product_opt2_${opt1I.opt_cd1}`] = result
        js.product_soldout_yn = 'N'
        js.product_stock = 1
    }

    //��ǰ�� ���û�ǰ(wt_product_relation)
    sql = mybatisMapper.getStatement('product', 'ProductRelationList', { product_cd: row[0].product_cd, cust_seq: param.cust_seq }, fm);

    var [rowR] = await pool.query(sql);
    for (let item of rowR) {
        var [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option_file', { product_cd: item.relation_product_cd, file_gb: 'P' }, { fm }))
        item.product_main_list = result
    }
    js.relationList = rowR;


    const [qna] = await pool.query(mybatisMapper.getStatement('qna', 'get_product_count', { product_cd: row[0].product_cd }, fm))
    js.qna_count = qna[0].count


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}

async function getProductDetailApp(req, res) {
    var product_cd = decodeURIComponent(req.query.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";
    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }


    var sql = "";
    var param = {};
    var js = {};

    var cateSql = "";

    const authHeader = req.headers["authorization"]
    const token = authHeader?.split('Bearer ')[1];
    const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null

    param.product_cd = product_cd;
    param.cust_seq = userData?.cust_seq || null




    sql = mybatisMapper.getStatement('product', 'Product', param, fm);
    var [row] = await pool.query(sql);


    if (row == null || row.length == 0) {		//����� ���ٸ� �����Ͱ� ���ٰ� ����
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }

    const [productOpt1C, productOpt1S, productOpt1I] = await Promise.all([
        await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'C' }, fm)),
        await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'S' }, fm)),
        await pool.query(mybatisMapper.getStatement('product', 'get_product_option1_list', { product_cd: row[0].product_cd, opt_gb: 'I' }, fm))
    ])

    js.optionBases = [
        ...productOpt1C[0].map(x => {
            const {reg_date, ...rest} = x 
            return rest
        }),
        ...productOpt1S[0].map(x => {
            const {reg_date, ...rest} = x 
            return rest
        }),
        ...productOpt1I[0].map(x => {
            const {reg_date, ...rest} = x 
            return rest
        })
    ]

    let i = 1 ;
    for (let opt1C of productOpt1C[0]) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1C.opt_db, product_cd: opt1C.product_cd, opt_cd1: opt1C.opt_cd1 }))
       
        js[`OPTION_${opt1C.opt_gb}${i}`] = result
         
        i++;
    }
    
// console.log(`OPTION_${opt1C.opt_gb}${opt1C.opt_cd1.split("_")[1]}`);

    js[`OPTION_S`] = []
    for (let opt1S of productOpt1S[0]) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1S.opt_db, product_cd: opt1S.product_cd, opt_cd1: opt1S.opt_cd1 }))
        js[`OPTION_S`].push(...result)
    }

    js[`OPTION_I`] = []
    for (let opt1I of productOpt1I[0]) {
        const [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option2_list', { opt_gb: opt1I.opt_db, product_cd: opt1I.product_cd, opt_cd1: opt1I.opt_cd1 }))
        js[`OPTION_I`].push(...result)
    }
    
    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}


// New Code 2 
// By: Mr.Jung
async function f10_shop_code2_list_get(req, res) {
    var code1 = decodeURIComponent(req.query.code1); if (code1 == null || code1 == "" || code1 == "undefined" || code1 == undefined) code1 = "";

    if (code1 == null || code1 == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "Large Code is empty!", errorCode: -100, data: null }));
        return;
    }

    var sql = "";
    var param = { code_cd1: code1 };

    sql = mybatisMapper.getStatement('common', 'get_code_list', param, fm);

    var js = [];
    var [row] = await pool.query(sql);

    if (row == null || row.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty data", errorCode: 0, data: [] }));
        return;
    }

    for (var i = 0; i < row.length; i++) {
        var sub = {};
        sub.code_cd2 = row[i].code_cd2;
        sub.code_nm2 = row[i].code_nm2;
        sub.use_yn = row[i].use_yn;

        js.push(sub);
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}
module.exports.f10_shop_code2_list_get = f10_shop_code2_list_get;


async function f10_shop_BannerList_New_get(req, res) {
    await getBannerList_New(req, res);
}
module.exports.f10_shop_BannerList_New_get = f10_shop_BannerList_New_get;

async function getBannerList_New(req, res) {
    var web_use_yn = decodeURIComponent(req.query.web_use_yn); if (web_use_yn == null || web_use_yn == "" || web_use_yn == "undefined" || web_use_yn == undefined) web_use_yn = "";
    var and_use_yn = decodeURIComponent(req.query.and_use_yn); if (and_use_yn == null || and_use_yn == "" || and_use_yn == "undefined" || and_use_yn == undefined) and_use_yn = "";
    var ios_use_yn = decodeURIComponent(req.query.ios_use_yn); if (ios_use_yn == null || ios_use_yn == "" || ios_use_yn == "undefined" || ios_use_yn == undefined) ios_use_yn = "";

    var sqlCode = "";
    var paramCode = {};
    var js = {};

    var sql = "";

    paramCode.code_cd1 = "100";
    sqlCode = mybatisMapper.getStatement('common', 'get_code_list', paramCode, fm);

    var [code] = await pool.query(sqlCode);

    if (code == null || code.length == 0) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "empty code", errorCode: 0, data: [] }));
        return;
    }

    for (var i = 0; i < code.length; i++) {

        if (code[i].code_cd2 != null && code[i].code_cd2 != "") {

            var param = {};
            param.code_cd2 = code[i].code_cd2;
            param.web_use_yn = web_use_yn;
            param.and_use_yn = and_use_yn;
            param.ios_use_yn = ios_use_yn;
            sql += mybatisMapper.getStatement('product-etc', 'get_banner_list_New', param, fm);
        }
    }

    var js = [];
    var [results] = await pool.query(sql);
    for (var i = 0; i < results.length; i++) {
        if (results[i].length > 0) {
            var subData = {};
            subData.banner_type_code = code[i].code_cd2;
            subData.banner_type_nm = code[i].code_nm2;
            subData.data = results[i];

            js.push(subData);
        }
    }

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}

async function f10_shop_product_main_new_list_get(req, res) {
    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == null || category1_cd == "" || category1_cd == "undefined" || category1_cd == undefined) category1_cd = "";
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == null || category2_cd == "" || category2_cd == "undefined" || category2_cd == undefined) category2_cd = "";
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == null || category3_cd == "" || category3_cd == "undefined" || category3_cd == undefined) category3_cd = "";
    var group_cd = "1001"
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == undefined || cust_seq == "undefined") cust_seq = ""


    if (group_cd == null || group_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "group_cd is empty!", errorCode: -100, data: null }));
        return;
    }



    var csql = "";
    var sql = "";


    var param = { group_cd: group_cd, category1_cd: category1_cd, category2_cd: category2_cd, category3_cd: category3_cd, cust_seq };

    csql = mybatisMapper.getStatement('product-etc', 'GroupProductCount', param, fm);

    //console.log(csql);
    sql = mybatisMapper.getStatement('product-etc', 'GroupProductList', param, fm);

    // console.log(sql);
    const js = await fc.getList(req, res, csql, sql);
    for (const product of js.data) {
        const pr = {
            product_cd: product.product_cd,
            opt_cd2: '',
            file_gb: "P",
        }
        const pmlSql = mybatisMapper.getStatement('product', 'get_product_option_file', pr, fm)
        const [result] = await pool.query(pmlSql)
        product.product_main_list = result
    }
    res.send(js)
}
module.exports.f10_shop_product_main_new_list_get = f10_shop_product_main_new_list_get

async function f10_shop_product_main_best_list_get(req, res) {
    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == null || category1_cd == "" || category1_cd == "undefined" || category1_cd == undefined) category1_cd = "";
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == null || category2_cd == "" || category2_cd == "undefined" || category2_cd == undefined) category2_cd = "";
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == null || category3_cd == "" || category3_cd == "undefined" || category3_cd == undefined) category3_cd = "";
    var group_cd = "1002"
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == undefined || cust_seq == "undefined") cust_seq = ""

    if (group_cd == null || group_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "group_cd is empty!", errorCode: -100, data: null }));
        return;
    }



    var csql = "";
    var sql = "";


    var param = { group_cd: group_cd, category1_cd: category1_cd, category2_cd: category2_cd, category3_cd: category3_cd, cust_seq };

    csql = mybatisMapper.getStatement('product-etc', 'GroupProductCount', param, fm);

    //console.log(csql);
    sql = mybatisMapper.getStatement('product-etc', 'GroupProductList', param, fm);

    // console.log(sql);
    const js = await fc.getList(req, res, csql, sql);
    for (const product of js.data) {
        const pr = {
            product_cd: product.product_cd,
            opt_cd2: '',
            file_gb: "P",
        }
        const pmlSql = mybatisMapper.getStatement('product', 'get_product_option_file', pr, fm)
        const [result] = await pool.query(pmlSql)
        product.product_main_list = result
    }
    res.send(js)
}
module.exports.f10_shop_product_main_best_list_get = f10_shop_product_main_best_list_get

async function getTokenRefresh(long_token) {
    let longAccessToken; let expiresIn;
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${long_token}`;
    const response = await fetch(url, { method: "GET" })
    const result = response.json()
    if (result) {
        longAccessToken = result.access_token;
        expiresIn = result.expires_in;
    }
    return { long_access_token: longAccessToken, expires_in: expiresIn }
}


async function f10_shop_main_get_insta_img(req, res) {
    var { username: insta_usernm, generated_user_long_token } = config.social_login.instagram;

    const get_insta_token = mybatisMapper.getStatement("main", "get_insta_token", { insta_usernm: insta_usernm }, fm)
    const [insta_token] = await pool.query(get_insta_token)
    const user_access_token = insta_token[0].access_token;

    let long_token;
    let long_remain_date;
    let expires_in;

    if (!user_access_token) {
        await pool.query(mybatisMapper.getStatement("main", "insert_token", { insta_usernm, access_token: generated_user_long_token }, fm))
    }

    const [refresh_long_token] = await pool.query(mybatisMapper.getStatement("main", "long_token_info", { insta_usernm }, fm));
    if (refresh_long_token[0]) {
        long_token = refresh_long_token[0].access_token;
        long_remain_date = refresh_long_token[0].remain_date;
        expires_in = refresh_long_token[0].expires_in;
    }

    if ((long_token && !expires_in) || long_remain_date >= 45) {
        const result = await getTokenRefresh(long_token)
        if (result && result.expires_in && result.long_access_token) {
            await pool.query(
                mybatisMapper
                    .getStatement("main", "update_insta_token",
                        {
                            access_token: result.long_access_token,
                            expires_in: result.expires_in
                        }, fm)
            )
        }
    }

    const [media] = await pool.query(mybatisMapper.getStatement("main", "get_insta_media_info", { insta_usernm }, fm))
    let media_access_token
    let data_max_update_date
    let data_media_id
    let now_date
    if (media[0]) {
        media_access_token = media[0].access_token
        data_max_update_date = media[0].data_max_update_date
        data_media_id = media[0].data_media_id
        now_date = media[0].now_date
    }

    let data_max_update_val;
    let date;
    date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + (date.getUTCDate() - 1)).slice(-2) + ' ' +
        ('00' + date.getUTCHours()).slice(-2) + ':' +
        ('00' + date.getUTCMinutes()).slice(-2) + ':' +
        ('00' + date.getUTCSeconds()).slice(-2);

    if (!data_max_update_date) {
        data_max_update_val = date
    } else {
        data_max_update_val = data_max_update_date
    }

    var s_date = new Date(now_date);
    var e_date = new Date(data_max_update_val);


    var check_date = (s_date - e_date)
    if ((media_access_token && check_date >= 1) || !data_media_id) {
        const list_arr = [];
        const limit_cnt = 5;
        const url = `https://graph.instagram.com/me/media?fields=id&limit=${limit_cnt}&access_token=${media_access_token}`;
        const response = await fetch(url, { method: "GET" })
        const json_ids = response.json()
        if (json_ids && json_ids.data) {
            for (const item of json_ids.data) {
                list_arr.push(item)
            }
        }

        if (list_arr.length) {
            for (const item of list_arr) {
                var id = item.id
                var url_get_media = `https://graph.instagram.com/${id}?fields=id,media_type,media_url,permalink,username,thumbnail_url,timestamp&access_token=${media_access_token}`
                var response2 = await fetch(url_get_media, { method: "GET" })
                var json_media = response2.json()
                if (json_media) {
                    var media_id = json_media.id;
                    var media_type = json_media.media_type;
                    var media_url = json_media.media_url;
                    var permalink = json_media.permalink;
                    var thumbnail_url = json_media.thumbnail_url;
                    var username = json_media.username;
                    var timestamp = json_media.timestamp;
                    let media_url_val
                    let exist_media_id

                    if (media_type == "VIDEO") {
                        media_url_val = thumbnail_url
                    } else {
                        media_url_val = media_url
                    }

                    if (media_type) {
                        const [media] = await pool.query(mybatisMapper.getStatement("main", "get_insta_media_id", { media_id, insta_usernm }, fm))
                        if (media[0]) {
                            exist_media_id = media[0].media_id
                        }

                        if (exist_media_id) {
                            await pool.query(mybatisMapper.getStatement("main", "update_media_id", {
                                media_url: media_url_val,
                                media_id: media_id,
                                insta_usernm: insta_usernm
                            }))
                        } else {
                            await pool.query(
                                mybatisMapper.getStatement("main", "insert_media_data", {
                                    media_type,
                                    media_id,
                                    media_url,
                                    permalink,
                                    update_date: "NOW()",
                                    insta_usernm: username,
                                    timestamp
                                }, fm)
                            )
                        }
                    }

                }
            }
        }
    }

    const [result] = await pool.query(mybatisMapper.getStatement("main", "get_insta_data", { insta_usernm }, fm))
    res.send(result)
}

module.exports.f10_shop_main_get_insta_img = f10_shop_main_get_insta_img


async function f10_shop_main_get_insta_pet_img(req, res) {
    var { username2: insta_usernm, generated_user_long_token2: generated_user_long_token } = config.social_login.instagram;

    const get_insta_token = mybatisMapper.getStatement("main", "get_insta_token", { insta_usernm: insta_usernm }, fm)
    const [insta_token] = await pool.query(get_insta_token)
    const user_access_token = insta_token[0].access_token;

    let long_token;
    let long_remain_date;
    let expires_in;

    if (!user_access_token) {
        await pool.query(mybatisMapper.getStatement("main", "insert_token", { insta_usernm, access_token: generated_user_long_token }, fm))
    }

    const [refresh_long_token] = await pool.query(mybatisMapper.getStatement("main", "long_token_info", { insta_usernm }, fm));
    if (refresh_long_token[0]) {
        long_token = refresh_long_token[0].access_token;
        long_remain_date = refresh_long_token[0].remain_date;
        expires_in = refresh_long_token[0].expires_in;
    }

    if ((long_token && !expires_in) || long_remain_date >= 45) {
        const result = await getTokenRefresh(long_token)
        if (result && result.expires_in && result.long_access_token) {
            await pool.query(
                mybatisMapper
                    .getStatement("main", "update_insta_token",
                        {
                            access_token: result.long_access_token,
                            expires_in: result.expires_in
                        }, fm)
            )
        }
    }

    const [media] = await pool.query(mybatisMapper.getStatement("main", "get_insta_media_info", { insta_usernm }, fm))
    let media_access_token
    let data_max_update_date
    let data_media_id
    let now_date
    if (media[0]) {
        media_access_token = media[0].access_token
        data_max_update_date = media[0].data_max_update_date
        data_media_id = media[0].data_media_id
        now_date = media[0].now_date
    }

    let data_max_update_val;
    let date;
    date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + (date.getUTCDate() - 1)).slice(-2) + ' ' +
        ('00' + date.getUTCHours()).slice(-2) + ':' +
        ('00' + date.getUTCMinutes()).slice(-2) + ':' +
        ('00' + date.getUTCSeconds()).slice(-2);

    if (!data_max_update_date) {
        data_max_update_val = date
    } else {
        data_max_update_val = data_max_update_date
    }

    var s_date = new Date(now_date);
    var e_date = new Date(data_max_update_val);


    var check_date = (s_date - e_date)
    if ((media_access_token && check_date >= 1) || !data_media_id) {
        const list_arr = [];
        const limit_cnt = 5;
        const url = `https://graph.instagram.com/me/media?fields=id&limit=${limit_cnt}&access_token=${media_access_token}`;
        const response = await fetch(url, { method: "GET" })
        const json_ids = response.json()
        if (json_ids && json_ids.data) {
            for (const item of json_ids.data) {
                list_arr.push(item)
            }
        }

        if (list_arr.length) {
            for (const item of list_arr) {
                var id = item.id
                var url_get_media = `https://graph.instagram.com/${id}?fields=id,media_type,media_url,permalink,username,thumbnail_url,timestamp&access_token=${media_access_token}`
                var response2 = await fetch(url_get_media, { method: "GET" })
                var json_media = response2.json()
                if (json_media) {
                    var media_id = json_media.id;
                    var media_type = json_media.media_type;
                    var media_url = json_media.media_url;
                    var permalink = json_media.permalink;
                    var thumbnail_url = json_media.thumbnail_url;
                    var username = json_media.username;
                    var timestamp = json_media.timestamp;
                    let media_url_val
                    let exist_media_id

                    if (media_type == "VIDEO") {
                        media_url_val = thumbnail_url
                    } else {
                        media_url_val = media_url
                    }

                    if (media_type) {
                        const [media] = await pool.query(mybatisMapper.getStatement("main", "get_insta_media_id", { media_id, insta_usernm }, fm))
                        if (media[0]) {
                            exist_media_id = media[0].media_id
                        }

                        if (exist_media_id) {
                            await pool.query(mybatisMapper.getStatement("main", "update_media_id", {
                                media_url: media_url_val,
                                media_id: media_id,
                                insta_usernm: insta_usernm
                            }))
                        } else {
                            await pool.query(
                                mybatisMapper.getStatement("main", "insert_media_data", {
                                    media_type,
                                    media_id,
                                    media_url,
                                    permalink,
                                    update_date: "NOW()",
                                    insta_usernm: username,
                                    timestamp
                                }, fm)
                            )
                        }
                    }

                }
            }
        }
    }

    const [result] = await pool.query(mybatisMapper.getStatement("main", "get_insta_data", { insta_usernm }, fm))
    res.send(result)
}

module.exports.f10_shop_main_get_insta_pet_img = f10_shop_main_get_insta_pet_img




async function f10_shop_category_total(req, res) {
    const keyword = req.query.keyword
    const replaceKeyword = keyword && keyword.replaceAll(",", "|")
    const replaceKeyword2 = keyword && keyword.replaceAll(" ", "%")
    const sql = mybatisMapper.getStatement("product-search", "get-category-cnt", { keyword, replaceKeyword, replaceKeyword2 }, fm)
    const [result] = await pool.query(sql)
    res.send(result)
}

module.exports.f10_shop_category_total = f10_shop_category_total
async function f10_shop_product_month_hotdeal_list_get(req, res) {
    const gSql = mybatisMapper.getStatement('product-etc', 'get_group_nm', { group_cd: '6001' }, fm)

    const [resultGroup] = await pool.query(gSql)

    const sql = mybatisMapper.getStatement('product-etc', 'get_month_hotdeal', undefined, fm)
    const [result] = await pool.query(sql)
    const js = {}
    js.success = true;
    js.message = "";
    js.errorCode = 0;
    js.data = {
        name: resultGroup[0].group_nm,
        products: result
    };
    res.send(js)
}

module.exports.f10_shop_product_month_hotdeal_list_get = f10_shop_product_month_hotdeal_list_get


async function f10_shop_product_option(req, res) {
    const { index, product_cd, select_opt_cd2, siblings_opt_cd1, pre_opt_cd2 } = req.body
    console.log(req.body);
    const data = {
        index: Number(index) || 1,
        pre_opt_val: `opt_val${Number(index)}`,
        opt_val: `opt_val${Number(index) + 1}`,
        combine_idx: Number(index) + 1,
        product_cd,
        select_opt_cd2,
        siblings_opt_cd1,
        pre_opt_cd2
    }

    const sql = `SELECT
            tb1.eos_yn,
            tb1.stock_seq,
            tb1.stock,
            tb1.limit_cnt,
            tb1.soldout_yn,
            tb1.restock_date,
            tb1.stock_opt_price,
            tb2.*,
            ( SELECT opt_nm1 FROM wt_product_opt1 WHERE opt_cd1 = tb2.opt_cd1 AND product_cd = tb1.product_cd ) AS opt_nm1,
            (select opt_gb FROM wt_product_opt1 WHERE opt_cd1 = tb2.opt_cd1 and product_cd = tb1.product_cd) as opt_gb,
            (
            CASE
                    
            WHEN tb1.opt_val3 IS NOT NULL THEN
            3 
            WHEN tb1.opt_val3 IS NULL 
            AND tb1.opt_val2 IS NOT NULL THEN
                2 ELSE 1 
            END 
            ) AS tot_combine_cnt,
            ${data.combine_idx} AS combine_idx 
        FROM
            wt_product_stock tb1
            LEFT JOIN wt_product_opt2 tb2 ON tb2.opt_cd2 = tb1.${data.opt_val}
            AND tb2.product_cd = ${data.product_cd}
        WHERE
            tb1.product_cd = ${data.product_cd}
            ${data.pre_opt_cd2 !== '' ? `AND tb1.opt_val1 = ${data.pre_opt_cd2}` : ''}
            AND tb1.${data.pre_opt_val} = '${data.select_opt_cd2}'
            AND tb1.use_yn = 'Y' 
            AND tb1.opt_gb = 'C' 
        GROUP BY
            tb1.${data.opt_val} 
        ORDER BY
            tb2.od ASC,
        tb2.opt_nm2,
        tb2.opt_cd2 
            `
console.log(sql);
    const [result] = await pool.query(sql)
    res.json(result)
}
module.exports.f10_shop_product_option = f10_shop_product_option
async function f10_shop_special_product_lists(req, res) {
    var js = {}
    var data = {}
    var stat = parseInt(decodeURIComponent(req.query.stat)) || 1;
    var page = parseInt(decodeURIComponent(req.query.page)) || 1;
    var queries = req.query;
    var row_count = parseInt(decodeURIComponent(req.query.row_count)) || 0
    var [total] = await pool.query(mybatisMapper.getStatement('theme', 'get_list_count', { stat }, fm));
    var total_count = total[0].count;
    let total_page
    if (total_count > 0 && row_count > 0) {
        total_page = Math.ceil(total_count / row_count)
    } else {
        js.page = page;
        js.row_count = 15;
        js.start_num = 0;
        js.total_page = Math.ceil(total_count / js.row_count)
    }
    const [specialTop] = await pool.query(mybatisMapper.getStatement('theme', 'get_list', { ...queries, stat }, fm))
    if (specialTop.length) {
        for (const sList of specialTop) {
            const [result] = await pool.query(mybatisMapper.getStatement('theme', 'get_theme_relation_list', { theme_seq: sList.theme_seq, type: 'list' }))
            sList.top_product_list = result
        }
        data.special_list_top = specialTop
    }


    var [midBanner] = await pool.query(mybatisMapper.getStatement('theme', 'get_banner', { banner_cd: '116' }))
    var [ingPromotion] = await pool.query(mybatisMapper.getStatement('theme', 'get_promotion', { state: '1' }))
    var [endPromotion] = await pool.query(mybatisMapper.getStatement('theme', 'get_promotion', { state: '2' }))
    var [winner] = await pool.query(mybatisMapper.getStatement('theme', 'get_event_after', {}, fm))

    data.mid_banner = midBanner
    data.ing_promotion = ingPromotion
    data.end_promotion = endPromotion
    data.winner_list = winner
    js.data = data
    res.send(js)
}

module.exports.f10_shop_special_product_lists = f10_shop_special_product_lists



async function f10_shop_issue_coupon(req, res) {
    const data = req.body
    const [couponInfo] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponView', { coupon_seq: data.coupon_seq }, fm))
    data.coupon_use_gb = couponInfo[0].coupon_use_gb
    data.coupon_s_date = couponInfo[0].s_date
    data.coupon_e_date = couponInfo[0].e_date

    if (data.coupon_use_gb === 0) {
        const [coupon_number_cnt_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumberCount', { coupon_master_seq: data.coupon_master_seq, coupon_seq: data.coupon_seq }, fm))
        const coupon_number_cnt = coupon_number_cnt_info[0].coupon_number_cnt

        if (coupon_number_cnt > 0) {
            const [coupon_number_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumber2', { coupon_master_seq: data.coupon_master_seq, coupon_seq: data.coupon_seq }, fm))
            data.coupon_number = coupon_number_info[0].coupon_number


            if (data.coupon_number) {
                await pool.query(mybatisMapper.getStatement('coupon', 'insertIssueCoupon', data, fm))
                await pool.query(mybatisMapper.getStatement('coupon', 'updateIssueCoupon', { coupon_number: data.coupon_number }, fm))

                res.json({ status: 'ok', message: '정상적으로 처리되었습니다.' })
            } else {
                res.json({ status: 'err', message: '등록 가능한 쿠폰이 없습니다.' })
            }
        } else {
            res.json({ status: 'err', msg: '등록 가능한 쿠폰이 없습니다.' })
        }
    } else if (data.coupon_use_gb === 1) {
        const [coupon_number_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumber', { coupon_master_seq: data.coupon_master_seq }, fm))
        data.coupon_number = coupon_number_info[0].coupon_number

        if (data.coupon_number) {
            await pool.query(mybatisMapper.getStatement('coupon', 'insertIssueCoupon', data, fm))
            res.json({ status: 'ok', msg: '정상적으로 처리되었습니다.' })
        } else {
            res.json({ status: 'err', msg: '등록 가능한 쿠폰이 없습니다.' })
        }
    }

}
module.exports.f10_shop_issue_coupon = f10_shop_issue_coupon


async function f10_shop_issue_all_coupon(req, res) {
    const data = req.body
    const param = []
    const result = {}

    let i = 0
    for (let coupon_seq of data.coupon_seq) {
        // data.coupon_seq = coupon_seq
        param[i] = {}
        param[i]['coupon_seq'] = coupon_seq
        i++
    }

    i = 0
    for (let coupon_master_seq of data.coupon_master_seq) {
        // data.coupon_master_seq = coupon_master_seq
        param[i] = param[i] || {}
        param[i]['coupon_master_seq'] = coupon_master_seq
        i++
    }
    
    param.forEach(async (item, index) => {
        const [couponInfo] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponView', { coupon_seq: item.coupon_seq }, fm))
        data.coupon_use_gb = couponInfo[0].coupon_use_gb
        data.coupon_s_date = couponInfo[0].s_date
        data.coupon_e_date = couponInfo[0].e_date
    
        if (data.coupon_use_gb === 0) {
            const [coupon_number_cnt_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumberCount', { coupon_master_seq: item.coupon_master_seq, coupon_seq: item.coupon_seq }, fm))
            const coupon_number_cnt = coupon_number_cnt_info[0].coupon_number_cnt
    
            if (coupon_number_cnt > 0) {
                const [coupon_number_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumber2', { coupon_master_seq: item.coupon_master_seq, coupon_seq: item.coupon_seq }, fm))
                data.coupon_number = coupon_number_info[0].coupon_number
    
    
                if (data.coupon_number) {
                    await pool.query(mybatisMapper.getStatement('coupon', 'insertIssueCoupon', {coupon_master_seq: item.coupon_master_seq, coupon_seq: item.coupon_seq, user_id: data.user_id, cust_seq: data.cust_seq, coupon_s_date: data.coupon_s_date, coupon_e_date: data.coupon_e_date, coupon_number: data.coupon_number}, fm))
                    await pool.query(mybatisMapper.getStatement('coupon', 'updateIssueCoupon', { coupon_number: data.coupon_number }, fm))
    
                    result.status = 'ok'
                    result.msg = '정상적으로 처리되었습니다.'
                } else {
                    result.status = 'err'
                    result.msg = '등록 가능한 쿠폰이 없습니다.'
                }
            } else {
                result.status = 'err'
                result.msg = '등록 가능한 쿠폰이 없습니다.'
            }
        } else if (data.coupon_use_gb === 1) {
            const [coupon_number_info] = await pool.query(mybatisMapper.getStatement('coupon', 'getCouponNumber', { coupon_master_seq: item.coupon_master_seq }, fm))
            data.coupon_number = coupon_number_info[0].coupon_number
    
            if (data.coupon_number) {
                await pool.query(mybatisMapper.getStatement('coupon', 'insertIssueCoupon', {coupon_master_seq: item.coupon_master_seq, coupon_seq: item.coupon_seq, user_id: data.user_id, cust_seq: data.cust_seq, coupon_s_date: data.coupon_s_date, coupon_e_date: data.coupon_e_date, coupon_number: data.coupon_number}, fm))
                result.status = 'ok'
                result.msg = '정상적으로 처리되었습니다.'
            } else {
                result.status = 'err'
                result.msg = '등록 가능한 쿠폰이 없습니다.'
            }
        }
        if (index === 1) {
            res.json(result)
        }
    })

}
module.exports.f10_shop_issue_all_coupon = f10_shop_issue_all_coupon


async function f10_shop_sale_category_list_get(req, res) {
    var sql = mybatisMapper.getStatement('sale', 'get_category_list', {}, fm)
    var js = await getList(req, res, null, sql)
    res.send(js)
}
module.exports.f10_shop_sale_category_list_get = f10_shop_sale_category_list_get

async function f10_shop_sale_product_lists(req, res) {
    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == undefined || category1_cd == "undefined" || category1_cd == null) category1_cd = ""
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == undefined || category2_cd == "undefined" || category2_cd == null) category2_cd = ""
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == undefined || category3_cd == "undefined" || category3_cd == null) category3_cd = ""
    var stock_yn = decodeURIComponent(req.query.stock_yn); if (stock_yn == undefined || stock_yn == "undefined" || stock_yn == null) stock_yn = ""
    var order_by = decodeURIComponent(req.query.order_by); if (order_by == undefined || order_by == "undefined" || order_by == null) order_by = ""
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == undefined || cust_seq == "undefined" || cust_seq == null) cust_seq == ""
    var csql = mybatisMapper.getStatement('sale', 'get_total', { category1_cd, category2_cd, category3_cd, stock_yn, order_by }, fm)
    var sql = mybatisMapper.getStatement('sale', 'get_list', {
        category1_cd,
        category2_cd,
        category3_cd,
        stock_yn,
        order_by
    }, fm)

    var js = await getList(req, res, csql, sql)

    for (const product of js.data) {
        var [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option_file', { product_cd: product.product_cd, file_gb: 'P' }, { fm }))
        var [cResult] = await pool.query(mybatisMapper.getStatement('product', 'get_product_color', { product_cd: product.product_cd }, { fm }))
        product.product_main_list = result
        product.product_color_list = cResult
    }

    res.send(js)
}
module.exports.f10_shop_sale_product_lists = f10_shop_sale_product_lists

async function f10_shop_sale_product_top_product_get(req, res) {
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == "undefined" || cust_seq == null || cust_seq == undefined) cust_seq = ""
    var sql = mybatisMapper.getStatement('sale', 'get_shop_list', { group_cd: 1003, cust_seq }, fm)
    var csql = mybatisMapper.getStatement('sale', 'get_shop_total', { group_cd: 1003, cust_seq }, fm)
    var js = await getList(req, res, csql, sql)

    for (const product of js.data) {
        var [result] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option_file', { product_cd: product.product_cd, file_gb: 'P' }, { fm }))
        var [cResult] = await pool.query(mybatisMapper.getStatement('product', 'get_product_color', { product_cd: product.product_cd }, { fm }))
        product.product_main_list = result
        product.product_color_list = cResult
    }

    res.send(js)
}
module.exports.f10_shop_sale_product_top_product_get = f10_shop_sale_product_top_product_get

async function f10_shop_system_cdn_get(req, res) {
    var ip = req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp
    var sql = mybatisMapper.getStatement('cdn', 'get_cdn', {}, fm)
    var [result] = await pool.query(sql)
    var div = result[0].service_div
    var allowed = false
    var url = 'https://www.amante.co.kr'
    switch (div) {
        case "VN":
            if (ip == "127.0.0.1" || ip == "14.241.209.20") {
                allowed = true
                url = 'https://cdn.amante.co.kr'
            }
            break;
        case "OPEN_ALL":
            allowed = true
            url = 'https://cdn.amante.co.kr'
            break;
        default:
            break;
    }
    var js = { ip, allowed, url }
    res.send(js)
}

module.exports.f10_shop_system_cdn_get = f10_shop_system_cdn_get

async function f10_shop_pet_category_list_get(req, res) {
    var category_m_cd = decodeURIComponent(req.query.category_m_cd); if (category_m_cd == null || category_m_cd == "undefined" || category_m_cd == undefined) category_m_cd = ""
    var [result] = await pool.query(mybatisMapper.getStatement("pet", "get_category_list", { category_m_cd: category_m_cd }, fm))
    var js = {}
    js.data = result
    res.send(js)
}

module.exports.f10_shop_pet_category_list_get = f10_shop_pet_category_list_get

async function f10_shop_icon_list_get(req, res) {
    var group_cds = decodeURIComponent(req.query.group_cds); if (group_cds == null || group_cds == undefined || group_cds == "undefined") group_cds = ""
    var [result] = await pool.query(mybatisMapper.getStatement("pet", "get_icon_list", { group_cds: group_cds.split(",") }, fm))
    var js = {}
    js.data = result
    res.send(js)
}
module.exports.f10_shop_icon_list_get = f10_shop_icon_list_get

async function f10_shop_icon_product_list(req, res) {
    var group_cd = decodeURIComponent(req.query.group_cd); if (group_cd == null || group_cd == "undefined" || group_cd == undefined) group_cd = ""
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == undefined || cust_seq == "undefined") cust_seq = ""
    var [result] = await pool.query(mybatisMapper.getStatement("pet", "get_icon_product_list", { group_cd: group_cd, cust_seq }, fm))
    for (const product of result) {
        var [fResult] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option_file', { product_cd: product.product_cd, file_gb: 'P' }, { fm }))
        var [cResult] = await pool.query(mybatisMapper.getStatement('product', 'get_product_color', { product_cd: product.product_cd }, { fm }))
        product.product_main_list = fResult
        product.product_color_list = cResult
    }
    var js = {}
    js.data = result
    res.send(js)
}
module.exports.f10_shop_icon_product_list = f10_shop_icon_product_list

async function f10_shop_event_list_get(req, res) {
    var event_seq = decodeURIComponent(req.query.event_seq); if (event_seq == null || event_seq == "undefined" || event_seq == undefined) event_seq = ""
    var page = parseInt(decodeURIComponent(req.query.page)) || 1
    var row_count = parseInt(decodeURIComponent(req.query.row_count)) || 25
    var start_num = (page - 1) * row_count
    var [result] = await pool.query(mybatisMapper.getStatement("pet", "get_event_list", { event_seq, start_num, row_count }, fm))
    var js = {}
    js.data = result
    res.send(js)
}

module.exports.f10_shop_event_list_get = f10_shop_event_list_get

async function f10_pet_product_list_get(req, res, group_cd = "") {
    var category1_cd = decodeURIComponent(req.query.category1_cd); if (category1_cd == null || category1_cd == undefined || category1_cd == "undefined") category1_cd = ""
    var category2_cd = decodeURIComponent(req.query.category2_cd); if (category2_cd == null || category2_cd == undefined || category2_cd == "undefined") category2_cd = ""
    var category3_cd = decodeURIComponent(req.query.category3_cd); if (category3_cd == null || category3_cd == undefined || category3_cd == "undefined") category3_cd = ""
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == undefined || cust_seq == "undefined") cust_seq = ""

    var sql = mybatisMapper.getStatement("sale", "get_shop_list", { group_cd, category1_cd, category2_cd, category3_cd, cust_seq }, fm)
    var csql = mybatisMapper.getStatement("sale", "get_shop_total", { group_cd, category1_cd, category2_cd, category3_cd, cust_seq }, fm)

    var js = await getList(req, res, csql, sql)
    for (const product of js.data) {
        var [cResult] = await pool.query(mybatisMapper.getStatement("product", "get_product_color", { product_cd: product.product_cd }, fm))
        var [fResult] = await pool.query(mybatisMapper.getStatement("product", "get_product_option_file", { product_cd: product.product_cd, file_gb: 'P' }, fm))
        product.product_color_list = cResult
        product.product_main_list = fResult
    }

    res.send(js)
}

async function f10_pet_best_product_list_get(req, res) {
    await f10_pet_product_list_get(req, res, 1002)
}

module.exports.f10_pet_best_product_list_get = f10_pet_best_product_list_get

async function f10_pet_new_product_list_get(req, res) {
    await f10_pet_product_list_get(req, res, 1001)
}

module.exports.f10_pet_new_product_list_get = f10_pet_new_product_list_get

async function f10_top_banner_list_get(req, res) {
    await getBannerList(req, res, 123)
}

module.exports.f10_top_banner_list_get = f10_top_banner_list_get

async function f10_center_banner_list_get(req, res) {
    await getBannerList(req, res, 122)
}

module.exports.f10_center_banner_list_get = f10_center_banner_list_get



async function f10_shop_product_restock(req, res) {
    const data = req.body

    const [exists_restock] = await pool.query(mybatisMapper.getStatement('product', 'exists_restock', data, fm))

    if (exists_restock[0].cnt > 0) {
        res.send({ success: false, message: '이미 재입고 신청이 완료되었습니다.' })
    } else {
        try {
            await pool.query(mybatisMapper.getStatement('product', 'insert_restock', data, fm))
            res.json({ success: true, message: '재입고 신청이 완료되었습니다.' })
        } catch (error) {
            res.json({ success: false, message: '에러가 발생했습니다.' })
        }
    }
}
module.exports.f10_shop_product_restock = f10_shop_product_restock




async function f10_shop_product_review_list(req, res) {
    const data = req.query
    data.page = Number(data.page) || 1
    data.row_count = 5 * data.page
    data.start_num = 0
    data.group_yn = data.group_yn || 'N'
    data.cust_seq = 29092001
    let review_gb = ''
    let sort = ''

    if (data.review_gb) {
        review_gb = `AND review_gb = '${data.review_gb}'`
    }

    if (data.review_sort === 'point_desc') {
        sort = 'point DESC'
    } else if (data.review_sort === 'point_asc') {
        sort = 'point ASC'
    } else if (data.review_sort === 'like_cnt') {
        sort = "like_cnt DESC, use_review_seq DESC"
    } else {
        sort = "use_review_seq DESC"
    }
    data.review_gb = review_gb
    data.sort = sort

    const [result] = await pool.query(mybatisMapper.getStatement('mypage', 'get_product_list', data, fm))
    res.json(result)

}
module.exports.f10_shop_product_review_list = f10_shop_product_review_list





async function f10_shop_product_review_comment(req, res) {
    const [result] = await pool.query(mybatisMapper.getStatement('mypage', 'get_comment', { use_review_seq: req.query.use_review_seq }, fm))
    res.json(result)
}
module.exports.f10_shop_product_review_comment = f10_shop_product_review_comment




async function f10_shop_event_insert_like(req, res) {
    const data = req.body
    const [result] = await pool.query(mybatisMapper.getStatement('event', 'insert_like_info', data, fm))

    if (result) {
        res.send({ status: 'Y' })
    } else {
        res.send({ status: 'N', msg: '좋아요 처리 중 오류가 발생했습니다.' })
    }
}
module.exports.f10_shop_event_insert_like = f10_shop_event_insert_like




async function f10_shop_event_delete_like(req, res) {
    const data = req.body
    const [result] = await pool.query(mybatisMapper.getStatement('event', 'delete_like_info', data, fm))

    if (result) {
        res.send({ status: 'Y' })
    } else {
        res.send({ status: 'N', msg: '좋아요 처리 중 오류가 발생했습니다.' })
    }
}
module.exports.f10_shop_event_delete_like = f10_shop_event_delete_like


async function f10_shop_event_insert_comment(req, res) {
    await pool.query(mybatisMapper.getStatement('event', 'insert_comment', req.body, fm))
    res.send({ message: 'success' })
}
module.exports.f10_shop_event_insert_comment = f10_shop_event_insert_comment




async function f10_shop_qna_list(req, res) {
    const data = req.query
    data.page = Number(data.page) || 1
    data.row_count = 5 * data.page
    data.start_num = 0

    const [result] = await pool.query(mybatisMapper.getStatement('qna', 'get_product_list', data, fm))
    res.json(result)

}
module.exports.f10_shop_qna_list = f10_shop_qna_list
// 20230525 Mr.Jung, Product Detail New
async function f10_shop_product_detail_New_get(req, res) {
    await getProductDetailNew(req, res);
}
module.exports.f10_shop_product_detail_New_get = f10_shop_product_detail_New_get;

async function getProductDetailNew(req, res) {

    var sql = "";
    var param = {};
    var js = {};
    var tc = await fc.tokenChecker(req, res);
    var cust_seq = tc == "" ? cust_seq = "" : cust_seq = tc.cust_seq;
    var product_cd = decodeURIComponent(req.query.product_cd); if (product_cd == null || product_cd == "" || product_cd == "undefined" || product_cd == undefined) product_cd = "";

    if (product_cd == null || product_cd == "") {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "product_cd is empty!", errorCode: -100, data: null }));
        return;
    }

    param.product_cd = product_cd;
    param.cust_seq = cust_seq;

    sql = mybatisMapper.getStatement('product', 'ProductDetail_New', param, fm);
    var [ds] = await pool.query(sql);

    if (ds[0].length != 1) {
        res.set({
            'content-type': 'application/json'
        }).send(JSON.stringify({ success: false, message: "Data is empty!", errorCode: -100, data: null }));
        return;
    }

    js.product_cd = ds[0][0].product_cd;
    js.product_state = ds[0][0].product_state;
    js.group_yn = ds[0][0].group_yn;
    js.group_cd = ds[0][0].group_cd;
    js.product_nm = ds[0][0].product_nm;
    js.product_etc_nm = ds[0][0].product_etc_nm;
    js.product_deal_nm = ds[0][0].product_deal_nm;
    js.product_nm_eng = ds[0][0].product_nm_eng;
    js.product_stock = ds[0][0].product_stock;
    js.coupon_use_yn = ds[0][0].coupon_use_yn;
    js.reserve_use_yn = ds[0][0].reserve_use_yn;
    js.reserve_give_yn = ds[0][0].reserve_give_yn;
    js.supply_price = ds[0][0].supply_price;
    js.sale_price = ds[0][0].sale_price;
    js.fee_rate = ds[0][0].fee_rate;
    js.reserve_rate = ds[0][0].reserve_rate;
    js.keywd = ds[0][0].keywd;
    js.product_content = ds[0][0].product_content;
    js.icon = ds[0][0].icon;
    js.free_trans_yn = ds[0][0].free_trans_yn;
    js.discount_gb = ds[0][0].discount_gb;
    js.product_relation_yn = ds[0][0].product_relation_yn;
    js.best_product_display = ds[0][0].best_product_display;
    js.best_review_display = ds[0][0].best_review_display;

    js.write_use_yn = ds[0][0].write_use_yn;
    js.write_title = ds[0][0].write_title;
    js.order_limit_cnt = ds[0][0].order_limit_cnt;
    js.order_mini_quantiry = ds[0][0].order_mini_quantiry;
    js.shipping_yn = ds[0][0].shipping_yn;
    js.shipping_gudie = ds[0][0].shipping_gudie;
    js.return_yn = ds[0][0].return_yn;
    js.return_guide = ds[0][0].return_guide;
    js.exchange_yn = ds[0][0].exchange_yn;
    js.exchange_guide = ds[0][0].exchange_guide;
    js.vw_cnt = ds[0][0].vw_cnt;
    js.hits = ds[0][0].hits;
    js.review_cnt = ds[0][0].review_cnt;
    js.order_cnt = ds[0][0].order_cnt;
    js.del_yn = ds[0][0].del_yn;
    js.reg_date = ds[0][0].reg_date;
    js.point = ds[0][0].point;
    js.review_pt_yn = ds[0][0].review_pt_yn;
    js.hidden_yn = ds[0][0].hidden_yn;

    var additionList = [];
    if (ds[1].length > 0) {
        for (var i = 0; i < ds[1].length; i++) {
            additionList.push(ds[1][i].addition_product_cd);
        }
    }
    js.additionList = additionList;

    var categoryList = [];
    if (ds[2].length > 0) {
        for (var i = 0; i < ds[2].length; i++) {
            var category = {};
            category.category1_cd = ds[2][i].category1_cd;
            category.category2_cd = ds[2][i].category2_cd;
            category.category3_cd = ds[2][i].category3_cd;
            category.category1_nm = ds[2][i].category1_nm;
            category.category2_nm = ds[2][i].category2_nm;
            category.category3_nm = ds[2][i].category3_nm;
            categoryList.push(category);
        }
    }
    js.categoryList = categoryList;

    var proudctCon = {};
    if (ds[3].length == 1) {
        proudctCon.content2 = ds[3][0].content2;
        proudctCon.content3 = ds[3][0].content3;
        proudctCon.content4 = ds[3][0].content4;
    }
    js.productCon = proudctCon;

    var productDetail = {};
    if (ds[4].length == 1) {
        productDetail.product_cd = ds[4][0].product_cd;
        productDetail.product_info_title = ds[4][0].product_info_title;
        productDetail.product_info = ds[4][0].product_info;
        productDetail.product_info_content = ds[4][0].product_info_content;
        productDetail.product_color = ds[4][0].product_color;
        productDetail.product_use_age = ds[4][0].product_use_age;
        productDetail.product_make_country = ds[4][0].product_make_country;
        productDetail.product_make_company = ds[4][0].product_make_company;
        productDetail.product_import = ds[4][0].product_import;
        productDetail.product_launch_year = ds[4][0].product_launch_year;
        productDetail.product_material = ds[4][0].product_material;
        productDetail.product_nc_cert = ds[4][0].product_nc_cert;
        productDetail.product_as_inquire = ds[4][0].product_as_inquire;
        productDetail.product_guaranty = ds[4][0].product_guaranty;
        productDetail.product_laundry = ds[4][0].product_laundry;
        productDetail.product_npncode = ds[4][0].product_npncode;
        productDetail.kfda_check = ds[4][0].kfda_check;
        productDetail.ingredient = ds[4][0].ingredient;
        productDetail.content = ds[4][0].content;
        productDetail.content_eng = ds[4][0].content_eng;
        productDetail.content_mb = ds[4][0].content_mb;
        productDetail.product_component_editor = ds[4][0].product_component_editor;
        productDetail.product_component_yn = ds[4][0].product_component_yn;
        productDetail.product_content_yn = ds[4][0].product_content_yn;
        productDetail.reg_date = ds[4][0].reg_date;
        productDetail.product_component_view_yn = ds[4][0].product_component_view_yn;
    }
    js.productDetail = productDetail;

    var fileInfo = [];
    if (ds[5].length > 0) {
        for (var i = 0; i < ds[5].length; i++) {
            var fi = {};
            fi.product_file_seq = ds[5][i].product_file_seq;
            fi.opt_cd2 = ds[5][i].opt_cd2;
            fi.file_gb = ds[5][i].file_gb;
            fi.file_nm = ds[5][i].file_nm;
            fi.od = ds[5][i].od;

            fileInfo.push(fi);
        }
    }
    js.file = fileInfo;

    var relationList = [];
    if (ds[6].length > 0) {
        for (var i = 0; i < ds[6].length; i++) {
            var relation = {};
            relation.relation_product_cd = ds[6][i].relation_product_cd;

            relationList.push(relation);
        }
    }
    js.relationList = relationList;

    var optBase = [];
    if (ds[7].length > 0) {
        for (var i = 0; i < ds[7].length; i++) {
            var opt1 = {};
            opt1.opt_gb = ds[7][i].opt_gb;
            opt1.opt_gbnm = ds[7][i].opt_gbnm;
            opt1.opt_cd1 = ds[7][i].opt_cd1;
            opt1.opt_nm1 = ds[7][i].opt_nm1;
            opt1.mandatory_yn = ds[7][i].mandatory_yn;
            opt1.color_yn = ds[7][i].color_yn;

            optBase.push(opt1);
        }
    }
    js.optBase = optBase;

    var opt2_C = [];
    var opt2_S = [];
    var opt2_I = [];

    if (ds[8].length > 0) {
        for (var i = 0; i < ds[8].length; i++) {
            var opt2 = {};
            opt2.stock_seq = ds[8][i].stock_seq;
            opt2.opt_gb = ds[8][i].opt_gb;
            opt2.opt_gbnm = ds[8][i].opt_gbnm;
            opt2.stock = ds[8][i].stock;
            opt2.limit_cnt = ds[8][i].limit_cnt;
            opt2.soldout_yn = ds[8][i].soldout_yn;
            opt2.restock_date = ds[8][i].restock_date;
            opt2.use_yn = ds[8][i].use_yn;
            opt2.stock_opt_price = ds[8][i].stock_opt_price;
            opt2.eos_yn = ds[8][i].eos_yn;
            opt2.alram_cnt = ds[8][i].alram_cnt;

            if (ds[8][i].opt_gb == "C") {
                opt2.opt_val1 = ds[8][i].opt_val1;
                opt2.opt_val1_nm = ds[8][i].opt_val1_nm;
                opt2.opt_val2 = ds[8][i].opt_val2;
                opt2.opt_val2_nm = ds[8][i].opt_val2_nm;
                opt2.opt_val3 = ds[8][i].opt_val3;
                opt2.opt_val3_nm = ds[8][i].opt_val3_nm;
                opt2_C.push(opt2);
            } else {
                opt2.opt_val1 = ds[8][i].opt_cd1;
                opt2.opt_val1_nm = ds[8][i].opt_val_nm1;
                opt2.opt_val2 = ds[8][i].opt_cd2;
                opt2.opt_val2_nm = ds[8][i].opt_val_nm2;
                opt2.opt_val3 = null;
                opt2.opt_val3_nm = null;

                if (ds[8][i].opt_gb == "S") {
                    opt2_S.push(opt2);
                } else if (ds[8][i].opt_gb == "I") {
                    opt2_I.push(opt2);
                }
            }
        }
    }

    js.optionC = opt2_C;
    js.optionI = opt2_I;
    js.optionS = opt2_S;

    var commentRow = 0;
    var useReview = [];

    if (ds[9].length > 0) {
        for (var i = 0; i < ds[9].length; i++) {
            var useReviewDtl = {};
            useReviewDtl.use_review_seq = ds[9][i].use_review_seq;
            useReviewDtl.cust_seq = ds[9][i].cust_seq;
            useReviewDtl.user_id = ds[9][i].user_id;
            useReviewDtl.user_nm = ds[9][i].user_nm;
            useReviewDtl.reg_date = ds[9][i].reg_date;
            useReviewDtl.title = ds[9][i].title;
            useReviewDtl.content = ds[9][i].content;
            useReviewDtl.review_gb = ds[9][i].review_gb;
            useReviewDtl.point = ds[9][i].point;
            useReviewDtl.file_nm1 = ds[9][i].file_nm1;
            useReviewDtl.file_nm2 = ds[9][i].file_nm2;
            useReviewDtl.file_nm3 = ds[9][i].file_nm3;
            useReviewDtl.file_nm4 = ds[9][i].file_nm4;
            useReviewDtl.file_nm5 = ds[9][i].file_nm5;
            useReviewDtl.photo_review_url = ds[9][i].photo_review_url;
            useReviewDtl.photo_review_url2 = ds[9][i].photo_review_url2;
            useReviewDtl.photo_review_url3 = ds[9][i].photo_review_url3;
            useReviewDtl.photo_review_url4 = ds[9][i].photo_review_url4;
            useReviewDtl.photo_review_url5 = ds[9][i].photo_review_url5;
            useReviewDtl.photo_review_url6 = ds[9][i].photo_review_url6;
            useReviewDtl.reserved_yn = ds[9][i].reserved_yn;
            useReviewDtl.comment_cnt = ds[9][i].comment_cnt;
            useReviewDtl.like_cnt = ds[9][i].like_cnt;
            useReviewDtl.like_yn = ds[9][i].like_yn;

            if (ds[9][i].comment_cnt > 0) {
                var Comment = [];

                for (var j = commentRow; j < commentRow + ds[9][i].comment_cnt; j++) {
                    var CommentDtl = {};

                    CommentDtl.comment_seq = ds[10][j].comment_seq;
                    CommentDtl.use_review_seq = ds[10][j].use_review_seq;
                    CommentDtl.user_id = ds[10][j].user_id;
                    CommentDtl.user_nm = ds[10][j].user_nm;
                    CommentDtl.comment = ds[10][j].comment;
                    CommentDtl.reg_date = ds[10][j].reg_date;

                    Comment.push(CommentDtl);
                }
            }

            useReviewDtl.comment_data = Comment;
            commentRow += ds[9][i].comment_cnt;

            useReview.push(useReviewDtl);
        }
    }
    js.useReview = useReview;

    var qna = [];
    if (ds[11].length > 0) {
        for (var i = 0; i < ds[11].length; i++) {
            var qnaDtl = {};
            qnaDtl.no = ds[11][i].no;
            qnaDtl.code_nm2 = ds[11][i].code_nm2;
            qnaDtl.public_yn = ds[11][i].public_yn;
            qnaDtl.cust_seq = ds[11][i].cust_seq;
            qnaDtl.writer_yn = ds[11][i].writer_yn;
            qnaDtl.writer_id = ds[11][i].writer_id;
            qnaDtl.reg_date = ds[11][i].reg_date;
            qnaDtl.content = ds[11][i].content;
            qnaDtl.reply_yn = ds[11][i].reply_yn;
            qnaDtl.reply_content = ds[11][i].reply_content;

            qna.push(qnaDtl);
        }
    }
    js.qna = qna;


    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));

}


// Phuoc loi
async function f10_review_lists_comment(req, res) {

    var param = {};
    var sql = "";

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
module.exports.f10_review_lists_comment = f10_review_lists_comment




async function f10_review_lists(req, res) {
    var sql = "";
    var param = {};
    var js = {};
    var checkDevice = req.query.checkDevice;
 
    sql = mybatisMapper.getStatement('common', 'get_banner', { banner_cd: '131' }, fm);
    const [topBanner] = await pool.query(sql);
    js.top_banner = topBanner

    sql = mybatisMapper.getStatement('mypage', 'review-get_review_info', { banner_cd: '131',checkDevice:checkDevice }, fm);

    const [reviewInfo] = await pool.query(sql);
    js.review_info = reviewInfo

    res.set({
        'content-type': 'application/json'
    }).send(JSON.stringify({ success: true, message: "", errorCode: 0, data: js }));
}
module.exports.f10_review_lists = f10_review_lists



async function f10_product_cate_banner(req, res) {
    try {
        const query = req.query
        const [banner] = await pool.query(mybatisMapper.getStatement('product', 'get_product_cate_banner', query, fm))
        res.json({ success: true, banner })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
module.exports.f10_product_cate_banner = f10_product_cate_banner



async function f10_product_cate_list(req, res) {
    try {
        const authHeader = req.headers["authorization"]
        const token = authHeader?.split('Bearer ')[1];
        const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null
        const query = req.query
        query.cust_seq = userData?.cust_seq || null

        const [bests] = await pool.query(mybatisMapper.getStatement('product', 'get_best_group_list', query, fm))
        for (let best of bests) {
            const pr = {
                product_cd: best.product_cd,
                opt_cd2: '',
                file_gb: "P",
                page: ''
            }
            const [mainList] = await pool.query(mybatisMapper.getStatement('product', 'get_product_option_file', pr, fm))
            best.product_main_list = mainList
        }
        const [cate] = await pool.query(mybatisMapper.getStatement('product', 'get_category_list', query, fm))
        const [cate2] = await pool.query(mybatisMapper.getStatement('product', 'get_category_list2', query, fm))
        const [cate3] = await pool.query(mybatisMapper.getStatement('product', 'get_category_list3', query, fm))
        res.json({ success: true, data: { cate: cate[0], cate2, cate3, bests } })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
module.exports.f10_product_cate_list = f10_product_cate_list




async function f10_shop_review_list (req, res) {
    var cust_seq = decodeURIComponent(req.query.cust_seq); if (cust_seq == null || cust_seq == "" || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";

    const data = req.query
    data.page = Number(data.page) || 1
    data.row_count = 5 * data.page
    data.start_num = 0
    data.group_yn = data.group_yn || 'N'
    data.cust_seq = cust_seq
    let review_gb = ''
    let sort = ''

    if (data.review_gb) {
        review_gb = `AND review_gb = '${data.review_gb}'`
    }

    if (data.review_sort === 'point_desc') {
        sort = 'point DESC'
    } else if (data.review_sort === 'point_asc') {
        sort = 'point ASC'
    } else if (data.review_sort === 'like_cnt') {
        sort = "like_cnt DESC, use_review_seq DESC"
    } else {
        sort = "use_review_seq DESC"
    }
    data.review_gb = review_gb
    data.sort = sort
var sql = mybatisMapper.getStatement('mypage', 'get_review_comment', data, fm);
// console.log(sql);
    const [result] = await pool.query(mybatisMapper.getStatement('mypage', 'get_review_comment', data, fm))
    res.json(result)

}
module.exports.f10_shop_review_list = f10_shop_review_list


async function f10_product_keyword_list(req, res) {
    try {
        const session_id = req.query.session_id

        const [keyword] = await pool.query(mybatisMapper.getStatement('keyword', 'get_keyword_list', { session_id }, fm))
        res.json({ success: true, keyword })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
module.exports.f10_product_keyword_list = f10_product_keyword_list



async function f10_product_keyword_proc(req, res) {
    try {
        const authHeader = req.headers["authorization"]
        const token = authHeader?.split('Bearer ')[1];
        const userData = (token !== "undefined" && token !== undefined) ? await fc.tokenChecker(req, res) : null
        const data = req.body
        const mode = data.mode
        data.cust_seq = userData?.cust_seq || null
        data.path_gb = fc.checkDeviceType(req.headers['user-agent'])

        if (mode === 'ADD') {
            await pool.query(mybatisMapper.getStatement('keyword', 'insert_keyword', data, fm))
            res.json({ success: true, message: 'Add keyword successfully' })
        } else if (mode === 'DEL') {
            console.log(mybatisMapper.getStatement('keyword', 'del_keyword', data, fm))
            await pool.query(mybatisMapper.getStatement('keyword', 'del_keyword', data, fm))
            res.json({ success: true, message: 'Delete keyword successfully' })
        } else {
            await pool.query(mybatisMapper.getStatement('keyword', 'del_all_keyword', data, fm))
            res.json({ success: true, message: 'Delete all keyword successfully' })
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
module.exports.f10_product_keyword_proc = f10_product_keyword_proc

module.exports.f10_get_all_cdn = async function (req, res) {
    const [result,] = await pool.query(mybatisMapper.getStatement("cdn", "get_all_cdn", {}, fm));
    res.send(result)
}

module.exports.f10_update_cdn = async function (req, res) {
    const service_div = req.body.service_div || ""
    if(service_div == "") {
        return res.send({status: "err", response: "service_div is missing!"})
    }

    await pool.query(mybatisMapper.getStatement("cdn", "update_cdn", {service_div}, fm))
    return res.send({status: "ok"})
}


module.exports.f10_category_list = async function (req, res) {
    try {
        const [list] = await pool.query(mybatisMapper.getStatement('product', 'getCategoryList', {}, fm))

        for (let cate of list) {
             [cate.cate_list_2] = await pool.query(mybatisMapper.getStatement('product', 'getCategoryList2', {cate_cd: cate.category_cd}, fm))

            for (let cate2 of cate.cate_list_2) {
                [cate2.cate_list_3] = await pool.query(mybatisMapper.getStatement('product', 'getCategoryList3', {cate2_cd: cate2.category_cd}))
            }
        }

        res.json({success: true, data: list})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}


module.exports.f10_get_product_by_keyword = async (req, res) => {
    try {
        let cust_seq = decodeURIComponent(req.query.cust_seq);
        if (cust_seq == null || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";
        const keywords = req.query.keyword.split(',')

        if (keywords.length > 0) {
            const sql = mybatisMapper.getStatement("concept-room", "get_related_product", {
                keyword: keywords,
                cust_seq
            }, fm)

            const [keyResult,] = await pool.query(sql);
            res.json({success: true, data: keyResult})
        }
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

