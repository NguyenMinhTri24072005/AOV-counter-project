// Do script nằm trong crawler/AddLaneForHero/ nên cần lùi 2 cấp (../../)
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào file models/Heros.js theo đường dẫn bạn cung cấp
const Hero = require('../../backend/src/models/Heros'); 

// Danh sách các tướng đi đường Top (Đường Tà Thần)
const topLaneHeroes = [
    "Airi", "Allain", "Amily", "Arduin", "Arthur", "Arum", "Astrid", "Ata", 
    "Bijan", "Biron", "Bolt Baron", "Charlotte", "Dextra", "Edras", "Errol", 
    "Florentino", "Heino", "Kil’Groth", "Lữ Bố", "Maloch", "Marja", "Max", 
    "Mina", "Omega", "Omen", "Qi", "Richter", "Roxie", "Ryoma", "Skud", 
    "Superman", "Taara", "Tachi", "Thane", "Toro", "Veres", "Volkath", 
    "Wiro", "Wonder Woman", "Xeniel", "Y’bneth", "Yan", "Yena", "Zephys", "Zuka"
];

const updateLanes = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Quét và thêm lane "Top" cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vị trí Đường Top cho các tướng...");
        let updatedCount = 0;

        for (const heroName of topLaneHeroes) {
            // Lệnh $addToSet tự động kiểm tra, nếu chữ "Top" chưa có trong mảng lane thì mới thêm vào
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { lane: "Top" } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm lane 'Top' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã có lane Top từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật thành công vị trí đi Top cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateLanes();