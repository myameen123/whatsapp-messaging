const {
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const qrcode = require("qrcode"); // Import the qrcode library

let sock; // Store the WhatsApp socket globally
let isConnected = false; // Flag to check connection status

async function connectionLogic(res) {
  console.log("inside connectLogic");
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  console.log("after useMultiFileFunc");

  sock = makeWASocket({
    printQRInTerminal: false, // Do not print the QR in terminal
    auth: state,
    syncFullHistory: false, // Disable full history sync to avoid being stuck
  });

  sock.ev.on("connection.update", async (update) => {
    console.log("sock.ev..");
    const { connection, lastDisconnect, qr } = update || {};

    if (qr) {
      // Generate QR code as base64 image and send it in the response
      const qrCodeImage = await qrcode.toDataURL(qr); // Convert QR to base64 image
      return res
        .status(200)
        .json({ message: "Scan the QR code to connect", qrCodeImage });
    }

    if (connection === "close") {
      console.log("if conn is close..");
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      isConnected = false; // Mark as disconnected

      if (shouldReconnect) {
        console.log("Connection closed, reconnecting...");
        await connectionLogic(res); // Re-establish the connection
      } else {
        console.log("Logged out from WhatsApp.");
      }
    } else if (connection === "open") {
      console.log("WhatsApp connected!");
      isConnected = true; // Mark as connected
      res.status(200).json({ message: "WhatsApp connected successfully." });
    }
  });

  sock.ev.on("creds.update", saveCreds); // Save session credentials
}

// Endpoint to establish WhatsApp connection
const connectWhatsApp = async (req, res) => {
  try {
    console.log("just inside try");
    if (isConnected) {
      return res
        .status(200)
        .json({ message: "WhatsApp is already connected." });
    }

    await connectionLogic(res);
    console.log("after connectLogic");
  } catch (error) {
    console.error("Error connecting to WhatsApp:", error);
    res.status(500).json({ error: "Failed to connect to WhatsApp" });
  }
};

module.exports = {
  connectWhatsApp,
  getSocket: () => sock,
  getIsConnected: () => isConnected,
};
