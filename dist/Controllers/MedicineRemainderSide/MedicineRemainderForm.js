"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editMedicineStatus = exports.deleteMedicine = exports.updateMedicine = exports.getSingleMedicine = exports.getMedicines = exports.createMedicine = exports.checkAndRefillMedicines = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const moment_1 = __importDefault(require("moment"));
const MedicineRemainderSchema_1 = __importDefault(require("../../Model/MedicineRemainderSchema"));
// export const checkMissedDoses = async () => {
//   const now = moment();
//   const medicines = await medicineModel.find({ reminder: true });
//   for (const medicine of medicines) {
//     const start = moment(medicine.startDate);
//     const end = medicine.days === "ongoing"
//       ? moment().add(100, "years")
//       : moment(start).add(medicine.days, "days");
//     if (now.isBefore(start) || now.isAfter(end)) continue;
//     let updated = false;
//     for (const dateEntry of medicine.dates) {
//       if (moment(dateEntry.date).format("YYYY-MM-DD") !== now.format("YYYY-MM-DD")) continue;
//       for (const timeEntry of dateEntry.times) {
//         const scheduledTime = moment(timeEntry.time, "h:mm a").set({
//           year: now.year(),
//           month: now.month(),
//           date: now.date(),
//         });
//         const diffInMinutes = now.diff(scheduledTime, "minutes");
//         if (diffInMinutes >= 4 && timeEntry.status === "take") {
//           timeEntry.status = "missed";
//           updated = true;
//         }
//       }
//     }
//     if (updated) {
//       // 🔥 This tells Mongoose to detect changes in the nested `dates` array
//       medicine.markModified('dates');
//       await medicine.save();
//       console.log(`⏰ Missed doses updated for medicine: ${medicine.name}`);
//     }
//   }
//   console.log("✅ Missed medicine check complete");
// };
// refilltracking
const checkAndRefillMedicines = async () => {
    const medicines = await MedicineRemainderSchema_1.default.find({ refillTracking: true });
    for (const medicine of medicines) {
        // Skip if no dates
        if (!medicine.dates || medicine.dates.length === 0)
            continue;
        const lastDateObj = medicine.dates[medicine.dates.length - 1];
        const lastDate = (0, moment_1.default)(lastDateObj.date).startOf("day");
        const today = (0, moment_1.default)().startOf("day");
        // Only proceed if lastDate is before today
        if (lastDate.isBefore(today)) {
            const newStartDate = (0, moment_1.default)().startOf("day"); // e.g., today at 00:00
            const daysToAdd = medicine.days || 7; // default to 7
            const timesTemplate = medicine.dates[0].times.map((t) => t.time); // reuse time(s)
            for (let i = 0; i < daysToAdd; i++) {
                const date = (0, moment_1.default)(newStartDate).add(i, "days").toDate();
                const times = timesTemplate.map((time) => ({
                    time,
                    status: "take",
                }));
                medicine.dates.push({ date, times });
            }
            // Update the startDate to the new refill period
            medicine.startDate = newStartDate.toDate();
            await medicine.save();
            console.log(`Refilled medicine: ${medicine.name}`);
        }
    }
};
exports.checkAndRefillMedicines = checkAndRefillMedicines;
// ✅ Create Medicine Remainder
const createMedicine = async (req, res) => {
    try {
        const data = req.body;
        const { startDate, days, times, often } = data;
        if (!startDate || !days || !Array.isArray(times) || times.length === 0 || !often) {
            return res.status(400).json({ error: "startDate, days, times[], and often are required" });
        }
        // Optional: Validate that times.length matches "often"
        const oftenMap = {
            "once daily": 1,
            "twice daily": 2,
            "three times daily": 3,
            "four times daily": 4
        };
        if (often !== "as needed" && times.length !== oftenMap[often]) {
            return res.status(400).json({ error: `Expected ${oftenMap[often]} time(s) for '${often}', but got ${times.length}` });
        }
        const dateList = [];
        const start = (0, moment_1.default)(startDate);
        for (let i = 0; i < (days === "ongoing" ? 30 : days); i++) {
            const currentDate = (0, moment_1.default)(start).add(i, "days").format("YYYY-MM-DD");
            dateList.push({
                date: currentDate,
                times: times.map((t) => ({
                    time: t,
                    status: "take"
                }))
            });
        }
        const medicine = new MedicineRemainderSchema_1.default({
            ...data,
            dates: dateList
        });
        await medicine.save();
        return res.status(201).json({ message: "Medicine remainder created", medicine });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create medicine remainder" });
    }
};
exports.createMedicine = createMedicine;
// 🔍 Get All Medicines (with pagination & optional search)
const getMedicines = async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const { userId } = req.params;
    const query = {
        name: { $regex: search, $options: "i" },
    };
    const medicines = await MedicineRemainderSchema_1.default.find({
        userId,
        ...query
    })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 });
    const total = await MedicineRemainderSchema_1.default.countDocuments(query);
    return res.status(200).json({
        medicines,
        total,
        page: +page,
        totalPages: Math.ceil(total / +limit),
    });
};
exports.getMedicines = getMedicines;
// 📄 Get Single Medicine by ID
const getSingleMedicine = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new http_errors_1.default.BadRequest("Invalid medicine ID");
    const medicine = await MedicineRemainderSchema_1.default.findOne({ _id: id });
    if (!medicine)
        throw new http_errors_1.default.NotFound("Medicine not found");
    return res.status(200).json(medicine);
};
exports.getSingleMedicine = getSingleMedicine;
// 📝 Update Medicine by ID
const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({ error: "Invalid medicine ID" });
        }
        const { startDate, days, times, often } = updateData;
        // Regenerate dates only if necessary fields are provided
        if (startDate && days && Array.isArray(times) && times.length > 0 && often) {
            const oftenMap = {
                "once daily": 1,
                "twice daily": 2,
                "three times daily": 3,
                "four times daily": 4
            };
            if (often !== "as needed" && times.length !== oftenMap[often]) {
                return res.status(400).json({
                    error: `Expected ${oftenMap[often]} time(s) for '${often}', but got ${times.length}`
                });
            }
            const dateList = [];
            const start = (0, moment_1.default)(startDate);
            for (let i = 0; i < (days === "ongoing" ? 30 : days); i++) {
                const currentDate = (0, moment_1.default)(start).add(i, "days").format("YYYY-MM-DD");
                dateList.push({
                    date: currentDate,
                    times: times.map((t) => ({
                        time: t,
                        status: "take"
                    }))
                });
            }
            updateData.dates = dateList;
        }
        const medicine = await MedicineRemainderSchema_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!medicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }
        return res.status(200).json({ message: "Medicine updated", medicine });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update medicine" });
    }
};
exports.updateMedicine = updateMedicine;
// ❌ Delete Medicine by ID
const deleteMedicine = async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new http_errors_1.default.BadRequest("Invalid medicine ID");
    const medicine = await MedicineRemainderSchema_1.default.findByIdAndDelete(id);
    if (!medicine)
        throw new http_errors_1.default.NotFound("Medicine not found");
    return res.status(200).json({ message: "Medicine deleted successfully" });
};
exports.deleteMedicine = deleteMedicine;
const editMedicineStatus = async (req, res) => {
    const { id } = req.params;
    const { time } = req.body;
    if (!time) {
        return res.status(400).json({ message: "Time is required" });
    }
    const medicine = await MedicineRemainderSchema_1.default.findById(id);
    if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
    }
    const today = (0, moment_1.default)().format("YYYY-MM-DD");
    // Find today's entry
    const todayEntry = medicine.dates.find(dateEntry => (0, moment_1.default)(dateEntry.date).format("YYYY-MM-DD") === today);
    if (!todayEntry) {
        return res.status(404).json({ message: "Today's schedule not found" });
    }
    // Find the time entry
    const timeEntry = todayEntry.times.find(t => t.time === time);
    if (!timeEntry) {
        return res.status(404).json({ message: "Scheduled time not found" });
    }
    // Update status
    timeEntry.status = "taken";
    // Mark nested field as modified
    medicine.markModified('dates');
    await medicine.save();
    return res.status(200).json({
        message: "Medicine status updated to taken",
        updated: timeEntry,
    });
};
exports.editMedicineStatus = editMedicineStatus;
//  export const alaram = async (req: Request, res: Response): Promise<any> => {
//   const now = moment();
//   const medicines = await medicineModel.find({ reminder: true });
//   let anyMissed = false;
//   for (const medicine of medicines) {
//     for (const dateEntry of medicine.dates) {
//       if (moment(dateEntry.date).format("YYYY-MM-DD") !== now.format("YYYY-MM-DD")) continue;
//       for (const timeEntry of dateEntry.times) {
//         const scheduledTime = moment(timeEntry.time, "h:mm a").set({
//           year: now.year(),
//           month: now.month(),
//           date: now.date(),
//         });
//         const diffInMinutes = now.diff(scheduledTime, "minutes");
//         if (diffInMinutes >= 4 && timeEntry.status === "missed") {
//           anyMissed = true;
//           break;
//         }
//       }
//     }
//     if (anyMissed) break;
//   }
//   res.json({ missed: anyMissed });
// };
//# sourceMappingURL=MedicineRemainderForm.js.map