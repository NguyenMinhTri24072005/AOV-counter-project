const mongoose = require('../../backend/node_modules/mongoose/types');
require('dotenv').config({ path: '../backend/.env' });

// Trỏ đúng vào file models/Heros.js và models/Role.js trong backend
const Hero = require('../../backend/src/models/Heros');
const Role = require('../../backend/src/models/Role');

// Danh sách các tướng Xạ thủ
const marksmanHeroes = [
    "Flowborn", "Erin", "Teeri", "Bright", "Thorne", "Laville",
    "Eland’orr", "Celica", "Capheny", "Hayate", "Elsu", "Wisp",
    "Lindis", "Moren", "Tel’Annas", "Stuart", "Slimz", "Fennik",
    "Yorn", "Violet", "Valhein"
];

const updateRoles = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Role "Xạ thủ"
        let xaThuRole = await Role.findOne({ name: "Xạ thủ" });

        if (!xaThuRole) {
            console.log("⚠️ Không tìm thấy Role 'Xạ thủ'. Đang tạo mới...");
            xaThuRole = new Role({
                name: "Xạ thủ",
                description: "Tướng gây sát thương vật lý chủ lực từ xa, có khả năng bắn phá giao tranh và công trình cực tốt nhưng sinh mệnh rất thấp."
            });
            await xaThuRole.save();
        }

        const roleId = xaThuRole._id;
        console.log(`🎯 ID của role 'Xạ thủ' là: ${roleId}`);

        // 3. Quét và thêm role cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vai trò cho các tướng...");
        let updatedCount = 0;

        for (const heroName of marksmanHeroes) {
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { roles: roleId } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm 'Xạ thủ' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Xạ thủ từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật vai trò cho ${updatedCount} tướng Xạ thủ.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateRoles();