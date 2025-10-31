import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBloodDonor extends Document {
  userId: Types.ObjectId;
  phone: string;
  dateOfBirth: Date;
  bloodGroup: "O+" | "O-" | "AB+" | "AB-" | "A+" | "A-" | "B+" | "B-";
  address: {
    place: string;
    pincode: number;
  };
  lastDonationDate?: Date | null;
}

const bloodDonorSchema: Schema<IBloodDonor> = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function (dob: Date) {
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const dayDiff = today.getDate() - dob.getDate();

          // Adjust age if birth date hasn't occurred this year yet
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            return age - 1 >= 18;
          }

          return age >= 18;
        },
        message: "You must be at least 18 years old to donate blood",
      },
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
    },
    address: {
      country : { type: String},
      state:  { type: String},
      district: { type: String},
      place: { type: String, required: true },
      pincode: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const bloodModel = mongoose.model<IBloodDonor>("BloodDonor", bloodDonorSchema);
export default  bloodModel;
