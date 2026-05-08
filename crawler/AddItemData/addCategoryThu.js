const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Thủ (đã được dọn dẹp khoảng trống)
const defenseItems = [
    "Nham thuẫn", "Phù chú trường sinh", "Áo choàng băng giá", "Giáp hộ mệnh", 
    "Huân chương Troy", "Giáp Gaia", "Khiên huyền thoại", "Khiên thất truyền", 
    "Áo choàng thần Ra", "Giáp cuồng nộ", "Hercule thịnh nộ", "Giáp thống khổ", 
    "Giáp hiệp sĩ", "Găng bạch kim", "Đai kháng phép", "Tim Incubus", 
    "Giáp chân", "Dây chuyền hồng ngọc", "Bùa sức mạnh", "Găng giác đấu", 
    "Giáp nhẹ", "Nhẫn hồng ngọc"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Thủ"
        let thuCategory = await ItemCategory.findOne({ name: "Thủ" });

        if (!thuCategory) {
            console.log("⚠️ Không tìm thấy Category 'Thủ'. Đang tạo mới...");
            thuCategory = new ItemCategory({ name: "Thủ" });
            await thuCategory.save();
        }

        const categoryId = thuCategory._id;
        console.log(`🎯 ID của category 'Thủ' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Thủ cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of defenseItems) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Thủ' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Thủ): ${itemName}`);
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