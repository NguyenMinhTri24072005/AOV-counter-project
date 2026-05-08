const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role');

// Danh sách các tướng Sát thủ
const assassinHeroes = [
    "Billow", "Aoi", "Sinestrea", "Paine", "Keera", "Enzo",
    "Quillen", "Murad", "Airi", "Kaine", "Kriknak",
    "Ngộ Không", "Nakroth", "Butterfly", "Ryoma", "Zuka", "Airi", "Qi",
    "Zephys", "Raz", "Astrid", "Zill", "Volkath", "Yan", "Liliana",
    "Zata", "Bright", "The Flash"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Sát thủ"
        let satThuRole = await Role.findOne({ name: "Sát thủ" });

        if (!satThuRole) {
            console.log("⚠️ Không tìm thấy Role 'Sát thủ'. Đang tạo mới...");
            satThuRole = new Role({
                name: "Sát thủ",
                description: "Tướng có độ cơ động cao và khả năng dồn sát thương cực mạnh, chuyên ám sát các mục tiêu yếu máu."
            });
            await satThuRole.save();
        }

        const roleId = satThuRole._id;
        console.log(`🎯 ID của role 'Sát thủ' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of assassinHeroes) {
            // Lệnh $addToSet tự động kiểm tra, nếu roleId chưa có trong mảng roles thì mới thêm vào
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Sát thủ' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Sát thủ từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng Sát thủ.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();