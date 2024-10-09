// controllers/messageController.js
const fs = require("fs");
const { getSocket, getIsConnected } = require("../services/whatsappService");

async function sendMessage(req, res) {
  const { phoneNumber, text } = req.body; // Destructure request body
  const mediaFiles = req.files; // Get uploaded files from the request

  const sock = getSocket(); // Get the WhatsApp socket
  const isConnected = getIsConnected(); // Get connection status

  if (!sock || !isConnected) {
    return res.status(400).json({ error: "WhatsApp connection is not established." });
  }

  try {
    const formattedNumber = `${phoneNumber}@s.whatsapp.net`; // Format phone number

    // Prepare media messages
    const mediaMessages = mediaFiles.map((file) => {
      const mediaData = fs.readFileSync(file.path); // Read the uploaded file
      const mediaType = file.mimetype; // Get the media type from the file
      const originalFileName = file.originalname; // Get the original filename

      // Create a media message based on the type
      const mediaMessage = {
        caption: text || '', // Include caption if text is provided
      };

      // Handle different media types
      if (mediaType.startsWith("video/")) {
        mediaMessage.video = { url: file.path, filename: originalFileName }; // For videos
      } else if (mediaType.startsWith("image/")) {
        mediaMessage.image = { url: file.path, filename: originalFileName }; // For images
      } else if (mediaType.startsWith("audio/")) {
        mediaMessage.audio = { url: file.path, filename: originalFileName }; // For audio
      } else if (mediaType.startsWith("application/")) {
        // Handle generic file types (e.g., documents, zip files)
        mediaMessage.document = { url: file.path, filename: originalFileName }; // For documents
      } else {
        throw new Error("Unsupported media type");
      }

      return { mediaData, mediaMessage, mediaType, originalFileName }; // Include originalFileName in return object
    });

    // Send media messages if mediaFiles are provided
    if (mediaFiles && mediaFiles.length > 0) {
      await Promise.all(
        mediaMessages.map(async ({ mediaData, mediaMessage, mediaType, originalFileName }) => {
          await sock.sendMessage(formattedNumber, {
            ...mediaMessage,
            media: {
              url: `data:${mediaMessage.video ? mediaType : mediaMessage.image ? mediaMessage.image.mimetype : mediaMessage.document.mimetype};base64,${mediaData.toString('base64')}`,
              filename: originalFileName // Set the original filename here
            },
          });
        })
      );
    } else {
      // Send only text message
      await sock.sendMessage(formattedNumber, {
        text: text || '', // Include text if provided
      });
    }

    // Clean up uploaded files after sending (optional)
    mediaFiles.forEach(file => fs.unlinkSync(file.path));

    res.status(200).json({ message: `Message sent to ${phoneNumber}` });
  } catch (error) {
    console.error("Failed to send message:", error.message);
    res.status(500).json({ error: "Failed to send message" });
  }
}

module.exports = {
  sendMessage,
};
