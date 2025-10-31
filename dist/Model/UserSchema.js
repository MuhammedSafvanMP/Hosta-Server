"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    password: {
        type: String,
        minlength: 8,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true, // <-- Add this line
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    picture: { imageUrl: { type: String }, public_id: { type: String } },
    expoPushToken: { type: String },
}, { timestamps: true });
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
//# sourceMappingURL=UserSchema.js.map