import mongoose from "mongoose";
const Schema = mongoose.Schema;

const medicineRemainderSchema = new Schema(
  {
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
      type: mongoose.Schema.Types.Mixed,  
      enum: [7, 14, 30, 90, "ongoing"],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    dates: [
      {
         date: {type: Date},
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  },
  { timestamps: true }
);


const medicineModel = mongoose.model("MedicineRemainder", medicineRemainderSchema);
export default  medicineModel;
