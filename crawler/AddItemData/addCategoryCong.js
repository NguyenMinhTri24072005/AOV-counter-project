const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào các model theo đường dẫn bạn cung cấp
const Item = require('../../backend/src/models/Item');
const ItemCategory = require('../../backend/src/models/ItemCategory');

// Danh sách trang bị thuộc tính Công (Đã cập nhật mới nhất)
const attackItems = [
    "Chùy băng sương", "Huyết ảnh đao", "Diệt thần cung", "Huyết cung", 
    "Xạ Nhật Cung", "Thương Xuyên Phá", "Vuốt Hung Tàn", "Cung tà ma", 
    "Thương khung kiếm", "Nanh Fenrir", "Song đao bão táp", "Gươm sấm sét", 
    "Phức hợp kiếm", "Quỷ Kiếm", "Kiếm Muramasa", "Thánh kiếm", "Kiếm Fafnir", 
    "Thương Longinus", "Đao Truy Hồn", "Liềm Đoạt Mệnh", "Gươm Uriel", 
    "Phi tiêu", "Thương đấu sĩ", "Song đao", "Chùy cổ", "Kiếm dài", 
    "Chùy xích", "Chùy máu", "Găng tay", "Dao găm"
];

const updateCategory = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Tìm hoặc tạo Category "Công"
        let congCategory = await ItemCategory.findOne({ name: "Công" });

        if (!congCategory) {
            console.log("⚠️ Không tìm thấy Category 'Công'. Đang tạo mới...");
            congCategory = new ItemCategory({ name: "Công" });
            await congCategory.save();
        }

        const categoryId = congCategory._id;
        console.log(`🎯 ID của category 'Công' là: ${categoryId}`);

        // 3. Cập nhật category cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật thuộc tính Công cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of attackItems) {
            // Sử dụng regex với tùy chọn 'i' để tìm kiếm không phân biệt hoa thường
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { category: categoryId }
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật 'Công' cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã thuộc nhóm Công): ${itemName}`);
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