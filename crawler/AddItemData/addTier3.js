const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Item
const Item = require('../../backend/src/models/Item');

// Danh sách trang bị Cấp 3 (Tier 3)
const tier3Items = [
    "Chùy băng sương", "Thệ ước Carano", "Ma pháp trường bào", "Diệt thần cung", 
    "Liệt hoả thần tốc", "Liệt hoả mở trói", "Liệt hoả hồi huyết", "Liệt hoả ma nhãn", 
    "Liệt hoả thần khiên", "Đại địa hồi huyết", "Đại địa ma nhãn", "Đại địa thần khiên", 
    "Đại địa Mở trói", "Nham thuẫn", "Phù chú trường sinh", "Áo choàng băng giá", 
    "Giáp hộ mệnh", "Huân chương Troy", "Giáp Gaia", "Khiên huyền thoại", 
    "Khiên thất truyền", "Áo choàng thần Ra", "Xuyên tâm lệnh", "Băng nhẫn Skadi", 
    "Quả cầu băng sương", "Mặt nạ Berith", "Trượng băng", "Thập Tự Kiếm", 
    "Quyền trượng Rhea", "Ngọc đại pháp sư", "Vương miện Hecate", "Trượng bùng nổ", 
    "Sách thánh", "Gươm hiền triết", "Gươm tận thế", "Cung Bão Tố", "Kiếm truy hồn", 
    "Rìu Leviathan", "Gươm Loki", "Xạ Nhật Cung", "Thương Xuyên Phá", "Vuốt Hung Tàn", 
    "Cung tà ma", "Thương khung kiếm", "Nanh Fenrir", "Song đao bão táp", "Gươm sấm sét", 
    "Phức hợp kiếm", "Quỷ Kiếm", "Kiếm Muramasa", "Thánh kiếm", "Kiếm Fafnir", 
    "Thương Longinus"
];

const updateTier = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Cập nhật tier cho từng trang bị
        console.log("⏳ Bắt đầu cập nhật Cấp 3 (Tier 3) cho các trang bị...");
        let updatedCount = 0;

        for (const itemName of tier3Items) {
            // Sử dụng regex để tìm kiếm chính xác tên trang bị (không phân biệt hoa thường)
            const result = await Item.updateOne(
                { name: { $regex: new RegExp(`^${itemName}$`, 'i') } },
                { tier: 3 } // Cập nhật trường tier thành 3
            );

            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    console.log(`✅ Đã cập nhật Cấp 3 cho: ${itemName}`);
                    updatedCount++;
                } else {
                    console.log(`⏩ Bỏ qua (Đã là Cấp 3 từ trước): ${itemName}`);
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