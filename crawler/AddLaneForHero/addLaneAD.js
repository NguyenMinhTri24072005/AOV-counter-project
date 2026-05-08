// Lùi 2 cấp để gọi đúng thư viện và file cấu hình từ backend
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Heros
const Hero = require('../../backend/src/models/Heros'); 

// Danh sách các tướng đi đường AD (Xạ Thủ - Đường Rồng)
const adLaneHeroes = [
    "Capheny", "Celica", "Eland'orr", "Elsu", "Erin", "Fennik", 
    "Flowborn", "Hayate", "Laville", "Lindis", "Moren", "Slimz", 
    "Stuart", "Teeri", "Tel’Annas", "Thorne", "Valhein", "Violet", 
    "Wisp", "Yorn"
];

const updateLanes = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Quét và thêm lane "AD" cho từng tướng
        console.log("⏳ Bắt đầu cập nhật vị trí Đường AD (Xạ thủ) cho các tướng...");
        let updatedCount = 0;

        for (const heroName of adLaneHeroes) {
            const result = await Hero.updateOne(
                { name: heroName },
                { $addToSet: { lane: "AD" } }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã thêm lane 'AD' cho: ${heroName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã có lane AD từ trước): ${heroName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy tướng trong CSDL: ${heroName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật thành công vị trí đi AD cho ${updatedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateLanes();