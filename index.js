var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var compression = require('compression');
const session = require('express-session');
var mysql = require("mysql2/promise");
var fs = require('fs');
var randomstring = require("randomstring");
var urlencode = require("urlencode");
var log4js = require("log4js");
const spdy = require("spdy")
require("date-util")
var multer = require("multer");
var cors = require("cors")
var upload = multer({dest: 'html/uploads/'});
var fileUpload = require("./multer");
//설정 정보
const configFile = fs.readFileSync('./config.json', 'utf8');
const config = JSON.parse(configFile);

var requestIp = require('request-ip');


//�α� ����
// log4js.configure({
//     appenders: {
//         access: { type: 'dateFile', filename: 'log/access.log', pattern: '-yyyy-MM-dd' },
//         app: { type: 'file', filename: 'log/app.log', maxLogSize: 10485760, numBackups: 10 },
//         errorFile: { type: 'file', filename: 'log/errors.log', maxLogSize: 10485760, numBackups: 10 },
//         errors: { type: 'logLevelFilter', level: 'error', appender: 'errorFile' }
//     },
//     categories: {
//         default: { appenders: ['app', 'errors'], level: 'info' },
//         http: { appenders: ['access'], level: 'info' }
//     }
// });
// const logger = log4js.getLogger('console');		//console �� �α׸� log4js �� ĳġ
// console.log = logger.info.bind(logger);


//express �ε�
var app = express();


//http ���� ���
// app.use(compression({filter: shouldCompress}));


function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res);
}


//�⺻ dir �� html ������ ����
app.use(express.static(path.join(__dirname, 'html')));
app.use(bodyParser.urlencoded({limit: '100mb', extended: false}));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '100mb'}));
app.use(session({
    secret: "/dA43fnfe21Nme2ADR2jQ==",
    resave: false,
    saveUninitialized: false
}))
app.use(cors())
//���� port ���� �� ����

app.listen( 3010, '0.0.0.0', function () {
    console.log('Server started: ' + ( 3010));
})


// const options = {
//     key: fs.readFileSync(path.join(__dirname, "./cert/shopping.amante.co.kr_202304186C49C.key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, './cert/shopping.amante.co.kr_202304186C49C.crt.pem'))
// };

// spdy.createServer(options, app).listen(process.env.PORT || 3010, () => {
//     console.log(`Server listening on port ${process.env.PORT || 3010}`);
// });

app.use(requestIp.mw())


//�߰� �Լ�, ������ Ȯ���� ����
function getExtension(filename) {
    return filename.split('.').pop();
}


/*
DB ���� ����
*/

var pool = mysql.createPool(config.dbSetting);
// var pool = mysql.createPool({
// 	connectionLimit : 10, 
// 	host : "localhost",
//     user : "root",
//     password : "",
//     database : "amante",
// 	dateStrings: 'date',
//     charset: "utf8_general_ci"
// });


pool.query("set session sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");


//���� rest api ���� ��� �ε�
var func10 = require("./func10.js");
func10.settingDb(pool);


//���� rest api ���� ��� �ε�
var func10b = require("./func10Board.js");
func10b.settingDb(pool);


//���� rest api ���� ��� �ε�
var func10m = require("./func10Mem.js");
func10m.settingDb(pool);


//���� rest api ���� ��� �ε�
var func10o = require("./func10Order.js");
func10o.settingDb(pool);

var func10c = require("./funcComm.js");
func10c.settingDb(pool)

var func10co = require("./func10Community");
func10co.settingDb(pool)

var func10Upload = require("./func10Upload.js")
func10Upload.settingDb(pool)


var func10h = require("./func10House.js");
func10h.settingDb(pool);

var func10pr = require("./func10Promotion.js");
func10pr.settingDb(pool);

var func10log = require("./func10Log.js");
func10log.settingDb(pool);

var kakaoManager = require("./kakaoManager.js")
kakaoManager.settingDb(pool)

var func10room = require("./func10Room.js");
func10room.settingDb(pool);

var func10auth = require("./func10Auth");
func10auth.settingDb(pool)

var func10style = require("./func10Style");
func10style.settingDb(pool)

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

app.set('trust proxy', true);
var returnResult = function (err, res) {
    // ����� ������ ���� �����ϱ� ���� result ��ü ����
    var result = {};
    if (err) {
        //res.status(400);
        result.data = err.stack;
    } else {
        //res.status(200);
        result.data = res;
    }
    return result;
}


//php �� addSlashes ����
String.prototype.addSlashes = function () {
    //no need to do (str+'') anymore because 'this' can only be a string
    return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};


//api �α� �����
async function apiLog(req, res, api_name, method) {
    // var sql = "";

    // var reqJson = null;

    // //console.log(req);
    // if(req.query != null && req.query != "") {
    // 	if(reqJson == null) {
    // 		reqJson = JSON.stringify(req.query);
    // 	}
    // }

    // try
    // {
    // 	if(req.body != null && req.body != "") {
    // 		if(reqJson == null) {
    // 			reqJson = JSON.stringify(req.body);	
    // 		}
    // 	}
    // }
    // catch (err)
    // {
    // }


    // if(reqJson != null) reqJson = "'"+reqJson+"'";

    // sql = "insert into amanteLog.API_LOG(api_name, method, req, IP) ";
    // sql += "	values('"+api_name+"',  '"+method+"', "+reqJson+", '"+requestIp.getClientIp(req)+"')";
    // await pool.query(sql);
}


//api ��� ����
//----------------------------------

app.get('/v1.0/shop/product/cate/banner', function (req, res) {
    console.log('/v1.0/shop/product/cate/banner - get');

    apiLog(req, res, '/v1.0/shop/product/cate/banner', "GET");

    func10.f10_product_cate_banner(req, res);
});


app.get('/v1.0/shop/category/main/list', function (req, res) {
    console.log('/v1.0/shop/category/main/list - get');

    apiLog(req, res, '/v1.0/shop/category/main/list', "GET");

    func10.f10_shop_category_main_list_get(req, res);
});

app.get('/v1.0/shop/category/best/list', function (req, res) {
    console.log('/v1.0/shop/category/best/list - get');

    apiLog(req, res, '/v1.0/shop/category/best/list', "GET");

    func10.f10_shop_category_best_list_get(req, res);
});

app.get('/v1.0/shop/category/new/list', function (req, res) {
    console.log('/v1.0/shop/category/new/list - get');

    apiLog(req, res, '/v1.0/shop/category/new/list', "GET");

    func10.f10_shop_category_new_list_get(req, res);
});


//����
app.get('/v1.0/shop/banner/list', function (req, res) {
    console.log('/v1.0/shop/banner/list - get');

    apiLog(req, res, '/v1.0/shop/banner/list', "GET");

    func10.f10_shop_banner_list_get(req, res);
});
app.get('/v1.0/shop/banner/mainPopup', function (req, res) {
    console.log('/v1.0/shop/banner/mainPopup - get');

    apiLog(req, res, '/v1.0/shop/banner/mainPopup', "GET");

    func10.f10_shop_banner_mainPopup_get(req, res);
});
app.get('/v1.0/shop/banner/mainTop', function (req, res) {
    console.log('/v1.0/shop/banner/mainTop - get');

    apiLog(req, res, '/v1.0/shop/banner/mainTop', "GET");

    func10.f10_shop_banner_mainTop_get(req, res);
});
app.get('/v1.0/shop/banner/mainVisual', function (req, res) {
    console.log('/v1.0/shop/banner/mainVisual - get');

    apiLog(req, res, '/v1.0/shop/banner/mainVisual', "GET");

    func10.f10_shop_banner_mainVisual_get(req, res);
});
app.get('/v1.0/shop/banner/mainMiddle', function (req, res) {
    console.log('/v1.0/shop/banner/mainMiddle - get');

    apiLog(req, res, '/v1.0/shop/banner/mainMiddle', "GET");

    func10.f10_shop_banner_mainMiddle_get(req, res);
});
app.get('/v1.0/shop/banner/mainPopularKeyword', function (req, res) {
    console.log('/v1.0/shop/banner/mainPopularKeyword - get');

    apiLog(req, res, '/v1.0/shop/banner/mainPopularKeyword', "GET");

    func10.f10_shop_banner_mainPopularKeyword_get(req, res);
});
app.get('/v1.0/shop/banner/topGNB', function (req, res) {
    console.log('/v1.0/shop/banner/topGNB - get');

    apiLog(req, res, '/v1.0/shop/banner/topGNB', "GET");

    func10.f10_shop_banner_topGNB_get(req, res);
});
app.get('/v1.0/shop/banner/mainPopularKeywordBanner', function (req, res) {
    console.log('/v1.0/shop/banner/mainPopularKeywordBanner - get');

    apiLog(req, res, '/v1.0/shop/banner/mainPopularKeywordBanner', "GET");

    func10.f10_shop_banner_mainPopularKeywordBanner_get(req, res);
});

app.get('/v1.0/shop/banner/shopping_home_top_banner', function (req, res) {
    console.log('/v1.0/shop/banner/shopping_home_top_banner - get');

    apiLog(req, res, '/v1.0/shop/banner/shopping_home_top_banner', "GET");

    func10.f10_shop_banner_shopping_home_top_get(req, res);
});

app.get('/v1.0/shop/banner/shopping_home_banner', function (req, res) {
    console.log('/v1.0/shop/banner/shopping_home_banner - get');

    apiLog(req, res, '/v1.0/shop/banner/shopping_home_banner', "GET");

    func10.f10_shop_banner_shopping_home_get(req, res);
});


//�׷�
app.get('/v1.0/shop/group/list', function (req, res) {
    console.log('/v1.0/shop/group/list - get');

    apiLog(req, res, '/v1.0/shop/group/list', "GET");

    func10.f10_shop_group_list_get(req, res);
});


app.get('/v1.0/shop/group/product/list', function (req, res) {
    console.log('/v1.0/shop/group/product/list - get');

    apiLog(req, res, '/v1.0/shop/group/product/list', "GET");

    func10.f10_shop_group_product_list_get(req, res);
});


//�Ż�ǰ(1001)
app.get('/v1.0/shop/product/new/list', function (req, res) {
    console.log('/v1.0/shop/product/new/list - get');

    apiLog(req, res, '/v1.0/shop/product/new/list', "GET");

    func10.f10_shop_product_new_list_get(req, res);
});

//BEST �ڳ�(1002)
app.get('/v1.0/shop/product/best/list', function (req, res) {
    console.log('/v1.0/shop/product/best/list - get');

    apiLog(req, res, '/v1.0/shop/product/best/list', "GET");

    func10.f10_shop_product_best_list_get(req, res);
});

//SALE �ڳ�(1003)
app.get('/v1.0/shop/product/sale/list', function (req, res) {
    console.log('/v1.0/shop/product/sale/list - get');

    apiLog(req, res, '/v1.0/shop/product/sale/list', "GET");

    func10.f10_shop_product_sale_list_get(req, res);
});

//�Բ� ������ �ڵ�(3001)
app.get('/v1.0/shop/product/together/list', function (req, res) {
    console.log('/v1.0/shop/product/together/list - get');

    apiLog(req, res, '/v1.0/shop/product/together/list', "GET");

    func10.f10_shop_product_together_list_get(req, res);
});

//BEST(2001 - �Ƹ� ��?)
app.get('/v1.0/shop/product/pet/best/list', function (req, res) {
    console.log('/v1.0/shop/product/pet/best/list - get');

    apiLog(req, res, '/v1.0/shop/product/pet/best/list', "GET");

    func10.f10_shop_product_pet_best_list_get(req, res);
});

//[��]ħ��/��Ʈ(2002)
app.get('/v1.0/shop/product/pet/bedmat/list', function (req, res) {
    console.log('/v1.0/shop/product/pet/bedmat/list - get');

    apiLog(req, res, '/v1.0/shop/product/pet/bedmat/list', "GET");

    func10.f10_shop_product_pet_bedmat_list_get(req, res);
});

//[��]����(2003)
app.get('/v1.0/shop/product/pet/furniture/list', function (req, res) {
    console.log('/v1.0/shop/product/pet/furniture/list - get');

    apiLog(req, res, '/v1.0/shop/product/pet/furniture/list', "GET");

    func10.f10_shop_product_pet_furniture_list_get(req, res);
});

//[��]�峭��(2004)
app.get('/v1.0/shop/product/pet/toy/list', function (req, res) {
    console.log('/v1.0/shop/product/pet/toy/list - get');

    apiLog(req, res, '/v1.0/shop/product/pet/toy/list', "GET");

    func10.f10_shop_product_pet_toy_list_get(req, res);
});

//������ �ֵ�(6001)
app.get('/v1.0/shop/product/hotdeal/list', function (req, res) {
    console.log('/v1.0/shop/product/hotdeal/list - get');

    apiLog(req, res, '/v1.0/shop/product/hotdeal/list', "GET");

    func10.f10_shop_product_hotdeal_list_get(req, res);
});


app.get('/v1.0/shop/product/month_hotdeal/list', function (req, res) {
    console.log('/v1.0/shop/product/month_hotdeal/list - get');

    apiLog(req, res, '/v1.0/shop/product/month_hotdeal/list', "GET");

    func10.f10_shop_product_month_hotdeal_list_get(req, res);
});


app.get('/v1.0/shop/product/main/new/list', function (req, res) {
    console.log('/v1.0/shop/product/main/new/list - get')
    func10.f10_shop_product_main_new_list_get(req, res)
})

app.get('/v1.0/shop/product/main/best/list', function (req, res) {
    console.log('/v1.0/shop/product/main/new/list - get')
    func10.f10_shop_product_main_best_list_get(req, res)
})

//--------------------------------------------------------------------
//��ǰ

//��ǰ ���
app.get('/v1.0/shop/product/list', function (req, res) {
    console.log('/v1.0/shop/product/list - get');

    apiLog(req, res, '/v1.0/shop/product/list', "GET");

    func10.f10_shop_product_list(req, res);
});


//��ǰ ��
app.get('/v1.0/shop/product/detail', function (req, res) {
    console.log('/v1.0/shop/product/detail - get');

    apiLog(req, res, '/v1.0/shop/product/detail', "GET");

    func10.f10_shop_product_detail_get(req, res);
});

// API log
app.get('/v1.0/shop/category/list', function (req, res) {
    console.log('/v1.0/shop/category/list - get');

    apiLog(req, res, '/v1.0/shop/category/list', "GET");

    func10.f10_shop_category_list_get(req, res);
});


//--------------------------------------------------------------------
//�̺�Ʈ (event)

//�̺�Ʈ ���
app.get('/v1.0/board/index/winner/list', function (req, res) {
    console.log('/v1.0/board/index/winner/list - get');

    apiLog(req, res, '/v1.0/board/index/winner/list', "GET");

    func10b.f10_board_index_winner_list(req, res);
});


app.get('/v1.0/board/event/list', function (req, res) {
    console.log('/v1.0/board/event/list - get');

    apiLog(req, res, '/v1.0/board/event/list', "GET");

    func10b.f10_board_event_list_get(req, res);
});


app.get('/v1.0/board/event/after/list', function (req, res) {
    console.log('/v1.0/board/event/after/list - get');

    apiLog(req, res, '/v1.0/board/event/after/list', "GET");

    func10b.f10_board_event_after_list_get(req, res);
});


app.get('/v1.0/board/event/board/list', function (req, res) {
    console.log('/v1.0/board/event/board/list - get');

    apiLog(req, res, '/v1.0/board/event/board/list', "GET");

    func10b.f10_board_event_board_list_get(req, res);
});

app.get('/v1.0/board/event/recomm/list', function (req, res) {
    console.log('/v1.0/board/event/recomm/list - get');

    apiLog(req, res, '/v1.0/board/event/recomm/list', "GET");

    func10b.f10_board_event_recomm_list_get(req, res);
});


app.get('/v1.0/board/concept/room/list', function (req, res) {
    console.log('/v1.0/board/concept/room/list - get');

    apiLog(req, res, '/v1.0/board/concept/room/list', "GET");

    func10b.f10_board_concept_room_list_get(req, res);
});

app.get('/v1.0/board/concept/room/recomm/list', function (req, res) {
    console.log('/v1.0/board/concept/room/recomm/list - get');

    apiLog(req, res, '/v1.0/board/concept/room/recomm/list', "GET");

    func10b.f10_board_concept_room_recomm_list_get(req, res);
});


app.get('/v1.0/board/housewarming/list', function (req, res) {
    console.log('/v1.0/board/housewarming/list - get');

    apiLog(req, res, '/v1.0/board/housewarming/list', "GET");

    func10b.f10_board_housewarming_list_get(req, res);
});


app.get('/v1.0/board/theme/list', function (req, res) {
    console.log('/v1.0/board/theme/list - get');

    apiLog(req, res, '/v1.0/board/theme/list', "GET");

    func10b.f10_board_theme_list_get(req, res);
});

app.get('/v1.0/board/theme/recomm/list', function (req, res) {
    console.log('/v1.0/board/theme/recomm/list - get');

    apiLog(req, res, '/v1.0/board/theme/recomm/list', "GET");

    func10b.f10_board_theme_recomm_list_get(req, res);
});


//####################################################################################################################


//FAQ
app.get('/v1.0/board/faq/faq_lists', function (req, res) {
    console.log('/v1.0/board/faq/faq_lists - get');

    apiLog(req, res, '/v1.0/board/faq/faq_lists', "GET");

    func10b.f10_board_faq_faq_lists_get(req, res);
});

app.get('/v1.0/board/faq/faq_index_lists', function (req, res) {
    console.log('/v1.0/board/faq/faq_index_lists - get');

    apiLog(req, res, '/v1.0/board/faq/faq_index_lists', "GET");

    func10b.f10_board_faq_faq_index_lists_get(req, res);
});

app.get('/v1.0/board/faq/faq_lists_ajax', function (req, res) {
    console.log('/v1.0/board/faq/faq_lists_ajax - get');

    apiLog(req, res, '/v1.0/board/faq/faq_lists_ajax', "GET");

    func10b.f10_board_faq_faq_lists_ajax_get(req, res);
});

app.get('/v1.0/board/faq/faq_code_lists', function (req, res) {
    console.log('/v1.0/board/faq/faq_code_lists - get');

    apiLog(req, res, '/v1.0/board/faq/faq_code_lists', "GET");

    func10b.f10_board_faq_code_lists_get(req, res);
});


//QNA
app.get('/v1.0/board/qna/qna_lists', function (req, res) {
    console.log('/v1.0/board/qna/qna_lists - get');

    apiLog(req, res, '/v1.0/board/qna/qna_lists', "GET");

    func10b.f10_board_qna_qna_lists_get(req, res);
});


app.get('/v1.0/board/qna/index_qna_lists', function (req, res) {
    console.log('/v1.0/board/qna/index_qna_lists - get');

    apiLog(req, res, '/v1.0/board/qna/index_qna_lists', "GET");

    func10b.f10_board_qna_index_qna_lists_get(req, res);
});


app.get('/v1.0/board/qna/qna_lists_ajax', function (req, res) {
    console.log('/v1.0/board/qna/qna_lists_ajax - get');

    apiLog(req, res, '/v1.0/board/qna/qna_lists_ajax', "GET");

    func10b.f10_board_qna_qna_lists_ajax_get(req, res);
});


app.get('/v1.0/board/qna/qna_view', function (req, res) {
    console.log('/v1.0/board/qna/qna_view - get');

    apiLog(req, res, '/v1.0/board/qna/qna_view', "GET");

    func10b.f10_board_qna_qna_view_get(req, res);
});


app.get('/v1.0/board/qna/my_qna_lists', function (req, res) {
    console.log('/v1.0/board/qna/my_qna_lists - get');

    apiLog(req, res, '/v1.0/board/qna/my_qna_lists', "GET");

    func10b.f10_board_qna_my_qna_lists_get(req, res);
});


app.delete('/v1.0/board/qna/qna_del_ajax', function (req, res) {
    console.log('/v1.0/board/qna/qna_del_ajax - delete');

    apiLog(req, res, '/v1.0/board/qna/qna_del_ajax', "DELETE");

    func10b.f10_board_qna_qna_del_ajax_delete(req, res);
});


//TIP
app.get('/v1.0/board/tip/tip_lists', function (req, res) {
    console.log('/v1.0/board/tip/tip_lists - get');

    apiLog(req, res, '/v1.0/board/tip/tip_lists', "GET");

    func10b.f10_board_tip_tip_lists_get(req, res);
});


app.get('/v1.0/board/tip/tip_view', function (req, res) {
    console.log('/v1.0/board/tip/tip_view - get');

    apiLog(req, res, '/v1.0/board/tip/tip_view', "GET");

    func10b.f10_board_tip_tip_view_get(req, res);
});


app.get('/v1.0/shop/promotion/promotion_lists', function (req, res) {
    console.log('/v1.0/shop/promotion/promotion_lists - get');

    apiLog(req, res, '/v1.0/shop/promotion/promotion_lists', "GET");

    func10pr.f10_promotion_get_lists(req, res);
});

app.get('/v1.0/shop/promotion/banner_list', function (req, res) {
    console.log('/v1.0/shop/promotion/banner_list - get');

    apiLog(req, res, '/v1.0/shop/promotion/banner_list', "GET");

    func10pr.f10_promotion_get_banner(req, res);
});

app.get('/v1.0/shop/promotion/promotion_view', function (req, res) {
    console.log('/v1.0/shop/promotion/promotion_view - get');

    apiLog(req, res, '/v1.0/shop/promotion/promotion_view', "GET");

    func10pr.f10_promotion_get_view(req, res);
});

app.get('/v1.0/shop/promotion/promotion_view', function (req, res) {
    console.log('/v1.0/shop/promotion/promotion_view - get');

    apiLog(req, res, '/v1.0/shop/promotion/promotion_view', "GET");

    func10pr.f10_promotion_get_view(req, res);
});

app.get('/v1.0/shop/promotion/promotion_comment', function (req, res) {
    console.log('/v1.0/shop/promotion/promotion_comment - get');

    apiLog(req, res, '/v1.0/shop/promotion/promotion_comment', "GET");

    func10pr.f10_promotion_get_comment(req, res);
});


//####################################################################################################################


var crypto = require('crypto');

app.get('/v1.0/test/passwd', function (req, res) {
    console.log('/v1.0/test/passwd - get');


    var user_id = decodeURIComponent(req.query.user_id);
    if (user_id == null || user_id == "" || user_id == "undefined" || user_id == undefined) user_id = "";
    var passwd = decodeURIComponent(req.query.passwd);
    if (passwd == null || passwd == "" || passwd == "undefined" || passwd == undefined) passwd = "";

    if (user_id == "") user_id = "jih07092";
    if (passwd == "") passwd = "ejsvk!1003";


    var passhash = crypto.createHash('md5').update(passwd).digest("hex");


    var hash = crypto.createHash('sha512').update(passhash + 'pyungan' + user_id).digest('hex');
    console.log('hashed: ', hash);
    //�׽�Ʈ
    var js = {};
    js.hash = hash;
    js.passhash = passhash;

    res.send(js);
});


app.post('/v1.0/member/login', function (req, res) {
    console.log('/v1.0/member/login - post');

    apiLog(req, res, '/v1.0/member/login', "POST");

    func10m.f10_login_post(req, res);
});

app.get('/v1.0/member/token/verify', function (req, res) {
    console.log('/v1.0/member/token/verify - GET')

    apiLog(req, res, '/v1.0/member/token/verify', "GET");

    func10m.verify_access_token(req, res)
})


app.post('/v1.0/member/phone/check', function (req, res) {

    console.log("/v1.0/member/phone/check - POST")

    apiLog(req, res, '/v1.0/member/phone/check', "POST")

    func10m.f10_member_phone_check(req, res)
})


app.post('/v1.0/member/cert/check', function (req, res) {

    console.log("/v1.0/member/cert/check - POST")

    apiLog(req, res, "/v1.0/member/cert/check", "POST")

    func10m.f10_phone_code_check(req, res)

})


app.post('/v1.0/member/findId', function (req, res) {
    console.log('/v1.0/member/findId - post');

    func10m.f10_member_findId_post(req, res);
});

app.post('/v1.0/member/findPw', function (req, res) {
    console.log('/v1.0/member/findPw - post');

    func10m.f10_member_findPw_post(req, res);
});


app.post('/v1.0/member/changePassword', function (req, res) {
    console.log('/v1.0/member/changePassword - post');

    func10m.f10_member_changePassword_post(req, res);
});

app.post('/v1.0/member/idCheck', function (req, res) {
    console.log('/v1.0/member/idCheck - post');

    func10m.f10_member_idCheck_post(req, res);
});


app.post('/v1.0/member/join', function (req, res) {
    console.log('/v1.0/member/join - post');

    func10m.f10_member_join_post(req, res);
});


//TODO
app.post('/v1.0/member/leave', function (req, res) {
    console.log('/v1.0/member/leave - post');

    func10m.f10_member_leave_post(req, res);
});


app.get('/v1.0/member/info', function (req, res) {
    console.log('/v1.0/member/info - get');


    //console.log(req);

    func10m.f10_member_info_get(req, res);
});


app.get('/v1.0/cart/priceTotal', function (req, res) {
    apiLog(req, res, '/v1.0/cart/priceTotal', "GET");
    func10m.f10_cart_price_get(req, res);
})

app.get('/v1.0/cart/lists', function (req, res) {
    apiLog(req, res, '/v1.0/cart/lists', "GET");
    console.log('v1.0/cart/lists');
    func10m.f10_member_cart_lists_get(req, res);
})


//��ٱ��� ����
app.delete('/v1.0/member/cart/del', function (req, res) {
    console.log('/v1.0/member/cart/del - delete');

    func10m.f10_member_cart_del_delete(req, res);
});
app.delete('/v1.0/member/cart/del2', function (req, res) {
    console.log('/v1.0/member/cart/del2 - delete');

    func10m.f10_member_cart_del2_delete(req, res);
});

//��������
app.post('/v1.0/member/cart/updQty', function (req, res) {
    console.log('/v1.0/member/cart/updQty - post');

    func10m.f10_member_cart_updQty_post(req, res);
});
//�ɼǼ�������
app.post('/v1.0/member/cart/updOptQty', function (req, res) {
    console.log('/v1.0/member/cart/updOptQty - post');

    func10m.f10_member_cart_updOptQty_post(req, res);
});
//�ֹ��ϱ�
app.post('/v1.0/member/cart/order', function (req, res) {
    console.log('/v1.0/member/cart/order - post');

    func10m.f10_member_cart_order_post(req, res);
});
//��ٱ��� ����ϱ�
app.post('/v1.0/member/cart/insert', function (req, res) {
    console.log('/v1.0/member/cart/insert - post');

    func10m.f10_member_cart_insert_post(req, res);
});

app.post('/v1.0/member/cart/insert2', function (req, res) {
    console.log('/v1.0/member/cart/insert2 - post');

    func10m.f10_member_cart_insert_post_2(req, res);
});


app.post("/v1.0/member/wish_click", function (req, res) {

    console.log("/v1.0/member/wish_click - POST")

    func10m.f10_wishlist_click_on_post(req, res)

})

app.post("/v1.0/member/wish_click_off", function (req, res) {

    console.log("/v1.0/member/wish_click_off - POST")

    func10m.f10_wishlist_click_off_post(req, res)

})


//����
app.get('/v1.0/member/mypage/coupon/coupon_lists', function (req, res) {
    console.log('/v1.0/member/mypage/coupon/coupon_lists - get');

    //console.log(req);

    func10m.f10_member_mypage_coupon_coupon_lists_get(req, res);
});

//���� �߱�
app.post('/v1.0/member/mypage/coupon/coupon_proc', function (req, res) {
    console.log('/v1.0/member/mypage/coupon/coupon_proc - post');

    //console.log(req);

    func10m.f10_member_mypage_coupon_coupon_proc_post(req, res);
});

// New Code2
// By: Mr.Jung
app.get('/v1.0/shop/code2/list', function (req, res) {
    console.log('/v1.0/shop/code2/list - get');

    apiLog(req, res, '/v1.0/shop/code2/list', "GET");

    func10.f10_shop_code2_list_get(req, res);
});

app.get('/v1.0/shop/banner/list_New', function (req, res) {
    console.log('/v1.0/shop/banner/list_New - get');

    apiLog(req, res, '/v1.0/shop/banner/list_New', "GET");

    func10.f10_shop_BannerList_New_get(req, res);
});


//��ġ��
app.get('/v1.0/member/mypage/deposit/total', function (req, res) {
    console.log('/v1.0/member/mypage/deposit/total - get');

    //console.log(req);

    func10m.f10_member_mypage_deposit_total_get(req, res);
});


app.get('/v1.0/member/mypage/deposit/list', function (req, res) {
    console.log('/v1.0/member/mypage/deposit/list - get');

    //console.log(req);

    func10m.f10_member_mypage_deposit_list_get(req, res);
});


//���ϸ���
app.get('/v1.0/member/mypage/mileage/total', function (req, res) {
    console.log('/v1.0/member/mypage/mileage/total - get');

    //console.log(req);

    func10m.f10_member_mypage_mileage_total_get(req, res);
});

app.get('/v1.0/member/mypage/mileage/list', function (req, res) {
    console.log('/v1.0/member/mypage/mileage/list - get');

    //console.log(req);

    func10m.f10_member_mypage_mileage_list_get(req, res);
});


//push
app.get('/v1.0/member/mypage/push/list', function (req, res) {
    console.log('/v1.0/member/mypage/push/list - get');

    //console.log(req);
    //push_lists
    func10m.f10_member_mypage_push_list_get(req, res);
});

app.get('/v1.0/member/mypage/push/setting', function (req, res) {
    console.log('/v1.0/member/mypage/push/setting - get');

    //console.log(req);
    //push_setting
    func10m.f10_member_mypage_push_setting_get(req, res);
});

app.post('/v1.0/member/mypage/push/setting', function (req, res) {
    console.log('/v1.0/member/mypage/push/setting - post');

    //console.log(req);
    //push_setting
    func10m.f10_member_mypage_push_setting_post(req, res);
});


//wish
app.get('/v1.0/member/mypage/wish/list', function (req, res) {
    console.log('/v1.0/member/mypage/wish/list - get');

    //console.log(req);
    //wish_group_list_ajax
    func10m.f10_member_mypage_wish_list_get(req, res);
});

app.post('/v1.0/member/mypage/wish/proc', function (req, res) {
    console.log('/v1.0/member/mypage/wish/proc - post');

    //console.log(req);
    //wish_proc_ajax
    func10m.f10_member_mypage_wish_proc_post(req, res);
});


//review
app.get('/v1.0/member/mypage/index/review/list', function (req, res) {
    console.log('/v1.0/member/mypage/index/review/list - get');

    //console.log(req);
    //_getajaxList
    func10m.f10_member_mypage_index_review_list(req, res);
});


app.get('/v1.0/member/mypage/review/list', function (req, res) {
    console.log('/v1.0/member/mypage/review/list - get');

    //console.log(req);
    //_getajaxList
    func10m.f10_member_mypage_review_list_get(req, res);
});

//review_write
app.get('/v1.0/member/mypage/review/isWrite', function (req, res) {
    console.log('/v1.0/member/mypage/review/isWrite - get');

    //console.log(req);
    func10m.f10_member_mypage_review_isWrite_get(req, res);
});


app.post('/v1.0/member/mypage/review/proc', upload.any(), function (req, res) {
    console.log('/v1.0/member/mypage/review/proc - post');


    func10m.f10_member_mypage_review_proc_post(req, res);
});


app.delete('/v1.0/member/mypage/review/del', function (req, res) {
    console.log('/v1.0/member/mypage/review/del - delete');


    func10m.f10_member_mypage_review_del_delete(req, res);
});


app.post('/v1.0/member/mypage/review/procComment', upload.any(), function (req, res) {
    console.log('/v1.0/member/mypage/review/procComment - post');


    func10m.f10_member_mypage_review_procComment_post(req, res);
});


app.get('/v1.0/member/mypage/review/getComment', function (req, res) {
    console.log('/v1.0/member/mypage/review/getComment - get');


    func10m.f10_member_mypage_review_getComment_get(req, res);
});


//order
app.get('/v1.0/member/mypage/order/order_lists', function (req, res) {
    console.log('/v1.0/member/mypage/order/order_lists - get');


    func10m.f10_member_mypage_order_order_lists_get(req, res);
});

app.get('/v1.0/member/mypage/order/pre_order_lists', function (req, res) {
    console.log('/v1.0/member/mypage/order/pre_order_lists - get');


    func10m.f10_member_mypage_order_pre_order_lists_get(req, res);
});

app.post('/v1.0/member/mypage/order/cancel_proc_ajax', function (req, res) {
    console.log('/v1.0/member/mypage/order/cancel_proc_ajax - post');


    func10m.f10_member_mypage_order_cancel_proc_ajax_post(req, res);
});


app.post('/v1.0/member/mypage/order/order_proc_ajax', function (req, res) {
    console.log('/v1.0/member/mypage/order/order_proc_ajax - post');


    func10m.f10_member_mypage_order_order_proc_ajax_post(req, res);
});


app.post('/v1.0/member/mypage/order/refund_product_ajax', function (req, res) {
    console.log('/v1.0/member/mypage/order/refund_product_ajax - post');


    func10m.f10_member_mypage_order_refund_product_ajax_post(req, res);
});


app.post('/v1.0/member/mypage/order/refund_trans_price_ajax', function (req, res) {
    console.log('/v1.0/member/mypage/order/refund_trans_price_ajax - post');


    func10m.f10_member_mypage_order_refund_trans_price_ajax_post(req, res);
});


app.post('/v1.0/member/mypage/order/refund_product_opt_ajax', function (req, res) {
    console.log('/v1.0/member/mypage/order/refund_product_opt_ajax - post');


    func10m.f10_member_mypage_order_refund_product_opt_ajax_post(req, res);
});


app.post('/v1.0/member/mypage/order/cash_receipts_proc', function (req, res) {
    console.log('/v1.0/member/mypage/order/cash_receipts_proc - post');


    func10m.f10_member_mypage_order_cash_receipts_proc_post(req, res);
});


app.post('/v1.0/member/mypage/order/cash_receipts_cancel_proc', function (req, res) {
    console.log('/v1.0/member/mypage/order/cash_receipts_cancel_proc - post');


    func10m.f10_member_mypage_order_cash_receipts_cancel_proc_post(req, res);
});


//--------------------------------------------------------------------


//--------------------------------------------------------------------


//�ֹ��ϱ�
app.get('/v1.0/order/write', function (req, res) {
    console.log('/v1.0/order/write - get');

    //console.log(req);

    func10o.f10_order_write_get(req, res);
});


//�������
app.get('/v1.0/order/coupon', function (req, res) {
    console.log('/v1.0/order/coupon - get');

    //console.log(req);

    func10o.f10_order_coupon_get(req, res);
});

//���� COUPON_APPLY
app.post('/v1.0/order/coupon/apply', function (req, res) {
    console.log('/v1.0/order/coupon/apply - post');

    //console.log(req);

    func10o.f10_order_coupon_apply_post(req, res);
});


//[AJAX] �ֹ� PROC
app.post('/v1.0/order/proc', function (req, res) {
    console.log('/v1.0/order/proc - post');

    //console.log(req);

    func10o.f10_order_proc_ajax_post(req, res);
});

//[AJAX] �ֹ� PROC
app.post('/v1.0/order/kakaopay_account_ajax', function (req, res) {
    console.log('/v1.0/order/kakaopay_account_ajax - post');

    //console.log(req);

    func10o.f10_kakaopay_account_ajax_post(req, res);
});



// naver login
app.get('/v1.0/member/login/naver', function (req, res) {
    console.log('/v1.0/member/login/naver - get')
    func10m.f10_naver_login_get(req, res)
})
// naver login
app.get('/v1.0/member/login/test', function (req, res) {
    console.log('/v1.0/member/login/naver - get')
    func10m.f10_naver_login_get(req, res)
})

// callback after login naver
app.get('/v1.0/login/naver/callback', function (req, res) {
    console.log('/v1.0/login/naver/callback')
    func10m.f10_naver_login_callback_get(req, res)
})

//kakao logout
app.get('/v1.0/member/naver/logout', function (req, res) {
    func10m.f10_naver_logout_get(req, res)
})

// kakao login
app.get('/v1.0/member/login/kakao', function (req, res) {
    console.log('/v1.0/member/login/kakao - get')
    func10m.f10_kakao_login_get(req, res)
})

// callback after login kakao
app.get('/v1.0/login/kakao/callback', function (req, res) {
    console.log('/v1.0/login/kakao/callback')
    func10m.f10_kakao_login_callback_get(req, res)
})

//kakao logout
app.get('/v1.0/member/kakao/logout', function (req, res) {
    func10m.f10_kakao_logout_get(req, res)
})


//--------------------------------------------------------------------


app.get('/v1.0/test/ip', function (req, res) {
    console.log('/v1.0/test/ip - get');

    console.log(req.ip);

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var ip2 = ip.slice("::ffff:")[1];
    var ip3 = requestIp.getClientIp(req);

    res.set({
        'content-type': 'application/json'
    }).send({"ip": req.ip, "ip2": ip2, "ip3": ip3});
    return;
});


app.get('/v1.0/test/111', function (req, res) {
    console.log('/v1.0/test/111 - get');

    console.log(req.ip);
    console.log(req.url);
    console.log(req.ip);

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);

    var ip2 = ip.slice("::ffff:")[1];
    var ip3 = requestIp.getClientIp(req);

    res.set({
        'content-type': 'application/json'
    }).send({"ip": req.ip, "ip2": ip2, "ip3": ip3});
    return;
});


app.get('/v1.0/test/mysql', function (req, res) {
    console.log('/v1.0/test/mysql - get');


    var row = testMysql();

    res.set({
        'content-type': 'application/json'
    }).send({row: row});
    return;
});

async function testMysql() {
    var sql = "update wt_board set gender = 'N' where no = 1 ";
    var [row] = await pool.query(sql);

    console.log(row);


    sql = "insert into wt_auth(admin_id, menu_cd2) values('test', '905') ";
    var [row2] = await pool.query(sql);

    console.log(row2);

    return row;
}


//Notice 
app.get('/v1.0/board/notice/notice_index_lists', function (req, res) {
    console.log('/v1.0/board/notice/notice_index_lists - get');

    apiLog(req, res, '/v1.0/board/notice/notice_index_lists', "GET");

    func10b.f10_board_index_notice_list_get(req, res);
});


app.get('/v1.0/shop/main/insta_img/list', function (req, res) {
    console.log("/v1.0/shop/main/insta_img/list - GET")
    func10.f10_shop_main_get_insta_img(req, res)
})

app.get('/v1.0/shop/main/insta_img_pet/list', function (req, res) {
    console.log("/v1.0/shop/main/insta_img_pet/list - GET")
    func10.f10_shop_main_get_insta_pet_img(req, res)
})


// Sort list
app.get('/v1.0/common/code/list', function (req, res) {
    console.log('/v1.0/common/code/list - get');

    apiLog(req, res, '/v1.0/common/code/list', "GET");

    func10c.codeList(req, res);
})


// API community
app.get('/v1.0/shop/community/view', function (req, res) {
    console.log('/v1.0/shop/community/view - get')
    func10co.f10_community_get_view(req, res)
});

app.get('/v1.0/shop/community/list', function (req, res) {
    console.log('/v1.0/shop/community/list - get')
    func10co.f10_community_get_list(req, res)
});

app.get('/v1.0/shop/community/relation_product_list', function (req, res) {
    console.log('/v1.0/shop/community/relation_product_list - get')
    func10co.f10_community_relation_product_list(req, res)
});

app.get('/v1.0/shop/community/comment_total', function (req, res) {
    console.log('/v1.0/shop/community/comment_total - get')
    func10co.f10_community_get_comment_total(req, res)
});

app.get('/v1.0/shop/community/comment_list', function (req, res) {
    console.log('/v1.0/shop/community/comment_list - get')
    func10co.f10_community_get_comment_list(req, res)
});

app.get('/v1.0/shop/community/get_benefit_info', function (req, res) {
    console.log('/v1.0/shop/community/get_benefit_info - get')
    func10co.f10_community_get_benefit_info(req, res)
});


//THEME
app.get('/v1.0/special/product/list', function (req, res) {
    console.log('/v1.0/special/product/list - GET')
    apiLog(req, res, '/v1.0/special/product/list', "GET")
    func10.f10_shop_special_product_lists(req, res)
})


// Total categories
app.get('/v1.0/shop/category/total', function (req, res) {
    console.log('/v1.0/shop/category/total - get');

    apiLog(req, res, '/v1.0/shop/category/total', "GET");

    func10.f10_shop_category_total(req, res);
})

//SALE
app.get('/v1.0/sale/product/list', function (req, res) {
    console.log('/v1.0/sale/product/list - get');

    apiLog(req, res, '/v1.0/sale/product/list', "GET");

    func10.f10_shop_sale_product_lists(req, res)
})

app.get('/v1.0/sale/category/list', function (req, res) {
    console.log('/v1.0/sale/category/list - get');

    apiLog(req, res, '/v1.0/sale/category/list', "GET");

    func10.f10_shop_sale_category_list_get(req, res)
})

app.get('/v1.0/sale/top_product/list', function (req, res) {
    console.log('/v1.0/sale/top_product/list - get');

    apiLog(req, res, '/v1.0/sale/top_product/list', "GET");

    func10.f10_shop_sale_product_top_product_get(req, res)
})

app.get("/v1.0/system/cdn/check", function (req, res) {
    console.log('/v1.0/system/cdn/check - get');

    apiLog(req, res, '/v1.0/system/cdn/check', "GET");

    func10.f10_shop_system_cdn_get(req, res)
})

app.get("/v1.0/pet/category/list", function (req, res) {
    console.log('/v1.0/pet/category/list - get');

    apiLog(req, res, '/v1.0/pet/category/list', "GET");

    func10.f10_shop_pet_category_list_get(req, res)
})

app.get("/v1.0/shop/icon/list", function (req, res) {
    console.log('/v1.0/shop/icon/list - get');

    apiLog(req, res, '/v1.0/shop/icon/list', "GET");

    func10.f10_shop_icon_list_get(req, res)
})

app.get("/v1.0/shop/icon/product/list", function (req, res) {
    console.log('/v1.0/shop/icon/product/list - get');

    apiLog(req, res, '/v1.0/shop/icon/product/list', "GET");

    func10.f10_shop_icon_product_list(req, res)
})

app.get("/v1.0/shop/event/list", function (req, res) {
    console.log('/v1.0/shop/event/list - get');

    apiLog(req, res, '/v1.0/shop/event/list', "GET");

    func10.f10_shop_event_list_get(req, res)
})

app.get("/v1.0/pet/product/new/list", function (req, res) {

    console.log('/v1.0/pet/product/new/list - get');

    apiLog(req, res, '/v1.0/pet/product/new/list', "GET");

    func10.f10_pet_new_product_list_get(req, res)

})


// Issuing coupon
app.post('/v1.0/shop/product/issue_coupon', function (req, res) {
    console.log('v1.0/shop/product/issue_coupon - post')

    apiLog(req, res, 'v1.0/shop/product/issue_coupon', "POST");

    func10.f10_shop_issue_coupon(req, res);
})


app.post('/v1.0/shop/product/issue_all_coupon', function (req, res) {
    console.log('v1.0/shop/product/issue_all_coupon - post')

    apiLog(req, res, 'v1.0/shop/product/issue_all_coupon', "POST");

    func10.f10_shop_issue_all_coupon(req, res);
})


app.get("/v1.0/pet/product/best/list", function (req, res) {

    console.log('/v1.0/pet/product/best/list - get');

    apiLog(req, res, '/v1.0/pet/product/best/list', "GET");

    func10.f10_pet_best_product_list_get(req, res)

})

app.get("/v1.0/banner/pet/top/list", function (req, res) {
    console.log('/v1.0/banner/pet/top/list - get');

    apiLog(req, res, '/v1.0/banner/pet/top/list', "GET");

    func10.f10_top_banner_list_get(req, res)
})

app.get("/v1.0/banner/pet/center/list", function (req, res) {
    console.log('/v1.0/banner/pet/center/list - get');

    apiLog(req, res, '/v1.0/banner/pet/center/list', "GET");

    func10.f10_center_banner_list_get(req, res)
})


// Product options
app.post('/v1.0/shop/product/product_option', function (req, res) {
    console.log('v1.0/shop/product/product_option - post')

    apiLog('v1.0/shop/product/product_option', 'POST')

    func10.f10_shop_product_option(req, res)
})


app.post('/v1.0/shop/product/product_restock', function (req, res) {
    console.log('v1.0/shop/product/product_restock - post')

    apiLog('v1.0/shop/product/product_restock', 'POST')

    func10.f10_shop_product_restock(req, res)
})


app.get('/v1.0/shop/product/review/list', function (req, res) {
    console.log('/v1.0/shop/product/review/list - get')

    apiLog('/v1.0/shop/product/review/list', 'GET')

    func10.f10_shop_product_review_list(req, res)
})

app.get('/v1.0/shop/product/review/comment', function (req, res) {
    console.log('/v1.0/shop/product/review/comment - get')

    apiLog('/v1.0/shop/product/review/comment', 'GET')

    func10.f10_shop_product_review_comment(req, res)
})


app.post('/v1.0/shop/event/insert/like', function (req, res) {
    console.log('/v1.0/shop/event/insert/like - post')

    apiLog('/v1.0/shop/event/insert/like', 'POST')

    func10.f10_shop_event_insert_like(req, res)
})


app.delete('/v1.0/shop/event/delete/like', function (req, res) {
    console.log('/v1.0/shop/event/delete/like - delete')

    apiLog('/v1.0/shop/event/delete/like', 'DELETE')

    func10.f10_shop_event_delete_like(req, res)
})


app.post('/v1.0/shop/event/insert/comment', function (req, res) {
    console.log('/v1.0/shop/event/insert/comment - post')

    apiLog('/v1.0/shop/event/insert/comment', 'POST')

    func10.f10_shop_event_insert_comment(req, res)
})


app.get('/v1.0/shop/qna/list', function (req, res) {
    console.log('/v1.0/shop/qna/list - get')

    apiLog('/v1.0/shop/qna/list', 'GET')

    func10.f10_shop_qna_list(req, res)
})
app.post("/v1.0/files/upload", multer({dest: "./html/uploads"}).array("files"), function (req, res) {
    func10Upload.f10_shop_upload_image(req, res)
})

app.get('/v1.0/shop/product/detail_New', function (req, res) {
    console.log('/v1.0/shop/product/detail - get');
    apiLog(req, res, '/v1.0/shop/product/detail_New', "GET");
    func10.f10_shop_product_detail_New_get(req, res);
});

// Phuoc Loi

app.get('/v1.0/shop/review/review_lists', function (req, res) {
    console.log('/v1.0/shop/review/review_lists - get');

    apiLog(req, res, '/v1.0/shop/review/review_lists', "GET");

    func10.f10_review_lists(req, res);
});

app.get('/v1.0/shop/review/review_lists_comment', function (req, res) {
    console.log('/v1.0/shop/review/review_lists_comment - get');

    apiLog(req, res, '/v1.0/shop/review/review_lists_comment', "GET");

    func10.f10_review_lists_comment(req, res);
});


// Phuoc loi
app.get('/v1.0/shop/housewarming/list', function (req, res) {
    console.log('/v1.0/shop/housewarming/list - get');

    apiLog(req, res, '/v1.0/shop/housewarming/list', "GET");

    func10h.f10_house_get_list(req, res);
});

app.get('/v1.0/shop/housewarming/total', function (req, res) {
    console.log('/v1.0/shop/housewarming/total - get');

    apiLog(req, res, '/v1.0/shop/housewarming/total', "GET");

    func10h.f10_house_get_total(req, res);
});

app.get('/v1.0/shop/housewarming/view', function (req, res) {
    console.log('/v1.0/shop/housewarming/view - get');

    apiLog(req, res, '/v1.0/shop/housewarming/view', "GET");

    func10h.f10_house_get_view(req, res);
});


app.post('/v1.0/product/wish_proc', function (req, res) {
    console.log('/v1.0/product/wish_proc - post');

    apiLog(req, res, '/v1.0/product/wish_proc', "POST");

    func10c.wishProc(req, res);
})


app.get('/v1.0/cart/num_by_cust_seq', function (req, res) {
    console.log('/v1.0/cart/num_by_cust_seq - get');

    apiLog(req, res, '/v1.0/cart/num_by_cust_seq', "GET");

    func10m.get_cart_num_by_cust_seq(req, res);
})


app.post('/v1.0/shop/promotion/insert/comment', function (req, res) {
    console.log('/v1.0/shop/promotion/insert/comment - post')

    apiLog('/v1.0/shop/promotion/insert/comment', 'POST')

    func10pr.f10_promotion_insert_comment(req, res)
})

app.get('/v1.0/shop/promotion/promotion_comment_list', function (req, res) {
    console.log('/v1.0/shop/promotion/promotion_comment_list - get')

    apiLog('/v1.0/shop/promotion/promotion_comment_list', 'GET')

    func10pr.f10_promotion_get_comment_list(req, res)
})

app.post('/v1.0/log/insert/click', function (req, res) {
    console.log('/v1.0/log/insert/click - post')

    apiLog('/v1.0/log/insert/click', 'POST')

    func10log.f10_log_insert_click(req, res)
})
app.post('/v1.0/log/insert/time', function (req, res) {

    console.log('/v1.0/log/insert/time - post')

    apiLog('/v1.0/log/insert/time', 'POST')

    func10log.f10_log_insert_time(req, res)
})

app.get('/v1.0/shop/product/cate_banner', function (req, res) {
    console.log('/v1.0/shop/product/cate_banner - get');

    apiLog(req, res, '/v1.0/shop/product/cate_banner', "GET");

    func10.f10_product_cate_banner(req, res);
})


app.get('/v1.0/shop/product/cate_list', function (req, res) {
    console.log('/v1.0/shop/product/cate_list - get');

    apiLog(req, res, '/v1.0/shop/product/cate_list', "GET");

    func10.f10_product_cate_list(req, res);
})


app.get('/v1.0/shop/product/keyword_list', function (req, res) {
    console.log('/v1.0/shop/product/keyword_list - get');

    apiLog(req, res, '/v1.0/shop/product/keyword_list', "GET");

    func10.f10_product_keyword_list(req, res);
})


app.post('/v1.0/shop/product/keyword_proc', function (req, res) {
    console.log('/v1.0/shop/product/keyword_proc - post');

    apiLog(req, res, '/v1.0/shop/product/keyword_proc', "POST");

    func10.f10_product_keyword_proc(req, res);
})


app.get('/v1.0/shop/housewarming/comment', function (req, res) {
    console.log('/v1.0/shop/housewarming/comment - get');

    apiLog(req, res, '/v1.0/shop/housewarming/comment', "GET");

    func10h.f10_house_get_list_comment(req, res);
})


app.post('/v1.0/shop/house/insert/comment', function (req, res) {
    console.log('/v1.0/shop/house/insert/comment - post')

    apiLog('/v1.0/shop/house/insert/comment', 'POST')

    func10h.f10_house_insert_comment(req, res)
})


app.get('/v1.0/shop/review/list', function (req, res) {
    console.log('/v1.0/shop/review/list - get')

    apiLog('/v1.0/shop/review/list', 'GET')

    func10.f10_shop_review_list(req, res)
})

app.get('/v1.0/room/concept/view', function (req, res) {
    console.log('/v1.0/room/concept/view - get')
    apiLog('/v1.0/room/concept/view', 'GET')
    func10room.f10_concept_room_view_get(req, res)
})


app.get('/v1.0/shop/get/session_id', function (req, res) {
    console.log('/v1.0/shop/get/session_id - get')

    apiLog('/v1.0/shop/get/session_id', 'GET');

    func10c.getSessionId(req, res)
})

app.get('/v1.0/shop/get/check_overlap_product', function (req, res) {
    console.log('/v1.0/shop/get/check_overlap_product - get')

    apiLog('/v1.0/shop/get/check_overlap_product', 'GET')

    func10m.f10_cart_check_overlap_product(req, res)
})

app.get('/v1.0/shop/get/member_grp_info', function (req, res) {
    console.log('/v1.0/shop/get/member_grp_info - get')

    apiLog('/v1.0/shop/get/member_grp_info', 'GET')

    func10m.f10_cart_member_grp_info(req, res)
})



app.post('/v1.0/shop/cart/cart_proc', function (req, res) {
    console.log('/v1.0/shop/cart/cart_proc - post')

    apiLog('/v1.0/shop/cart/cart_proc', 'POST')

    func10m.f10_cart_proc_post(req, res)
})

app.get('/v1.0/room/concept/list', function (req, res) {
    console.log('/v1.0/room/concept/list - get')
    apiLog('/v1.0/room/concept/list', 'GET')
    func10room.f10_concept_room_list_get(req, res)
})

app.get('/v1.0/room/concept/styles/list', function (req, res) {
    console.log('/v1.0/room/concept/styles/list - get')
    apiLog('/v1.0/room/concept/styles/list', 'GET')
    func10room.f10_concept_room_style_list_get(req, res)
})

app.post('/v1.0/room/concept/new', function (req, res) {
    console.log('/v1.0/room/concept/new - POST')
    apiLog('/v1.0/room/concept/new', 'POST')
    func10room.f10_concept_room_insert_post(req, res);
})

app.get('/v1.0/room/concept/modify', function (req, res) {
    console.log('/v1.0/room/concept/modify - GET')
    apiLog('/v1.0/room/concept/modify', 'GET')
    func10room.f10_concept_room_edit_view_get(req, res);
})

app.post('/v1.0/room/concept/modify/post', function (req, res) {
    console.log('/v1.0/room/concept/modify/post - POST')
    apiLog('/v1.0/room/concept/modify/post', 'POST')
    func10room.f10_concept_room_edit_post(req, res);
})


app.post('/v1.0/room/concept/update_view_count', function (req, res) {
    console.log('/v1.0/room/concept/update_view_count - post')
    apiLog('/v1.0/room/concept/update_view_count', 'POST')
    func10c.updateViewCount(req, res)
})


app.post('/v1.0/room/concept/update_download_image_count', function (req, res) {
    console.log('/v1.0/room/concept/update_download_image_count - post')
    apiLog('/v1.0/room/concept/update_download_image_count', 'POST')
    func10c.updateDownloadImageCount(req, res)
})

app.post("/v1.0/manager/auth/login", function (req, res) {
    console.log('v1.0/manager/auth/login - POST');
    apiLog('/v1.0/manager/auth/login', 'POST')
    func10auth.f10_manager_login_post(req, res)
})

app.get("/v1.0/manager/style/list", function (req, res) {
    console.log('/v1.0/manager/style/list - GET');
    apiLog('/v1.0/manager/style/list', 'GET');
    func10style.f10_manager_styles_get(req, res);
})

app.get("/v1.0/manager/style/detailed", function (req, res) {
    console.log('/v1.0/manager/style/detailed - GET');
    apiLog('/v1.0/manager/style/detailed', 'GET');
    func10style.f10_manager_detailed_get(req, res);
})

app.get("/v1.0/manager/style/edit/view", function (req, res) {
    console.log('/v1.0/manager/style/edit/view - GET');
    apiLog('/v1.0/manager/style/edit/view', 'GET');
    func10style.f10_manager_style_edit_view(req, res);
})

app.get("/v1.0/manager/detailed/edit/view", function (req, res) {
    console.log('/v1.0/manager/detailed/edit/view - GET');
    apiLog('/v1.0/manager/detailed/edit/view', 'GET');
    func10style.f10_manager_detailed_edit_view(req, res);
})


app.post("/v1.0/manager/style/new", fileUpload.fields([
    {name: "style_icon_enb", maxCount: 1},
    {name: "style_icon_dis", maxCount: 1}
]), function (req, res) {
        console.log('/v1.0/manager/style/new - POST');
        apiLog('/v1.0/manager/style/new', 'POST');
        func10style.f10_manager_insert_style_post(req, res);
    })

app.post("/v1.0/manager/detailed/new", function (req, res) {
    console.log('/v1.0/manager/detailed/new - POST');
    apiLog('/v1.0/manager/detailed/new', 'POST');
    func10style.f10_manager_insert_detailed_post(req, res)
})


app.post("/v1.0/manager/style/edit", fileUpload.fields([
    {name: "style_icon_enb", maxCount: 1},
    {name: "style_icon_dis", maxCount: 1}
]), function (req, res) {
    console.log('/v1.0/manager/style/edit - POST');
    apiLog('/v1.0/manager/style/edit', 'POST');
    func10style.f10_manager_style_edit_post(req, res);
})

app.post("/v1.0/manager/detailed/edit", function (req, res) {
    console.log('/v1.0/manager/detailed/edit - POST');
    apiLog('/v1.0/manager/detailed/edit', 'POST');
    func10style.f10_manager_detailed_edit_post(req, res);
})

app.get("/v1.0/manager/concept/room/list", function (req, res) {
    console.log('/v1.0/manager/concept/room/list - GET');
    apiLog('/v1.0/manager/concept/room/list', 'GET');
    func10room.f10_concept_room_manager_list(req, res)
})

app.post("/v1.0/manager/concept/room/list/update", function (req, res) {
    console.log('/v1.0/manager/concept/room/list/update - POST');
    apiLog('/v1.0/manager/concept/room/list/update', 'POST');
    func10room.f10_concept_room_manager_update_list(req, res);
})

app.get("/v1.0/manager/system/cdn", function (req, res) {
    console.log('/v1.0/manager/system/cdn - GET');
    apiLog('/v1.0/manager/system/cdn', 'GET');
    func10.f10_get_all_cdn(req, res)
})

app.post("/v1.0/manager/system/modify", function (req, res) {
    console.log('/v1.0/manager/system/modify - POST');
    apiLog('/v1.0/manager/system/modify', 'POST');
    func10.f10_update_cdn(req, res)
})


app.post("/v1.0/shop/common/like_info_proc", function (req, res) {
    console.log('/v1.0/shop/common/like_info_proc - POST');
    apiLog('/v1.0/shop/common/like_info_proc', 'POST');
    func10c.likeInfoProc(req, res);
})


app.get("/v1.0/manager/room/product/view", function (req, res) {
    console.log('/v1.0/manager/room/product/view - GET');
    apiLog('/v1.0/manager/room/product/view', 'GET');
    func10room.f10_concecpt_room_product_view(req, res)
})

app.get("/v1.0/manager/room/product/list", function (req, res) {
    console.log('/v1.0/manager/room/product/list - GET');
    apiLog('/v1.0/manager/room/product/list', 'GET');
    func10room.f10_concept_room_product_list(req, res)
})

app.get("/v1.0/manager/room/lookup/product", function (req, res) {
    console.log('/v1.0/manager/room/lookup/product - GET');
    apiLog('/v1.0/manager/room/lookup/product', 'GET');
    func10room.f10_concept_room_look_up(req, res)
})

app.post("/v1.0/manager/file/upload", fileUpload.single("concept_room_file"),function (req, res) {
    console.log("/v1.0/manager/file/upload - POST");
    apiLog('/v1.0/manager/file/upload', 'POST');
    func10Upload.f10_manager_upload(req, res)
})

app.post("/v1.0/manager/file/delete", function (req, res) {
    console.log("/v1.0/manager/file/delete - POST");
    apiLog('/v1.0/manager/file/delete', 'POST');
    func10Upload.f10_manager_delete_file(req, res);
})

app.post("/v1.0/manager/file/multiple/delete", function (req, res) {
    console.log("/v1.0/manager/file/multiple/delete - POST");
    apiLog('/v1.0/manager/file/multiple/delete', 'POST');
    func10Upload.f10_manager_delete_multiple_file(req, res);
})

app.get("/v1.0/manager/concept/room/slide", function (req, res) {
    console.log("/v1.0/manager/concept/room/slide - GET");
    apiLog('/v1.0/manager/concept/room/slide', 'GET');
    func10room.f10_concept_room_change_method(req, res);
})

app.get("/v1.0/manager/concept/room/product/list",  function (req, res) {
    console.log("/v1.0/manager/concept/room/product/list - GET");
    apiLog('/v1.0/manager/concept/room/product/list', 'GET');
    func10room.f10_concept_room_product_get(req, res);
})

app.get('/v1.0/shop/product/category/list' , function (req, res) {
    console.log('/v1.0/shop/product/category/list - GET')
    apiLog('/v1.0/shop/product/category/list', 'GET')
    func10.f10_category_list(req, res)
})

app.get('/v1.0/shop/product/get_product_by_keyword' , function (req, res) {
    console.log('/v1.0/shop/product/get_product_by_keyword - GET')
    apiLog('/v1.0/shop/product/get_product_by_keyword', 'GET')
    func10.f10_get_product_by_keyword(req, res)
})


// member/snslogin
app.post('/v1.0/member/snslogin', function (req, res) {
    console.log('v1.0/member/snslogin - post')

    apiLog(req, res, 'v1.0/member/snslogin', "POST");

    func10m.f10_snslogin_post(req, res);
})

app.get('/v1.0/shop/app/product/detail' , function (req, res) {
    console.log('/v1.0/shop/app/product/detail - GET')
    apiLog('/v1.0/shop/app/product/detail', 'GET')
    func10.f10_shop_product_detail_app_get(req, res)
})

app.post('/v1.0/room/log/write', function (req, res) {
    console.log('/v1.0/room/log/write - POST')
    apiLog('/v1.0/room/log/write', 'POST')
    func10room.f10_concept_room_log_insert(req, res)
})
