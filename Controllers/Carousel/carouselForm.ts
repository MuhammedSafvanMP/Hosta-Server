import { Request, Response } from "express";
import createError from "http-errors";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { uploadFile } from "../../Middlewares/Multer";
import hospitalModel from "../../Model/HospitalSchema";
import { log } from "console";

// POST /api/hospitals/:id/ads
export const uploadAd = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const file = req.file; // uploaded image
    const { title, startDate, endDate } = req.body;
    console.log(req.body);

    // Find hospital
    const hospital = await hospitalModel.findById(id);
    if (!hospital) {
      throw new createError.NotFound("Hospital not found!");
    }

    if (!file) {
      throw new createError.BadRequest("No file uploaded!");
    }

    const normalizedPath = path.normalize(file.path);
    console.log("Uploading file at path:", normalizedPath);

    const result = await cloudinary.uploader.upload(normalizedPath);

    console.log("Cloudinary upload result:", result);

    // Add new ad to hospital.ads
    const newAd = {
      imageUrl: result.secure_url as string,
      public_id: result.public_id as string,
      title: req.body.title || "",
      startDate: req.body.startDate || Date.now(),
      endDate: req.body.endDate || null,
      isActive: true,
    };

    hospital.ads.push(newAd);
    await hospital.save();

    return res.status(201).json(newAd);
  } catch (error) {
    console.error("Error uploading ad:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/hospitals/:hospitalId/ads/:adId
export const deleteAd = async (req: Request, res: Response) => {
  const { hospitalId, adId } = req.params;
  const hospital = await hospitalModel.findById(hospitalId);
  if (!hospital) throw new createError.NotFound("Hospital not found!");

  const ad = hospital.ads.find((ad) => ad._id?.toString() === adId.toString());
  if (!ad) throw new createError.NotFound("Ad not found!");

  // Delete image from Cloudinary
  if (ad.public_id) await cloudinary.uploader.destroy(ad.public_id);

  await ad.deleteOne();
  await hospital.save();

  return res.status(200).json({ message: "Ad deleted successfully" });
};

// In your controller
export const updateAd = async (req: Request, res: Response) => {
  const { hospitalId, adId } = req.params;

  // At this point, Multer must already have processed the request
  const file = req.file; // uploaded image
  const { title, startDate, endDate, isActive } = req.body; // text fields

  const hospital = await hospitalModel.findById(hospitalId);
  if (!hospital) throw new createError.NotFound("Hospital not found!");

  const ad = hospital.ads.id(adId);
  if (!ad) throw new createError.NotFound("Ad not found!");

  if (title) ad.title = title;
  if (startDate) ad.startDate = startDate;
  if (endDate) ad.endDate = endDate;
  if (isActive !== undefined) ad.isActive = isActive === "true";

  if (file) {
    if (ad.public_id) await cloudinary.uploader.destroy(ad.public_id);
    const result = await cloudinary.uploader.upload(path.normalize(file.path), {
      folder: `hospital_ads/${hospitalId}`,
    });
    ad.imageUrl = result.secure_url;
    ad.public_id = result.public_id;
  }

  await hospital.save();
  return res.status(200).json(ad);
};

// GET /api/ads/nearby?lat=...&lng=...

export const GetAds = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    console.log("Received lat and lng:", lat, lng);
    

    const nearbyAds: any[] = [];

    if (!lat || !lng) {
      const hospitals = await hospitalModel.find();
      hospitals.forEach((hospital) => {
        hospital.ads.forEach((ad) => {
          if (ad.isActive) nearbyAds.push(ad);
        });
      });
      return res
        .status(200)
        .json({ data: nearbyAds, message: "All active ads" });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radiusInMeters = 50000; // 50km


    // Fetch hospitals that have ads
    const hospitals = await hospitalModel.find({
      ads: { $exists: true, $not: { $size: 0 } },
    });

    // Filter ads manually based on distance

    const R = 6371; // km
    hospitals.forEach((hospital) => {
      const dLat = ((hospital.latitude! - userLat) * Math.PI) / 180;
      const dLon = ((hospital.longitude! - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((hospital.latitude! * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c * 1000; // meters

      if (distance <= radiusInMeters) {
        hospital.ads.forEach((ad) => {
          if (ad.isActive) nearbyAds.push(ad);
        });
      }
    });

    res.json(nearbyAds);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};


// GET /api/hospitals/:id/ads - Get all ads for a specific hospital
export const GetAdsHospital = async (req: Request, res: Response) => {
  const hospitalId = req.params.id;
  const hospital = await hospitalModel.findById(hospitalId);
  if (!hospital) {
    return res.status(404).json({ message: "Hospital not found" });
  }

  return res.status(200).json(hospital.ads);
}