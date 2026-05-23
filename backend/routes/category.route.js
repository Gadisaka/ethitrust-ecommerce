const express = require("express");
const router = express.Router();
const { getAllCatagories } = require("../controllers/catagory.controller");

router.get("/", getAllCatagories);

module.exports = router;
