// routers/messageRouter.js
const express = require("express");
const { sendMessage } = require("../controllers/messageController");
const multer = require("multer");

const upload = multer({ dest: "uploads/" }); // Directory for storing uploaded files

const router = express.Router();

router.post("/send", upload.array("media"), sendMessage);

module.exports = router;
