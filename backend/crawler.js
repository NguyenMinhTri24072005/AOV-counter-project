const puppeteer = require('puppeteer');
const fs = require('fs-extra');

async function crawlLienQuan() {
    console.log("🚀 Đang mở trình duyệt (Chế độ hiển thị)...");
    
    // BẬC THẦY GỠ LỖI:
    // 1. headless: false -> Mở trình duyệt lên để bạn nhìn thấy nó đang làm gì
    // 2. defaultViewport: null -> Mở rộng toàn màn hình để load đủ dữ liệu
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized'] 
    });
    
    const page = await browser.newPage();

    try {
        console.log("🔗 Truy cập trang Học viện...");
        await page.goto('https://lienquan.garena.vn/hoc-vien/tuong-skin/', { 
            waitUntil: 'networkidle2'
        });

        console.log("⚠️  HÃY KIỂM TRA TRÌNH DUYỆT:");
        console.log("- Nếu có Popup hiện ra, hãy tự tay nhấn TẮT nó.");
        console.log("- Nếu trang bắt xác minh, hãy nhấn xác minh.");
        console.log("⏳ Script sẽ đợi trong 10 giây để bạn xử lý...");
        
        // Đợi 10 giây để bạn thao tác tay nếu cần
        await new Promise(r => setTimeout(r, 10000));

        console.log("🔍 Đang tìm kiếm Selector mới...");
        
        // Thuật toán tìm Selector tự động: 
        // Thay vì tìm đích danh .list-tuong, ta tìm bất kỳ <li> nào chứa ảnh và tên
        const heroes = await page.evaluate(() => {
            // Thử tìm tất cả các thẻ có khả năng là thẻ tướng
            const items = document.querySelectorAll('li');
            const results = [];
            
            items.forEach(li => {
                const nameEl = li.querySelector('p') || li.querySelector('.name');
                const imgEl = li.querySelector('img');
                const linkEl = li.querySelector('a');
                
                if (nameEl && imgEl && linkEl) {
                    results.push({
                        name: nameEl.innerText.trim(),
                        avatarUrl: imgEl.src,
                        detailUrl: linkEl.href
                    });
                }
            });
            return results;
        });

        if (heroes.length > 0) {
            console.log(`✅ Tuyệt vời! Đã tìm thấy ${heroes.length} tướng bằng phương pháp quét rộng.`);
            await fs.writeJson('heroes_temp.json', heroes, { spaces: 2 });
            console.log("💾 Đã lưu vào heroes_temp.json");
        } else {
            console.log("❌ Vẫn không thấy tướng nào. Có vẻ cấu trúc trang đã thay đổi hoàn toàn.");
        }

    } catch (err) {
        console.error("❌ Lỗi cụ thể:", err.message);
    } finally {
        console.log("💡 Bạn có thể đóng trình duyệt hoặc đợi 30s để xem kết quả.");
        await new Promise(r => setTimeout(r, 30000));
        await browser.close();
    }
}

crawlLienQuan();