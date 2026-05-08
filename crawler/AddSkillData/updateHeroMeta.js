const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 1. Ép dùng chung Mongoose của backend để tránh lỗi Timeout
const mongoose = require('../../backend/node_modules/mongoose');
require('dotenv').config({ path: '../../backend/.env' });

// Trỏ đúng vào model Heros
const Hero = require('../../backend/src/models/Heros');

// 2. Thư mục lưu ảnh trỏ chính xác về backend/uploads
const UPLOAD_DIR = path.join(__dirname, '../../backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Hàm tải ảnh về máy
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

const updateData = async () => {
    try {
        // Kết nối Database an toàn với IP nội bộ
        const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aov-counter-project";
        await mongoose.connect(dbUri);
        console.log("✅ Đã kết nối Database!");

        // 3. Đọc dữ liệu từ file JSON nằm ở crawler/RawData
        const rawData = fs.readFileSync(path.join(__dirname, '../RawData/final_heroes_data.json'), 'utf-8');
        const heroesData = JSON.parse(rawData);

        if (!heroesData || heroesData.length === 0) {
            console.log("❌ Không có dữ liệu trong file JSON.");
            process.exit(1);
        }

        console.log(`⏳ Bắt đầu quét và cập nhật ${heroesData.length} tướng...`);
        let updatedCount = 0;
        let insertedCount = 0;

        for (const hero of heroesData) {
            const safeName = hero.name.replace(/\s+/g, '_').replace(/'/g, '');
            const imgFilename = `${safeName}.jpg`;
            
            const localAvatarPath = await downloadImage(hero.avatar, imgFilename);

            // Xử lý map kỹ năng từ file JSON
            const mappedSkills = {
                passive: hero.skills[0] ? `${hero.skills[0].TenChieu}: ${hero.skills[0].MoTaChieu}` : "",
                skill1: hero.skills[1] ? `${hero.skills[1].TenChieu}: ${hero.skills[1].MoTaChieu}` : "",
                skill2: hero.skills[2] ? `${hero.skills[2].TenChieu}: ${hero.skills[2].MoTaChieu}` : "",
                skill3: hero.skills[3] ? `${hero.skills[3].TenChieu}: ${hero.skills[3].MoTaChieu}` : "",
                skill4: hero.skills[4] ? `${hero.skills[4].TenChieu}: ${hero.skills[4].MoTaChieu}` : ""
            };

            // 4. Cập nhật an toàn với findOneAndUpdate (Cơ chế Upsert)
            const result = await Hero.findOneAndUpdate(
                { name: hero.name }, // Điều kiện tìm kiếm theo tên
                {
                    // $set: Cập nhật đè Avatar và Kỹ năng mới nhất
                    $set: {
                        avatar: localAvatarPath,
                        skills: mappedSkills
                    },
                    // $setOnInsert: CHỈ khởi tạo mảng rỗng nếu đây là Tướng mới tinh (chưa từng có trong DB)
                    $setOnInsert: {
                        roles: [],
                        lane: [],
                        tags: []
                    }
                },
                { 
                    upsert: true, // Nếu chưa có thì tạo mới, có rồi thì chỉ update $set
                    returnDocument: 'after', 
                    rawResult: true 
                }
            );

            // Kiểm tra xem là tạo mới hay cập nhật
            if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
                console.log(`🔄 Đã cập nhật skill/avatar cho: ${hero.name}`);
                updatedCount++;
            } else {
                console.log(`✨ Đã thêm MỚI tướng: ${hero.name}`);
                insertedCount++;
            }
        }

        console.log(`🎉 HOÀN TẤT! Đã cập nhật ${updatedCount} tướng cũ và thêm mới ${insertedCount} tướng.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra trong quá trình nạp dữ liệu:", error);
        process.exit(1);
    }
};

updateData();