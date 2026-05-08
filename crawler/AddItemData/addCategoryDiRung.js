const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model theo đường dẫn dự án của bạn
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Đi rừng
const jungleItems = [
    "Cung Bão Tố", "Kiếm truy hồn", "Rìu Leviathan", "Gươm Loki", 
    "Cung Gió Lốc", "Đao truy kích", "Rìu Gnoll", "Gươm hiến tế", "Rựa thợ săn"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Đi rừng"
        let diRungCategory = await ItemCategory.findOne({ name: "Đi rừng" });

        if (!diRungCategory) {
            console.log("⚠️ Không tìm thấy Category 'Đi rừng'. Đang tạo mới...");
            diRungCategory = new ItemCategory({ name: "Đi rừng" });
            await diRungCategory.save();
        }

        const categoryId = diRungCategory._id;
        console.log(`🎯 ID của category 'Đi rừng' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Đi rừng cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of jungleItems) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Đi rừng' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Đi rừng): ${itemName}`);
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