const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role');

// Danh sách các tướng Pháp sư
const mageHeroes = [
    "Flowborn AP", "Goverra", "Heino", "Bolt Baron", "Dirak", "Bonnie", "Yue",
    "Iggy", "Lorion", "Zata", "Ishar", "D’Arcy", "Marja", "The Flash", "Liliana",
    "Tulen", "Zill", "Ignis", "Lauriel", "Raz", "Preyta", "Ilumia", "Jinna",
    "Natalya", "Aleister", "Gildur", "Azzen’Ka", "Điêu Thuyền", "Kahlii", "Mganga",
    "Krixi", "Veera", "Annette", "Sephera", "Dyadia"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Pháp sư"
        let phapSuRole = await Role.findOne({ name: "Pháp sư" });

        if (!phapSuRole) {
            console.log("⚠️ Không tìm thấy Role 'Pháp sư'. Đang tạo mới...");
            phapSuRole = new Role({
                name: "Pháp sư",
                description: "Tướng sử dụng sức mạnh phép thuật, cấu rỉa hoặc dồn sát thương cực mạnh từ xa."
            });
            await phapSuRole.save();
        }

        const roleId = phapSuRole._id;
        console.log(`🎯 ID của role 'Pháp sư' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of mageHeroes) {
            // Lệnh $addToSet tự động kiểm tra, nếu roleId chưa có trong mảng roles thì mới thêm vào
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Pháp sư' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Pháp sư từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng Pháp sư.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();