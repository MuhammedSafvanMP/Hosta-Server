"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const ambulanceSchema = new Schema({
    serviceName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    vehicleType: {
        type: String,
    },
});
const ambulanceModel = mongoose_1.default.model("Ambulance", ambulanceSchema);
exports.default = ambulanceModel;
//# sourceMappingURL=AmbulanceSchema.js.map