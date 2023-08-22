var axios = require("axios").default
var fc = require("./funcComm.js")
var mybatisMapper = require("mybatis-mapper")
var biz_userid = "pyungan";
var biz_profile = "14dc1c4fff11cb7e6cd6f1383c10e9ba82705a8d";
var sms_sender = "15882933";
var biz_url = "https://alimtalk-api.bizmsg.kr/v2/sender/send"
var biz_message_type = "AT";
var fm = { language: 'sql', indent: '  ' };

let pool = null

function settingDb(poolConnect) {
    pool = poolConnect;
    //console.log("setting DB");
    mybatisMapper.createMapper(['./sql-log.xml']);
    fc.settingDb(pool);
}
module.exports.settingDb = settingDb;

async function send_msg(phone_num, title, sms_msg) {
    let log_return = false

    if (phone_num != "" || phone_num != null || phone_num != undefined) {
        var data = JSON.stringify([{
            phn: phone_num,
            profile: biz_profile,
            reserveDT: "00000000000000",
            smsOnly: "Y",
            smsKind: "S",
            msgSms: sms_msg,
            smsSender: sms_sender,
            smsLmsTit: title,
        }])

        var response = await axios({
            url: biz_url,
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                'userid': biz_userid
            },
            data: data
        })

        var result = response.data
        if (result) {
            var log = {
                code: result[0].code,
                phn: result[0].data.phn,
                type: result[0].data.type,
                msgid: result[0].data.msgid,
                message: result[0].message,
                originMessge: result[0].originMessage,
                send_msg: sms_msg,
                reg_date: new Date(Date.now()).format("yy-mm-dd HH:MM:ss"),
            }

            var sql = mybatisMapper.getStatement("log", "insert_talk_log", log, fm)
            var result = await pool.query(sql)
            if (result.insertId) {
                log_return = true
            }
        }
    }
    return log_return
}
module.exports.send_msg = send_msg

async function send_kakao_auto(data) {
    var template_cd = data.template_cd
    var sms_user_phn = data.hp

    var sql = mybatisMapper.getStatement("log", "get_talk_template", { template_cd }, fm)
    var [result,] = await pool.query(sql)
    var { user_send_yn, content: sms_msg, template_url, button_nm, template_url_2, button_nm_2 } = result[0]

    let send_data = {}
    if (user_send_yn != "Y") return false
    if (sms_user_phn != "" || sms_user_phn != null || sms_user_phn != undefined) return false

    sms_msg = sms_msg.replace("#{SHOPNAME}", "아망떼")
    sms_msg = sms_msg.replace("#{NAME}", data.user_nm)
    sms_msg = sms_msg.replace("#{DATE}", data.e_date)
    sms_msg = sms_msg.replace("#{COUPONNAME}", data.coupon_nm)
    sms_msg = sms_msg.replace("#{ACCOUNT}", data.vact_num)
    sms_msg = sms_msg.replace("#{은행명}", data.vact_nm)
    sms_msg = sms_msg.replace("#{PRICE}", data.order_price)
    sms_msg = sms_msg.replace("#{ORDERDATE}", data.order_date)


    if (button_nm && template_url && button_nm_2 && template_url_2) {
        send_data = JSON.stringify({
            message_type: biz_message_type,
            profile: biz_profile,
            phn: sms_user_phn,
            tmplId: template_cd,
            msg: sms_msg,
            button1: {
                name: button_nm,
                type: "WL",
                url_mobile: template_url,
                url_pc: template_url
            },
            button2: {
                name: button_nm_2,
                type: "WL",
                url_mobile: template_url_2,
                url_pc: template_url_2
            },
        })
    } else if (button_nm && template_url && !button_nm_2 && !template_url_2) {
        send_data = JSON.stringify({
            message_type: biz_message_type,
            profile: biz_profile,
            phn: sms_user_phn,
            tmplId: template_cd,
            msg: sms_msg,
            button1: {
                name: button_nm,
                type: "WL",
                url_mobile: template_url,
                url_pc: template_url
            }
        })
    } else {
        send_data = JSON.stringify({
            message_type: biz_message_type,
            profile: biz_profile,
            phn: sms_user_phn,
            tmplId: template_cd,
            msg: sms_msg
        })
    }

    var response = await axios({
        method: "POST",
        url: biz_url,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            'userid': biz_userid
        },
        data: send_data
    })

    var returnedData = response.data

    if (!returnedData) return false

    var log = {
        template_cd,
        code: returnedData[0].code,
        phn: returnedData[0].data.phn,
        type: returnedData[0].data.type,
        msgid: returnedData[0].data.msgid,
        message: returnedData[0].message,
        originMessage: returnedData[0].originMessage,
        send_msg: sms_msg,
        reg_date: new Date(Date.now()).format("yy-mm-dd HH:MM:ss")
    }

    var sql = mybatisMapper.getStatement("log", "insert_talk_log", log, fm)

    const resultLog = await pool.query(sql)
    if (resultLog.insertId) return true
    return false
}

module.exports.send_kakao_auto = send_kakao_auto

async function send_kakao(template_cd, code) {
    if (!template_cd) return false
    var [template,] = await pool.query(mybatisMapper.getStatement("log", "get_talk_template", { template_cd }, fm))
    var {
        user_send_yn,
        content: sms_msg,
        button_nm,
        template_url,
        button_nm_2,
        template_url_2
    } = template[0]

    sms_msg = sms_msg.replace("#{SHOPNAME}", '아망떼')

    if (user_send_yn != 'Y') return false

    var filter = ['member_join', 'member_certification', 'member_password', 'member_sms', 'member_id', 'notice_answer']
    var filter2 = [
        'order_completion1',
        'deposit_cancellation',
        'order_application',
        'order_todaysend',
        'deposit_partialcancellation',
        'deposit_confirmation',
        'deposit_request_01'
    ];

    var filter3 = ['order_return_receipt', 'order_return_complete', 'order_exchange_complete']

    var sms_user_phn = ""
    var send_data = {}

    if (filter.includes(template_cd)) {
        var [user_info,] = await pool.query(mybatisMapper.getStatement("log", "get_member_info", code, fm))
        var { user_id: sms_user_id, user_nm: sms_user_nm, phone } = user_info[0]

        sms_user_phn = phone

        if (code.tmp_pwd) {
            sms_msg = sms_msg.replace("#{PASSWD}", code.tmp_pwd)
        }

        sms_msg = sms_msg.replace("#{ID}", sms_user_id)
        sms_msg = sms_msg.replace("#{NAME}", sms_user_nm)
        sms_msg = sms_msg.replace("#{DATE}", new Date(Date.now()).format("yy-mm-dd"))
        sms_msg = sms_msg.replace("#{RESULT}", 'SMS 수신 거부 처리')
    } else if (template_cd == "member_number") {
        sms_user_phn = code.hp
        sms_msg = sms_msg.replace('#{인증번호}', code.cert_num)
    } else if (filter2.includes(template_cd)) {
        var [user_info,] = await pool.query(mybatisMapper.getStatement("log", "get_sms_order_info", code, fm))
        var {
            ocode: sms_ocode,
            or_name: sms_user_nm,
            reg_date: sms_reg_date,
            otype_nm: sms_otype_nm,
            or_hp: sms_user_phn,
            re_addr1,
            re_addr2,
            order_price: sms_order_price,
            part_cancel_price: sms_part_cancel_price,
            product_nm: sms_product_nm,
            vact_num: sms_vact_num,
            vact_nm: sms_vact_nm,
            p_cnt } = user_info[0]

        if (p_cnt) sms_product_nm = `${sms_product_nm} 외${p_cnt}`
        var sms_re_addr = `${re_addr1} ${re_addr2}`

        if (template_cd == "deposit_partialcancellation") {
            sms_msg = sms_msg.replace("#{PRICE}", sms_part_cancel_price)
        } else {
            sms_msg = sms_msg.replace("#{PRICE}", sms_order_price)
        }

        sms_msg = sms_msg.replace("#{은행명}", sms_vact_nm)
        sms_msg = sms_msg.replace("#{ACCOUNT}", sms_vact_num)
        sms_msg = sms_msg.replace("#{NAME}", sms_user_nm)
        sms_msg = sms_msg.replace("#{PRODUCT_OP}", sms_product_nm)
        sms_msg = sms_msg.replace("#{ORDERNO}", sms_ocode)
        sms_msg = sms_msg.replace("#{PRODUCT}", sms_ocode)
        sms_msg = sms_msg.replace("#{DATE}", new Date(sms_reg_date).format("y.m.d"))
        sms_msg = sms_msg.replace("#{PAYMENT_OP}", sms_otype_nm)
    } else if (filter3.includes(template_cd)) {
        var [user_info,] = await pool.query(mybatisMapper.getStatement("log", "get_order_info_refund", code, fm))
        var { or_hp, product_nm, or_name } = user_info[0]
        sms_user_phn = or_hp
        sms_product_nm = product_nm
        sms_user_nm = or_name

        sms_msg = sms_msg.replace('#{NAME}', sms_user_nm)
        sms_msg = sms_msg.replace('#{PRODUCT}', sms_product_nm)
    } else if (template_cd == 'notice_soldout') {
        template_cd = 'notice_Soldout1'
        var [user_info,] = await pool.query(mybatisMapper.getStatement("log", "get_restock_info", code, fm))
        var { user_id, user_nm, hp, product_nm, product_cd, opt_nm2_1, opt_nm2_2, opt_nm2_3, opt_nm2_4 } = user_info[0]
        sms_user_id = user_id
        sms_user_nm = user_nm
        sms_user_phn = hp
        sms_product_nm = product_nm
        var sms_product_cd = product_cd
        var sms_opt_nm = ""

        if (opt_nm2_1 != '') sms_opt_nm = opt_nm2_1
        if (opt_nm2_2 != '') sms_opt_nm += ` / ${opt_nm2_2}`
        if (opt_nm2_3 != '') sms_opt_nm += ` / ${opt_nm2_3}`
        if (opt_nm2_4 != '') sms_opt_nm = opt_nm2_4
        if (sms_opt_nm != "") sms_product_nm = `${sms_product_nm} ( ${sms_opt_nm} ) `

        sms_msg = sms_msg.replace("#{NAME}", sms_user_nm)
        sms_msg = sms_msg.replace("#{PRODUCT}", sms_product_nm)
        sms_msg = sms_msg.replace("#{재입고상품코드}", sms_product_cd)
    }

    if (sms_user_phn != "") {
        if (button_nm && template_url && button_nm_2 && template_url_2) {
            send_data = JSON.stringify({
                message_type: biz_message_type,
                profile: biz_profile,
                phn: sms_user_phn,
                tmplId: template_cd,
                msg: sms_msg,
                button1: {
                    name: button_nm,
                    type: "WL",
                    url_mobile: template_url,
                    url_pc: template_url
                },
                button2: {
                    name: button_nm_2,
                    type: "WL",
                    url_mobile: template_url_2,
                    url_pc: template_url_2
                },
            })
        } else if (button_nm && template_url && !button_nm_2 && !template_url_2) {
            send_data = JSON.stringify({
                message_type: biz_message_type,
                profile: biz_profile,
                phn: sms_user_phn,
                tmplId: template_cd,
                msg: sms_msg,
                button1: {
                    name: button_nm,
                    type: "WL",
                    url_mobile: template_url,
                    url_pc: template_url
                }
            })
        } else {
            send_data = JSON.stringify({
                message_type: biz_message_type,
                profile: biz_profile,
                phn: sms_user_phn,
                tmplId: template_cd,
                msg: sms_msg
            })
        }

        var response = await axios({
            method: "POST",
            url: biz_url,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                'userid': biz_userid
            },
            data: send_data
        })

        var returnedData = response.data

        if (!returnedData) return false

        var log = {
            template_cd,
            code: returnedData[0].code,
            phn: returnedData[0].data.phn,
            type: returnedData[0].data.type,
            msgid: returnedData[0].data.msgid,
            message: returnedData[0].message,
            originMessage: returnedData[0].originMessage,
            send_msg: sms_msg,
            reg_date: new Date(Date.now()).format("yy-mm-dd HH:MM:ss")
        }

        var sql = mybatisMapper.getStatement("log", "insert_talk_log", log, fm)

        const resultLog = await pool.query(sql)
        if (resultLog.insertId) return true
    }
    return false
}

module.exports.send_kakao = send_kakao