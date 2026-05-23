// Controller for fetching all categories
const Catagory = require("../models/Catagory");

exports.getAllCatagories = async (req, res) => {
  try {
    const catagories = await Catagory.find();
    res.json(catagories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
};
