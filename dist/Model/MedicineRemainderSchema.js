"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const medicineRemainderSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
    },
    often: {
        type: String,
        enum: ["once daily", "twice daily", "three times daily", "four times daily", "as needed"],
        required: true
    },
    days: {
        type: mongoose_1.default.Schema.Types.Mixed,
        enum: [7, 14, 30, 90, "ongoing"],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    dates: [
        {
            date: { type: Date },
            times: [
                {
                    time: { type: String, required: true },
                    status: { type: String, enum: ["take", "missed", "taken"], default: "take" }
                }
            ]
        }
    ],
    reminder: {
        type: Boolean,
        default: false
    },
    refillTracking: {
        type: Boolean,
        default: false
    },
    instructions: {
        type: String
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });
const medicineModel = mongoose_1.default.model("MedicineRemainder", medicineRemainderSchema);
exports.default = medicineModel;
//# sourceMappingURL=MedicineRemainderSchema.js.map