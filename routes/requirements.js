
const mongoose = require('mongoose');

const requirementSchema = mongoose.Schema({
    customerId: String,
    kaarigarType: String,
    description: String,
    createdAt: Date,
    expiresAt: Date
});

module.exports = mongoose.model("requirement", requirementSchema);

