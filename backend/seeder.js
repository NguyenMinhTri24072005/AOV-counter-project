require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
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

        // 1. DỌN DẸP SẠCH SẼ DATABASE
        await User.deleteMany();
        await Role.deleteMany();
        await ItemCategory.deleteMany();
        await Hero.deleteMany();
        await Item.deleteMany();
        await Matchup.deleteMany();
        console.log('🗑️ Đã xóa toàn bộ dữ liệu cũ!');

        // 2. TẠO TÀI KHOẢN ADMIN & USER
        const salt = await bcrypt.genSalt(10);
        const adminPass = await bcrypt.hash('admin123', salt);
        const userPass = await bcrypt.hash('123456', salt);
        
        const adminUser = await User.create({ username: 'admin', password: adminPass, role: 'admin' });
        const normalUser = await User.create({ username: 'nguoichoi_vip', password: userPass, role: 'user' });
        console.log('👑 Đã tạo Admin (admin/admin123) và 👤 User (nguoichoi_vip/123456)');

        // 3. TẠO VAI TRÒ
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

        // 5. TẠO 50 TRANG BỊ
        const itemsData = [
            // ĐỒ CÔNG
            { name: 'Kiếm dài', category: catId('Công'), tier: 1, price: 250, passive: '+20 Công vật lý' },
            { name: 'Dao găm', category: catId('Công'), tier: 1, price: 290, passive: '+10% Tốc đánh' },
            { name: 'Thương Xuyên Phá', category: catId('Công'), tier: 3, price: 2020, passive: 'Xuyên giáp và tăng tốc chạy khi rời giao tranh.' },
            { name: 'Kiếm Muramasa', category: catId('Công'), tier: 3, price: 2020, passive: 'Xuyên 40% giáp vật lý.' },
            { name: 'Nanh Fenrir', category: catId('Công'), tier: 3, price: 2950, passive: 'Tăng 30% sát thương khi máu mục tiêu dưới 50%.' },
            { name: 'Phức Hợp Kiếm', category: catId('Công'), tier: 3, price: 2150, passive: 'Đòn đánh sau chiêu thức gây thêm STVL.' },
            { name: 'Đao Truy Hồn', category: catId('Công'), tier: 3, price: 2000, passive: 'Giảm 40% hồi máu mục tiêu.' },
            { name: 'Kiếm Fafnir', category: catId('Công'), tier: 3, price: 2040, passive: 'Đánh thường gây thêm 8% máu hiện tại.' },
            { name: 'Thánh Kiếm', category: catId('Công'), tier: 3, price: 2120, passive: '+25% Tỉ lệ chí mạng, sát thương chí mạng tăng 50%.' },
            { name: 'Song Đao Bão Táp', category: catId('Công'), tier: 3, price: 2050, passive: 'Tăng tốc đánh, chí mạng, tốc chạy và kháng hiệu ứng.' },
            { name: 'Vuốt Hung Cuồng', category: catId('Công'), tier: 3, price: 2070, passive: 'Đánh trúng địch tăng tốc đánh.' },
            { name: 'Cung Tà Ma', category: catId('Công'), tier: 3, price: 2250, passive: 'Kích hoạt: Hút máu cực mạnh trong 3s.' },
            { name: 'Thương Longinus', category: catId('Công'), tier: 3, price: 2060, passive: 'Đánh trúng trừ giáp mục tiêu, cộng dồn 4 lần.' },
            { name: 'Gươm Uất Hận', category: catId('Công'), tier: 3, price: 2100, passive: 'Giảm ST gánh chịu và phản ST.' },
            
            // ĐỒ PHÉP
            { name: 'Sách phép', category: catId('Phép'), tier: 1, price: 300, passive: '+40 Công phép' },
            { name: 'Vương Miện Hecate', category: catId('Phép'), tier: 3, price: 2400, passive: 'Tăng 35% tổng công phép.' },
            { name: 'Trượng Hỗn Mang', category: catId('Phép'), tier: 3, price: 2050, passive: 'Xuyên 40% giáp phép.' },
            { name: 'Sách Truy Hồn', category: catId('Phép'), tier: 3, price: 2000, passive: 'Giảm 40% hồi máu mục tiêu.' },
            { name: 'Quả Cầu Băng Sương', category: catId('Phép'), tier: 3, price: 2200, passive: 'Kích hoạt: Bất tử 2 giây.' },
            { name: 'Trượng Băng', category: catId('Phép'), tier: 3, price: 2000, passive: 'Chiêu thức làm chậm 20% tốc chạy.' },
            { name: 'Băng Nhẫn Skadi', category: catId('Phép'), tier: 3, price: 2150, passive: 'Nhận lá chắn phép và giáp khi máu thấp.' },
            { name: 'Mặt Nạ Berith', category: catId('Phép'), tier: 3, price: 2120, passive: 'Chiêu thức thiêu đốt % máu địch.' },
            { name: 'Gươm Tận Thế', category: catId('Phép'), tier: 3, price: 2190, passive: 'Đòn đánh sau chiêu thức gây thêm ST phép.' },
            { name: 'Xuyên Tâm Lệnh', category: catId('Phép'), tier: 3, price: 1980, passive: '+150 Xuyên giáp phép, máu và hồi chiêu.' },
            { name: 'Ngọc Đại Pháp Sư', category: catId('Phép'), tier: 3, price: 2010, passive: 'Lên cấp hồi máu và năng lượng.' },
            { name: 'Sách Thánh', category: catId('Phép'), tier: 3, price: 2990, passive: '+400 Công phép, tăng 10% máu tối đa.' },

            // ĐỒ THỦ
            { name: 'Giáp nhẹ', category: catId('Thủ'), tier: 1, price: 220, passive: '+90 Giáp' },
            { name: 'Khiên Thất Truyền', category: catId('Thủ'), tier: 3, price: 2100, passive: 'Giảm 30% tốc đánh địch xung quanh.' },
            { name: 'Áo Choàng Băng Giá', category: catId('Thủ'), tier: 3, price: 2000, passive: 'Đòn đánh sau chiêu làm chậm và gây ST diện rộng.' },
            { name: 'Huân Chương Troy', category: catId('Thủ'), tier: 3, price: 2320, passive: 'Tạo giáp ảo chống sát thương phép mỗi 8s.' },
            { name: 'Giáp Hộ Mệnh', category: catId('Thủ'), tier: 3, price: 2400, passive: 'Hồi sinh sau khi chết (tối đa 2 lần/game).' },
            { name: 'Giáp Gaia', category: catId('Thủ'), tier: 3, price: 1960, passive: 'Hồi 8% máu khi chịu sát thương (Hồi 10s).' },
            { name: 'Nham Thuẫn', category: catId('Thủ'), tier: 3, price: 2120, passive: 'Kích hoạt: Tạo lá chắn khổng lồ dựa trên máu tổn thất.' },
            { name: 'Giáp Thống Khổ', category: catId('Thủ'), tier: 3, price: 1940, passive: 'Phản lại 15% STVL đã gánh chịu.' },
            { name: 'Rìu Hyoga', category: catId('Thủ'), tier: 3, price: 1900, passive: 'Đòn đánh thường làm chậm địch 25%.' },
            { name: 'Phù Chú Trường Sinh', category: catId('Thủ'), tier: 3, price: 2680, passive: 'Hồi 4% máu tối đa mỗi giây khi rời giao tranh.' },
            { name: 'Khiên Huyền Thoại', category: catId('Thủ'), tier: 3, price: 2100, passive: '+20% Giảm hồi chiêu. Giảm tốc đánh địch đánh mình.' },
            { name: 'Áo Choàng Thần Ra', category: catId('Thủ'), tier: 3, price: 1900, passive: 'Thiêu đốt ST phép kẻ địch lân cận.' },

            // GIÀY (TỐC ĐỘ)
            { name: 'Giày Vải', category: catId('Tốc độ'), tier: 1, price: 250, passive: '+30 Tốc chạy' },
            { name: 'Giày Kiên Cường', category: catId('Tốc độ'), tier: 2, price: 700, passive: 'Tăng 35% kháng hiệu ứng.' },
            { name: 'Giày Hộ Vệ', category: catId('Tốc độ'), tier: 2, price: 700, passive: 'Giảm 15% STVL nhận từ đòn đánh tay.' },
            { name: 'Giày Du Mục', category: catId('Tốc độ'), tier: 2, price: 700, passive: '+25% Tốc đánh.' },
            { name: 'Giày Thuật Sĩ', category: catId('Tốc độ'), tier: 2, price: 700, passive: '+15% Giảm hồi chiêu.' },
            { name: 'Giày Phù Thủy', category: catId('Tốc độ'), tier: 2, price: 700, passive: '+75 Xuyên giáp phép.' },
            { name: 'Giày Hermes', category: catId('Tốc độ'), tier: 2, price: 700, passive: 'Tăng 60 tốc chạy khi rời giao tranh.' },

            // TRỢ THỦ & RỪNG
            { name: 'Đại Địa Mở Trói', category: catId('Trợ thủ'), tier: 3, price: 1900, passive: 'Giải khống chế cho đồng minh xung quanh.' },
            { name: 'Đại Địa Ma Nhãn', category: catId('Trợ thủ'), tier: 3, price: 1900, passive: 'Phát hiện tướng tàng hình.' },
            { name: 'Thủy Triều Mở Trói', category: catId('Trợ thủ'), tier: 3, price: 1900, passive: 'Giải khống chế và buff công phép.' },
            { name: 'Rìu Leviathan', category: catId('Đi rừng'), tier: 3, price: 1750, passive: 'Thiêu đốt kẻ địch. Stack máu tối đa.' },
            { name: 'Kiếm Truy Hồn', category: catId('Đi rừng'), tier: 3, price: 1750, passive: 'Stack công vật lý và giảm hồi chiêu.' },
            { name: 'Gươm Loki', category: catId('Đi rừng'), tier: 3, price: 1750, passive: 'Stack công phép, đòn đánh sau chiêu gây thêm ST phép.' },
            { name: 'Cung Bão Tố', category: catId('Đi rừng'), tier: 3, price: 1750, passive: 'Stack tốc đánh.' }
        ];
        const createdItems = await Item.insertMany(itemsData);

        // 6. TẠO 70 VỊ TƯỚNG
        const heroesData = [
            // Đấu Sĩ
            { name: 'Florentino', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top'] },
            { name: 'Omen', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Yena', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top'] },
            { name: 'Richter', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Support'] },
            { name: 'Allain', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Maloch', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top', 'Support'] },
            { name: 'Arthur', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top'] },
            { name: 'Zuka', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Jungle'] },
            { name: 'Ryoma', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Jungle'] },
            { name: 'Airi', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Jungle'] },
            { name: 'Amily', roles: [roleId('Đấu sĩ')], lane: ['Top', 'Jungle'] },
            { name: 'Astrid', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Bijan', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top'] },
            { name: 'Charlotte', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Dextra', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Errol', roles: [roleId('Đấu sĩ')], lane: ['Top', 'Jungle'] },
            { name: 'Qi', roles: [roleId('Đấu sĩ')], lane: ['Top', 'Jungle'] },
            { name: 'Superman', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top', 'Support'] },
            { name: 'Tachi', roles: [roleId('Đấu sĩ')], lane: ['Top'] },
            { name: 'Yan', roles: [roleId('Đấu sĩ'), roleId('Sát thủ')], lane: ['Top', 'Jungle'] },
            
            // Sát thủ
            { name: 'Nakroth', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Ngộ Không', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Kaine', roles: [roleId('Sát thủ')], lane: ['Jungle', 'Support'] },
            { name: 'Quillen', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Aoi', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Keera', roles: [roleId('Sát thủ'), roleId('Pháp sư')], lane: ['Jungle'] },
            { name: 'Kriknak', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Zill', roles: [roleId('Sát thủ'), roleId('Pháp sư')], lane: ['Jungle'] },
            { name: 'Murad', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Paine', roles: [roleId('Sát thủ'), roleId('Pháp sư')], lane: ['Jungle', 'Mid'] },
            { name: 'Butterfly', roles: [roleId('Sát thủ'), roleId('Đấu sĩ')], lane: ['Jungle'] },
            { name: 'Enzo', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Sinestrea', roles: [roleId('Sát thủ')], lane: ['Jungle'] },
            { name: 'Zanis', roles: [roleId('Sát thủ'), roleId('Đấu sĩ')], lane: ['Jungle'] },

            // Pháp Sư
            { name: 'Krixi', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Aleister', roles: [roleId('Pháp sư'), roleId('Trợ thủ')], lane: ['Mid', 'Support'] },
            { name: 'Zata', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'] },
            { name: 'Liliana', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'] },
            { name: 'Dirak', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Veera', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Diaochan', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Lorion', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Tulen', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid', 'Jungle'] },
            { name: 'Natalya', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Iggy', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Azzen\'Ka', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'D\'Arcy', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid', 'Jungle'] },
            { name: 'Flash', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'] },
            { name: 'Ignis', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Ilumia', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Jinna', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Lauriel', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            { name: 'Raz', roles: [roleId('Pháp sư'), roleId('Sát thủ')], lane: ['Mid'] },
            { name: 'Yue', roles: [roleId('Pháp sư')], lane: ['Mid'] },
            
            // Xạ thủ
            { name: 'Hayate', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Elsu', roles: [roleId('Xạ thủ')], lane: ['ADC', 'Mid'] },
            { name: 'Yorn', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Tel\'Annas', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Violet', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Capheny', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Valhein', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Stuart', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Laville', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Brunhilda', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Celica', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Erin', roles: [roleId('Xạ thủ'), roleId('Pháp sư')], lane: ['ADC', 'Mid'] },
            { name: 'Fennik', roles: [roleId('Xạ thủ')], lane: ['Jungle', 'ADC'] },
            { name: 'Lindis', roles: [roleId('Xạ thủ')], lane: ['Jungle'] },
            { name: 'Slimz', roles: [roleId('Xạ thủ')], lane: ['Jungle', 'ADC'] },
            { name: 'Teeri', roles: [roleId('Xạ thủ')], lane: ['ADC'] },
            { name: 'Wisp', roles: [roleId('Xạ thủ')], lane: ['ADC'] },

            // Trợ thủ / Đỡ đòn
            { name: 'Chaugnar', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'] },
            { name: 'Grakk', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'] },
            { name: 'Arum', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Helen', roles: [roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Alice', roles: [roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Gildur', roles: [roleId('Đỡ đòn'), roleId('Pháp sư')], lane: ['Support', 'Mid'] },
            { name: 'Zip', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'] },
            { name: 'Max', roles: [roleId('Đấu sĩ'), roleId('Đỡ đòn')], lane: ['Top', 'Support'] },
            { name: 'Toro', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Lumburr', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Annette', roles: [roleId('Trợ thủ'), roleId('Pháp sư')], lane: ['Support', 'Mid'] },
            { name: 'Aya', roles: [roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Cresht', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Mina', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support', 'Top'] },
            { name: 'Omega', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Rouie', roles: [roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Teemee', roles: [roleId('Trợ thủ'), roleId('Đỡ đòn')], lane: ['Support'] },
            { name: 'Thane', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support'] },
            { name: 'Xeniel', roles: [roleId('Đỡ đòn'), roleId('Trợ thủ')], lane: ['Support', 'Top'] },
            { name: 'Taara', roles: [roleId('Đỡ đòn'), roleId('Đấu sĩ')], lane: ['Top', 'Jungle'] },
            { name: 'Skud', roles: [roleId('Đỡ đòn'), roleId('Đấu sĩ')], lane: ['Top', 'Jungle'] }
        ];
        const createdHeroes = await Hero.insertMany(heroesData);

        const hId = (name) => createdHeroes.find(h => h.name === name)?._id;
        const iId = (name) => createdItems.find(i => i.name === name)?._id;

        // 7. KÈO ĐẤU CỦA ADMIN (50 KÈO CHUẨN META)
        const adminMatchupsRaw = [
            // Khắc tàng hình
            { enemy: 'Ngộ Không', counter: 'Elsu', score: 5, items: [], note: 'Ưng Nhãn soi tàng hình.' },
            { enemy: 'Kaine', counter: 'Elsu', score: 5, items: [], note: 'Mìn soi rõ Kaine.' },
            { enemy: 'Quillen', counter: 'Max', score: 4, items: [], note: 'Chiêu cuối Max phá tàng hình Quillen.' },
            { enemy: 'Kaine', counter: 'Max', score: 4, items: [], note: 'Chiêu cuối bay thẳng đầu Kaine.' },
            { enemy: 'Ngộ Không', counter: 'Chaugnar', score: 4, items: ['Đại Địa Ma Nhãn', 'Giáp Hộ Mệnh'], note: 'Trâu bò và có Ma nhãn.' },
            
            // Khắc hồi máu
            { enemy: 'Taara', counter: 'Max', score: 5, items: ['Đao Truy Hồn'], note: 'Giảm hồi máu triệt để.' },
            { enemy: 'Helen', counter: 'Max', score: 5, items: ['Đao Truy Hồn'], note: 'Bắt thẳng Helen trong giao tranh.' },
            { enemy: 'Mina', counter: 'Hayate', score: 5, items: [], note: 'Thả diều sát thương chuẩn.' },
            { enemy: 'Arthur', counter: 'Hayate', score: 5, items: [], note: 'Sát thương chuẩn phá lớp giáp và hồi máu.' },
            { enemy: 'Taara', counter: 'Florentino', score: 4, items: ['Đao Truy Hồn'], note: 'Sát thương chuẩn đâm lủng Taara.' },
            
            // Khắc khống chế diện rộng
            { enemy: 'Grakk', counter: 'Chaugnar', score: 5, items: [], note: 'Giải hoàn toàn Bão Từ Trường.' },
            { enemy: 'Diaochan', counter: 'Chaugnar', score: 5, items: [], note: 'Giải đóng băng tức thì.' },
            { enemy: 'Gildur', counter: 'Chaugnar', score: 5, items: [], note: 'Phế chiêu cuối Gildur.' },
            { enemy: 'Lorion', counter: 'Chaugnar', score: 5, items: [], note: 'Hóa giải hất tung của Lorion.' },
            { enemy: 'Alice', counter: 'Chaugnar', score: 5, items: [], note: 'Giải câm lặng và làm chậm của Alice.' },
            { enemy: 'Darcy', counter: 'Chaugnar', score: 5, items: [], note: 'Hóa giải chiêu cuối nhốt người.' },
            { enemy: 'Arum', counter: 'Zip', score: 5, items: [], note: 'Hút đồng đội bị trói vào bụng.' },
            { enemy: 'Aleister', counter: 'Zip', score: 5, items: [], note: 'Cứu đồng đội khỏi Ngục Tù Vĩnh Hằng.' },
            
            // Khắc bay nhảy, sát thủ
            { enemy: 'Zata', counter: 'Aleister', score: 5, items: ['Huân Chương Troy'], note: 'Zata lướt là bị xích lại.' },
            { enemy: 'Paine', counter: 'Aleister', score: 5, items: ['Huân Chương Troy'], note: 'Paine bay vào bị xích thẳng.' },
            { enemy: 'Nakroth', counter: 'Omen', score: 5, items: ['Khiên Thất Truyền'], note: 'Sát Vực xích Nakroth không cho chạy.' },
            { enemy: 'Florentino', counter: 'Aleister', score: 5, items: [], note: 'Xích lại không cho múa.' },
            { enemy: 'Florentino', counter: 'Arum', score: 5, items: [], note: 'Thú Côn trói chặt Flo.' },
            { enemy: 'Nakroth', counter: 'Arum', score: 5, items: [], note: 'Trói Nakroth khi hắn lao vào.' },
            { enemy: 'Murad', counter: 'Arum', score: 5, items: [], note: 'Bắt Murad ngay khi hắn quay về bóng hoặc ảo ảnh.' },
            { enemy: 'Aoi', counter: 'Omen', score: 5, items: ['Khiên Thất Truyền'], note: 'Xích Aoi khi đu dây vào.' },

            // Khắc Tank/Lù đù
            { enemy: 'Toro', counter: 'Hayate', score: 5, items: ['Rìu Hyoga'], note: 'Sát thương chuẩn thả diều Toro.' },
            { enemy: 'Maloch', counter: 'Hayate', score: 5, items: ['Áo Choàng Băng Giá'], note: 'Cấu rỉa không cho Maloch chém.' },
            { enemy: 'Omen', counter: 'Hayate', score: 5, items: ['Rìu Hyoga'], note: 'Thả diều thoát khỏi xích của Omen.' },
            { enemy: 'Skud', counter: 'Hayate', score: 5, items: [], note: 'Sát thương chuẩn dọn Skud rất nhanh.' },
            { enemy: 'Xeniel', counter: 'Hayate', score: 4, items: [], note: 'Bắn nát lớp giáp của Xeniel.' },
            
            // Khắc AD
            { enemy: 'Yorn', counter: 'Zuka', score: 5, items: [], note: 'Sốc sát thương cực mạnh Yorn không kịp ngáp.' },
            { enemy: 'Tel\'Annas', counter: 'Aoi', score: 5, items: [], note: 'Đu dây không thể bị chọn, dồn dame Tel.' },
            { enemy: 'Yorn', counter: 'Kaine', score: 5, items: [], note: 'Tàng hình ám sát Xạ thủ không cơ động.' },
            { enemy: 'Capheny', counter: 'Zuka', score: 5, items: [], note: 'Bắt Capheny rất nhanh.' },
            { enemy: 'Violet', counter: 'Zuka', score: 4, items: [], note: 'Zuka cơ động hơn tầm lướt của Violet.' },
            { enemy: 'Valhein', counter: 'Aoi', score: 4, items: [], note: 'Aoi miễn chọn nên Valhein không stun được.' },
            
            // Các kèo đa dạng khác
            { enemy: 'Stuart', counter: 'Zill', score: 5, items: ['Quả Cầu Băng Sương'], note: 'Zill gây ST phép, xuyên qua miễn STVL của Stuart.' },
            { enemy: 'Ngộ Không', counter: 'Stuart', score: 5, items: [], note: 'Stuart bật chiêu 2 miễn ST chí mạng của khỉ.' },
            { enemy: 'Hayate', counter: 'Veera', score: 4, items: [], note: 'Hôn gió khóa Hayate đang múa và dồn dame chết.' },
            { enemy: 'Florentino', counter: 'Omen', score: 4, items: ['Khiên Thất Truyền', 'Giáp Thống Khổ'], note: 'Nhốt Flo không cho nhặt hoa.' },
            { enemy: 'Dirak', counter: 'Elsu', score: 5, items: ['Kiếm Muramasa'], note: 'Cấu rỉa Dirak từ xa, Dirak mất nội tại nhanh.' },
            { enemy: 'Airi', counter: 'Florentino', score: 4, items: ['Áo Choàng Băng Giá'], note: 'Sát thương chuẩn lấn át giáp ảo của Airi.' },
            { enemy: 'Elsu', counter: 'Max', score: 4, items: [], note: 'Bay thẳng đầu Elsu, ép Elsu bỏ vị trí ngắm.' },
            { enemy: 'Zata', counter: 'Toro', score: 4, items: ['Huân Chương Troy'], note: 'Toro bật chiêu 2 miễn thương đứng đỡ hết lông của Zata.' },
            { enemy: 'Zata', counter: 'Chaugnar', score: 4, items: ['Huân Chương Troy'], note: 'Chaugnar buff miễn thương giảm sát thương từ Zata bay.' },
            { enemy: 'Ignis', counter: 'Chaugnar', score: 5, items: [], note: 'Khắc chế hoàn toàn bộ choáng liên hoàn của Ignis.' },
            { enemy: 'Tulen', counter: 'Liliana', score: 4, items: ['Quả Cầu Băng Sương'], note: 'Biến cáo không thể chọn làm mục tiêu né lôi điểu.' },
            { enemy: 'Raz', counter: 'Chaugnar', score: 4, items: [], note: 'Miễn khống chế để chặn chuỗi ủn của Raz.' },
            { enemy: 'Superman', counter: 'Omen', score: 5, items: ['Rìu Hyoga'], note: 'Xích Superman lại, phế hoàn toàn tốc chạy của hắn.' },
            { enemy: 'Tachi', counter: 'Florentino', score: 4, items: [], note: 'Múa Flo linh hoạt né sát thương chuẩn của Tachi.' }
        ];

        // 8. KÈO ĐẤU CỦA USER (50 KÈO CÁ NHÂN / DỊ BẢN)
        const userMatchupsRaw = [
            { enemy: 'Florentino', counter: 'Valhein', score: 4, items: ['Trượng Băng'], note: 'Lên full phép, thả diều choáng liên tục không cho Flo nhặt hoa.' },
            { enemy: 'Florentino', counter: 'Arthur', score: 3, items: ['Áo Choàng Thần Ra'], note: 'Cứ lao vào câm lặng rồi chạy ra, cấu rỉa bằng chiêu 2.' },
            { enemy: 'Arthur', counter: 'Valhein', score: 4, items: [], note: 'Bắn thả diều Arthur đến chết.' },
            { enemy: 'Yorn', counter: 'Batman', score: 5, items: ['Thương Xuyên Phá'], note: 'Tàng hình combo 1 hit bay màu Yorn.' },
            { enemy: 'Tel\'Annas', counter: 'Ngộ Không', score: 5, items: ['Thánh Kiếm', 'Song Đao Bão Táp'], note: 'Đập chí mạng 2 gậy Tel bay màu.' },
            { enemy: 'Veera', counter: 'Nakroth', score: 4, items: ['Giày Kiên Cường'], note: 'Né hôn gió bằng lướt, sau đó lao vào gõ Veera.' },
            { enemy: 'Natalya', counter: 'Nakroth', score: 5, items: [], note: 'Lướt ra sau lưng Nat lúc cô ta đang xả chiêu cuối.' },
            { enemy: 'Diaochan', counter: 'Krixi', score: 4, items: ['Vương Miện Hecate'], note: 'Dùng chiêu 1 cấu rỉa phá khiên Diaochan từ xa.' },
            { enemy: 'Veera', counter: 'Krixi', score: 3, items: ['Quả Cầu Băng Sương'], note: 'Hất tung trước khi Veera kịp vào tầm ném hôn gió.' },
            { enemy: 'Valhein', counter: 'Butterfly', score: 4, items: ['Khiên Thất Truyền'], note: 'Núm lùm lao vào chém Valhein bất ngờ.' },
            { enemy: 'Grakk', counter: 'Toro', score: 5, items: [], note: 'Cố tình đứng lên trước cho Grakk kéo, team ăn trọn combo của Toro.' },
            { enemy: 'Grakk', counter: 'Mina', score: 5, items: [], note: 'Kéo Mina về Mina xoay nát team địch.' },
            { enemy: 'Hayate', counter: 'Jinna', score: 4, items: ['Quả Cầu Băng Sương'], note: 'Hayate lao vào bão tiêu thì Jinna bật chiêu cuối lùa lại.' },
            { enemy: 'Capheny', counter: 'Jinna', score: 4, items: ['Khiên Huyền Thoại'], note: 'Jinna bật ulti chạy theo Capheny ép góc.' },
            { enemy: 'Maloch', counter: 'Lauriel', score: 5, items: ['Mặt Nạ Berith'], note: 'Lauriel múa trong ulti Maloch không thể chém trúng.' },
            { enemy: 'Omen', counter: 'Lauriel', score: 5, items: [], note: 'Omen xích nhưng Lauriel múa vô địch trong lồng.' },
            { enemy: 'Zephys', counter: 'Lauriel', score: 4, items: ['Quả Cầu Băng Sương'], note: 'Né cú nhảy của Zephys bằng chiêu 2.' }, // Giả định Zephys là Nakroth/Zuka do ko có Zephys
            { enemy: 'Ryoma', counter: 'Zuka', score: 4, items: [], note: 'Zuka lướt qua chiêu 2 của Ryoma và dồn dame.' },
            { enemy: 'Allain', counter: 'Zuka', score: 3, items: ['Thương Xuyên Phá'], note: 'Cấu rỉa Allain chứ không đánh tay đôi.' },
            { enemy: 'Allain', counter: 'Hayate', score: 5, items: ['Rìu Hyoga'], note: 'Bắn xa làm chậm, Allain không chém được cái nào.' },
            { enemy: 'Allain', counter: 'Florentino', score: 4, items: [], note: 'Đọ kỹ năng tay đôi, Flo múa nhạy hơn.' },
            { enemy: 'Zuka', counter: 'Omen', score: 5, items: ['Giáp Thống Khổ'], note: 'Xích Zuka lại khi Zuka lao vào, bật khiên phản dame.' },
            { enemy: 'Airi', counter: 'Omen', score: 5, items: [], note: 'Xích Airi lại không cho lướt.' },
            { enemy: 'Airi', counter: 'Zuka', score: 4, items: [], note: 'Zuka dồn sát thương bạo phát nhanh hơn Airi.' },
            { enemy: 'Errol', counter: 'Omen', score: 5, items: ['Đao Truy Hồn'], note: 'Omen bật chiêu 2 đấm tay đôi thắng Errol.' },
            { enemy: 'Errol', counter: 'Florentino', score: 5, items: ['Đao Truy Hồn'], note: 'Né chiêu 2 của Errol và múa lủng sọ.' },
            { enemy: 'Batman', counter: 'Max', score: 5, items: [], note: 'Ulti soi tàng hình.' },
            { enemy: 'Batman', counter: 'Elsu', score: 5, items: [], note: 'Soi map bằng mìn.' },
            { enemy: 'Keera', counter: 'Aleister', score: 4, items: [], note: 'Đợi Keera hiện ra từ tường là xích.' },
            { enemy: 'Keera', counter: 'Arum', score: 4, items: [], note: 'Trói Keera bảo kê xạ thủ.' },
            { enemy: 'Eland\'orr', counter: 'Aleister', score: 5, items: [], note: 'Khóa chết con bướm ảo diệu.' },
            { enemy: 'Tulen', counter: 'Aleister', score: 4, items: [], note: 'Tulen biến ảnh vào là xích.' },
            { enemy: 'Tulen', counter: 'Veera', score: 4, items: [], note: 'Núp lùm dồn dame Tulen trước khi hắn tích nội tại.' },
            { enemy: 'Iggy', counter: 'Zuka', score: 5, items: [], note: 'Luồn ra sau và gõ đầu Iggy.' },
            { enemy: 'Yue', counter: 'Nakroth', score: 5, items: [], note: 'Cơ động áp sát Yue, Yue không có góc bắn.' },
            { enemy: 'Yue', counter: 'Aoi', score: 5, items: [], note: 'Đu dây áp sát Yue bất ngờ.' },
            { enemy: 'Dirak', counter: 'Zuka', score: 4, items: ['Thương Xuyên Phá'], note: 'Vượt qua tường lửa và gõ.' },
            { enemy: 'Laville', counter: 'Ngộ Không', score: 5, items: [], note: 'Gõ sau lưng Laville bất ngờ.' },
            { enemy: 'Laville', counter: 'Zuka', score: 5, items: [], note: 'Laville không có lướt, mồi ngon của gấu.' },
            { enemy: 'Celica', counter: 'Elsu', score: 5, items: [], note: 'Celica dựng pháo đứng im làm bia tập bắn cho Elsu.' },
            { enemy: 'Brunhilda', counter: 'Elsu', score: 5, items: [], note: 'Bắn tỉa ngoài tầm pháo.' },
            { enemy: 'Wisp', counter: 'Kaine', score: 4, items: [], note: 'Ám sát Wisp.' },
            { enemy: 'Slimz', counter: 'Kaine', score: 4, items: [], note: 'Chờ Slimz quăng hụt lao rồi ám sát.' },
            { enemy: 'Alice', counter: 'Zip', score: 4, items: [], note: 'Hút đồng đội ra khỏi vùng câm lặng.' },
            { enemy: 'Helen', counter: 'Mina', score: 4, items: ['Đao Truy Hồn'], note: 'Kéo Helen vào cấm hồi máu.' },
            { enemy: 'Aya', counter: 'Aleister', score: 5, items: [], note: 'Aya nhảy xuống là xích luôn không cho lên lại.' },
            { enemy: 'Mina', counter: 'Toro', score: 3, items: [], note: 'Trâu bò húc nhau, Toro miễn khống.' },
            { enemy: 'Gildur', counter: 'Toro', score: 4, items: [], note: 'Gildur xịt choáng vô dụng với nội tại Toro.' },
            { enemy: 'Cresht', counter: 'Hayate', score: 5, items: [], note: 'Cresht bật ulti càng to Hayate bắn phi tiêu càng dễ trúng.' },
            { enemy: 'Omega', counter: 'Chaugnar', score: 4, items: [], note: 'Giải choáng của máy sấy.' }
        ];

        // Lọc và chèn kèo Admin
        const validAdminMatchups = adminMatchupsRaw.filter(m => hId(m.enemy) && hId(m.counter)).map(m => ({
            enemyHeroId: hId(m.enemy), counterHeroId: hId(m.counter), score: m.score,
            counterItems: m.items.map(itemName => iId(itemName)).filter(id => id),
            note: m.note, author: adminUser._id
        }));
        await Matchup.insertMany(validAdminMatchups);
        console.log(`🔥 Đã tạo ${validAdminMatchups.length} Kèo Khắc Chế của ADMIN (Hệ thống)!`);

        // Lọc và chèn kèo User
        const validUserMatchups = userMatchupsRaw.filter(m => hId(m.enemy) && hId(m.counter)).map(m => ({
            enemyHeroId: hId(m.enemy), counterHeroId: hId(m.counter), score: m.score,
            counterItems: m.items.map(itemName => iId(itemName)).filter(id => id),
            note: m.note, author: normalUser._id
        }));
        await Matchup.insertMany(validUserMatchups);
        console.log(`🔥 Đã tạo ${validUserMatchups.length} Kèo Khắc Chế của USER (Cá nhân)!`);

        console.log('🎉 TOÀN BỘ DỮ LIỆU "KHỦNG" ĐÃ ĐƯỢC BƠM THÀNH CÔNG!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Có lỗi xảy ra trong quá trình seed dữ liệu:', error);
        process.exit(1);
    }
};

seedDatabase();