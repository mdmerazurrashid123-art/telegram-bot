
const http = require("http");

http.createServer((req, res) => {
  res.write("Bot is alive");
  res.end();
}).listen(3000);

// নিচে তোমার bot code

const TelegramBot = require("node-telegram-bot-api");

const token = "8725404047:AAGAE5rWF5q7BM38u_1pNRJAHM9OoqczKv0"; // 🔴 নিজের token বসাও

// 🔴 Main Group ID
const MAIN_GROUP_ID = -1003983935352;

// 🔵 Log Channel ID
const LOG_CHANNEL_ID = -1003907115988;

// 👑 Owner ID
const OWNER_ID = 7644710152;

const bot = new TelegramBot(token, { polling: true });

console.log("Bot Running...");

// ===============================
// 🧠 Storage
// ===============================
let users = new Set();
let groups = new Set();
let blockedUsers = new Set();

// ===============================
// ▶️ START COMMAND (7 sec delete)
// ===============================
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;

    const sentMsg = await bot.sendMessage(
        chatId,
        `আসসালামুয়ালাইকুম ${name} 😊

🤖 এই বটটি একটি Security & Monitoring Bot

🔐 Features:
✔ সকল মেসেজ লগ করা হয়
✔ লিংক / ইউজারনেম auto delete
✔ ছবি / ভিডিও মনিটরিং
✔ Admin control system

📌 আপনি এই বট ব্যবহার করছেন।

আল্লাহ হাফেজ 🌙`
    );

    setTimeout(() => {
        bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {});
    }, 7000);
});

// ===============================
// 📌 Track Users & Groups
// ===============================
bot.on("message", (msg) => {
    if (msg.chat.type === "private") {
        users.add(msg.from.id);
    } else if (msg.chat.type.includes("group")) {
        groups.add(msg.chat.id);
    }
});

// ===============================
// 🚫 Block Check
// ===============================
bot.on("message", (msg) => {
    if (blockedUsers.has(msg.from.id)) {
        bot.sendMessage(msg.chat.id, "❌ আপনি এই বট ব্যবহার করতে পারবেন না");
        return;
    }
});

// ===============================
// 📌 Message Logger + Media Forward
// ===============================
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    if (chatId !== MAIN_GROUP_ID) return;

    const username = user.username ? `@${user.username}` : user.first_name;
    const userInfo = `👤 User: ${username}\n🆔 ID: ${user.id}`;

    try {
        // ✅ TEXT
        if (msg.text) {
            await bot.sendMessage(LOG_CHANNEL_ID, `${userInfo}\n\n${msg.text}`);
        }

        // ✅ PHOTO
        else if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;

            await bot.sendPhoto(LOG_CHANNEL_ID, fileId, {
                caption: userInfo
            });
        }

        // ✅ VIDEO
        else if (msg.video) {
            await bot.sendVideo(LOG_CHANNEL_ID, msg.video.file_id, {
                caption: userInfo
            });
        }

        // ✅ DOCUMENT
        else if (msg.document) {
            await bot.sendDocument(LOG_CHANNEL_ID, msg.document.file_id, {
                caption: userInfo
            });
        }

    } catch (err) {
        console.log("Log Error:", err.message);
    }

    const text = msg.text || "";

    const hasLink = /https?:\/\/|www\.|t\.me\//i.test(text);
 

    // =========================
    // ❌ Delete after 7 sec
    // =========================
    if (hasLink || msg.photo || msg.video) {
        setTimeout(async () => {
            try {
                await bot.deleteMessage(chatId, msg.message_id);

                const warn = await bot.sendMessage(
                    chatId,
                    "আসসালামুয়ালাইকুম,\n\nভাই আমাদের চ্যানেলে লিংক এবং ইউজার নেম দেওয়া নিষেধ, তবে চিন্তার কোনো কারন নেই লিংকটা আমি এডমিন এর কাছে পাঠিয়ে দিয়েছি। তিনি আপনার লিংক পরিক্ষা করবেন যদি ভালো হয় তাহলে সুযোগ পাবেন।\n\nআল্লাহ হাফেজ।"
                );

                setTimeout(() => {
                    bot.deleteMessage(chatId, warn.message_id);
                }, 7000);

            } catch (e) {
                console.log(e.message);
            }
        }, 7000);
    }
});

// ===============================
// 👋 Welcome System (26 sec delete)
// ===============================
bot.on("new_chat_members", (msg) => {
    const chatId = msg.chat.id;

    msg.new_chat_members.forEach(async (user) => {
        const mention = user.username ? `@${user.username}` : user.first_name;

        const welcome = await bot.sendMessage(
            chatId,
            `আসসালামুয়ালাইকুম ${mention}

BNCT_1360 টিমের পক্ষ থেকে আপনাকে স্বাগতম। মনদিয়ে কাজ করবেন। আমাদের সাথে থাকলে অনেক দূর যেতে পারবেন ইনশাল্লাহ।

আল্লাহ হাফেজ।`
        );

        setTimeout(() => {
            bot.deleteMessage(chatId, welcome.message_id);
        }, 26000);
    });
});

// ===============================
// 📢 Broadcast
// ===============================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    if (msg.from.id !== OWNER_ID) return;

    const text = match[1];

    users.forEach((id) => {
        if (!blockedUsers.has(id)) {
            bot.sendMessage(id, `📢 Announcement:\n\n${text}`).catch(() => {});
        }
    });

    groups.forEach((id) => {
        bot.sendMessage(id, `📢 Announcement:\n\n${text}`).catch(() => {});
    });

    bot.sendMessage(msg.chat.id, "✅ Broadcast Done");
});

// ===============================
// 👥 User List
// ===============================
bot.onText(/\/users/, (msg) => {
    if (msg.from.id !== OWNER_ID) return;

    let text = "👥 Users:\n\n";
    users.forEach((id) => {
        text += `${id}\n`;
    });

    bot.sendMessage(msg.chat.id, text);
});

// ===============================
// 🚫 Block
// ===============================
bot.onText(/\/block (\d+)/, (msg, match) => {
    if (msg.from.id !== OWNER_ID) return;

    const id = parseInt(match[1]);
    blockedUsers.add(id);

    bot.sendMessage(msg.chat.id, `🚫 Blocked ${id}`);
});

// ===============================
// ✅ Unblock
// ===============================
bot.onText(/\/unblock (\d+)/, (msg, match) => {
    if (msg.from.id !== OWNER_ID) return;

    const id = parseInt(match[1]);
    blockedUsers.delete(id);

    bot.sendMessage(msg.chat.id, `✅ Unblocked ${id}`);
});
