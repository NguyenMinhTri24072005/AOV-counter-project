require('dotenv').config();
const mongoose = require('mongoose');

// Chú ý: Đảm bảo đường dẫn này khớp với tên file model của bạn trong thư mục src/models/
const Hero = require('./src/models/Heros'); 
const Item = require('./src/models/Item');
const Matchup = require('./src/models/Matchup');

const seedDatabase = async () => {
    try {
        // Kết nối Database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối Database thành công!');

        // 1. XÓA DỮ LIỆU CŨ (Để tránh bị nhân đôi dữ liệu khi chạy script nhiều lần)
        await Hero.deleteMany();
        await Item.deleteMany();
        await Matchup.deleteMany();
        console.log('🗑️ Đã dọn dẹp dữ liệu cũ!');

        // 2. TẠO DỮ LIỆU TRANG BỊ
        const itemsData = [
            { name: 'Đao Truy Hồn', type: 'Công vật lý', price: 2000, passive: 'Giảm 40% khả năng hồi máu của mục tiêu.' },
            { name: 'Sách Truy Hồn', type: 'Phép thuật', price: 2000, passive: 'Giảm 40% khả năng hồi máu của mục tiêu.' },
            { name: 'Rìu Hyoga', type: 'Phòng thủ', price: 1900, passive: 'Đòn đánh thường làm chậm tốc chạy kẻ địch.' },
            { name: 'Khiên Thất Truyền', type: 'Phòng thủ', price: 2100, passive: 'Giảm tốc đánh của kẻ địch lân cận.' }
        ];
        const createdItems = await Item.insertMany(itemsData);
        console.log('⚔️ Đã tạo xong Trang bị!');

        // 3. TẠO DỮ LIỆU TƯỚNG
        const heroesData = [
            { name: 'Florentino', role: 'Đấu sĩ', lane: ['Top'], tags: ['Sát thương chuẩn', 'Kỹ năng cao'] },
            { name: 'Omen', role: 'Đấu sĩ', lane: ['Top'], tags: ['Khống chế cứng', 'Chống chịu'] },
            { name: 'Taara', role: 'Đỡ đòn', lane: ['Top', 'Jungle'], tags: ['Hồi máu khủng'] },
            { name: 'Hayate', role: 'Xạ thủ', lane: ['ADC'], tags: ['Cơ động', 'Sát thương chuẩn'] },
            { name: 'Zuka', role: 'Sát thủ', lane: ['Top', 'Jungle'], tags: ['Sốc sát thương', 'Cơ động'] },
            { name: 'Arum', role: 'Trợ thủ', lane: ['Support'], tags: ['Khống chế áp chế', 'Hồi máu'] }
        ];
        const createdHeroes = await Hero.insertMany(heroesData);
        console.log('🦸 Đã tạo xong Tướng!');

        // --- Hàm Helper để tìm nhanh ID của Tướng/Trang bị từ tên ---
        const getHeroId = (name) => createdHeroes.find(h => h.name === name)._id;
        const getItemId = (name) => createdItems.find(i => i.name === name)._id;

        // 4. TẠO DỮ LIỆU KÈO KHẮC CHẾ
        const matchupsData = [
            {
                enemyHeroId: getHeroId('Florentino'),
                counterHeroId: getHeroId('Omen'),
                score: 4,
                counterItems: [getItemId('Khiên Thất Truyền')],
                note: 'Omen dùng chiêu cuối xích Florentino lại, làm mất độ cơ động múa hoa.'
            },
            {
                enemyHeroId: getHeroId('Taara'),
                counterHeroId: getHeroId('Omen'),
                score: 5,
                counterItems: [getItemId('Đao Truy Hồn')],
                note: 'Taara hồi máu rất nhiều, Omen cần lên Đao Truy Hồn để giảm hồi máu và dùng xích để bắt chết.'
            },
            {
                enemyHeroId: getHeroId('Taara'),
                counterHeroId: getHeroId('Florentino'),
                score: 4,
                counterItems: [getItemId('Đao Truy Hồn')],
                note: 'Sát thương chuẩn của Flo múa lủng lớp giáp của Taara một cách dễ dàng.'
            },
            {
                enemyHeroId: getHeroId('Omen'),
                counterHeroId: getHeroId('Hayate'),
                score: 5,
                counterItems: [getItemId('Rìu Hyoga')],
                note: 'Hayate có thể thả diều Omen đến chết nhờ độ cơ động, Rìu Hyoga giúp làm chậm khiến Omen không thể tiếp cận.'
            },
            {
                enemyHeroId: getHeroId('Florentino'),
                counterHeroId: getHeroId('Arum'),
                score: 5,
                counterItems: [],
                note: 'Cứ lao vào múa là Arum dùng Thú Côn (Chiêu cuối) áp chế không cho nhúc nhích.'
            }
        ];
        await Matchup.insertMany(matchupsData);
        console.log('🔥 Đã tạo xong Kèo Khắc Chế!');

        console.log('🎉 TOÀN BỘ DỮ LIỆU ĐÃ ĐƯỢC BƠM THÀNH CÔNG!');
        process.exit(0); // Tắt script an toàn
    } catch (error) {
        console.error('❌ Có lỗi xảy ra trong quá trình seed dữ liệu:', error);
        process.exit(1); // Tắt script và báo lỗi
    }
};

// Chạy hàm
seedDatabase();