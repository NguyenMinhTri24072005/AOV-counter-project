const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

// Đảm bảo trỏ đúng đường dẫn tới Model Heros của bạn
const Hero = require('../../backend/src/models/Heros');

// SỬA Ở ĐÂY: Lưu thẳng vào thư mục 'uploads'
const UPLOAD_DIR = path.join(__dirname, '../backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Hàm tải ảnh về máy
const downloadImage = async (url, filename) => {
    try {
        const filepath = path.join(UPLOAD_DIR, filename);
        
        // Nếu ảnh đã tồn tại, không cần tải lại
        if (fs.existsSync(filepath)) {
            // SỬA Ở ĐÂY: Trả về đường dẫn gốc
            return `/uploads/${filename}`;
        }

        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            // SỬA Ở ĐÂY: Trả về đường dẫn gốc
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
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aov-counter-project");
        console.log("✅ Đã kết nối Database!");

        const rawData = fs.readFileSync(path.join(__dirname, 'CookedData/final_heroes_data.json'), 'utf-8');
        const heroesData = JSON.parse(rawData);

        if (!heroesData || heroesData.length === 0) {
            console.log("❌ Không có dữ liệu trong file JSON.");
            process.exit(1);
        }

        console.log("🗑️ Đang dọn dẹp dữ liệu cũ trong Database...");
        await Hero.deleteMany({});

        console.log(`⏳ Bắt đầu import ${heroesData.length} tướng...`);
        let importedCount = 0;

        for (const hero of heroesData) {
            const safeName = hero.name.replace(/\s+/g, '_').replace(/'/g, '');
            const imgFilename = `${safeName}.jpg`;
            
            // Đường dẫn trả về giờ sẽ là /uploads/Tên_Tướng.jpg
            const localAvatarPath = await downloadImage(hero.avatar, imgFilename);

            const mappedSkills = {
                passive: hero.skills[0] ? `${hero.skills[0].TenChieu}: ${hero.skills[0].MoTaChieu}` : "",
                skill1: hero.skills[1] ? `${hero.skills[1].TenChieu}: ${hero.skills[1].MoTaChieu}` : "",
                skill2: hero.skills[2] ? `${hero.skills[2].TenChieu}: ${hero.skills[2].MoTaChieu}` : "",
                skill3: hero.skills[3] ? `${hero.skills[3].TenChieu}: ${hero.skills[3].MoTaChieu}` : "",
                skill4: hero.skills[4] ? `${hero.skills[4].TenChieu}: ${hero.skills[4].MoTaChieu}` : ""
            };

            const newHero = new Hero({
                name: hero.name,
                avatar: localAvatarPath,
                roles: [], 
                lane: [],  
                tags: [],
                skills: mappedSkills
            });

            await newHero.save();
            console.log(`✅ Đã thêm thành công: ${hero.name}`);
            importedCount++;
        }

        console.log(`🎉 HOÀN TẤT! Đã nạp thành công ${importedCount} tướng vào cơ sở dữ liệu.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Có lỗi xảy ra trong quá trình nạp dữ liệu:", error);
        process.exit(1);
    }
};

importData();