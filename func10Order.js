var mysql = require("mysql2/promise");
var fs = require('fs');
const xlsx = require( "xlsx" );
var path = require('path');

const date = require('date-and-time');


var crypto = require('crypto');


var requestOld = require("request");
var request = require("request-promise-native");



const mybatisMapper = require('mybatis-mapper');
var fm = {language: 'sql', indent: '  '};

const jwt = require('jsonwebtoken');
const SECRET_KEY = '/dA43fnfe21Nme2ADR2jQ==';





//공통 함수용
var fc = require("./funcComm.js");



var pageCnt = 25;			//페이지당 글 수
var pageCnt10 = 10;			//페이지당 글 수(10개)

var regExp = /[\{\}\[\]\/?.;:|\)*~`!^\-_<>@\#$%&\\\=\(\'\"]/gi;			// , +  ��... ��������.
var KR_TIME_DIFF = 9 * 60 * 60 * 1000;
//KR_TIME_DIFF = 0;
var axios = require("axios");


String.prototype.addSlashes = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

String.prototype.EM = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	if(this == 'TRUE' || this == 'true' || this == true) return '1';
	else return '0';
};

String.prototype.EM2 = function() { 
	//no need to do (str+'') anymore because 'this' can only be a string
	if(this == null) return null;
	if(this == 'NULL') return '';
	else return this;
};

function EM3(data) {
	if(data =="1" || data == "0") return data;
	if(data == null) return null;
	if(data == false || data == "FALSE" || data == "false") return "'0'";
	else return "'1'";
}

function isNullCheck(str) {
	if(str == null || str == "" || str == "null") return null;
	else return str;
}

var pool = null;

//DB
function settingDb(poolConnect) {
	pool = poolConnect;

	//console.log("setting DB");

	mybatisMapper.createMapper([ './sql-member.xml', './sql-cart.xml', './sql-common.xml', './sql-order.xml', './sql-mypage.xml']);
}
module.exports.settingDb = settingDb;





//카트 목록
async function f10_order_write_get(req, res) {
	/*
	#카카오페이 구매여부
	$data['direct_order'] = $this->input->get("direct_order", TRUE);


	$data['code_trans_msg_info'] = $this->common->get_code_list('3200');
	$data['toss']              = (object)$this->toss_config;

	## 주문상품 리스트
	$i = 0;
	$arr_list = [];
	$cart_list = $this->order->get_list();

	if(!$cart_list){
		alertMove("주문할 상품이 존재하지 않습니다.","/shop/cart/cart_lists");
		return;
	}

	$product_trans_gb = "2001"; #상품의 배송비 구분
	$free_trans_yn = false; #유료배송

	foreach ($cart_list as $row){
		$arr_list[$i] = $row;
		$arr_list[$i]['option_list'] = $this->order->get_option_list($row['cart_seq']);
		$arr_list[$i]['stock_price_info'] = $this->order->get_stock_price_select($row['cart_seq']);

		# 옵션 누락 체크추가
		if(!$arr_list[$i]['option_list'] && $row['opt_cnt']){
			alertMove($row['product_nm'] ." 상품의 옵션을 다시 선택해 주세요.","/shop/cart/cart_lists");
			break;
			exit;
		}

		if($free_trans_yn || ($row['free_trans_yn'] == "2002")){
			$free_trans_yn = true;
			$product_trans_gb = "2002";
		}else if(!$free_trans_yn){
			$product_trans_gb = $row['free_trans_yn'];
		}
		$i++;
	}

	$data['cart_list'] = $arr_list;
	$data['const_trans_info'] = $this->common->get_trans_info($product_trans_gb);

	if($this->session->userdata('cust_seq')){
		#회원정보
		$data['mem_info'] = $this->order->get_mem_info($this->session->userdata('cust_seq'));

		#회원등급정보
		$data['member_grp_info'] = $this->member->get_member_grp_info($this->session->userdata('member_grp_cd'));

		#회원배송지정보
		$data['mem_addr_list'] = $this->member_info->order_addr_list($this->session->userdata('cust_seq'), $data['mem_info']->mem_addr_seq);

		#이전배송지정보
		$data['prev_trans_list'] = $this->order->get_prev_trnas_list($this->session->userdata('cust_seq'));
	}else{
		$data['mem_info'] = (object)array('user_nm' => $_SESSION["nomem_or_name"], 'or_pass' => $_SESSION["nomem_or_pass"]);
	}
	*/

	var token = "";
	var tc = "";
	
	var param = {};
	var sql = "";


	var direct_order = decodeURIComponent(req.query.direct_order); if(direct_order == null || direct_order == "" || direct_order == "undefined" || direct_order == undefined) direct_order = "";


	var js = {};
	
	js.success = true;
	js.message = "";
	js.errorCode = 0;

	js.data = {};
	js.data.mem_info = null;
	js.data.member_grp_info = null;
	js.data.mem_addr_list = null;
	js.data.prev_trans_list = null;


	js.data.direct_order = direct_order;


	param.code_cd1 = "3200";
	sql = mybatisMapper.getStatement('common', 'get_code_list', param, fm);
	var [rowC] = await pool.query(sql);
	js.data.code_trans_msg_info = rowC;


	js.data.toss = null;		//TODO








	var arr_list = [];
	var cart_list = [];

	var product_trans_gb = "2001";		//#상품의 배송비 구분
	var free_trans_yn = false;			//#유료배송







	let authHeader = req.headers["authorization"];
	
	tc = await fc.tokenChecker(req, res);
	
	var cust_seq = null;
	var member_grp_cd = null;

	
	if(tc == "") {
		return;
	}
	cust_seq = tc.cust_seq;
	member_grp_cd = tc.member_grp_cd;

	
	if(cust_seq != null && cust_seq != "") {
		param.cust_seq = cust_seq;
		param.member_grp_cd = member_grp_cd;
		
		
		//## 주문상품 리스트
		sql = mybatisMapper.getStatement('order', 'get_list', param, fm);

		var [rowO] = await pool.query(sql);

		if(rowO != null && rowO.length > 0) {
			cart_list = rowO;
		}
		if(cart_list == null || cart_list.length == 0) {
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"주문할 상품이 존재하지 않습니다.", errorCode:-1200, data:null}));
			return;
		}

		
		for(var n = 0 ; n < cart_list.length ; n++) {
			var row = cart_list[n];


			var param2 = {};
			param2.cart_seq = row.cart_seq;

			sql = mybatisMapper.getStatement('order', 'get_option_list', param2, fm);
			var [rowOL] = await pool.query(sql);

			row.option_list = rowOL;

			
			sql = mybatisMapper.getStatement('order', 'get_stock_price_select', param2, fm);
			var [rowSP] = await pool.query(sql);

			row.stock_price_info = rowSP;

			if( (rowOL == null || rowOL.length == 0) && (row.opt_cnt == null || row.opt_cnt == 0) ) {
				res.set({
					'content-type': 'application/json'
				}).send(JSON.stringify({success:false, message:row.product_nm + " 상품의 옵션을 다시 선택해 주세요.", errorCode:-1201, data:null}));
				return;
			}

			if(free_trans_yn || row.free_trans_yn == "2002") {
				free_trans_yn = true;
				product_trans_gb = "2002";
			} else if(!free_trans_yn) {
				product_trans_gb = row.free_trans_yn;
			}

			


			
			arr_list.push(row);
		}
		
		js.data.cart_list = arr_list;





		//
		var param3 = {};
		param3.free_trans_yn = product_trans_gb;

		sql = mybatisMapper.getStatement('common', 'get_trans_info', param3, fm);
		
		var [rowTI] = await pool.query(sql);


		js.data.const_trans_info = null;
		if(rowTI == null || rowTI.length == 0) {
		} else {
			js.data.const_trans_info = rowTI[0];
		}



		//#회원정보
		sql = mybatisMapper.getStatement('member', 'get_mem_info1', param, fm);
		
		var [rowM] = await pool.query(sql);

		if(rowM != null && rowM.length > 0) {
			js.data.mem_info = rowM[0];
		}

		//#회원등급정보
		sql = mybatisMapper.getStatement('member', 'get_member_grp_info', param, fm);
		
		var [rowMG] = await pool.query(sql);

		if(rowMG != null && rowMG.length > 0) {
			js.data.member_grp_info = rowMG[0];
		}

		//#회원배송지정보
		param.mem_addr_seq = js.data.mem_info.mem_addr_seq;

		sql = mybatisMapper.getStatement('mypage', 'info-order_addr_list', param, fm);
		
		var [rowMA] = await pool.query(sql);

		if(rowMA != null && rowMA.length > 0) {
			js.data.mem_addr_list = rowMA;
		}
		

		//#이전배송지정보
		sql = mybatisMapper.getStatement('order', 'get_prev_trnas_list', param, fm);
		
		var [rowPT] = await pool.query(sql);
		
		if(rowPT != null && rowPT.length > 0) {
			js.data.prev_trans_list = rowPT;
		}
	}



	


	


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"", errorCode:0, data:js}));
	
}
module.exports.f10_order_write_get =  f10_order_write_get;











//카트 목록
async function f10_order_coupon_get(req, res) {
	var sql = "";
	var js = {};

	var param = {};


	var cust_seq = decodeURIComponent(req.query.cust_seq); if(cust_seq == null || cust_seq == "" || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";
	var buy_coupon_price = decodeURIComponent(req.query.buy_coupon_price); if(buy_coupon_price == null || buy_coupon_price == "" || buy_coupon_price == "undefined" || buy_coupon_price == undefined) buy_coupon_price = "";
	var order_gb = decodeURIComponent(req.query.order_gb); if(order_gb == null || order_gb == "" || order_gb == "undefined" || order_gb == undefined) order_gb = "";
	

	if(cust_seq == null || cust_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
		return;
	}
	if(buy_coupon_price == null || buy_coupon_price== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"buy_coupon_price is empty!", errorCode:-100, data:null}));
		return;
	}

	param.cust_seq = cust_seq;
	param.buy_coupon_price = buy_coupon_price;
	param.order_gb = order_gb;



	
	
	sql = mybatisMapper.getStatement('order', 'get_coupon_list', param, fm);

	var [row] = await pool.query(sql);

	js = row;
	

	
	


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"", errorCode:0, data:js}));
	
}
module.exports.f10_order_coupon_get =  f10_order_coupon_get;





//쿠폰 COUPON_APPLY
async function f10_order_coupon_apply_post(req, res) {
	var sql = "";
	var js = {};

	var param = {};


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
	var member_grp_cd = tc.member_grp_cd;
	
	var coupon_member_seq = decodeURIComponent(req.body.coupon_member_seq); if(coupon_member_seq == null || coupon_member_seq == "" || coupon_member_seq == "undefined" || coupon_member_seq == undefined) coupon_member_seq = "";
	var buy_coupon_price = decodeURIComponent(req.body.buy_coupon_price); if(buy_coupon_price == null || buy_coupon_price == "" || buy_coupon_price== "undefined" || buy_coupon_price == undefined) buy_coupon_price = "";

	var sale_target = decodeURIComponent(req.body.sale_target); if(sale_target == null || sale_target == "" || sale_target== "undefined" || sale_target == undefined) sale_target = "";
	var coupon_category1_cd = decodeURIComponent(req.body.coupon_category1_cd); if(coupon_category1_cd == null || coupon_category1_cd == "" || coupon_category1_cd== "undefined" || coupon_category1_cd == undefined) coupon_category1_cd = "";
	var coupon_category2_cd = decodeURIComponent(req.body.coupon_category2_cd); if(coupon_category2_cd == null || coupon_category2_cd == "" || coupon_category2_cd== "undefined" || coupon_category2_cd == undefined) coupon_category2_cd = "";
	var coupon_category3_cd = decodeURIComponent(req.body.coupon_category3_cd); if(coupon_category3_cd == null || coupon_category3_cd == "" || coupon_category3_cd== "undefined" || coupon_category3_cd == undefined) coupon_category3_cd = "";

	

	if(cust_seq == null || cust_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"cust_seq is empty!", errorCode:-100, data:null}));
		return;
	}
	if(coupon_member_seq == null || coupon_member_seq== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"coupon_member_seq is empty!", errorCode:-100, data:null}));
		return;
	}
	if(buy_coupon_price == null || buy_coupon_price== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"buy_coupon_price is empty!", errorCode:-100, data:null}));
		return;
	}
	if(sale_target == null || sale_target== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"sale_target is empty!", errorCode:-100, data:null}));
		return;
	}
	if(sale_target == "2") {
		if(coupon_master_seq == null || coupon_master_seq== "") {
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"coupon_master_seq is empty!", errorCode:-100, data:null}));
			return;
		}
		param.coupon_master_seq = coupon_master_seq;
	}

	param.cust_seq = cust_seq;
	param.coupon_member_seq = coupon_member_seq;
	param.member_grp_cd = member_grp_cd;
	
	param.sale_target = sale_target;
	param.coupon_category1_cd = coupon_category1_cd;
	param.coupon_category2_cd = coupon_category2_cd;
	param.coupon_category3_cd = coupon_category3_cd;
	


	var rtn_msg = ""; 			//메시지
	var discount_price = "0"; 	//할인값
	var rtn_status = "ok";		//결과값

	var cart_list = null;

	//#선택한 쿠폰정보
	sql = mybatisMapper.getStatement('order', 'get_coupon_apply_list', param, fm);
	
	var [rowCA] = await pool.query(sql);

	if(rowCA != null && rowCA.length > 0) {
		var apply_info = rowCA[0];
		//'사용유무체크
		var compare_product_price = 0;
		var use_yn  = apply_info['use_yn'];

		if (use_yn != "N") {
			rtn_msg ="이미 사용한 쿠폰입니다.";
			rtn_status = "fail";
		}

		//'기간체크
		var date_chk  = apply_info['date_chk'];
		if (date_chk != "Y") {
			rtn_msg = "사용기간을 확인해 주세요.";
			rtn_status = "fail";
		}

		//'정상적인 쿠폰인 경우 프로세스
		if (rtn_status == "ok") {
			var coupon_gb    		 = apply_info['coupon_gb'];				//'할인 구분
			var coupon_value 		 = apply_info['coupon_value'];			//'할인 값
			var min_price 			 = apply_info['min_price'];				//'사용가능 금액
			var max_price 			 = apply_info['max_price'];				//'사용가능 금액
			var coupon_nm 			 = apply_info['title'];					//'쿠폰이름

			//'무료배송쿠폰
			if (coupon_gb == "2")	{
				discount_price = "0";
				rtn_status = "ok";
			} else {
				if(buy_coupon_price > 0) {
					if(buy_coupon_price >= min_price) {
						//#적용가능 상품목록
						
						sql = mybatisMapper.getStatement('order', 'get_coupon_cart_list', param, fm);
						var [rowCCL] = await pool.query(sql);
						cart_list = rowCCL;

						for(var m = 0 ; m < cart_list.length ; m++) {
							var ro = cart_list[m];
							var sale_price = ro['sale_price'] * ro['qty'];
							var fee_rate = ro['fee_rate'];
							var coupon_yn = ro['coupon_use_yn'];

							//#적용가능 상품의 옵션
							var param2 = {};
							param2.cart_seq = ro['cart_seq'];
							sql = mybatisMapper.getStatement('order', 'get_option_list', param2, fm);
							var [rowOL] = await pool.query(sql);
							for(var l = 0 ; l < rowOL.length ; l++) {
								sale_price += rowOL[l].opt_price * rowOL[l].qty;
							}

							//#조합옵션 추가금액
							
							sql = mybatisMapper.getStatement('order', 'get_stock_price_select', param2, fm);
							var [rowSP] = await pool.query(sql);
							if(rowSP != null && rowSP.length > 0) {
								sale_price += rowSP[0].tot_stock_opt_price;
							}

							compare_product_price += sale_price;
						}


						//쿠폰적용금액 계산
						if(cart_list == null || cart_list.length == 0) {
							rtn_msg = "쿠폰을 적용할 상품이 존재하지 않습니다.";
							rtn_status = "fail";
						} else {
							//'퍼센트할인
							if(coupon_gb == "0") {
								if(coupon_value == "") coupon_value = "0";

								//'할인금액
								discount_price = Math.floor(compare_product_price * coupon_value / 100);

								if( (max_price > 0) && (max_price < discount_price) ) {
									discount_price = max_price;
								}
								rtn_status = "ok";

							} else {	//'금액할인
								//'할인대상 금액이 쿠폰 금액보다 큰경우
								if (compare_product_price > $coupon_value) {
									discount_price = coupon_value;
								}else{
									discount_price = compare_product_price;
								}

								if (discount_price < 0) { discount_price = "0"; }

								if ((max_price > 0) && (max_price < discount_price)){
									discount_price = max_price;
								}

								rtn_status = "ok";
							}
						}
					} else {
						rtn_msg = "선택하신 쿠폰은 총금액 {####}이상에서 사용 가능합니다.".replace("{####}", min_price.toLocaleString()) ;
						rtn_status = "fail";
					}


				} else {
					rtn_msg = "할인상품에는 쿠폰 적용이 불가합니다.";
					rtn_status = "fail";
				}
			}
		}
	} else {
		rtn_msg = "존재하지 않는 쿠폰입니다.";
		rtn_status = "fail";
	}
	

	js.status = rtn_status;
	js.msg = rtn_msg;
	js.discount_price = discount_price;
	js.coupon_nm = coupon_nm;
	js.coupon_gb = coupon_gb;
	js.coupon_value = coupon_value;
	js.max_price = max_price;
	js.coupon_product_list = cart_list;
	js.compare_product_price = compare_product_price;
	


	res.set({
		'content-type': 'application/json'
	}).send(JSON.stringify({success:true, message:"", errorCode:0, data:js}));
	
}
module.exports.f10_order_coupon_apply_post =  f10_order_coupon_apply_post;





/**
 * INNER FUNCTION
 * 쿠폰 검산
 * @return [type] [description]
 */
async function config_coupon(post_data)
{
	
	var param = {};
	var sql = "";

	var rtn_msg = ""; 			//메시지
	var discount_price = "0"; 	//할인값
	var rtn_status = "ok";		//결과값

	var cust_seq = null;
	var member_grp_cd = null;

	cust_seq = post_data.cust_seq;
	member_grp_cd = post_data.member_grp_cd;


	var coupon_member_seq = decodeURIComponent(post_data.coupon_member_seq); if(coupon_member_seq == null || coupon_member_seq == "" || coupon_member_seq== "undefined" || coupon_member_seq == undefined) coupon_member_seq = "";
	var buy_coupon_price = decodeURIComponent(post_data.buy_coupon_price); if(buy_coupon_price == null || buy_coupon_price == "" || buy_coupon_price== "undefined" || buy_coupon_price == undefined) buy_coupon_price = "";


	param.cust_seq = cust_seq;
	param.coupon_member_seq = coupon_member_seq;

	sql = mybatisMapper.getStatement('order', 'get_coupon_apply_list', param, fm);
	var [rowAI] = await pool.query(sql);


	var compare_product_price = 0;
	var use_yn = "";
	var date_chk = "";

	if(rowAI != null && rowAI.length > 0) {
		compare_product_price = 0;
		use_yn = rowAI[0].use_yn;

		//'사용유무체크
		if(use_yn != "N") {
			rtn_msg ="이미 사용한 쿠폰입니다.";
			rtn_status = "fail";
		}

		//'기간체크
		date_chk  = rowAI[0].date_chk;
		if (date_chk != "Y") {
			rtn_msg = "사용기간을 확인해 주세요.";
			rtn_status = "fail";
		}
		

		//'정상적인 쿠폰인 경우 프로세스
		if (rtn_status == "ok") {

			var coupon_gb    		 = rowAI[0].coupon_gb;				//'할인 구분
			var coupon_value 		 = rowAI[0].coupon_value;			//'할인 값
			var min_price 			 = rowAI[0].min_price;				//'사용가능 금액
			var max_price 			 = rowAI[0].max_price;				//'사용가능 금액
			var coupon_nm 			 = rowAI[0].title;					//'쿠폰이름

			//'무료배송쿠폰
			if (coupon_gb == "2")	{
				discount_price = "0";
				rtn_status = "ok";
			} else {

				if (Number(buy_coupon_price) > 0) {
					//'카트에 담긴 총금액 계산
					if (Number(buy_coupon_price) >= min_price) {

						//#적용가능 상품목록
						param.sale_target = rowAI[0].sale_target;
						param.coupon_category1_cd = rowAI[0].coupon_category1_cd;
						param.coupon_category2_cd = rowAI[0].coupon_category2_cd;
						param.coupon_category3_cd = rowAI[0].coupon_category3_cd;

						
						sql = mybatisMapper.getStatement('order', 'get_coupon_cart_list', param, fm);
						var [rowCL] = await pool.query(sql);
						var cart_list = rowCL;

						for(var n = 0 ; n < rowCL.length ; n++) {
							var row = rowCL[n];
							sale_price = row['sale_price'] * row['qty'];
							fee_rate   = row['fee_rate'];
							coupon_yn  = row['coupon_use_yn'];

							//#적용가능 상품의 옵션
							param.cart_seq = row['cart_seq'];
							sql = mybatisMapper.getStatement('order', 'get_option_list', param, fm);
							var [rowOOL] = await pool.query(sql);

							var option_list = rowOOL;
							for(var m = 0 ; m < option_list.length ; m++) {
								var o_row = option_list[m];

								sale_price += (o_row['opt_price'] * o_row['qty']);
							}

							//#조합옵션 추가금액
							sql = mybatisMapper.getStatement('order', 'get_stock_price_select', param, fm);
							var [rowSPI] = await pool.query(sql);

							var stock_price_info = rowSPI;
							if(stock_price_info != null && stock_price_info.length > 0) {
								sale_price += stock_price_info[0]['tot_stock_opt_price'];
							}

							compare_product_price += sale_price;

						}

						//쿠폰적용금액 계산
						if (cart_list == null || cart_list.length == 0) {
							rtn_msg= "쿠폰을 적용할 상품이 존재하지 않습니다.";
							rtn_status = "fail";
						} else {

							//'퍼센트할인
							if (coupon_gb == "0" ){
								if (coupon_value == ""){ coupon_value = "0";}

								//'할인금액
								discount_price = Math.floor(compare_product_price * coupon_value/100);

								if ((max_price > 0) && (max_price < discount_price)){
									discount_price = max_price;
								}

								rtn_status = "ok";

							//'금액할인
							}else if (coupon_gb == "1") {
								//'할인대상 금액이 쿠폰 금액보다 큰경우
								if (compare_product_price > coupon_value) {
									discount_price = coupon_value;
								}else{
									discount_price = compare_product_price;
								}

								if (discount_price < 0) { discount_price = "0"; }

								if ((max_price > 0) && (max_price < discount_price)){
									discount_price = max_price;
								}

								rtn_status = "ok";
							}
						}
					}else{
						rtn_msg = "선택하신 쿠폰은 총금액 {####}이상에서 사용 가능합니다.".replace("{####}", min_price.toLocaleString()) ;
						rtn_status = "fail";
					}
				}else{
					rtn_msg = "할인상품에는 쿠폰 적용이 불가합니다.";
					rtn_status = "fail";
				}
			}
		}
	}else{
		rtn_msg = "존재하지 않는 쿠폰입니다.";
		rtn_status = "fail";
	}

	var js = {};
	js.status = rtn_status;
	js.msg = rtn_msg;
	js.discount_price = discount_price;
	js.coupon_nm = coupon_nm;
	js.coupon_gb = coupon_gb;
	js.coupon_value = coupon_value;
	js.max_price = max_price;
	js.coupon_product_list = cart_list;
	js.compare_product_price = compare_product_price;

	//return array('status' => $rtn_status, 'msg' => $rtn_msg, 'discount_price' => $discount_price, 'coupon_nm' => $coupon_nm, 'coupon_gb' => $coupon_gb, 'coupon_value' => $coupon_value, 'max_price' => $max_price, 'coupon_product_list' => $cart_list, 'compare_product_price' => $compare_product_price );
	return js;
}







/**
 * INNER FUNCTION
 * 배송비 검산 (결제금액, 상품총합계, 배송구분(국내,해외), 추가배송비발생여부, 추가배송비
 * @return [type] [description]
 */
async function config_trnas(price, add_trans_yn, add_trans_price, product_trans_gb) {

	var sql = "";
	var param = {};

	param.free_trans_yn = product_trans_gb;

	sql = mybatisMapper.getStatement('common', 'get_trans_info', param, fm);
	var [rowTI] = await pool.query(sql);

	var const_trans_info = rowTI[0];


	var const_trans_price = const_trans_info['const_trans_price'];
	var const_trans_limit = const_trans_info['const_trans_limit'];


	var return_val = const_trans_price;

	if(price >= const_trans_limit){
		return_val = 0;
	}

	if(add_trans_yn == "Y"){
		return_val = return_val + add_trans_price;
	}

	return return_val;
}





/**
 * INNER FUNCTION
 * 적립금 계산
 * @return [type] [description]
 */
async function config_reserve(price, reserve_rate){
	var return_val = 0;
	if (price){
		return_val = Math.floor(price* reserve_rate/100);
	}
	return return_val;
}






/**
 * [AJAX] 주문 PROC
 * @return [type] [description]
 */
async function f10_order_proc_ajax_post(req, res) {
	
	var token = "";
	var tc = "";

	var sql = "";
	var param = {};

	var mode = decodeURIComponent(req.body.mode); if(mode == null || mode == "" || mode == "undefined" || mode == undefined) mode = "";

	if(mode == null || mode== "") {
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:false, message:"mode is empty!", errorCode:-100, data:null}));
		return;
	}
	console.log("mode : " + mode);


	
	var rtn_msg = "";			//메시지
	var rtn_status = "ok";		//결과값

	
	if(mode == "ADD_TRNAS") {	//추가배송비 조회
		
		
		var zipcode = decodeURIComponent(req.body.zipcode); if(zipcode == null || zipcode == "" || zipcode == "undefined" || zipcode == undefined) zipcode = "";

		
		if(zipcode == null || zipcode== "") {
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"zipcode is empty!", errorCode:-100, data:null}));
			return;
		}
		
	

		param.zipcode = zipcode;
		
		sql = mybatisMapper.getStatement('order', 'get_add_trnas_price', param, fm);
	
		var [rowTP] = await pool.query(sql);

		var js = {};

		if(rowTP != null && rowTP.length > 0) {
			js.add_price = rowTP[0].add_price;
			
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:true, message:"", errorCode:0, data:js}));
		} else {
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"add_price is empty", errorCode:-500, data:null}));
		}
		return;
		
	} else if(mode == "ORDER_WRITE"){	//주문서 등록
		/**
		* 검산
		* 1.카트 상품합계액 조회
		* 2.배송비 재계산
		* 3.쿠폰 조회
		* 4.적립금 조회
		* 5.최종금액 확인
		**/

		var coupon_sale = decodeURIComponent(req.body.coupon_sale); if(coupon_sale == null || coupon_sale == "" || coupon_sale == "undefined" || coupon_sale == undefined) coupon_sale = "";
		var use_reserve = decodeURIComponent(req.body.use_reserve); if(use_reserve == null || use_reserve == "" || use_reserve == "undefined" || use_reserve == undefined) use_reserve = "";
		var use_deposit = decodeURIComponent(req.body.use_deposit); if(use_deposit == null || use_deposit == "" || use_deposit == "undefined" || use_deposit == undefined) use_deposit = "";
		var order_price = decodeURIComponent(req.body.order_price); if(order_price == null || order_price == "" || order_price == "undefined" || order_price == undefined) order_price = "";
		var order_origin_price = decodeURIComponent(req.body.order_origin_price); if(order_origin_price == null || order_origin_price == "" || order_origin_price == "undefined" || order_origin_price == undefined) order_origin_price = "";
		var add_trans_yn = decodeURIComponent(req.body.add_trans_yn); if(add_trans_yn == null || add_trans_yn == "" || add_trans_yn == "undefined" || add_trans_yn == undefined) add_trans_yn = "";
		var add_trans_price = decodeURIComponent(req.body.add_trans_price); if(add_trans_price == null || add_trans_price == "" || add_trans_price == "undefined" || add_trans_price == undefined) add_trans_price = "";
		var trans_price = decodeURIComponent(req.body.trans_price); if(trans_price == null || trans_price == "" || trans_price == "undefined" || trans_price == undefined) trans_price = "";


		var ocode = "";


		//#1.카트 상품합계액 조회
		var compare_product_price = 0;
		var compare_buy_coupon_price = 0;
		var compare_buy_reserve_price = 0;

		var compare_trans_price = 0;
		var coupon_adapt_price = 0;
		var compare_add_trans_price = 0;

		var buy_coupon_price = 0;




		let authHeader = req.headers["authorization"];
		tc = await fc.tokenChecker(req, res);

		var cust_seq = null;
		var member_grp_cd = null;
		var user_id = null;


		if(tc == "") {
			/*
			res.set({
				'content-type': 'application/json'
			}).send(JSON.stringify({success:false, message:"Not login!!!", errorCode:-600, data:null}));
			*/
			return;
		}
		cust_seq = tc.cust_seq;
		member_grp_cd = tc.member_grp_cd;
		user_id = tc.user_id;

		param.cust_seq = cust_seq;
		param.member_grp_cd = member_grp_cd;


		sql =  mybatisMapper.getStatement('order', 'get_list', param, fm);
		
		var [rowOL] = await pool.query(sql);
		var cart_list = rowOL;

		var product_trans_gb = "2001";		//#상품의 배송비 구분
		var free_trans_yn = false;			//#유료배송
		var sum_qty = 0;

		for(var n = 0 ; n < cart_list.length ; n++) {
			var row = cart_list[n];
			var sale_price = row['sale_price'] * row['qty'];
			sum_qty += row['qty'];


			//#적용가능 상품의 옵션
			param.cart_seq = row['cart_seq'];
			sql = mybatisMapper.getStatement('order', 'get_option_list', param, fm);
			var [rowOOL] = await pool.query(sql);

			var option_list = rowOOL;
			for(var m = 0 ; m < option_list.length ; m++) {
				var o_row = option_list[m];

				sale_price += (o_row['opt_price'] * o_row['qty']);
			}

			//#조합옵션 추가금액
			sql = mybatisMapper.getStatement('order', 'get_stock_price_select', param, fm);
			var [rowSPI] = await pool.query(sql);

			var stock_price_info = rowSPI;
			if(stock_price_info != null && stock_price_info.length > 0) {
				sale_price += stock_price_info[0]['tot_stock_opt_price'];
			}

			compare_product_price += sale_price;


			if(row['coupon_use_yn'] == "Y"){
				compare_buy_coupon_price += sale_price;
			}

			if(row['reserve_use_yn'] == "Y"){
				compare_buy_reserve_price += sale_price;
			}

			if(free_trans_yn || row['free_trans_yn'] == "2002"){
				free_trans_yn = true;
				product_trans_gb = row['free_trans_yn'];
			}else if(!free_trans_yn){
				product_trans_gb = row['free_trans_yn'];
			}
		}

		
		var re_zip = decodeURIComponent(req.body.re_zip); if(re_zip == null || re_zip == "" || re_zip== "undefined" || re_zip == undefined) re_zip = "";
		param.zipcode = re_zip;

		//#추가배송비 재계산
		sql = mybatisMapper.getStatement('order', 'get_add_trnas_price', param, fm);
		var [rowCATI] = await pool.query(sql);
		var compare_add_trans_info = rowCATI;

		if(compare_add_trans_info != null && compare_add_trans_info.length > 0){
			compare_add_trans_price = compare_add_trans_info[0]['add_price'];
		}else{
			compare_add_trans_price = 0;
		}
		

		//#2.배송비 재계산
		if( compare_product_price > 0 ){
			var coupon_gb = decodeURIComponent(req.body.coupon_gb); if(coupon_gb == null || coupon_gb == "" || coupon_gb== "undefined" || coupon_gb == undefined) coupon_gb = "";
			if(coupon_gb == "2") {
				compare_trans_price = compare_add_trans_price;
			}else{
				coupon_adapt_price = compare_product_price - (coupon_sale);	//적립금의 경우 현금성이라 배송비 계산에 포함하지 x
				compare_trans_price = await config_trnas(coupon_adapt_price, add_trans_yn, compare_add_trans_price, product_trans_gb);
			}
		}else{
			rtn_status = "fail";
			rtn_msg = "주문할 상품이 존재하지 않습니다.";
		}
		
		console.log("compare_trans_price : " + compare_trans_price);
		console.log("trans_price : " + trans_price);

		if(compare_trans_price != trans_price) {
			rtn_status = "fail";
			rtn_msg = "배송비 계산이 잘못되었습니다.";
		}




		var coupon_arry = null;


		//#3.쿠폰여부 조회
		var coupon_member_seq = decodeURIComponent(req.body.coupon_member_seq); if(coupon_member_seq == null || coupon_member_seq == "" || coupon_member_seq== "undefined" || coupon_member_seq == undefined) coupon_member_seq = "";
		if (coupon_member_seq != "") {
			if(cust_seq != ""){
				buy_coupon_price = compare_buy_coupon_price;
				var data = req.body;
				data.cust_seq = cust_seq;
				data.member_grp_cd = member_grp_cd;
				data.buy_coupon_price = buy_coupon_price;

				coupon_arry = await config_coupon(data);
				if(coupon_arry['status'] != "ok" || coupon_arry['discount_price'] != coupon_sale){
					rtn_status = "fail";
					rtn_msg = "쿠폰사용이 잘못되었습니다.";
				}
			}else{
				rtn_status = "fail";
				rtn_msg = "쿠폰사용이 잘못되었습니다.";
			}
		} else {
			//TODO 이부분은 다시 해야함(쿠폰 정보가 없는데.. 값을 요청함.
			coupon_arry = {};
			coupon_arry['compare_product_price'] = 0;

		}


		//#4.예치금 조회
		if (use_deposit != "") {
			if(cust_seq != ""){
				sql = mybatisMapper.getStatement('member', 'get_mem_info', param, fm);
				var [rowMI] = await pool.query(sql);

				var point_useable = rowMI[0];
				var is_newmlg = point_useable['mb_deposit'] - use_deposit;
				if(is_newmlg < 0) {
					rtn_status = "fail";
					res_msg = "예치금 사용이 잘못 되었습니다.";
				}
			}else{
				rtn_status = "fail";
				res_msg = "예치금 사용이 잘못 되었습니다.";
			}
		}

		//#5.최종금액 확인
		var compare_order_price = (Number(compare_product_price) + Number(trans_price)) - Number(coupon_sale) - Number(use_reserve) - Number(use_deposit);

		console.log("compare_order_price : " + compare_order_price);
		console.log("order_price : " + order_price);
		order_price= compare_order_price;
		if((compare_order_price != order_price)) {
			rtn_status = "fail";
			rtn_msg = "주문금액이 맞지 않습니다. 주문금액을 확인해 주세요.";
		}


		
		
		if(rtn_status == "ok") {
			//#주문번호 생성
			var otype_cd_body = decodeURIComponent(req.body.otype_cd); if(otype_cd_body == null || otype_cd_body == "" || otype_cd_body== "undefined" || otype_cd_body == undefined) otype_cd_body = "";
			var otype_cd = "";
			var order_yn = "";
			var order_state_cd = "";

			ocode = await orderRandomText();			// TODO 주문 번호 생성
			if(order_price == 0){
				//#0원결제
				otype_cd = "50";
				order_yn = "Y";
				order_state_cd = "20";
			}else if(otype_cd_body == "60"){
				//#무통장입금
				otype_cd = otype_cd_body;
				order_yn = "Y";
				order_state_cd = "10";
			}else{
				//#기타 결제수단
				otype_cd = otype_cd_body;
				order_yn = "N";
				order_state_cd = "10";
			}

			var or_email ="";
			var or_email1 = decodeURIComponent(req.body.or_email1); if(or_email1 == null || or_email1 == "" || or_email1== "undefined" || or_email1 == undefined) or_email1 = "";
			var or_email2 = decodeURIComponent(req.body.or_email2); if(or_email2 == null || or_email2 == "" || or_email2== "undefined" || or_email2 == undefined) or_email2 = "";
			var or_hp = "";
			var or_hp1 = decodeURIComponent(req.body.or_hp1); if(or_hp1 == null || or_hp1 == "" || or_hp1== "undefined" || or_hp1 == undefined) or_hp1 = "";
			var or_hp2 = decodeURIComponent(req.body.or_hp2); if(or_hp2 == null || or_hp2 == "" || or_hp2== "undefined" || or_hp2 == undefined) or_hp2 = "";
			var or_hp3 = decodeURIComponent(req.body.or_hp3); if(or_hp3 == null || or_hp3 == "" || or_hp3== "undefined" || or_hp3 == undefined) or_hp3 = "";
			var re_hp = "";
			var re_hp1 = decodeURIComponent(req.body.re_hp1); if(re_hp1 == null || re_hp1 == "" || re_hp1== "undefined" || re_hp1 == undefined) re_hp1 = "";
			var re_hp2 = decodeURIComponent(req.body.re_hp2); if(re_hp2 == null || re_hp2 == "" || re_hp2== "undefined" || re_hp2 == undefined) re_hp2 = "";
			var re_hp3 = decodeURIComponent(req.body.re_hp3); if(re_hp3 == null || re_hp3 == "" || re_hp3== "undefined" || re_hp3 == undefined) re_hp3 = "";
			var re_hp02 = "";
			var re_hp21 = decodeURIComponent(req.body.re_hp21); if(re_hp21 == null || re_hp21 == "" || re_hp21== "undefined" || re_hp21 == undefined) re_hp21 = "";
			var re_hp22 = decodeURIComponent(req.body.re_hp22); if(re_hp22 == null || re_hp22 == "" || re_hp22== "undefined" || re_hp22 == undefined) re_hp22 = "";
			var re_hp23 = decodeURIComponent(req.body.re_hp23); if(re_hp23 == null || re_hp23 == "" || re_hp23== "undefined" || re_hp23 == undefined) re_hp23 = "";
			
			or_email = or_email1 + "@" + or_email2;
			
			or_hp = or_hp1 + "-" + or_hp2 + "-" + or_hp3;
			re_hp = re_hp1 + "-" + re_hp2 + "-" + re_hp3;
			if(re_hp21 != "" && re_hp22 != "" && re_hp23 != "") {
				re_hp02 = re_hp21 + "-" + re_hp22 + "-" + re_hp23;
			}

			
			//## 회원 최근배송지 insert
			var re_name = decodeURIComponent(req.body.re_name); if(re_name == null || re_name == "" || re_name== "undefined" || re_name == undefined) re_name = "";
			//var re_zip = decodeURIComponent(req.body.re_zip); if(re_zip == null || re_zip == "" || re_zip== "undefined" || re_zip == undefined) re_zip = "";
			var re_addr1 = decodeURIComponent(req.body.re_addr1); if(re_addr1 == null || re_addr1 == "" || re_addr1== "undefined" || re_addr1 == undefined) re_addr1 = "";
			var re_addr2 = decodeURIComponent(req.body.re_addr2); if(re_addr2 == null || re_addr2 == "" || re_addr2== "undefined" || re_addr2 == undefined) re_addr2 = "";
			//var re_hp = decodeURIComponent(req.body.re_hp); if(re_hp == null || re_hp == "" || re_hp== "undefined" || re_hp == undefined) re_hp = "";
			var trans_memo = decodeURIComponent(req.body.trans_memo); if(trans_memo == null || trans_memo == "" || trans_memo== "undefined" || trans_memo == undefined) trans_memo = "";
			
			var paramAA = {};
			paramAA.cust_seq = cust_seq;
			paramAA.cust_nm = re_name;
			paramAA.home_zip = re_zip;
			paramAA.home_addr1 = re_addr1;
			paramAA.home_addr2 = re_addr2;
			paramAA.tel = re_hp;
			paramAA.hp = re_hp;
			paramAA.delivery_msg = trans_memo;
			paramAA.default_yn = "N";
			paramAA.addr_gb = "O";
			
			
			sql = mybatisMapper.getStatement('order', 'insert_mem_addr', paramAA, fm);
			await pool.query(sql);

	
			var info_update = decodeURIComponent(req.body.info_update); if(info_update == null || info_update == "" || info_update== "undefined" || info_update == undefined) info_update = "";
			if(info_update == "Y" && user_id != null) {
				paramAA.detault_yn = "Y";
				
				sql = mybatisMapper.getStatement('order', 'update_member_info2', paramAA, fm);
				await pool.query(sql);
			}


			
			var next_use = decodeURIComponent(req.body.next_use); if(next_use == null || next_use == "" || next_use== "undefined" || next_use == undefined) next_use = "";
			
			if(next_use == "Y" && cust_seq != null){
				paramAA.next_use_otype_cd = otype_cd;
				
				sql = mybatisMapper.getStatement('member', 'set_member_update3', paramAA, fm);
				await pool.query(sql);
			}


			//#등급별 혜택 조회
			var paramM = {};
			paramM.member_grp_cd = member_grp_cd;
			sql = mybatisMapper.getStatement('member', 'get_member_grp_info', paramM, fm);
			var [rowMG] = await pool.query(sql);
			var member_grp_info = rowMG[0];
			
			var reserve_rate = member_grp_info['reserve_rate'];	//등급별 적립금
			
			if(reserve_rate == null || reserve_rate == "") reserve_rate = 0;

			var point_price = compare_product_price - (coupon_sale);
			var give_reserve = await config_reserve(point_price, reserve_rate);

			var device_gb = "APP";



			var paramO = {};

			var or_name = decodeURIComponent(req.body.or_name);


			var order_gb = decodeURIComponent(req.body.order_gb); if(order_gb == null || order_gb == "" || order_gb== "undefined" || order_gb == undefined) order_gb = "";
			
			if(order_gb == "G") {
				paramO.ocode = ocode;
				paramO.order_yn = order_yn;
				paramO.otype_cd = otype_cd;
				paramO.order_state_cd = order_state_cd;
				paramO.order_price = order_price.toString().replace(",", "");
				paramO.repay_price = order_price.toString().replace(",", "");
				paramO.order_origin_price = order_origin_price.toString().replace(",", "");
				paramO.coupon_price = coupon_sale.toString().replace(",","");
				paramO.use_reserve = use_reserve.toString().replace(",", "");
				paramO.use_deposit = use_deposit.toString().replace(",", "");
				paramO.reserve = give_reserve;
				paramO.cust_seq = cust_seq;
				paramO.user_id = user_id;
				paramO.session_id = null;						//TODO session_id 체크 해야함.
				paramO.order_gb = order_gb;
				paramO.or_name = or_name;
				paramO.or_email = or_email;
				paramO.or_pass = null;
				paramO.or_hp = or_hp;
				paramO.re_name = '';
				paramO.re_hp = '';
				paramO.re_tel = '';
				paramO.re_zip = '';
				paramO.re_addr1 = '';
				paramO.re_addr2 = '';
				paramO.coupon_member_seq = coupon_member_seq;
				paramO.trans_memo = trans_memo;
				paramO.trans_price = trans_price.toString().replace(",", "");
				paramO.order_path = "APP";
				paramO.member_grp_cd = member_grp_cd;
			} else {
				paramO.ocode = ocode;
				paramO.order_yn = order_yn;
				paramO.otype_cd = otype_cd;
				paramO.order_state_cd = order_state_cd;
				paramO.order_price = order_price.toString().replace(",", "");
				paramO.repay_price = order_price.toString().replace(",", "");
				paramO.order_origin_price = order_origin_price.toString().replace(",", "");
				paramO.coupon_price = coupon_sale.toString().replace(",","");
				paramO.use_reserve = use_reserve.toString().replace(",", "");
				paramO.use_deposit = use_deposit.toString().replace(",", "");
				paramO.reserve = give_reserve;
				paramO.cust_seq = cust_seq;
				paramO.user_id = user_id;
				paramO.session_id = null;						//TODO session_id 체크 해야함.
				paramO.order_gb = order_gb;
				paramO.or_name = or_name;
				paramO.or_email = or_email;
				paramO.or_pass = null;
				paramO.or_hp = or_hp;
				paramO.re_name = re_name;
				paramO.re_hp = re_hp;
				paramO.re_tel = re_hp02;
				paramO.re_zip = re_zip;
				paramO.re_addr1 = re_addr1;
				paramO.re_addr2 = re_addr2;
				paramO.coupon_member_seq = coupon_member_seq;
				paramO.trans_memo = trans_memo;
				paramO.trans_price = trans_price.toString().replace(",", "");
				paramO.order_path = "APP";
				paramO.member_grp_cd = member_grp_cd;
			}
			
			//#ORDER_INTO INSERT
		
			
			sql = mybatisMapper.getStatement('order', 'order_insert', paramO, fm);
			var [rowOI] = await pool.query(sql);
		
			var rtn_order = rowOI.insertId;
			
			if(rtn_order != null && rtn_order >= 0) {
				sql = mybatisMapper.getStatement('order', 'get_list', param, fm);
				
				var [rowC] = await pool.query(sql);
				var cart_list = rowC;
				
				for(var n = 0 ; n < cart_list.length ; n++) {
					var row = cart_list[n];

					var opt_price = 0;

					param.cart_seq = row['cart_seq'];
					sql = mybatisMapper.getStatement('order', 'get_option_list', param, fm);
					var [rowOOL] = await pool.query(sql);

					var option_list = rowOOL;
					for(var m = 0 ; m < option_list.length ; m++) {
						var o_row = option_list[m];

						opt_price += (o_row['opt_price'] * o_row['qty']);
					}

					//#조합옵션 추가금액
					sql = mybatisMapper.getStatement('order', 'get_stock_price_select', param, fm);
					var [rowSPI] = await pool.query(sql);

					var stock_price_info = rowSPI;
					var tot_stock_opt_price = 0
					if(stock_price_info != null && stock_price_info.length > 0) {
						tot_stock_opt_price = stock_price_info[0]['tot_stock_opt_price']
						opt_price += stock_price_info[0]['tot_stock_opt_price'];
					}
					
					//#상품가 합계액
					var product_price =  row['sale_price'] * row['qty'];
					//#상품가 합계액
					var origin_product_price =  row['sale_price_origin'] * row['qty'];

					//#할인후 (등급할인후 상품가*수량 + 옵션가*수량)
					var sum_product_price = product_price + opt_price;
					//#할인전 (등급할인전 상품가*수량 + 옵션가*수량)
					var sum_origin_product_price = origin_product_price + opt_price;


					//#상품별 적립금계산
					var reserve = await config_reserve(sum_product_price, reserve_rate);

					var product_coupon_dc_price = 0;


					var paramP1 = {};
					paramP1.ocode						= ocode;
					paramP1.product_gb					= "N";
					paramP1.cart_seq					= row['cart_seq'];
					paramP1.product_order_state_cd		= order_state_cd;
					paramP1.product_cd					= row['product_cd'];
					paramP1.product_nm					= row['product_nm'];
					paramP1.supply_price				= row['supply_price']; 			//#상품 소비자가
					paramP1.sale_price					= row['sale_price_origin'];		//#등급할인 할인전 상품가(판매가)
					paramP1.price						= row['sale_price'];			//#등급할인 할인후 상품가
					paramP1.qty							= row['qty'];			 		//#수량
					paramP1.stock_opt_price				= tot_stock_opt_price;			//#조합옵션 추가금액 (*수량)
					paramP1.product_coupon_dc_price		= product_coupon_dc_price;		//#상품별 쿠폰할인액 ((등급할인후 상품가 + 옵션가 + 조합옵션 추가금액) * 수량)

					paramP1.total_price					= sum_product_price;			//#할인후 (등급할인후 상품가*수량 + 옵션가*수량)
					paramP1.total_origin_price			= sum_origin_product_price; 	//#할인전 (등급할인전 상품가*수량 + 옵션가*수량)
					paramP1.fee_price					= origin_product_price - product_price; //#등급할인 할인전 상품가 - 등급할인 할인후 상품가

					paramP1.iscurr						= row['iscurr'];
					paramP1.reserve						= reserve;
					paramP1.total_reserve				= reserve;
					paramP1.opt_cd						= row['opt_cd'];
					paramP1.cancel_qty					= 0;
					
					paramP1.naver_product_ocode			= null;

					
					//#ORDER_PRODUCT INSERT
					sql = mybatisMapper.getStatement('order', 'order_product_insert', paramP1, fm);
					
					await pool.query(sql);
				}

				
				if(coupon_sale != "") {
					var paramPC = {};
					paramPC.ocode = ocode;

					sql = mybatisMapper.getStatement('order', 'get_order_product_coupon', paramPC, fm);
					var [rowCL] = await pool.query(sql);
					var cart_list = rowCL;

					
					var sum_total_price_grigin = coupon_arry['compare_product_price'];
					
					for(var m = 0 ; m < cart_list.length ; m++) {
						var row = cart_list[m];

						sum_product_price = row['total_price'];
						var product_ocode = row['product_ocode'];
						product_coupon_dc_price = 0;

						if(coupon_arry['coupon_product_list'] != null && coupon_arry['coupon_product_list'].length > 0 && row['coupon_use_yn'] == 'Y'){
							for(var l = 0 ; l < coupon_arry['coupon_product_list'].length ; l++) {
								var coupon_row = coupon_array['coupon_product_list'][l];

								if(row['product_cd'] == coupon_row['product_cd']) {
									//#상품별 쿠폰할인액
									if(coupon_sale != "") {
										//#상품별 할인율 계산시 최대적용금액 과 쿠폰액 비교후 최대금액 만큼 할인시 쿠폰할인가 방식으로 적용
										if(coupon_arry['coupon_gb'] == "0"){
											if(coupon_arry['max_price'] && (coupon_arry['max_price'] <= coupon_sale )){
												//#할인가
												product_coupon_dc_price = Math.round( sum_product_price / sum_total_price_grigin,2) * coupon_sale;
											}else{
												//#할인율
												product_coupon_dc_price = await config_reserve(sum_product_price, coupon_arry['coupon_value']);
											}

										}else{
											//#할인가
											product_coupon_dc_price = Math.round( sum_product_price / sum_total_price_grigin,2) * coupon_sale;
										}
									}
								}

							}
						}

						if(product_coupon_dc_price != "") {
							var paramPCU = {};
							paramPCU.product_coupon_dc_price = product_coupon_dc_price;
							paramPCU.product_ocode = product_ocode;

							sql = mybatisMapper.getStatement('order', 'order_product_coupon_update', paramPCU, fm);
							await pool.query(sql);
						}

					}


				}


				var paramPOI = {};
				paramPOI.ocode = ocode;
				paramPOI.reserve_rate = reserve_rate;
				sql = mybatisMapper.getStatement('order', 'order_product_opt_insert', paramPOI, fm);
				
				await pool.query(sql);


				//#ORDER GIFT INSERT
		        if(order_gb == "G") {
					var gift_order_gb = decodeURIComponent(req.body.gift_order_gb); if(gift_order_gb == null || gift_order_gb == "" || gift_order_gb== "undefined" || gift_order_gb == undefined) gift_order_gb = "";
					var receive_nm = "";
					var receive_hp = "";
					var receive_msg = "";
					if( gift_order_gb == 'K'){
						var kakao_re_name = decodeURIComponent(req.body.kakao_re_name); if(kakao_re_name == null || kakao_re_name == "" || kakao_re_name== "undefined" || kakao_re_name == undefined) kakao_re_name = "";
						var kakao_msg_card = decodeURIComponent(req.body.kakao_msg_card); if(kakao_msg_card == null || kakao_msg_card == "" || kakao_msg_card== "undefined" || kakao_msg_card == undefined) kakao_msg_card = "";
						
						receive_nm  = kakao_re_name;
						receive_hp  = '';
						receive_msg = kakao_msg_card;
					} else if($data['gift_order_gb'] == 'S'){
						var sms_re_name = decodeURIComponent(req.body.sms_re_name); if(sms_re_name == null || sms_re_name == "" || sms_re_name== "undefined" || sms_re_name == undefined) sms_re_name = "";
						var sms_re_hp1 = decodeURIComponent(req.body.sms_re_hp1); if(sms_re_hp1 == null || sms_re_hp1 == "" || sms_re_hp1== "undefined" || sms_re_hp1 == undefined) sms_re_hp1 = "";
						var sms_re_hp2 = decodeURIComponent(req.body.sms_re_hp2); if(sms_re_hp2 == null || sms_re_hp2 == "" || sms_re_hp2== "undefined" || sms_re_hp2 == undefined) sms_re_hp2 = "";
						var sms_re_hp3 = decodeURIComponent(req.body.sms_re_hp3); if(sms_re_hp3 == null || sms_re_hp3 == "" || sms_re_hp3== "undefined" || sms_re_hp3 == undefined) sms_re_hp3 = "";
						var sms_msg_card = decodeURIComponent(req.body.sms_msg_card); if(sms_msg_card == null || sms_msg_card == "" || sms_msg_card== "undefined" || sms_msg_card == undefined) sms_msg_card = "";

						receive_nm  = sms_re_name;
						receive_hp  = sms_re_hp1+ sms_re_hp2 + sms_re_hp3;
						receive_msg = sms_msg_card;
					}
					var paramOGI = {};

					paramOGI.ocode					= ocode;
					paramOGI.re_name				= receive_nm;
					paramOGI.re_hp					= receive_hp;
					paramOGI.gift_gb				= gift_order_gb;
					paramOGI.gift_msg				= receive_msg;
					paramOGI.ran_cd					= fc.random6String();
					paramOGI.done_yn				= "N";
					paramOGI.reg_date				= fc.getDate();

					
					sql = mybatisMapper.getStatement('order', 'order_gift_insert', paramOGI, fm);
					await pool.query(sql);
				}

				//#PRODUCT_PRESENT
				var paramOPP = {};
				paramOPP.ocode = ocode;

				sql = mybatisMapper.getStatement('order', 'order_product_present', paramOPP, fm);
				await pool.query(sql);


				//#적립금 결제(0원) 결제완료일경우
				if(order_state_cd == "20"){
					sql = mybatisMapper.getStatement('order', 'get_finish_order_info', paramOPP, fm);
					var [rowOI] = await pool.query(sql);
					var order_info = rowOI[0];


					await receive_confirm(order_info);

					await order_finish(ocode, cust_seq);
				}

				//#무통장입금일경우
				if(otype_cd == "60"){
					var paramOCI = {};
					paramOCI.ocode			= ocode;
					paramOCI.vact_num		= "";		//TODO bank_num 찾아와야 함
					paramOCI.vact_nm		= "";		//TODO bank_nm 찾아와야 함
					paramOCI.vact_user_nm	= or_name;

					/*
					$arrays = [
								'ocode'				=> $ocode,
								'vact_num'			=> $this->bank_config['bank_num'],
								'vact_nm'			=> $this->bank_config['bank_nm'],
								'vact_user_nm'		=> $data['or_name']
					];
					$this->order->order_card_insert($arrays);

					self::order_finish($ocode);
					*/
					sql = mybatisMapper.getStatement('order', 'order_card_insert', paramOCI, fm);
					await pool.query(sql);
					
					await order_finish(ocode, cust_seq);
				}

			}

		}


		var js = {};
		js.status = rtn_status;
		js.msg = rtn_msg;
		js.ocode = ocode;

		
		res.set({
			'content-type': 'application/json'
		}).send(JSON.stringify({success:true, message:"", errorCode:0, data:js}));
	}

}
module.exports.f10_order_proc_ajax_post =  f10_order_proc_ajax_post;


async function f10_kakaopay_account_ajax_post(req, res) {
	let authHeader = req.headers["authorization"];
	tc = await fc.tokenChecker(req, res);

	var cust_seq = null;
	var member_grp_cd = null;
	var user_id = null;
	var product_nm = null;

	var ocode = decodeURIComponent(req.body.ocode); if(ocode == null || ocode == "" || ocode == "undefined" || ocode == undefined) mode = "";

	// if(tc == "") {
	// 	return;
	// }

	// cust_seq = tc.cust_seq;
	// member_grp_cd = tc.member_grp_cd;
	// user_id = tc.user_id;

	var param = {};
	param.ocode = ocode;
	var kakaopay = {};
	kakaopay.cid ='CT02493574',
	kakaopay.adminkey = '28ebeec61db18ebb234fa995121e4941'

	sql = mybatisMapper.getStatement('order', 'get_order_account', param, fm);

	var [order_account] =await pool.query(sql);
	var order_info = order_account[0];
	
	
	if(order_info.user_id){
		user_id = order_info.user_id;
	}else{
		user_id = tc.user_id;
	}
	if (order_info.p_cnt > 1){
		product_nm = order_info.product_nm +" 외"+(order_info.p_cnt-1);
	}else{
		product_nm = order_info.product_nm;
	}
	var kakaopay_url = "https://kapi.kakao.com/v1/payment/ready";
	var approval_url = "http://localhost:5173//shop/order/kakaopay_account_proc?ocode="+order_info.ocode;
	var fail_url = "http://localhost:5173//shop/order/order_write";
	var cancel_url = "http://localhost:5173//shop/order/order_write";

	var pay_data = [];
	pay_data.cid =kakaopay.cid;
	pay_data.partner_order_id =order_info.ocode;
	pay_data.partner_user_id =user_id;
	pay_data.item_name =product_nm;
	pay_data.quantity =order_info.p_cnt;
	pay_data.total_amount =order_info.order_price;
	pay_data.tax_free_amount =0;
	pay_data.approval_url =approval_url;
	pay_data.fail_url =fail_url;
	pay_data.cancel_url =cancel_url;
	
	// Exchange authorization code for access token
   
	const response = await axios({
		method: 'POST',
		url: kakaopay_url,
		data : pay_data,
		headers: {
			Authorization: `KakaoAK ${kakaopay.adminkey}`,
			'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
	});
console.log(123);
	// return res.set({
	// 	'content-type': 'application/json'
	// }).send(JSON.stringify({ success: true, data: response.data }));
	

}
module.exports.f10_kakaopay_account_ajax_post =  f10_kakaopay_account_ajax_post;


async function orderRandomText() {
	var temp = fc.getDate();
	return temp;
}



/**
 * INNER FUNCTION
 * 주문구분별 처리
 * @return [type] [description]
 */
async function receive_confirm(order_info)
{
	//#선물하기
	if(order_info.order_gb == "G"){
		//#승인요청 보내기
		var param = {};
		param.ocode = order_info.ocode;
		
		sql = mybatisMapper.getStatement('order', 'get_gift_confirm_list', param, fm);
		var [row] = await pool.query(sql);


		var receive_list = row[0];
		if(row != null && row.length > 0){
			ocode = receive_list.ocode;
			phone_num = receive_list.re_hp;

			//#문자발송
			if(order_info.gift_gb == "S"){
				//TODO 문자 발송!!!
				/*
				$url = "https://".$_SERVER["HTTP_HOST"]."/shop/order/gift_confirm?ocode=".$ocode."&ran_cd=".$receive_list->ran_cd;
				$short_url = short_url($url);
				$meg_info= fn_gift_msg_create($order_info,$short_url); #전달할 메시지 생성

				#sms 발송
				$this->kakao_manager->sendSMS($phone_num, $meg_info['gift_tit'], $meg_info['gift_msg']);
				*/

			}
		}
	}
}













/**
 * INNER FUNCTION
 * 결제완료처리
 * @return [type] [description]
 */
async function order_finish(ocode, cust_seq)
{
	var sql = "";

	var paramOPP = {};
	paramOPP.ocode = ocode;


	
	sql = mybatisMapper.getStatement('order', 'get_finish_order_info', paramOPP, fm);
	var [rowOI] = await pool.query(sql);
	var order_info = rowOI[0];

	if(cust_seq != null) {
		//세션 저장?
		//$this->session->set_userdata('guest_or_name', $order_info->or_name);
		//$this->session->set_userdata('guest_or_ocode', $ocode);
	}

	//#COUPON UPDATE
	if(order_info['coupon_member_seq']){
		var paramOCU = {};
		paramOCU.ocode = ocode;
		paramOCU.coupon_member_seq = order_info['order_coupon_update'];
		sql = mybatisMapper.getStatement('order', 'get_finish_order_info', paramOCU, fm);
		await pool.query(sql);
	}

	//#RESERVE UPDATE
	if(order_info['use_reserve'] > 0){
		var reserve_array= {};
		reserve_array.state = "M";
		reserve_array.reserve = order_info['use_reserve'];
		reserve_array.ocode = order_info['ocode'];
		reserve_array.frommlg = "201";
		reserve_array.reference = "주문건 사용";
		//$this->reserve_manager->publish($reserve_array);

		//TODO 추가 데이터(cust_seq)
		reserve_array.cust_seq = cust_seq;
		reserve_array.user_id = user_id;

		await publish(reserve_array);
	}


	//#DEPOSIT UPDATE
	if(order_info['use_deposit'] > 0){
		var deposit_array= {};
		deposit_array.state = "M";
		deposit_array.deposit = order_info['use_deposit'];
		deposit_array.ocode = order_info['ocode'];
		deposit_array.frommlg = "201";
		deposit_array.reference = "주문건 사용";
		
		//TODO 추가 데이터(cust_seq)
		deposit_array.cust_seq = cust_seq;
		deposit_array.user_id = user_id;

		await publish(deposit_array);
	}

	//#CART STATUS UPDATE
	sql = mybatisMapper.getStatement('order', 'cart_finish_update', paramOPP, fm);
	await pool.query(sql);
	

	//#STOCK UPDATE
	sql = mybatisMapper.getStatement('order', 'order_stock_update', paramOPP, fm);
	await pool.query(sql);

	//#order history insert
	paramOPP.order_state_cd = order_info['order_state_cd'];
	sql = mybatisMapper.getStatement('order', 'order_history', paramOPP, fm);
	await pool.query(sql);




	//#MAIL SEND
	var mail_data = {};
	mail_data.order_info = order_info;
	sql = mybatisMapper.getStatement('order', 'get_order_product', paramOPP, fm);
	var [rowP] = await pool.query(sql);
	var order_product = rowP;
	
	var arr_list = [];

	for(var n = 0 ; n < order_product.length ; n++) {
		var row = order_product[n];

		paramOPP.product_ocode = row.product_ocode;
		sql = mybatisMapper.getStatement('order', 'get_order_product_option', paramOPP, fm);
		var [rowPO] = await pool.query(sql);


		row.option_list = rowPO;
		arr_list.push(row);
	}
	mail_data.order_product = arr_list;

	var paramT = {};
	paramT.free_trans_yn = "2001";
	sql = mybatisMapper.getStatement('common', 'get_trans_info', paramT, fm);
	var [rowT] = await pool.query(sql);

	mail_data.const_trans_info = rowT;


	


	//#회원정보
	var paramGMI = {
		cust_seq : cust_seq
	};
	
	sql = mybatisMapper.getStatement('order', 'get_mem_info', paramGMI, fm);
	var [rowM] = await pool.query(sql);
	mail_data.mem_info = rowM[0];

	/*
	TODO
	$this->email->initialize(['mailtype'=>'html']);
	$this->email->from(DEFAULT_EMAIL, DEFAULT_EMAIL_NAME);
	$this->email->to($order_info->or_email);
	$this->email->subject("[아망떼] 주문접수가 완료되었습니다.");
	$mail_view = $this->load->view("/".URL_GLOBAL."/mail/order_ok_mail", $mail_data, TRUE);
	$this->email->message($mail_view);
	$this->email->send();
	*/


	if(order_info['order_state_cd'] == "20"){
		//#SMS_SEND
		//$this->kakao_manager->sendKakao("order_completion1",$order_info->ocode);
	}else{
		//#SMS_SEND
		//$this->kakao_manager->sendKakao("deposit_request_01",$order_info->ocode);
	}

}


















async function publish(array) {
	var sql = "";


	var cust_seq = "";
	var user_id = "";
	if(array['cust_seq'] != null && array['user_id'] != null){
		cust_seq = array['cust_seq'];
		user_id = array['user_id'];
	}else{
		//$cust_seq = $this->CI->session->userdata('cust_seq');
		//$user_id = $this->CI->session->userdata('user_id');
	}

	if(cust_seq != "" && array['reserve'] > 0){
		var paramM = {};
		paramM.cust_seq = cust_seq;

		sql = mybatisMapper.getStatement('member', 'get_mem_info', paramM, fm);
		var [rowM] = await pool.query(sql);


		var mem_info = null;
		var nowmlg = null;
		var is_newmlg = null;

		if(rowM != null && rowM.length > 0) {
			mem_info = rowM[0];

			nowmlg = mem_info['mb_reserve'];
			if (array['state'] == "P"){
				is_newmlg = (nowmlg + array['reserve']);
			}else{
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
		console.log("rowMU : ");
		

		return true;			//결과값?
		/*
		$return = $this->CI->member->set_member_update($arrays, $cust_seq);
		if($return === TRUE){
			return TRUE;
		}else{
			return FALSE2;
		}
		*/

	}else{
		return false;
	}
}

















