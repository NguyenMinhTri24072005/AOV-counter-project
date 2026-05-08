const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Phép (đã được làm sạch dữ liệu copy thừa)
const magicItems = [
    "Thệ ước Carano", "Ma pháp trường bào", "Cầu chiêm tinh", "Xuyên tâm lệnh", 
    "Băng nhẫn Skadi", "Quả cầu băng sương", "Mặt nạ Berith", "Trượng băng", 
    "Thập Tự Kiếm", "Quyền trượng Rhea", "Ngọc đại pháp sư", "Vương miện Hecate", 
    "Trượng bùng nổ", "Sách thánh", "Gươm hiền triết", "Gươm tận thế", 
    "Sách Truy Hồn", "Dây chuyền lục bảo", "Trượng hỗn mang", "Huyết trượng", 
    "Vòng đức hạnh", "Phượng hoàng lệ", "Mặt nạ ma quái", "Gươm nguyên tố", 
    "Sớ ma thuật", "Nhẫn ma pháp", "Sách cổ", "Dây chuyền ma thuật", 
    "Nhẫn Lapis", "Sách phép"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Phép"
        let phepCategory = await ItemCategory.findOne({ name: "Phép" });

        if (!phepCategory) {
            console.log("⚠️ Không tìm thấy Category 'Phép'. Đang tạo mới...");
            phepCategory = new ItemCategory({ name: "Phép" });
            await phepCategory.save();
        }

        const categoryId = phepCategory._id;
        console.log(`🎯 ID của category 'Phép' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Phép cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of magicItems) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Phép' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Phép): ${itemName}`);
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