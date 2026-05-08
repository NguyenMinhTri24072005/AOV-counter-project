const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Tốc chạy (Giày)
const speedItems = [
    "Giày Hermes", "Giày du mục", "Giày phù thủy", 
    "Giày thuật sĩ", "Giày kiên cường", "Giày hộ vệ",
    "Giày thép"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Tốc chạy"
        let tocChayCategory = await ItemCategory.findOne({ name: "Tốc chạy" });

        if (!tocChayCategory) {
            console.log("⚠️ Không tìm thấy Category 'Tốc chạy'. Đang tạo mới...");
            // Trong game thường gọi tab này là "Tốc chạy"
            tocChayCategory = new ItemCategory({ name: "Tốc chạy" });
            await tocChayCategory.save();
        }

        const categoryId = tocChayCategory._id;
        console.log(`🎯 ID của category 'Tốc chạy' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Tốc chạy cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of speedItems) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Tốc chạy' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Tốc chạy): ${itemName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy trang bị trong CSDL: ${itemName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật Category cho ${updatedCount} trang bị.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateCategory();