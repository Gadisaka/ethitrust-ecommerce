const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String },
    features: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);
