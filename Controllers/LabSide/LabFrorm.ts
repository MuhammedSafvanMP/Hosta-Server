import { Request, Response } from "express";
import labModel from "../../Model/labSchema"; 
import createError from "http-errors";

// ✅ Create a Lab
export const createLab = async (req: Request, res: Response): Promise<Response> => {
  const { name, email, phone, time, services, location } = req.body;

  const exists = await labModel.findOne({ email });
  if (exists) throw new createError.Conflict("Email already exists");

  const lab = new labModel({ name, email, phone, time, services, location });
  await lab.save();

  return res.status(201).json({ message: "Lab created successfully", lab });
};

// 🔍 Get All Labs (with pagination & search)
export const getLabs = async (req: Request, res: Response): Promise<Response> => {
  const { page = 1, limit = 10, search = "", pincode, place } = req.query;

  const query: any = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { "location.place": { $regex: search, $options: "i" } },
    ],
  };

  if (pincode) query["location.pincode"] = +pincode;
  if (place) query["location.place"] = { $regex: place, $options: "i" };

  const labs = await labModel.find(query)
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort({ createdAt: -1 });

  const total = await labModel.countDocuments(query);

  return res.status(200).json({ labs, total, page: +page, totalPages: Math.ceil(total / +limit) });
};

// 📄 Get Single Lab
export const getSingleLab = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid Lab ID");

  const lab = await labModel.findById(id);
  if (!lab) throw new createError.NotFound("Lab not found");

  return res.status(200).json(lab);
};

// 📝 Update Lab
export const updateLab = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) throw new createError.BadRequest("Invalid Lab ID");

  const lab = await labModel.findByIdAndUpdate(id, updateData, { new: true });
  if (!lab) throw new createError.NotFound("Lab not found");

  return res.status(200).json({ message: "Lab updated", lab });
};

// ❌ Delete Lab
export const deleteLab = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  if (!id) throw new createError.BadRequest("Invalid Lab ID");

  const lab = await labModel.findByIdAndDelete(id);
  if (!lab) throw new createError.NotFound("Lab not found");

  return res.status(200).json({ message: "Lab deleted successfully" });
};
