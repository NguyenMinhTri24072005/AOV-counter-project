const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Item
const Item = require('../../backend/src/models/Item');

// Danh sách trang bị Cấp 2
const tier2Items = [
    "Huyết ảnh đao", "Cầu chiêm tinh", "Huyết cung", "Đại địa thần tốc", 
    "Hoả hệ bảo thạch", "Thổ hệ bảo thạch", "Giày Hermes", "Giày du mục", 
    "Giày phù thủy", "Giày thuật sĩ", "Giày kiên cường", "Giày hộ vệ", 
    "Giáp cuồng nộ", "Hercule thịnh nộ", "Giáp thống khổ", "Giáp hiệp sĩ", 
    "Găng bạch kim", "Đai kháng phép", "Tim Incubus", "Giáp chân", 
    "Sách Truy Hồn", "Dây chuyền lục bảo", "Trượng hỗn mang", "Huyết trượng", 
    "Vòng đức hạnh", "Phượng hoàng lệ", "Mặt nạ ma quái", "Gươm nguyên tố", 
    "Sớ ma thuật", "Cung Gió Lốc", "Đao truy kích", "Rìu Gnoll", "Gươm hiến tế", 
    "Đao Truy Hồn", "Liềm Đoạt Mệnh", "Gươm Uriel", "Phi tiêu", "Thương đấu sĩ", 
    "Song đao", "Chùy cổ"
];

const updateTier = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Cập nhật tier cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật Cấp 2 (Tier 2) cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of tier2Items) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { tier: 2 } // Cập nhật trường tier thành 2
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật Cấp 2 cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Cấp 2 từ trước): ${itemName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy trang bị trong CSDL: ${itemName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật Cấp độ cho ${updatedCount} trang bị.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateTier();