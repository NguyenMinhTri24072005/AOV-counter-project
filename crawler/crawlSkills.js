const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const runCrawler = async () => {
    // 1. Đọc file JSON cũ mà ParseHub đã cào được
    const rawData = fs.readFileSync(path.join(__dirname, 'RawData/run_results.json'), 'utf-8');
    const heroesData = JSON.parse(rawData).Tuong;

    // 2. Khởi tạo Puppeteer (để headless: true cho nó chạy ngầm siêu nhanh)
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Chặn tải hình ảnh, CSS, Fonts thừa để tăng tốc độ cào x10 lần
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    const finalData = [];
    console.log(`🚀 Bắt đầu lấy kỹ năng cho ${heroesData.length} tướng...`);

    for (const hero of heroesData) {
        try {
            console.log(`⏳ Đang xử lý: ${hero.name}...`);
            
            // Vào trang của tướng (chỉ cần đợi tải xong khung HTML)
            await page.goto(hero.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Rút thẳng dữ liệu từ trong HTML (bỏ qua việc có bị ẩn hay không)
            const skills = await page.evaluate(() => {
                const results = [];
                // Bắt tất cả các khối chứa chiêu thức
                const skillBlocks = document.querySelectorAll('.hero__skills--detail');
                
                skillBlocks.forEach(block => {
                    const ten = block.querySelector('h3');
                    const moTa = block.querySelector('article');
                    
                    if (ten && moTa) {
                        results.push({
                            TenChieu: ten.innerText.trim(),
                            MoTaChieu: moTa.innerText.trim()
                        });
                    }
                });
                return results;
            });

            // Gộp dữ liệu
            finalData.push({
                name: hero.name,
                avatar: hero.avatar,
                url: hero.url,
                skills: skills
            });

            console.log(`✅ Thành công: ${hero.name} (${skills.length} chiêu)`);

        } catch (error) {
            console.error(`❌ Lỗi ở tướng ${hero.name}:`, error.message);
        }
    }

    await browser.close();

    // 3. Lưu ra file JSON mới
    fs.writeFileSync(path.join(__dirname, 'CookedData/final_heroes_data.json'), JSON.stringify(finalData, null, 4));
    console.log('🎉 XONG! Dữ liệu đã lưu vào final_heroes_data.json');
};

runCrawler();