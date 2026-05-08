// Lùi 2 cấp để gọi đúng thư viện và file cấu hình từ backend
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Heros
const Hero = require('../../backend/src/models/Heros'); 

// Danh sách các tướng đi Mid (Đường Giữa)
const midLaneHeroes = [
    "Aleister", "Azzen'Ka", "Bonnie", "D'arcy", "Điêu Thuyền", "Dirak", 
    "Dolia", "Dyadia", "Gildur", "Goverra", "Heino", "Iggy", "Ignis", 
    "Ilumia", "Ishar", "Jinna", "Kahlii", "Krixi", "Lauriel", "Liliana", 
    "Lorion", "Mganga", "Natalya", "Preyta", "Raz", "Sephera", 
    "The Flash", "Tulen", "Veera", "Yue", "Zata"
];

const updateLanes = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Quét và thêm lane "Mid" cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vị trí Đường Giữa (Mid) cho các tướng...");
        let updatedCount = 0;

        for (const heroName of midLaneHeroes) {
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { lane: "Mid" } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm lane 'Mid' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã có lane Mid từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật thành công vị trí đi Mid cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateLanes();