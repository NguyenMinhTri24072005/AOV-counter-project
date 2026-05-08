const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// SỬA LẠI ĐƯỜNG DẪN IMPORT MODEL CHO CHÍNH XÁC:
// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role'); // Sửa từ Roles thành Role

// Danh sách các tướng Đấu sĩ
const fighterHeroes = [
    "Edras", "Biron", "Charlotte", "Tachi", "Qi", "Bijan", "Yan", "Dextra",
    "Allain", "Ata", "Volkath", "Yena", "Errol", "Veres", "Florentino",
    "Richter", "Amily", "Roxie", "Rourke", "Omen", "Kil’Groth", "Wonder Woman",
    "Superman", "Astrid", "Ryoma", "Arduin", "Zuka", "Skud", "Arthur",
    "Maloch", "Ormarr", "Zephys", "Triệu Vân", "Lữ Bố", "Airi", "Taara", "Billow",
    "Butterfly", "Heino", "Wiro", "Gildur", "Bolt Baron"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Đấu sĩ"
        let dauSiRole = await Role.findOne({ name: "Đấu sĩ" });

        if (!dauSiRole) {
            console.log("⚠️ Không tìm thấy Role 'Đấu sĩ'. Đang tạo mới...");
            dauSiRole = new Role({
                name: "Đấu sĩ",
                description: "Tướng cận chiến có khả năng chống chịu và gây sát thương tốt."
            });
            await dauSiRole.save();
        }

        const roleId = dauSiRole._id;
        console.log(`🎯 ID của role 'Đấu sĩ' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of fighterHeroes) {
            // Lệnh $addToSet tự động kiểm tra, nếu roleId chưa có trong mảng roles thì mới thêm vào
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Đấu sĩ' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Đấu sĩ từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();