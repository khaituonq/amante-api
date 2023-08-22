var mybatisMapper = require('mybatis-mapper');
var fc = require("./funcComm.js");
var fm = { language: 'sql', indent: '  ' };
var pool = null
var fs = require("fs");
var path = require("path");


function check_value(object, res) {
    for (const [key, value] of Object.entries(object)) {
        if (value == "" || value == "undefined" || value == undefined || value == null) {
            return res.send({ success: "err", response: `${key} is empty!` })
        }
    }
}


module.exports = {
    settingDb: (poolConnect) => {
        pool = poolConnect;
        fc.settingDb(pool);
        mybatisMapper.createMapper(['./sql-concept-room.xml']);
    },

    f10_concept_room_view_get: async (req, res) => {
        var concept_room_seq = decodeURIComponent(req.query.concept_room_seq);
        var cust_seq = decodeURIComponent(req.query.cust_seq);
        if (cust_seq == null || cust_seq == "undefined" || cust_seq == undefined) cust_seq = "";
        if (concept_room_seq == null || concept_room_seq == "undefined" || concept_room_seq == undefined) concept_room_seq = "";
        if (concept_room_seq == "") {
            return res.set({
                "Content-Type": "application/json"
            }).send({ success: false, msg: "concept_room_seq is empty!" })
        }

        var [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_concept_room_view", {
            concept_room_seq,
            cust_seq
        }, fm))
        var js = {
            ...result[0][0],
            styles: result[1],
            view: result[2],
            related_room: result[5],
            related_product: []
        };

        for (var view of js.view) {
            view.outside_prd = result[7].filter(x => x.view_seq === view.view_seq)
            view.room_object = result[3]
                .filter(x => x.view_seq === view.view_seq)
                .map(obj => ({
                    ...obj,
                    options: result[4]
                        .filter(x => x.object_seq === obj.object_seq)
                        .map(option => ({
                            ...option,
                            product: result[6].filter(x => option.product_cd.indexOf(x.product_cd) !== -1)
                        }))
                }))
        }

        let keywords = []

        for (const product of result[6]) {
            const split_key = product.keywd ? product.keywd.split(",") : []
            keywords.push(...split_key.filter(key => !keywords.includes(key)))
        }

        if (keywords.length) {
            const sql = mybatisMapper.getStatement("concept-room", "get_related_product", {
                keyword: keywords,
                cust_seq
            }, fm)
            const [keyResult,] = await pool.query(sql);
            js.related_product = keyResult;
        }
        res.send({ status: "success", response: js })
    },

    f10_concept_room_list_get: async (req, res) => {
        var row_count = parseInt(decodeURIComponent(req.query.row_count)) || 9;
        var query = req.query.styles ? JSON.parse(decodeURIComponent(req.query.styles)) : [];
        var page = parseInt(decodeURIComponent(req.query.page));
        if (!page || page < 1) page = 1;
        var start_num = (page - 1) * row_count;
        var styles = [];
        var filter = req.query.filter || "newest";

        if (query.length) {
            for (const q of query) {
                var value = q.split("|");
                styles.push({ h_code: value[0], d_code: value[1] })
            }
        } else {
            styles = ""
        }

        var [rooms,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_concept_room_list", {
            styles,
            filter,
            row_count,
            start_num
        }, fm));

        var [total,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_total_concept_room", { styles }, fm));
        var totalPage = Math.ceil(total[0].cnt / row_count)

        var promises = rooms.map(async (room) => {
            var product = [...new Set(room.product_cd ? room.product_cd.split(",") : [])]
            if (product.length) {
                var [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_product_img", { product }, fm));
                room.product_main_file = result
            }
            delete room.product_cd
        })
        await Promise.all(promises)
        res.send({ currentPage: page, limit: row_count, totalPage, total: total[0].cnt, list: rooms })
    },

    f10_concept_room_style_list_get: async (req, res) => {
        var [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_styles", {}, fm));
        var js = result[0].map((s) => {
            s.detailed = result[1].filter(x => x.h_code === s.h_code)
            return s;
        })
        res.send(js)
    },

    f10_concept_room_insert_post: async (req, res) => {

        const {
            concept_room_nm, bg_url, thumbnail_img, state, use_yn,
            brand, upload_method, admin_id, view, styles
        } = req.body;

        check_value({
            concept_room_nm, bg_url, thumbnail_img, state, use_yn,
            brand, upload_method, admin_id, view, styles
        }, res)

        var roomPost = await pool.query(mybatisMapper.getStatement("concept-room", "insert_concept_room", {
            concept_room_nm,
            bg_url,
            thumbnail_img,
            use_yn,
            state,
            brand,
            upload_method,
            admin_id
        }));

        var insertRoomId = roomPost[0].insertId;
        var object = []
        var option = []
        var style_data = []
        var outside = []
        if (insertRoomId) {
            if (styles && styles.length) {

                for (const style of styles) {
                    style_data.push(JSON.parse(style))
                }

                const sql = mybatisMapper.getStatement("concept-room", "insert_room_style", {
                    concept_room_seq: insertRoomId,
                    datas: style_data
                })

                await pool.query(sql);
            }

            if (view) {
                for (const v of view) {
                    var sql = mybatisMapper.getStatement("concept-room", "insert_room_view", {
                        concept_room_seq: insertRoomId,
                        view_nm: v.view_nm,
                        file_nm: v.file_nm,
                        method: upload_method,
                        slide_url: v.slide_url
                    }, fm)
                    var viewPost = await pool.query(sql)
                    var insertedViewId = viewPost[0].insertId
                    if (insertedViewId) {
                        object.push({ view_seq: insertedViewId, room_object: v.room_object })
                        outside.push({ view_seq: insertedViewId, outside_prd: v.outside_prd })
                    }
                }

                for (const out of outside) {
                    for (const item of out.outside_prd) {
                        await pool.query(mybatisMapper.getStatement("concept-room", "insert_outside", {
                            concept_room_seq: insertRoomId,
                            view_seq: out.view_seq,
                            x: item.x,
                            y: item.y,
                            product_nm: item.product_nm,
                            url: item.url,
                            method: upload_method
                        }, fm))
                    }
                }

                for (const obj of object) {
                    for (const o of obj.room_object) {
                        const sql = mybatisMapper.getStatement("concept-room", "insert_room_object", {
                            view_seq: obj.view_seq,
                            concept_room_seq: insertRoomId,
                            thumbnail_img: o.thumbnail_img,
                            id: o.id,
                            child_obj: o.child_obj.length ? "" : o.child_obj.join(","),
                            method: upload_method,
                            coord_x: o.coord_x,
                            coord_y: o.coord_y,
                            object_pos_x: upload_method == "L" ? "00.00" : o.object_pos_x,
                            object_pos_y: upload_method == "L" ? "00.00" : o.object_pos_y,
                            width: upload_method == "L" ? "770" : o.width,
                            height: upload_method == "L" ? "580" : o.height,
                            od: o.od,
                        })
                        const objectPost = await pool.query(sql);
                        const insertedObjectId = objectPost[0].insertId;
                        if (insertedObjectId) option.push({ object_seq: insertedObjectId, options: o.options })
                    }
                }

                for (const opt of option) {
                    for (const op of opt.options) {
                        const sql = mybatisMapper.getStatement("concept-room", "insert_room_option", {
                            object_seq: opt.object_seq,
                            id: op.id,
                            thumbnail_img: op.thumbnail_img,
                            option_nm: op.option_nm,
                            option_file_nm: op.option_file_nm,
                            product_cd: op.product.map(x => x.value).join(","),
                            product_nm: op.product.map(x => x.label).join(",")
                        })
                        await pool.query(sql)
                    }
                }
            }
        }
        res.send({ status: "ok", response: "success" })
    },

    f10_concept_room_edit_view_get: async (req, res) => {
        const concept_room_seq = req.query.concept_room_seq
        if (!concept_room_seq) {
            return res.send({ success: false, message: "concept_room_seq is empty!" });
        }

        const sql = mybatisMapper.getStatement("concept-room", "get_update_room", { concept_room_seq }, fm);
        const [result,] = await pool.query(sql)
        const js = {
            ...result[0][0],
            styles: result[4].map(el => JSON.stringify({ h_code: el.h_code, d_code: el.d_code })),
            view: result[1],
        }

        for (const item of js.view) {
            item.room_object = result[2].filter(x => x.view_seq === item.view_seq)
            item.outside_prd = result[5].filter(x => x.view_seq == item.view_seq) || []
            for (const object of item.room_object) {
                object.child_obj = object.child_obj === "" ? [] : object.child_obj.split(",")
                object.options = result[3].filter(x => x.object_seq === object.object_seq)
                for (const opt of object.options) {
                    const product_cds = opt.product_cd.split(",")
                    const product_nms = opt.product_nm.split(",")
                    const product = [];

                    for (let i = 0; i < product_cds.length; i++) {
                        product.push({
                            value: product_cds[i],
                            label: product_nms[i]
                        })
                    }

                    opt.product = product;
                }
            }
        }
        res.send({ status: "success", response: js })
    },

    f10_concept_room_edit_post: async (req, res) => {
        const {
            concept_room_seq, concept_room_nm, bg_url, thumbnail_img, state, use_yn,
            brand, upload_method, admin_id, view, styles
        } = req.body;

        check_value({ concept_room_seq, upload_method }, res);

        var roomPost = await pool.query(mybatisMapper.getStatement("concept-room", "update_room", {
            concept_room_seq,
            concept_room_nm,
            bg_url,
            thumbnail_img,
            use_yn,
            state,
            brand,
            upload_method,
            admin_id
        }));

        const [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_edit_info", { concept_room_seq }, fm));
        var delete_view = result[0].length ? result[0].map(el => el.view_seq) : null;
        var delete_object = result[1].length ? result[1].map(el => el.object_seq) : null;
        var delete_option = result[2].length ? result[2].map(el => el.option_seq) : null;
        var delete_outside = result[3].length ? result[3].map(el => el.id) : null;

        var insertRoomId = concept_room_seq;
        var object = []
        var option = []
        var style_data = []
        var outside = []
        if (insertRoomId) {
            if (styles && styles.length) {

                for (const style of styles) {
                    style_data.push(JSON.parse(style))
                }

                await pool.query(mybatisMapper.getStatement("concept-room", "delete_style", {concept_room_seq} ,fm))

                const sql = mybatisMapper.getStatement("concept-room", "insert_room_style", {
                    concept_room_seq: insertRoomId,
                    datas: style_data
                })

                await pool.query(sql);
            }

            if (view) {
                for (const v of view) {
                    var sql = mybatisMapper.getStatement("concept-room", "insert_room_view", {
                        concept_room_seq: insertRoomId,
                        view_nm: v.view_nm,
                        file_nm: v.file_nm,
                        method: upload_method,
                        slide_url: v.slide_url
                    }, fm)
                    var viewPost = await pool.query(sql)
                    var insertedViewId = viewPost[0].insertId
                    if (insertedViewId) {
                        object.push({ view_seq: insertedViewId, room_object: v.room_object })
                        outside.push({ view_seq: insertedViewId, outside_prd: v.outside_prd })
                    }
                }

                for (const out of outside) {
                    for (const item of out.outside_prd) {
                        await pool.query(mybatisMapper.getStatement("concept-room", "insert_outside", {
                            concept_room_seq: insertRoomId,
                            view_seq: out.view_seq,
                            x: item.x,
                            y: item.y,
                            product_nm: item.product_nm,
                            url: item.url,
                            method: upload_method
                        }, fm))
                    }
                }

                for (const obj of object) {
                    for (const o of obj.room_object) {
                        const sql = mybatisMapper.getStatement("concept-room", "insert_room_object", {
                            view_seq: obj.view_seq,
                            concept_room_seq: insertRoomId,
                            thumbnail_img: o.thumbnail_img,
                            id: o.id,
                            child_obj: o.child_obj.length ? "" : o.child_obj.join(","),
                            method: upload_method,
                            coord_x: o.coord_x,
                            coord_y: o.coord_y,
                            object_pos_x: upload_method == "L" ? "00.00" : o.object_pos_x,
                            object_pos_y: upload_method == "L" ? "00.00" : o.object_pos_y,
                            width: upload_method == "L" ? "770" : o.width,
                            height: upload_method == "L" ? "580" : o.height,
                            od: o.od,
                        })
                        const objectPost = await pool.query(sql);
                        const insertedObjectId = objectPost[0].insertId;
                        if (insertedObjectId) option.push({ object_seq: insertedObjectId, options: o.options })
                    }
                }

                for (const opt of option) {
                    for (const op of opt.options) {
                        const sql = mybatisMapper.getStatement("concept-room", "insert_room_option", {
                            object_seq: opt.object_seq,
                            id: op.id,
                            thumbnail_img: op.thumbnail_img,
                            option_nm: op.option_nm,
                            option_file_nm: op.option_file_nm,
                            product_cd: op.product.map(x => x.value).join(","),
                            product_nm: op.product.map(x => x.label).join(",")
                        })
                        await pool.query(sql)
                    }
                }

                await pool.query(mybatisMapper.getStatement("concept-room", "delete_info", {
                    delete_view,
                    delete_object,
                    delete_option,
                    delete_outside,
                }, fm))
            }


        }
        res.send({ status: "ok", response: "success" })
    },

    f10_concept_room_manager_list: async (req, res) => {
        const {
            style, concept_room_seq, concept_room_nm,
            use_yn, brand_cd, page, limit
        } = req.query

        const start_num = (parseInt(page) && parseInt(page) - 1 >= 0) ? parseInt(page) - 1 : 0;
        const row_count = start_num * parseInt(limit) || 25;

        let csql = mybatisMapper.getStatement("concept-room", "get_room_total", {
            style: style || "",
            concept_room_seq: concept_room_seq || "",
            concept_room_nm: concept_room_nm || "",
            use_yn: use_yn || "",
            brand_cd: brand_cd || "",
        }, fm)

        let sql = mybatisMapper.getStatement("concept-room", "get_room_list", {
            style: style || "",
            concept_room_seq: concept_room_seq || "",
            concept_room_nm: concept_room_nm || "",
            use_yn: use_yn || "",
            brand_cd: brand_cd || "",
            start_num,
            row_count
        }, fm)

        // console.log(sql);

        const result = await Promise.all([
            await pool.query(sql),
            await pool.query(csql)
        ])

        const [list,] = result[0]
        const [count,] = result[1]

        const js = {}
        js.status = "ok"
        js.response = {
            total: count[0].cnt,
            list: list,
            totalPage: Math.ceil(count[0].cnt / row_count),
            currentPage: parseInt(page) || 1,
            itemPerPage: row_count
        }

        res.send(js)
    },

    f10_concept_room_manager_update_list: async (req, res) => {
        let concept_room_seq = req.body.concept_room_seq;
        let del_yn = req.body.del_yn || "N";
        let use_yn = req.body.use_yn || "";
        if (concept_room_seq === "" || concept_room_seq === undefined || concept_room_seq === "undefined" || concept_room_seq === null) {
            return res.send({ status: "err", msg: "concept_room_seq is missing" })
        }

        await pool.query(mybatisMapper.getStatement("concept-room", "update_room_list", {
            concept_room_seq,
            concept_room_nm: "",
            brand: "",
            state: "",
            thumbnail_img: "",
            bg_url: "",
            del_yn,
            use_yn,
            upload_method: ""
        }, fm))

        res.send({ status: "ok" })
    },

    f10_concecpt_room_product_view: async (req, res) => {
        let concept_room_seq = req.query.concept_room_seq || ""
        if (concept_room_seq === "") {
            return res.send({ status: "err", response: "concept_room_seq is missing!" })
        }

        const [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_product_lookup_by_id", { concept_room_seq }, fm))
        return res.send({ status: "ok", response: result })
    },

    f10_concept_room_product_list: async (req, res) => {
        let brand_cd = req.query.brand_cd || ""
        let product_cd = req.query.product_cd || ""
        let product_nm = req.query.product_nm || ""
        let page = req.query.page || 1;
        let row_count = req.query.limit || 25;

        let start_num = (page - 1) * row_count;
        const [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_product_lookup_list", {
            brand_cd,
            product_cd,
            product_nm,
            row_count,
            start_num
        }, fm));
        const [result2,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_product_total", {
            brand_cd,
            product_nm,
            product_cd
        }, fm))
        let totalPage = Math.ceil(result2[0].cnt / row_count);

        const js = {
            status: "ok",
            response: {
                currentPage: page,
                totalPage,
                total: result2[0].cnt,
                list: result,
                itemPerPage: row_count
            }
        }
        res.send(js)
    },

    f10_concept_room_look_up: async (req, res) => {
        let product_cd = req.query.product_cd || ""
        if (product_cd === "") {
            return res.send({ status: "err", response: "product_cd is missing!" })
        }

        const [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_room_lookup_by_id", { product_cd }, fm))
        return res.send({ status: "ok", response: result })
    },

    f10_concept_room_change_method: async (req, res) => {
        const { concept_room_seq, method } = req.query;
        if (!concept_room_seq || concept_room_seq === "") {
            return res.send({ status: "err", response: "concept_room_seq is missing" });
        }

        if (!method || method === "") {
            return res.send({ status: "err", response: "method is missing" });
        }

        const sql = mybatisMapper.getStatement("concept-room", "get_room_slide", { method, concept_room_seq }, fm);
        const [result,] = await pool.query(sql);
        const js = [
            ...result[0]
        ]

        for (const view of js) {
            view.room_object = result[1].filter(x => x.view_seq === view.view_seq)
            for (const object of view.room_object) {
                object.child_obj = object.child_obj == "" ? [] : object.child_obj.split(",")
                object.options = result[2].filter(x => x.object_seq === object.object_seq)
            }
        }
        res.send({ status: "ok", response: js })
    },

    f10_concept_room_product_get: async (req, res) => {
        const [result,] = await pool.query(mybatisMapper.getStatement("concept-room", "get_product", {}, fm));
        res.send({ status: "ok", response: result })
    },

    f10_concept_room_log_insert: async (req, res) => {
        const data = req.body.data;
        const string = `[${new Date(Date.now())}] - DATA: ${JSON.stringify(data)} \n`;
        fs.appendFile(path.join(__dirname, "/log/room.log"), string, (err) => {
            if(err) throw err;
            if(err) console.log(err);
        })
        return res.json({ status: "ok" })
    }
}