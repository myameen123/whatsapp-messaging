// app.js
const express = require("express");
const { connectWhatsApp } = require("./services/whatsappService");
const messageRouter = require("./routers/messageRouter");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  console.log("logging....");
  res.status(200).json({ message: "successfully connected" });
});
app.use("/api/messages", messageRouter);
app.get("/api/connect", connectWhatsApp); // Connect to WhatsApp

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
