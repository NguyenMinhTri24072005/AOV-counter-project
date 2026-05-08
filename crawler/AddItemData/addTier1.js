const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Item
const Item = require('../../backend/src/models/Item');

// Danh sách trang bị Cấp 1
const tier1Items = [
    "Nguyên tố bảo thạch", "Giày thép", "Dây chuyền hồng ngọc", "Bùa sức mạnh", 
    "Găng giác đấu", "Giáp nhẹ", "Nhẫn hồng ngọc", "Nhẫn ma pháp", "Sách cổ", 
    "Dây chuyền ma thuật", "Nhẫn Lapis", "Sách phép", "Rựa thợ săn", "Kiếm dài", 
    "Chùy xích", "Chùy máu", "Găng tay", "Dao găm", "Kiếm ngắn"
];

const updateTier = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Cập nhật tier cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật Cấp 1 (Tier 1) cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of tier1Items) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { tier: 1 } // Cập nhật trường tier thành 1
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật Cấp 1 cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Cấp 1 từ trước): ${itemName}`);
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