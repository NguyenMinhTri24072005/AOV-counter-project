require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import tất cả các Models
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const ItemCategory = require('./src/models/ItemCategory');
const Hero = require('./src/models/Heros'); 
const Item = require('./src/models/Item');
const Matchup = require('./src/models/Matchup');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối Database thành công!');

        // 1. XÓA SẠCH DỮ LIỆU CŨ
        await User.deleteMany();
        await Role.deleteMany();
        await ItemCategory.deleteMany();
        await Hero.deleteMany();
        await Item.deleteMany();
        await Matchup.deleteMany();
        console.log('🗑️ Đã dọn dẹp sạch sẽ dữ liệu cũ!');

        // 2. TẠO TÀI KHOẢN ADMIN
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('admin123', salt);
        
        const adminUser = await User.create({
            username: 'admin',
            password: hashedAdminPassword,
            role: 'admin'
        });
        console.log('👑 Đã tạo tài khoản Admin!');

        // 3. TẠO PHÂN LOẠI TƯỚNG (ROLES)
        const rolesData = [
            { name: 'Đấu sĩ' }, { name: 'Sát thủ' }, { name: 'Pháp sư' },
            { name: 'Xạ thủ' }, { name: 'Trợ thủ' }, { name: 'Đỡ đòn' }
        ];
        const createdRoles = await Role.insertMany(rolesData);
        const roleId = (name) => createdRoles.find(r => r.name === name)._id;

        // 4. TẠO PHÂN LOẠI TRANG BỊ
        const categoriesData = [
            { name: 'Công' }, { name: 'Phép' }, { name: 'Thủ' }, 
            { name: 'Tốc độ' }, { name: 'Đi rừng' }, { name: 'Trợ thủ' }
        ];
        const createdCategories = await ItemCategory.insertMany(categoriesData);
        const catId = (name) => createdCategories.find(c => c.name === name)._id;

        // 5. TẠO DỮ LIỆU TRANG BỊ KHẮC CHẾ (Mở rộng)
        const itemsData = [
            // Đồ Công
            { name: 'Đao Truy Hồn', category: catId('Công'), tier: 3, price: 2000, passive: 'Giảm 40% hồi máu mục tiêu.' },
            { name: 'Kiếm Fafnir', category: catId('Công'), tier: 3, price: 2040, passive: 'Đòn đánh thường gây thêm sát thương bằng 8% máu hiện tại của mục tiêu.' },
            { name: 'Gươm Uất Hận', category: catId('Công'), tier: 3, price: 2100, passive: 'Giảm sát thương gánh chịu và phản sát thương.' },
            // Đồ Phép
            { name: 'Sách Truy Hồn', category: catId('Phép'), tier: 3, price: 2000, passive: 'Giảm 40% hồi máu mục tiêu.' },
            { name: 'Quả Cầu Băng Sương', category: catId('Phép'), tier: 3, price: 2200, passive: 'Bất tử trong 2 giây.' },
            { name: 'Trượng Băng', category: catId('Phép'), tier: 3, price: 2000, passive: 'Chiêu thức trúng đích làm chậm 20%.' },
            // Đồ Thủ
            { name: 'Rìu Hyoga', category: catId('Thủ'), tier: 3, price: 1900, passive: 'Đòn đánh thường làm chậm tốc chạy kẻ địch 25%.' },
            { name: 'Khiên Thất Truyền', category: catId('Thủ'), tier: 3, price: 2100, passive: 'Giảm 30% tốc đánh kẻ địch lân cận.' },
            { name: 'Áo Choàng Băng Giá', category: catId('Thủ'), tier: 3, price: 2000, passive: 'Đòn đánh sau chiêu thức làm chậm.' },
            { name: 'Huân Chương Troy', category: catId('Thủ'), tier: 3, price: 2320, passive: 'Tạo giáp ảo chống sát thương phép.' },
            { name: 'Giáp Hộ Mệnh', category: catId('Thủ'), tier: 3, price: 2400, passive: 'Hồi sinh sau khi chết.' },
            { name: 'Giáp Gaia', category: catId('Thủ'), tier: 3, price: 1960, passive: 'Hồi máu khi chịu sát thương.' },
            { name: 'Nham Thuẫn', category: catId('Thủ'), tier: 3, price: 2120, passive: 'Tạo lớp lá chắn khổng lồ dựa trên máu tối đa.' },
            // Đồ Trợ Thủ
            { name: 'Đại Địa Mở Trói', category: catId('Trợ thủ'), tier: 3, price: 1900, passive: 'Giải toàn bộ hiệu ứng khống chế cho đồng minh.' },
            { name: 'Đại Địa Ma Nhãn', category: catId('Trợ thủ'), tier: 3, price: 1900, passive: 'Phát hiện tướng địch tàng hình xung quanh.' },
            // Đồ Tốc độ
            { name: 'Giày Kiên Cường', category: catId('Tốc độ'), tier: 2, price: 700, passive: 'Tăng 35% kháng hiệu ứng.' },
            { name: 'Giày Hộ Vệ', category: catId('Tốc độ'), tier: 2, price: 700, passive: 'Giảm 15% sát thương vật lý gánh chịu.' }
        ];
        const createdItems = await Item.insertMany(itemsData);

        // 6. TẠO DỮ LIỆU TƯỚNG (Hơn 50 Tướng meta)
        const heroesData = [
            // --- TOP ---
            { name: 'Florentino', roles: [roleId('Đấu sĩ')], lane: ['Top'], tags: ['Sát thương chuẩn'], skills: {} },
            { name: 'Omen', roles: [roleId('Đấu sĩ')], lane: ['Top'], tags: ['Khống chế cứng', 'Miễn thương'], skills: {} },
            { name: 'Yena', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top'], tags: ['Sốc sát thương', 'Câm lặng'], skills: {} },
            { name: 'Richter', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Support'], tags: ['Miễn nhiễm', 'Cơ động'], skills: {} },
            { name: 'Allain', roles: [roleId('Đấu sĩ')], lane: ['Top'], tags: ['Hỗn hợp sát thương', 'Trói chân'], skills: {} },
            { name: 'Maloch', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top', 'Support'], tags: ['Sát thương chuẩn', 'Giao tranh tổng'], skills: {} },
            { name: 'Arthur', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top'], tags: ['Trâu bò', 'Dễ chơi'], skills: {} },
            { name: 'Taara', roles: [roleId('Đỡ đòn'), roleId('Đấu sĩ')], lane: ['Top', 'Jungle'], tags: ['Hồi máu khủng'], skills: {} },
            { name: 'Skud', roles: [roleId('Đỡ đòn'), roleId('Đấu sĩ')], lane: ['Top', 'Jungle'], tags: ['Máu nhiều', 'Đấm đau'], skills: {} },
            
            // --- JUNGLE ---
            { name: 'Nakroth', roles: [roleId('Sát thủ')], lane: ['Jungle'], tags: ['Siêu cơ động', 'Đẩy lẻ'], skills: {} },
            { name: 'Ngộ Không', roles: [roleId('Sát thủ')], lane: ['Jungle'], tags: ['Tàng hình', 'Sốc chí mạng'], skills: {} },
            { name: 'Kaine', roles: [roleId('Sát thủ')], lane: ['Jungle', 'Support'], tags: ['Tàng hình vĩnh viễn', 'Sát thủ'], skills: {} },
            { name: 'Quillen', roles: [roleId('Sát thủ')], lane: ['Jungle'], tags: ['Tàng hình', 'Sát thương lưng'], skills: {} },
            { name: 'Aoi', roles: [roleId('Sát thủ')], lane: ['Jungle'], tags: ['Đu dây', 'Bắt chủ lực'], skills: {} },
            { name: 'Keera', roles: [roleId('Sát thủ'), roleId('Pháp sư')], lane: ['Jungle'], tags: ['Đi xuyên tường', 'Miễn thương'], skills: {} },
            { name: 'Kriknak', roles: [roleId('Sát thủ')], lane: ['Jungle'], tags: ['Sát thương theo % máu', 'Bắt lẻ'], skills: {} },
            { name: 'Zill', roles: [roleId('Sát thủ'), roleId('Pháp sư')], lane: ['Jungle'], tags: ['Không thể chọn mục tiêu'], skills: {} },
            
            // --- MID ---
            { name: 'Krixi', roles: [roleId('Pháp sư')], lane: ['Mid'], tags: ['Sát thương diện rộng', 'Hất tung'], skills: {} },
            { name: 'Aleister', roles: [roleId('Pháp sư'), roleId('Trợ thủ')], lane: ['Mid', 'Support'], tags: ['Khống chế áp chế'], skills: {} },
            { name: 'Zata', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'], tags: ['Bay lên trời', 'Miễn nhiễm'], skills: {} },
            { name: 'Liliana', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'], tags: ['Biến ảo', 'Cấu rỉa'], skills: {} },
            { name: 'Dirak', roles: [roleId('Pháp sư')], lane: ['Mid'], tags: ['Chặn sát thương', 'Ép góc'], skills: {} },
            { name: 'Veera', roles: [roleId('Pháp sư')], lane: ['Mid'], tags: ['Sốc sát thương', 'Choáng mục tiêu'], skills: {} },
            { name: 'Diaochan', roles: [roleId('Pháp sư')], lane: ['Mid'], tags: ['Đóng băng', 'Miễn khống'], skills: {} },
            { name: 'Lorion', roles: [roleId('Pháp sư')], lane: ['Mid'], tags: ['Giao tranh tổng', 'Không thể chọn mục tiêu'], skills: {} },
            
            // --- ADC ---
            { name: 'Hayate', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Sát thương chuẩn', 'Thả diều'], skills: {} },
            { name: 'Elsu', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Tầm siêu xa', 'Soi map'], skills: {} },
            { name: 'Yorn', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Sát thương % máu', 'Xả đạn liên tục'], skills: {} },
            { name: 'Tel\'Annas', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Sải tay dài', 'Hỗn hợp sát thương'], skills: {} },
            { name: 'Violet', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Cấu rỉa', 'Cơ động'], skills: {} },
            { name: 'Capheny', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Vừa đi vừa bắn', 'Xuyên giáp'], skills: {} },
            { name: 'Valhein', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Hit and run', 'Choáng liên tục'], skills: {} },
            { name: 'Stuart', roles: [roleId('Xạ thủ')], lane: ['ADC'], tags: ['Miễn ST vật lý', 'Sốc sát thương'], skills: {} },
            
            // --- SUPPORT ---
            { name: 'Chaugnar', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'], tags: ['Giải khống chế', 'Băng càn'], skills: {} },
            { name: 'Grakk', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'], tags: ['Kéo mục tiêu', 'Hút diện rộng'], skills: {} },
            { name: 'Arum', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'], tags: ['Khống chế áp chế', 'Hồi máu'], skills: {} },
            { name: 'Helen', roles: [roleId('Trợ thủ')], lane: ['Support'], tags: ['Hồi máu liên tục'], skills: {} },
            { name: 'Alice', roles: [roleId('Trợ thủ')], lane: ['Support'], tags: ['Tạo lá chắn', 'Làm câm lặng'], skills: {} },
            { name: 'Gildur', roles: [roleId('Đỡ đòn'), roleId('Pháp sư')], lane: ['Support', 'Mid'], tags: ['Choáng liên tục', 'Tầm xa'], skills: {} },
            { name: 'Zip', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'], tags: ['Nuốt đồng đội', 'Bảo kê'], skills: {} },
            { name: 'Max', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top', 'Support'], tags: ['Soi map', 'Giảm hồi máu'], skills: {} },
            { name: 'Toro', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'], tags: ['Trâu bò nhất game', 'Miễn khống chế'], skills: {} }
        ];
        const createdHeroes = await Hero.insertMany(heroesData);
        console.log('🦸 Đã tạo xong Tướng và Trang bị!');

        // Helper lấy ID
        const hId = (name) => createdHeroes.find(h => h.name === name)?._id;
        const iId = (name) => createdItems.find(i => i.name === name)?._id;

        // 7. TẠO DỮ LIỆU KÈO KHẮC CHẾ ĐA DẠNG
        const matchupsRaw = [
            // --- KHẮC CHẾ BẰNG KỸ NĂNG ÁP CHẾ (CỨNG) ---
            { enemy: 'Florentino', counter: 'Aleister', score: 5, items: [], note: 'Ngục Tù Vĩnh Hằng áp chế cứng, đồng đội dễ dàng hạ gục Flo trước khi hắn múa.' },
            { enemy: 'Florentino', counter: 'Arum', score: 5, items: [], note: 'Arum cứ thấy Flo lao vào là dùng Thú Côn trói lại.' },
            { enemy: 'Florentino', counter: 'Omen', score: 5, items: ['Khiên Thất Truyền'], note: 'Sát Vực xích Flo lại, không cho hắn nhặt hoa để lướt.' },
            
            // --- KHẮC CHẾ HỒI MÁU KHỦNG ---
            { enemy: 'Taara', counter: 'Max', score: 5, items: ['Đao Truy Hồn'], note: 'Nội tại Max giảm hồi máu bẩm sinh, kết hợp Đao Truy Hồn khiến Taara phế hoàn toàn.' },
            { enemy: 'Helen', counter: 'Max', score: 5, items: ['Đao Truy Hồn', 'Giáp Hộ Mệnh'], note: 'Max chỉ định bay thẳng vào Helen để triệt tiêu nguồn hồi máu của team địch.' },
            { enemy: 'Taara', counter: 'Florentino', score: 4, items: ['Đao Truy Hồn'], note: 'Sát thương chuẩn của Flo múa lủng lớp giáp và máu của Taara rất nhanh.' },

            // --- KHẮC CHẾ SÁT THỦ TÀNG HÌNH ---
            { enemy: 'Ngộ Không', counter: 'Elsu', score: 5, items: [], note: 'Ưng Nhãn (Chiêu 1) của Elsu soi rõ Ngộ Không đang tàng hình rình rập.' },
            { enemy: 'Kaine', counter: 'Elsu', score: 5, items: [], note: 'Kaine không thể tàng hình gank nếu giẫm phải mìn của Elsu.' },
            { enemy: 'Quillen', counter: 'Max', score: 4, items: [], note: 'Max bay chiêu cuối sẽ cấp tầm nhìn toàn bản đồ, phế luôn chiêu cuối tàng hình của Quillen.' },
            { enemy: 'Ngộ Không', counter: 'Chaugnar', score: 4, items: ['Đại Địa Ma Nhãn', 'Giáp Hộ Mệnh'], note: 'Lên nhãn soi tàng hình. Chaugnar cực trâu và giải choáng, Ngộ Không đập không chết được.' },

            // --- KHẮC CHẾ TƯỚNG PHỤ THUỘC KHỐNG CHẾ DIỆN RỘNG ---
            { enemy: 'Grakk', counter: 'Chaugnar', score: 5, items: [], note: 'Chỉ cần một nút bấm Chiêu Cuối của Chaugnar, toàn đội hóa giải hoàn toàn Bão Từ Trường của Grakk.' },
            { enemy: 'Diaochan', counter: 'Chaugnar', score: 5, items: [], note: 'Chaugnar khắc tinh tuyệt đối của Diaochan, giải đóng băng cho toàn team.' },
            { enemy: 'Lorion', counter: 'Chaugnar', score: 5, items: [], note: 'Lorion vừa hất tung thì Chaugnar buff giải hiệu ứng cho cả đội đi bộ ra khỏi vùng sát thương.' },
            { enemy: 'Gildur', counter: 'Chaugnar', score: 5, items: [], note: 'Chaugnar phế hoàn toàn chiêu cuối diện rộng của Gildur.' },

            // --- KHẮC CHẾ BỘ LƯỚT / BAY LƯỢN ---
            { enemy: 'Zata', counter: 'Aleister', score: 5, items: ['Huân Chương Troy'], note: 'Zata vừa lướt chuẩn bị bay lên là bị Aleister xích lại ngay lập tức.' },
            { enemy: 'Zata', counter: 'Zuka', score: 4, items: ['Huân Chương Troy'], note: 'Zuka đợi Zata bay xong rơi xuống đất thì lao vào sốc sát thương bốc hơi Zata.' },
            { enemy: 'Nakroth', counter: 'Omen', score: 4, items: ['Khiên Thất Truyền'], note: 'Nakroth lướt vào đẩy lẻ bị Omen xích lại là hết đường về.' },

            // --- KHẮC CHẾ TANK LÙ ĐÙ / TRÂU BÒ ---
            { enemy: 'Toro', counter: 'Hayate', score: 5, items: ['Rìu Hyoga'], note: 'Hayate rỉa sát thương chuẩn chí mạng khiến lớp giáp của Toro trở nên vô nghĩa.' },
            { enemy: 'Maloch', counter: 'Hayate', score: 5, items: ['Áo Choàng Băng Giá'], note: 'Hayate cấu rỉa thả diều khiến Maloch không thể chạm tới người.' },
            { enemy: 'Omen', counter: 'Hayate', score: 5, items: ['Rìu Hyoga'], note: 'Hayate cơ động thoát khỏi tầm xích của Omen và bắn sát thương chuẩn ngược lại.' },

            // --- KHẮC CHẾ XẠ THỦ KÉM CƠ ĐỘNG ---
            { enemy: 'Yorn', counter: 'Zuka', score: 5, items: [], note: 'Zuka lướt qua tường sốc sát thương cực nhanh, Yorn không kịp tốc biến.' },
            { enemy: 'Tel\'Annas', counter: 'Aoi', score: 5, items: [], note: 'Aoi đu dây từ xa, không bị chọn làm mục tiêu, lao thẳng vào Tel\'Annas.' },
            { enemy: 'Yorn', counter: 'Kaine', score: 5, items: [], note: 'Kaine tàng hình áp sát, Yorn là miếng mồi ngon vì không có chiêu lướt.' },

            // --- KHẮC CHẾ ĐẶC QUYỀN (UNIQUE COUNTERS) ---
            { enemy: 'Stuart', counter: 'Zill', score: 5, items: ['Quả Cầu Băng Sương'], note: 'Stuart miễn thương vật lý nhưng Zill là sát thủ PHÉP, dễ dàng bốc hơi Stuart.' },
            { enemy: 'Ngộ Không', counter: 'Stuart', score: 4, items: [], note: 'Stuart bật chiêu 2 miễn 100% sát thương vật lý, khắc chế cứng những cú gập chí mạng của Ngộ Không.' },
            { enemy: 'Hayate', counter: 'Veera', score: 4, items: [], note: 'Hayate rất bay nhảy nhưng Veera có chiêu 2 Hôn Gió chỉ định (không cần định hướng), stun cứng và dồn dame chết ngay.' },
            { enemy: 'Arum', counter: 'Zip', score: 5, items: [], note: 'Khi Arum trói đồng đội, Zip dùng chiêu hút cả đồng đội đang bị trói vào bụng để cứu.' }
        ];

        // Lọc và lưu trữ các Kèo đấu hợp lệ
        const validMatchups = matchupsRaw
            .filter(m => hId(m.enemy) && hId(m.counter)) // Đảm bảo tướng có tồn tại
            .map(m => ({
                enemyHeroId: hId(m.enemy),
                counterHeroId: hId(m.counter),
                score: m.score,
                counterItems: m.items.map(itemName => iId(itemName)).filter(id => id), // Đảm bảo Item có tồn tại
                note: m.note,
                author: adminUser._id // GÁN QUYỀN SỞ HỮU CHO ADMIN
            }));

        await Matchup.insertMany(validMatchups);
        console.log(`🔥 Đã tạo xong ${validMatchups.length} Kèo Khắc Chế Chuẩn (Global)!`);

        console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC BƠM THÀNH CÔNG!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Có lỗi xảy ra trong quá trình seed dữ liệu:', error);
        process.exit(1);
    }
};

seedDatabase();