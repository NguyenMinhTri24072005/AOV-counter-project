const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 1. Ép dùng chung Mongoose của backend để tránh lỗi Timeout
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

const Item = require('../../backend/src/models/Item');

// 2. Sửa lại đường dẫn lưu ảnh trỏ chính xác về thư mục backend/uploads
const UPLOAD_DIR = path.join(__dirname, '../../backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const downloadImage = async (url, filename) => {
    try {
        const filepath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
            return `/uploads/${filename}`; // Đã có ảnh thì bỏ qua tải lại
        }
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(`/uploads/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`[!] Lỗi tải ảnh ${filename}:`, error.message);
        return ""; 
    }
};

const importData = async () => {
    try {
        // Đổi localhost thành 127.0.0.1 để tránh lỗi phân giải IP của Node.js 18+
        const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aov-counter-project";
        await mongoose.connect(dbUri);
        console.log("✅ Đã kết nối Database!");

        // 3. Đường dẫn đọc file JSON đã chính xác
        const rawData = fs.readFileSync(path.join(__dirname, '../RawData/run_results_TrangBi.json'), 'utf-8');
        const itemsData = JSON.parse(rawData).TrangBi;

        if (!itemsData || itemsData.length === 0) {
            console.log("❌ Không có dữ liệu trong file JSON.");
            process.exit(1);
        }

        console.log(`⏳ Bắt đầu cập nhật/thêm mới ${itemsData.length} trang bị...`);
        let updatedCount = 0;
        let insertedCount = 0;

        for (const item of itemsData) {
            const safeName = item.name.replace(/\s+/g, '_').replace(/'/g, '');
            const ext = path.extname(new URL(item.IconTrangBi).pathname) || '.png';
            const imgFilename = `item_${safeName}${ext}`;
            
            const localIconPath = await downloadImage(item.IconTrangBi, imgFilename);
            const priceNumber = parseInt(item.GiaVang.replace(/\D/g, '')) || 0;

            // 4. Update an toàn, khắc phục warning Mongoose
            const result = await Item.findOneAndUpdate(
                { name: item.name },
                {
                    $set: {
                        icon: localIconPath,
                        price: priceNumber,
                        passive: item.MoTaTrangBi
                    },
                    $setOnInsert: {
                        tier: 3 
                    }
                },
                { 
                    upsert: true, 
                    returnDocument: 'after', // Đã thay thế new: true để hết cảnh báo
                    rawResult: true 
                }
            );

            // Kiểm tra xem là tạo mới hay cập nhật
            if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
                console.log(`🔄 Đã cập nhật meta cho: ${item.name}`);
                updatedCount++;
            } else {
                console.log(`✨ Đã thêm MỚI trang bị: ${item.name}`);
                insertedCount++;
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật ${updatedCount} đồ cũ và thêm mới ${insertedCount} đồ.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra trong quá trình nạp dữ liệu:", error);
        process.exit(1);
    }
};

importData();