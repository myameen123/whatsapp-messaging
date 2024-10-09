// services/whatsappService.js
const { DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const qrcode = require("qrcode-terminal");

let sock; // Store the WhatsApp socket globally
let isConnected = false; // Flag to check connection status

async function connectionLogic() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    syncFullHistory: false, // Disable full history sync to avoid being stuck
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update || {};

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("Scan the QR code to connect to WhatsApp.");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      isConnected = false; // Mark as disconnected

      if (shouldReconnect) {
        console.log("Connection closed, reconnecting...");
        await connectionLogic(); // Re-establish the connection
      } else {
        console.log("Logged out from WhatsApp.");
      }
    } else if (connection === "open") {
      console.log("WhatsApp connected!");
      isConnected = true; // Mark as connected
    }
  });

  sock.ev.on("creds.update", saveCreds); // Save session credentials
}

// Endpoint to establish WhatsApp connection
const connectWhatsApp =  async (req, res) => {
  try {
    if (isConnected) {
      return res.status(200).json({ message: "WhatsApp is already connected." });
    }

    await connectionLogic();
    res.status(200).json({ message: "WhatsApp connection initiated." });
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


// let sock; // Store the WhatsApp socket globally
// let isConnected = false; // Flag to check connection status

// async function connectWhatsApp(req, res) {
//   try {
//     if (isConnected) {
//       return res.status(200).json({ message: "WhatsApp is already connected." });
//     }

//     const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

//     sock = makeWASocket({
//       printQRInTerminal: true,
//       auth: state,
//       syncFullHistory: false,
//     });

//     sock.ev.on("connection.update", async (update) => {
//       const { connection, lastDisconnect, qr } = update || {};

//       if (qr) {
//         qrcode.generate(qr, { small: true });
//         console.log("Scan the QR code to connect to WhatsApp.");
//       }

//       if (connection === "close") {
//         isConnected = false; // Mark as disconnected

//         const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

//         if (shouldReconnect) {
//           console.log("Connection closed, attempting to reconnect...");
//           // Here you might consider a delay before reconnecting
//           // setTimeout(() => connectWhatsApp(req, res), 5000); // Example of delayed reconnect
//         } else {
//           console.log("Logged out from WhatsApp.");
//           res.status(500).json({ error: "Logged out from WhatsApp." });
//         }
//       } else if (connection === "open") {
//         console.log("WhatsApp connected!");
//         isConnected = true; // Mark as connected
//         res.status(200).json({ message: "WhatsApp connected successfully." });
//       }
//     });

//     sock.ev.on("creds.update", saveCreds); // Save session credentials

//   } catch (error) {
//     console.error("Error connecting to WhatsApp:", error);
//     res.status(500).json({ error: "Failed to connect to WhatsApp" });
//   }
// }

// module.exports = {
//   connectWhatsApp,
//   getSocket: () => sock,
//   getIsConnected: () => isConnected,
// };
