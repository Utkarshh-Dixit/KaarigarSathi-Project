
const mongoose = require('mongoose');

const requirementSchema = mongoose.Schema({
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    },
    kaarigarType: String,
    description: String,
    createdAt: Date,
    expiresAt: Date
});

module.exports = mongoose.model("requirement", requirementSchema);

