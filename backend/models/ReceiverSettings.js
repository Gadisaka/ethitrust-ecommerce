const mongoose = require("mongoose");

const ReceiverSettingsSchema = new mongoose.Schema(
  {
    // Provider-specific fields
    cbeReceiverName: { type: String, required: true },
    cbeAccountNumber: { type: String, required: true },
    telebirrReceiverName: { type: String, required: true },
    telebirrPhoneNumber: { type: String, required: true },
    // ensure a single settings document by fixed key
    key: { type: String, unique: true, default: "receiver_settings_singleton" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReceiverSettings", ReceiverSettingsSchema);


