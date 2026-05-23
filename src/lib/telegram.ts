export async function sendTelegramDocument(pdfBuffer: Buffer, caption: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsEnv = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatIdsEnv) {
    console.warn("Telegram bot token or chat ID not set. Skipping Telegram notification.");
    return;
  }

  // Allow multiple chat IDs separated by commas
  const chatIds = chatIdsEnv.split(',').map(id => id.trim()).filter(id => id.length > 0);

  // Create a Blob from the Buffer
  const pdfBlob = new Blob([pdfBuffer as unknown as BlobPart], { type: "application/pdf" });

  try {
    await Promise.all(chatIds.map(async (chatId) => {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("caption", caption);
      formData.append("document", pdfBlob, "SafeCheck_Report.pdf");

      const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to send to Telegram chat ${chatId}:`, errorText);
      } else {
        console.log(`Successfully sent report to Telegram chat ${chatId}.`);
      }
    }));
  } catch (error) {
    console.error("Error communicating with Telegram API:", error);
  }
}
