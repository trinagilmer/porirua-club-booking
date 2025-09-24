const express = require("express");
const app = express();

// --- Middleware ---
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.json());

// --- Import routes ---
const bookingRoutes = require("./routes/booking");
const functionRoutes = require("./routes/functions");
const calendarRoutes = require("./routes/calendar");

// --- Register routes ---
app.use("/api/bookings", bookingRoutes);
app.use("/api/functions", functionRoutes);
app.use("/api/functions/calendar", calendarRoutes);

// --- Start server ---
app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
