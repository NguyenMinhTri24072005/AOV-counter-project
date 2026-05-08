const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role');

// Danh sách các tướng Đỡ đòn
const tankHeroes = [
    "Wiro", "Y’bneth", "Baldum", "Arum", "Max", "Cresht",
    "Lumburr", "Grakk", "Taara", "Toro", "Omega", "Mina", "Thane",
    "Skud", "Maloch", "Taara", "Biron", "Arduin", "Omarr", "Chaugnar", "Xeniel", "Ata",
    "TeeMee", "Dextra", "Roxie"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Đỡ đòn"
        let doDonRole = await Role.findOne({ name: "Đỡ đòn" });

        if (!doDonRole) {
            console.log("⚠️ Không tìm thấy Role 'Đỡ đòn'. Đang tạo mới...");
            doDonRole = new Role({
                name: "Đỡ đòn",
                description: "Tướng có sinh mệnh và giáp vượt trội, chuyên gia gánh chịu sát thương và bảo vệ đồng đội."
            });
            await doDonRole.save();
        }

        const roleId = doDonRole._id;
        console.log(`🎯 ID của role 'Đỡ đòn' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of tankHeroes) {
            // Lệnh $addToSet tự động kiểm tra, nếu roleId chưa có trong mảng roles thì mới thêm vào
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Đỡ đòn' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Đỡ đòn từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng Đỡ đòn.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();