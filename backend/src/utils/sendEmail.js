const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'AOV Counter System <Arenaofvalorcounterpage@gmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Đã gửi mail thành công tới: ", options.email);
        
    } catch (error) {
        // 🌟 THÊM DÒNG NÀY ĐỂ XEM LỖI THẬT SỰ LÀ GÌ:
        console.error("❌ CHI TIẾT LỖI TỪ NODEMAILER:", error.message);
        
        console.log("⚠️ CHƯA CẤU HÌNH EMAIL. HỆ THỐNG ĐANG IN MÃ OTP RA CONSOLE ĐỂ TEST:");
        console.log("=========================================");
        console.log(`Gửi tới: ${options.email}`);
        console.log(`Nội dung:\n${options.message}`);
        console.log("=========================================");
    }
};

module.exports = sendEmail;