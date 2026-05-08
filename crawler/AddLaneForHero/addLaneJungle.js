// Lùi 2 cấp để gọi đúng thư viện và file cấu hình từ backend
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Heros
const Hero = require('../../backend/src/models/Heros'); 

// Danh sách các tướng đi Rừng (Jungle)
const jungleHeroes = [
    "Airi", "Amily", "Aoi", "Astrid", "Bijan", "Billow", "Biron", "Bright", 
    "Butterfly", "Dirak", "Edras", "Eland'orr", "Enzo", "Fennik", "Florentino", 
    "Goverra", "Kaine", "Keera", "Kriknak", "Lindis", "Murad", "Nakroth", 
    "Ngộ Không", "Paine", "Quillen", "Rourke", "Ryoma", "Sinestrea", "Skud", 
    "Tachi", "The Flash", "Thorne", "Triệu Vân", "Veres", "Volkath", 
    "Wonder Woman", "Xeniel", "Yan", "Yena", "Zephys", "Zill", "Zuka"
];

const updateLanes = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Quét và thêm lane "Jungle" cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vị trí Đường Rừng (Jungle) cho các tướng...");
        let updatedCount = 0;

        for (const heroName of jungleHeroes) {
            // Lệnh $addToSet đảm bảo không bị trùng lặp lane
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { lane: "Jungle" } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm lane 'Jungle' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã có lane Jungle từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật thành công vị trí đi Rừng cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateLanes();