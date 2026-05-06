import React, { useState, useEffect, useContext } from 'react';
import { getHeroes, getItems, createMatchup } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const ManageMatchups = () => {
    const { user } = useContext(AuthContext); // Lấy user hiện tại (Admin)
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    
    const initialForm = { enemyHeroId: '', counterHeroId: '', score: 3, note: '', counterItems: [] };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        const loadData = async () => {
            const [resHeroes, resItems] = await Promise.all([getHeroes(), getItems()]);
            setHeroes(resHeroes.data);
            setItems(resItems.data);
        };
        loadData();
    }, []);

    const handleItemToggle = (itemId) => {
        const newItems = formData.counterItems.includes(itemId)
            ? formData.counterItems.filter(id => id !== itemId)
            : [...formData.counterItems, itemId];
        setFormData({ ...formData, counterItems: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Gắn author là ID của Admin hiện tại vào request
            const payload = { ...formData, author: user.id }; 
            await createMatchup(payload);
            alert("Tạo Kèo Khắc Chế Chuẩn thành công!");
            setFormData(initialForm);
        } catch (error) {
            alert("Lỗi tạo kèo: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="manage-container">
            <h2>🔥 Quản lý Kèo Khắc Chế (Chuẩn Server)</h2>
            
            <form className="admin-form" onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* BÊN TRÁI: TƯỚNG ĐỊCH */}
                    <div>
                        <label style={{ fontWeight: 'bold', color: '#dc3545', display: 'block', marginBottom: '5px' }}>Tướng Địch (Bị Khắc Chế):</label>
                        <select required value={formData.enemyHeroId} onChange={e => setFormData({...formData, enemyHeroId: e.target.value})} style={{ width: '100%', padding: '10px' }}>
                            <option value="">-- Chọn tướng địch --</option>
                            {heroes.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                    </div>

                    {/* BÊN PHẢI: TƯỚNG TA */}
                    <div>
                        <label style={{ fontWeight: 'bold', color: '#0d6efd', display: 'block', marginBottom: '5px' }}>Tướng Đề Xuất (Pick Ta):</label>
                        <select required value={formData.counterHeroId} onChange={e => setFormData({...formData, counterHeroId: e.target.value})} style={{ width: '100%', padding: '10px' }}>
                            <option value="">-- Chọn tướng khắc chế --</option>
                            {heroes.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Điểm Tối Ưu (1 - 5):</label>
                    <input type="range" min="1" max="5" value={formData.score} onChange={e => setFormData({...formData, score: Number(e.target.value)})} style={{ width: '200px' }}/>
                    <span style={{ marginLeft: '10px', fontWeight: 'bold', fontSize: '18px' }}>{formData.score} Điểm</span>
                </div>

                <div className="checkbox-group" style={{ marginTop: '15px' }}>
                    <label>Khuyên lên trang bị:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {items.map(item => (
                            <label key={item._id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#f1f3f5', padding: '5px 10px', borderRadius: '4px' }}>
                                <input type="checkbox" checked={formData.counterItems.includes(item._id)} onChange={() => handleItemToggle(item._id)} /> 
                                {item.name}
                            </label>
                        ))}
                    </div>
                </div>

                <textarea 
                    placeholder="Giải thích vì sao lại khắc chế (Chi tiết kỹ năng, lý do)..." 
                    required
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '15px', minHeight: '80px' }}
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})} 
                />

                <button type="submit" className="btn-save" style={{ marginTop: '15px' }}>Lưu Kèo Đấu</button>
            </form>
        </div>
    );
};

export default ManageMatchups;