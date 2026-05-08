const fs = require('fs');
const path = require('path');
const axios = require('axios');
// Dùng mongoose của backend để không bị lỗi timeout
const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

// Sửa lại đường dẫn này nếu file Item.js của bạn nằm trong src/models/
const Item = require('../../backend/src/models/Item');

// Cấu hình thư mục lưu ảnh (trỏ về backend/uploads như bạn đã làm với tướng)
const UPLOAD_DIR = path.join(__dirname, '../backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Hàm tải ảnh Trang bị về máy
const downloadImage = async (url, filename) => {
    try {
        const filepath = path.join(UPLOAD_DIR, filename);
        
        // Nếu ảnh đã tồn tại thì không tải lại
        if (fs.existsSync(filepath)) {
            return `/uploads/${filename}`;
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
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        // 2. Đọc file JSON cào được
        const rawData = fs.readFileSync(path.join(__dirname, 'RawData/run_results_TrangBi.json'), 'utf-8');
        const itemsData = JSON.parse(rawData).TrangBi; // Trỏ đúng vào mảng TrangBi

        if (!itemsData || itemsData.length === 0) {
            console.log("❌ Không có dữ liệu trong file JSON.");
            process.exit(1);
        }

        // 3. Xóa dữ liệu Trang bị cũ (nếu muốn làm mới hoàn toàn)
        console.log("🗑️ Đang dọn dẹp dữ liệu Trang bị cũ trong Database...");
        await Item.deleteMany({});

        // 4. Xử lý và Thêm dữ liệu mới
        console.log(`⏳ Bắt đầu import ${itemsData.length} trang bị...`);
        let importedCount = 0;

        for (const item of itemsData) {
            // Chuẩn hóa tên file ảnh (xóa khoảng trắng, ký tự đặc biệt)
            const safeName = item.name.replace(/\s+/g, '_').replace(/'/g, '');
            // Các trang bị Liên Quân đa số là đuôi .png, ta có thể lấy phần mở rộng từ URL hoặc ép cứng .png
            const ext = path.extname(new URL(item.IconTrangBi).pathname) || '.png';
            const imgFilename = `item_${safeName}${ext}`;
            
            // Tải ảnh và lấy đường dẫn cục bộ
            const localIconPath = await downloadImage(item.IconTrangBi, imgFilename);

            // Chuyển Giá vàng từ String sang Number
            const priceNumber = parseInt(item.GiaVang.replace(/\D/g, '')) || 0;

            // Tạo record mới
            const newItem = new Item({
                name: item.name,
                icon: localIconPath,
                price: priceNumber,
                passive: item.MoTaTrangBi,
                tier: 3 // Mặc định là trang bị cấp 3 như trong Schema
                // Trường category hiện để trống, bạn có thể phân loại sau bằng Dashboard
            });

            await newItem.save();
            console.log(`✅ Đã thêm thành công: ${item.name}`);
            importedCount++;
        }

        console.log(`🎉 HOÀN TẤT! Đã nạp thành công ${importedCount} trang bị vào CSDL.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra trong quá trình nạp dữ liệu:", error);
        process.exit(1);
    }
};

importData();