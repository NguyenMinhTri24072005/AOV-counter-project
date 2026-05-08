// Lùi 2 cấp để gọi đúng thư viện và file cấu hình từ backend
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Heros
const Hero = require('../../backend/src/models/Heros'); 

// Danh sách các tướng đi Trợ thủ (Support)
const supportLaneHeroes = [
    "Alice", "Annette", "Arum", "Ata", "Aya", "Baldum", "Chaugnar", 
    "Cresht", "Dolia", "Dyadia", "Gildur", "Grakk", "Helen", "Ishar", 
    "Krizzix", "Lumburr", "Mina", "Ming", "Omega", "Omen", "Ormarr", 
    "Richter", "Rouie", "Sephera", "TeeMee", "Thane", "Toro", "Veres", 
    "Wiro", "Xeniel", "Y’bneth", "Zip"
];

const updateLanes = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Quét và thêm lane "Support" cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vị trí Trợ thủ (Support) cho các tướng...");
        let updatedCount = 0;

        for (const heroName of supportLaneHeroes) {
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { lane: "Support" } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm lane 'Support' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã có lane Support từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật thành công vị trí đi Support cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateLanes();