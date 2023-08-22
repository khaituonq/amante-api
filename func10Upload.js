var Client = require('ssh2-sftp-client');
var fs = require("fs")
var mybatisMapper = require('mybatis-mapper');
var fc = require("./funcComm.js");
var fm = {language: 'sql', indent: '  '};
var pool = null
var {extname, basename, join} = require("path");
var sharp = require("sharp");

module.exports = {
    settingDb: (poolConnect) => {
        pool = poolConnect;
        //console.log("setting DB");
        fc.settingDb(pool);
        mybatisMapper.createMapper(['./sql-upload.xml']);
    },

    f10_shop_upload_image: async (req, res) => {
        var hostname = decodeURIComponent(req.body.hostname);
        if (hostname == undefined || hostname == null || hostname == "undefined") hostname = "";
        var username = decodeURIComponent(req.body.username);
        if (username == undefined || username == null || username == "undefined") username = "";
        var port = decodeURIComponent(req.body.port);
        if (port == undefined || port == null || port == "undefined") port = "22";
        var password = decodeURIComponent(req.body.password);
        if (password == undefined || password == null || password == "undefined") password = "";
        var path = decodeURIComponent(req.body.path);
        if (path == undefined || path == null || path == "undefined") path = ""

        if (hostname == "") {
            return res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({success: false, message: "hostname is empty"}));
        }

        if (username == "") {
            return res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({success: false, message: "username is empty"}));
        }

        if (password == "") {
            return res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({success: false, message: "password is empty"}));
        }

        if (path == "") {
            return res.set({
                'content-type': 'application/json'
            }).send(JSON.stringify({success: false, message: "path is empty"}));
        }

        var sftp_config = {
            host: hostname,
            port: port,
            user: username,
            password: password
        };

        var {files} = req

        var sftp = new Client()
        sftp
            .connect(sftp_config)
            .then(() => {
                const uploadPromises = files.map((file) => {
                    const remoteFilePath = `${path}/${file.originalname}`;
                    return sftp.put(file.path, remoteFilePath);
                });

                Promise.all(uploadPromises)
                    .then(() => {
                        return res.set({
                            'content-type': 'application/json'
                        }).send(JSON.stringify({success: true, message: "Uploaded successfully"}));
                    })
                    .catch((err) => {
                        return res.set({
                            'content-type': 'application/json'
                        }).send(JSON.stringify({success: false, message: err}));
                    })
                    .finally(() => {
                        // Disconnect from the SFTP server
                        sftp.end();

                        // Clean up the temporary files
                        files.forEach((file) => {
                            fs.unlinkSync(file.path);
                        });

                        var sql = mybatisMapper.getStatement("upload", "insert_upload", {
                            hostname,
                            port,
                            password,
                            username,
                            timestamp: Date.now()
                        }, fm)
                        pool.query(sql)
                    });
            })
            .catch((err) => {
                return res.set({
                    'content-type': 'application/json'
                }).send(JSON.stringify({success: false, message: err}));
            });
    },

    f10_manager_upload: async (req, res) => {
        const file = req.file;
        if (!file) {
            return res.send({status: "err", response: "file is missing"});
        }

        if (!file.mimetype.startsWith("image/")) {
            return res.send({status: "ok", response: req.file.filename})
        }

        const inputPath = file.path;
        const outputPath = `${inputPath.replace(extname(inputPath), ".webp")}`;

        await sharp(inputPath)
            .toFormat("webp")
            .webp({quality: 80})
            .toFile(outputPath)
            .then(() => {
                fs.unlink(inputPath, () => {
                })
            })
            .catch((error) => {
                return res.send({status: "err", response: error})
            });

        res.send({status: "ok", response: basename(outputPath)})
    },

    f10_manager_delete_file: async (req, res) => {
        const {file_nm, folder} = req.body;
        if (!file_nm || file_nm === "") {
            return res.send({status: "err", response: "file_nm is missing!"})
        }

        if (!folder || folder === "") {
            return res.send({status: "err", response: "folder is missing"});
        }

        const filePath = join(__dirname, `./html/uploads/${folder}/${file_nm}`);
        if (!fs.existsSync(filePath)) {
            return res.send({status: "err", response: "file not found"})
        }

        await fs.unlink(filePath, () => {
        });

        return res.send({status: "ok", response: "deleted successfully"})
    },

    f10_manager_delete_multiple_file: async (req, res) => {
        let {file_arr, folder} = req.body;
        if (!file_arr || file_arr === "") {
            return res.send({status: "err", response: "file_arr is missing!"})
        }

        if (!folder || folder === "") {
            return res.send({status: "err", response: "folder is missing"});
        }

        try {
            file_arr = JSON.parse(file_arr)
            const promise = file_arr.map(async file_nm => {
                    const filePath = join(__dirname, `./html/uploads/${folder}/${file_nm}`);
                    await fs.unlink(filePath, () => {})
                }
            )
            await Promise.all(promise)
            return res.send({status: "ok", response: "deleted successfully"})
        } catch (e) {
            return res.send({status: "err", response: "format not correct"})
        }
    },


}
