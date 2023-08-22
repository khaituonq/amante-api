const path = require("path")
const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, `./html/uploads/${req.headers.folder}`))
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname.toString().toUpperCase()}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage: storage});

module.exports = upload;