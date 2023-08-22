let mybatisMapper = require('mybatis-mapper');
let fc = require("./funcComm.js");
const crypto = require("crypto");
let fm = {language: 'sql', indent: '  '};
let pool = null
let fs = require("fs");
const path = require("path");

module.exports = {
    settingDb: (poolConnect) => {
        pool = poolConnect;
        fc.settingDb(pool);
        mybatisMapper.createMapper(['./sql-style.xml']);
    },

    f10_manager_styles_get: async (req, res) => {
        const [result, ] = await pool.query(mybatisMapper.getStatement("style", "get_manager_all_styles", {}, fm));
        res.send({ status: "ok", response: result });
    },

    f10_manager_detailed_get: async (req, res) => {
        let h_code = decodeURIComponent(req.query.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        if(h_code === "") {
            return res.send({status: "err", message: "h_code is missing"})
        }

        const [result, ] = await pool.query(mybatisMapper.getStatement("style", "get_manager_all_detailed", {h_code}, fm));
        res.send({ status: "ok", response: result })
    },

    f10_manager_style_edit_view: async (req, res) => {
        let h_code = decodeURIComponent(req.query.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        if(h_code === "") {
            return res.send({status: "err", message: "h_code is missing"})
        }
        const [result, ] = await pool.query(mybatisMapper.getStatement("style", "get_manager_style", {h_code}, fm));
        res.send({ status: "ok", response: result });
    },

    f10_manager_detailed_edit_view: async (req, res) => {
        let h_code = decodeURIComponent(req.query.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        let d_code = decodeURIComponent(req.query.h_code); if(d_code === "undefined" || d_code === undefined || d_code === null) d_code = "";

        if(d_code === "") {
            return res.send({status: "err", message: "d_code is missing"})
        }

        if(h_code === "") {
            return res.send({status: "err", message: "h_code is missing"})
        }

        const [result, ] = await pool.query(mybatisMapper.getStatement("style", "get_manager_detailed", {h_code, d_code}, fm));

        res.send({status: "ok", response: result})
    },

    f10_manager_style_edit_post: async (req, res) => {
        let h_code = decodeURIComponent(req.body.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        let h_name = decodeURIComponent(req.body.h_name); if(h_name === "undefined" || h_name === undefined || h_name === null) h_name = "";
        let file_nm_enb = decodeURIComponent(req.body.file_nm_enb); if(file_nm_enb === "undefined" || file_nm_enb === undefined || file_nm_enb === null) file_nm_enb = "";
        let file_nm_dis = decodeURIComponent(req.body.file_nm_dis); if(file_nm_dis === "undefined" || file_nm_dis === undefined || file_nm_dis === null) file_nm_dis = "";
        let use_yn = decodeURIComponent(req.body.use_yn); if(use_yn === "undefined" || use_yn === undefined || use_yn === null) use_yn = "";
        let del_yn = decodeURIComponent(req.body.del_yn); if(del_yn === "undefined" || del_yn === undefined || del_yn === null) del_yn = "";

        if(req.files && req.files.style_icon_dis && req.files.style_icon_enb) {
            file_nm_dis = req.files.style_icon_dis[0].filename
            file_nm_enb = req.files.style_icon_enb[0].filename
        }

        console.log(req.body)

        if(req.body.deleted_file) {
            console.log(req.body.deleted_file)
            for (const file of req.body.deleted_file) {
                fs.unlink(path.join(__dirname, `./html/uploads/styles/${file}`), (error)=> {
                    if(error) console.log(error)
                })
            }
        }

        if(h_name === "" || file_nm_enb === "" || use_yn === "" || del_yn === "" || file_nm_dis === "") {
            return res.send({status: "err", message: "wrong input"})
        }

        await pool.query(mybatisMapper.getStatement("style", "update_style", {
            h_code, h_name, file_nm_enb, file_nm_dis, use_yn, del_yn
        }, fm));

        return res.send({status: "ok"})
    },

    f10_manager_detailed_edit_post: async (req, res) => {
        let h_code = decodeURIComponent(req.body.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        let d_code = decodeURIComponent(req.body.d_code); if(d_code === "undefined" || d_code === undefined || d_code === null) d_code = "";
        let d_name = decodeURIComponent(req.body.d_name); if(d_name === "undefined" || d_name === undefined || d_name === null) d_name = "";
        let use_yn = decodeURIComponent(req.body.use_yn); if(use_yn === "undefined" || use_yn === undefined || use_yn === null) use_yn = "";
        let del_yn = decodeURIComponent(req.body.del_yn); if(del_yn === "undefined" || del_yn === undefined || del_yn === null) del_yn = "";

        if(h_code === "" || d_code === "" || d_name === "" || use_yn === "" || del_yn === "") {
            return res.send({status: "err", message: "wrong input"})
        }

        await pool.query(mybatisMapper.getStatement("style", "update_detailed", {h_code, d_code, d_name, use_yn, del_yn}, fm))
        res.send({status: "ok"})
    },

    f10_manager_insert_style_post: async (req, res) => {
        let h_name = decodeURIComponent(req.body.h_name); if(h_name === "undefined" || h_name === undefined || h_name === null) h_name = "";
        let file_nm_enb = decodeURIComponent(req.body.file_nm_enb); if(file_nm_enb === "undefined" || file_nm_enb === undefined || file_nm_enb === null) file_nm_enb = "";
        let file_nm_dis = decodeURIComponent(req.body.file_nm_dis); if(file_nm_dis === "undefined" || file_nm_dis === undefined || file_nm_dis === null) file_nm_dis = "";
        let use_yn = decodeURIComponent(req.body.use_yn); if(use_yn === "undefined" || use_yn === undefined || use_yn === null) use_yn = "";
        let del_yn = decodeURIComponent(req.body.del_yn); if(del_yn === "undefined" || del_yn === undefined || del_yn === null) del_yn = "";

        if(req.files && req.files.style_icon_dis && req.files.style_icon_enb) {
            file_nm_dis = req.files.style_icon_dis[0].filename
            file_nm_enb = req.files.style_icon_enb[0].filename
        }

        if(h_name === "" || file_nm_enb === "" || use_yn === "" || del_yn === "" || file_nm_dis === "") {
            return res.send({status: "err", message: "wrong input"})
        }

        await pool.query(mybatisMapper.getStatement("style", "insert_style", {
            h_name, file_nm_enb, file_nm_dis, use_yn, del_yn
        }, fm));

        return res.send({status: "ok"})
    },

    f10_manager_insert_detailed_post: async (req, res) => {
        let h_code = decodeURIComponent(req.body.h_code); if(h_code === "undefined" || h_code === undefined || h_code === null) h_code = "";
        let d_name = decodeURIComponent(req.body.d_name); if(d_name === "undefined" || d_name === undefined || d_name === null) d_name = "";
        let use_yn = decodeURIComponent(req.body.use_yn); if(use_yn === "undefined" || use_yn === undefined || use_yn === null) use_yn = "";
        let del_yn = decodeURIComponent(req.body.del_yn); if(del_yn === "undefined" || del_yn === undefined || del_yn === null) del_yn = "";

        if(h_code === "" || d_name === "" || use_yn === "" || del_yn === "") {
            return res.send({status: "err", message: "wrong input"})
        }

        await pool.query(mybatisMapper.getStatement("style", "insert_detail", {h_code, d_name, use_yn, del_yn}, fm))
        res.send({status: "ok"})
    }
}