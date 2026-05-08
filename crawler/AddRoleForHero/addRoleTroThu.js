const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role');

// Danh sách các tướng Trợ thủ
const supportHeroes = [
    "Dyadia", "Dolia", "Ming", "Aya", "Rouie", "Krizzix",
    "Zip", "Sephera", "Annette", "TeeMee", "Xeniel",
    "Helen", "Grakk", "Gildur", "Alice", "Chaugnar", "Toro",
    "Mina", "Lumburr", "Baldum", "Arum", "Omega", "Cresht", "Ishar"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Trợ thủ"
        let troThuRole = await Role.findOne({ name: "Trợ thủ" });

        if (!troThuRole) {
            console.log("⚠️ Không tìm thấy Role 'Trợ thủ'. Đang tạo mới...");
            troThuRole = new Role({
                name: "Trợ thủ",
                description: "Tướng chuyên bảo vệ chủ lực, cung cấp tầm nhìn, hồi máu, buff giáp hoặc tạo hiệu ứng khống chế."
            });
            await troThuRole.save();
        }

        const roleId = troThuRole._id;
        console.log(`🎯 ID của role 'Trợ thủ' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of supportHeroes) {
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Trợ thủ' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Trợ thủ từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng Trợ thủ.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();