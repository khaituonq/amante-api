let mybatisMapper = require('mybatis-mapper');
let fc = require("./funcComm.js");
const crypto = require("crypto");
let fm = {language: 'sql', indent: '  '};
let pool = null
let jwt = require("jsonwebtoken");
const SECRET_KEY = '/dA43fnfe21Nme2ADR2jQ==';

function getPassEncrypt(pass, user_id) {
    let passwd
    if (pass) {
        let shop_key = "pyungan"
        passwd = fc.hash("sha512", `${fc.md5(pass)}${shop_key}${user_id}`)
    }
    return passwd
}

module.exports = {
    settingDb: (poolConnect) => {
        pool = poolConnect;
        fc.settingDb(pool);
        mybatisMapper.createMapper(['./sql-auth.xml']);
    },

    f10_manager_login_post: async (req, res) => {
        const ERR_COUNT = 4
        let m_id = decodeURIComponent(req.body.m_id);
        if (m_id === undefined || m_id === "undefined") m_id = "";
        let m_pw = decodeURIComponent(req.body.m_pw);
        if (m_pw === undefined || m_pw === "undefined") m_pw = "";
        let hash = getPassEncrypt(m_pw, m_id);

        if (m_id === "") {
            return res.send({
                success: "false",
                response: "user id is missing!"
            })
        }

        if (m_pw === "") {
            return res.send({
                success: "false",
                response: "user password is missing!"
            })
        }

        const [admin,] = await pool.query(mybatisMapper.getStatement("auth", "get_admin_info", {admin_id: m_id}, fm));
        const row = admin[0]

        if (!row) {
            return res.send({status: "err", msg: "로그인 정보를 확인해주세요."})
        }

        const today = new Date().format("yyyy-mm-dd HH:MM:ss")
        if (row.pass_err_date > today || row.pass_err_date) {
            return res.send({status: "err", msg: "로그인 정보를 확인해주세요."})
        }

        if (row.admin_pw !== hash) {
            if (row.pass_err_date !== "" && row.pass_err_date > new Date().format("yyyy-mm-dd HH:MM:ss")) {
                return res.send({status: "err", msg: "10분후가능"})
            }

            if (row.pass_err_date !== "" && row.pass_err_date <= new Date().format("yyyy-mm-dd HH:MM:ss")) {
                await pool.query(mybatisMapper.getStatement("auth", "reset_cnt", {admin_id: row.admin_id}, fm))
                return res.send({status: "err", msg: "로그인 정보를 확인해주세요."})
            }

            const pass_err_date = row.pass_err_cnt < ERR_COUNT ? "" : new Date().setMinutes(new Date() + 10);
            const message = row.pass_err_cnt < ERR_COUNT ? "로그인 정보를 확인해주세요." : "10분후가능"
            await pool.query(mybatisMapper.getStatement("auth", "update_login_err", {
                admin_id: row.admin_id,
                pass_err_cnt: row.pass_err_cnt + 1,
                pass_err_date: pass_err_date
            }, fm))
            return res.send({status: "err", msg: message})
        }

        if (row.admin_gb !== "com" && row.approval !== "Y" && row.admin_gb !== "cms") {
            return res.send({status: "err", msg: "승인처리가 안된 계정입니다."})
        }

        await pool.query(mybatisMapper.getStatement("auth", "update_login_date", {admin_id: row.admin_id}, fm))

        const ip = req.clientIp.indexOf("::ffff:") >= 0 ? req.clientIp.slice("::ffff:")[1] : req.clientIp

        const data = {
            login_id: row.admin_id,
            login_gb: "A",
            login_nm: row.admin_nm,
            login_sdate: today,
            reg_ip: ip,
            user_agent: req.headers["user-agent"] || "localhost",
        }

        const token = jwt.sign({
            admin_id: row.admin_id,
            admin_nm: row.admin_nm,
            login_sdate: data.login_sdate,
            ip: data.reg_ip,
            admin_login_use: true
        }, SECRET_KEY, {
            algorithm: 'HS256',
            expiresIn: '24h'
        })

        await pool.query(mybatisMapper.getStatement("auth", "login_history", data, fm));
        return res.send({status: "ok", msg: "로그인 되었습니다.", access_token: token, data: data})
    },

    authenticateAdmin: async (req, res) => {
    
    }

}