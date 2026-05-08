const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Phụ trợ (Support)
const supportItems = [
    "Liệt hoả thần tốc", "Liệt hoả mở trói", "Liệt hoả hồi huyết", 
    "Liệt hoả ma nhãn", "Liệt hoả thần khiên", "Đại địa hồi huyết", 
    "Đại địa ma nhãn", "Đại địa thần khiên", "Đại địa Mở trói", 
    "Đại địa thần tốc", "Hoả hệ bảo thạch", "Thổ hệ bảo thạch", 
    "Nguyên tố bảo thạch"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Phụ trợ"
        let phuTroCategory = await ItemCategory.findOne({ name: "Phụ trợ" });

        if (!phuTroCategory) {
            console.log("⚠️ Không tìm thấy Category 'Phụ trợ'. Đang tạo mới...");
            phuTroCategory = new ItemCategory({ name: "Phụ trợ" });
            await phuTroCategory.save();
        }

        const categoryId = phuTroCategory._id;
        console.log(`🎯 ID của category 'Phụ trợ' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Phụ trợ cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of supportItems) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Phụ trợ' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Phụ trợ): ${itemName}`);
                }
            } else {
                console.log(`❌ Không tìm thấy trang bị trong CSDL: ${itemName}`);
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật Category cho ${updatedCount} trang bị phụ trợ.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra:", error);
        process.exit(1);
    }
};

updateCategory();