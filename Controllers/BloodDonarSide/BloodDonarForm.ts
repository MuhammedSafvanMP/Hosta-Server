import { Request, Response } from "express";
import bloodModel from "../../Model/BloodDonarSchema";
import createError from "http-errors";
import userModel from "../../Model/UserSchema";

// ✅ Create a Donor
export const createDonor = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      phone,
      dateOfBirth,
      bloodGroup,
      address,
      userId,
    } = req.body.newDonor;

    // Check if donor already exists by email
    const exists = await bloodModel.findOne({ phone });
    if (exists) {
      throw new createError.Conflict("Phone already exists");
    }

    // Validate phone number - remove starting 0 if needed
    const cleanedPhone = phone.startsWith("0") ? phone.slice(1) : phone;
    if (!/^\d{10}$/.test(cleanedPhone)) {
      throw new createError.BadRequest(
        "Phone number must be exactly 10 digits"
      );
    }

    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      throw new createError.NotFound("User not found");
    }

 
    const existingDonor = await bloodModel.findOne({ userId });
    if (existingDonor) {
      throw new createError.BadRequest("Donor already created");
    }

    const donor = new bloodModel({
      phone: cleanedPhone,
      dateOfBirth,
      bloodGroup,
      address,
      userId,
    });

    await donor.save();

    return res.status(201).json({
      message: "Donor created successfully",
      donor,
      status: 201,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res
        .status(409)
        .json({ message: "Email or phone already exists", status: 409 });
    }

    // Other errors
    const statusCode = error.status || 500;
    const message = error.message || "Internal Server Error";
    return res.status(statusCode).json({ message, status: statusCode });
  }
};

// 🔍 Get All Donors (with pagination & search)
export const getDonors = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { search = "", bloodGroup, pincode, place } = req.query;

  const query: any = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { bloodGroup: { $regex: search, $options: "i" } },
      { "address.place": { $regex: search, $options: "i" } },
    ],
  };

  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (pincode) query["address.pincode"] = pincode;
  if (place) query["address.place"] = place;

  const donors = await bloodModel.find(query)
    .populate("userId")
    .sort({ createdAt: -1 });

  return res.status(200).json({ donors, total: donors.length });
};

// 📄 Get Single Donor
export const getSingleDonor = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid donor ID");

  const donor = await bloodModel.findById(id).populate("userId");
  if (!donor) throw new createError.NotFound("Donor not found");

  return res.status(200).json(donor);
};

// 📄 Get  Donor id
export const getDonorId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid donor ID");

  const donor = await bloodModel.findOne({ userId: id });
  if (!donor) throw new createError.NotFound("Donor not found");

  return res.status(200).json(donor);
};

// 📝 Update Donor
export const updateDonor = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) throw new createError.BadRequest("Invalid donor ID");

  const donor = await bloodModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!donor) throw new createError.NotFound("Donor not found");

  return res.status(200).json({ message: "Donor updated", donor });
};

// ❌ Delete Donor
export const deleteDonor = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid donor ID");

  const donor = await bloodModel.findByIdAndDelete(id);
  if (!donor) throw new createError.NotFound("Donor not found");

  return res.status(200).json({ message: "Donor deleted successfully" });
};
