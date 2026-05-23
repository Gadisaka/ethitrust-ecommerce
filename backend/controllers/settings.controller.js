const ReceiverSettings = require("../models/ReceiverSettings");

// Defaults fallbacks (match UI hints)
const DEFAULTS = {
  cbeReceiverName: "MRS HIWOT LEGESSE",
  cbeAccountNumber: "1000721399552",
  telebirrReceiverName: "MRS HIWOT LEGESSE",
  telebirrPhoneNumber: "0912345678",
};

async function getReceiverSettings(req, res) {
  try {
    const doc = await ReceiverSettings.findOne({ key: "receiver_settings_singleton" }).lean();
    if (doc) {
      return res.status(200).json({
        cbeReceiverName: doc.cbeReceiverName || DEFAULTS.cbeReceiverName,
        cbeAccountNumber: doc.cbeAccountNumber || DEFAULTS.cbeAccountNumber,
        telebirrReceiverName: doc.telebirrReceiverName || DEFAULTS.telebirrReceiverName,
        telebirrPhoneNumber: doc.telebirrPhoneNumber || DEFAULTS.telebirrPhoneNumber,
      });
    }
    return res.status(200).json(DEFAULTS);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get receiver settings", error: error.message });
  }
}

async function updateReceiverSettings(req, res) {
  try {
    const {
      cbeReceiverName,
      cbeAccountNumber,
      telebirrReceiverName,
      telebirrPhoneNumber,
    } = req.body || {};
    if (
      !cbeReceiverName ||
      !cbeAccountNumber ||
      !telebirrReceiverName ||
      !telebirrPhoneNumber
    ) {
      return res.status(400).json({
        message:
          "cbeReceiverName, cbeAccountNumber, telebirrReceiverName, telebirrPhoneNumber are required",
      });
    }
    const updated = await ReceiverSettings.findOneAndUpdate(
      { key: "receiver_settings_singleton" },
      {
        $set: {
          cbeReceiverName,
          cbeAccountNumber,
          telebirrReceiverName,
          telebirrPhoneNumber,
          key: "receiver_settings_singleton",
        },
      },
      { new: true, upsert: true }
    ).lean();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update receiver settings", error: error.message });
  }
}

module.exports = { getReceiverSettings, updateReceiverSettings, DEFAULTS };


