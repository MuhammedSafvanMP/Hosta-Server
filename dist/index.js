"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./Config/.env" });
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./Config/passport");
const AuthRoutes_1 = __importDefault(require("./Routes/AuthRoutes"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dbConnection_1 = __importDefault(require("./Config/dbConnection"));
const UserRoutes_1 = __importDefault(require("./Routes/UserRoutes"));
const CommenRoute_1 = __importDefault(require("./Routes/CommenRoute"));
const ErrorHandler_1 = __importDefault(require("./Middlewares/ErrorHandler"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const HospitalRoute_1 = __importDefault(require("./Routes/HospitalRoute"));
const AmbulanceRoutes_1 = __importDefault(require("./Routes/AmbulanceRoutes"));
const BloodDonarRoutes_1 = __importDefault(require("./Routes/BloodDonarRoutes"));
const MedicineRemainderRoutes_1 = __importDefault(require("./Routes/MedicineRemainderRoutes"));
const LabRoutes_1 = __importDefault(require("./Routes/LabRoutes"));
const CarouselRoutes_1 = __importDefault(require("./Routes/CarouselRoutes"));
const NotficationRoutes_1 = __importDefault(require("./Routes/NotficationRoutes"));
const socket_1 = require("./sockets/socket");
// ✅ Correct import
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
// ✅ Create HTTP server for Socket.IO
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
app.use((0, cors_1.default)({
    origin: [
        process.env.UserSide_URL,
        process.env.AmbulanceSide_URL,
        process.env.HospitalSide_URL,
        process.env.AdminSide_URL,
        "http://127.0.0.1:5500",
        "https://hosta-hospitals.vercel.app",
        "http://localhost:5173",
    ],
    credentials: true,
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/auth", AuthRoutes_1.default);
app.get("/", (req, res) => {
    res.redirect("/auth/google");
});
app.get("/profile", (req, res) => {
    res.send(`<pre>${JSON.stringify(req.user, null, 2)}</pre>`);
});
app.use("/api", UserRoutes_1.default);
app.use("/api", CommenRoute_1.default);
app.use("/api", HospitalRoute_1.default);
app.use("/api", AmbulanceRoutes_1.default);
app.use("/api", BloodDonarRoutes_1.default);
app.use("/api", MedicineRemainderRoutes_1.default);
app.use("/api", LabRoutes_1.default);
app.use("/api", CarouselRoutes_1.default);
app.use("/api", NotficationRoutes_1.default);
(0, dbConnection_1.default)();
app.use(ErrorHandler_1.default);
// ✅ Listen using `server` instead of `app`
const PORT = process.env.Port || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map