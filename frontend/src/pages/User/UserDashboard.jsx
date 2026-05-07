import React, { useState, useEffect, useContext } from 'react';
import { getHeroes, getItems, createMatchup, getMyMatchups, deleteMatchup } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import '../Admin/Admin.css'; 

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const [items, setItems] = useState([]);
    const [myMatchups, setMyMatchups] = useState([]);
    
    const initialForm = { enemyHeroId: '', counterHeroId: '', score: 3, note: '', counterItems: [] };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [resHeroes, resItems, resMatchups] = await Promise.all([
                getHeroes(), getItems(), getMyMatchups(user.id)
            ]);
            setHeroes(resHeroes.data);
            setItems(resItems.data);
            setMyMatchups(resMatchups.data);
        } catch (error) { console.error("Lỗi:", error); }
    };

    const handleItemToggle = (itemId) => {
        const newItems = formData.counterItems.includes(itemId)
            ? formData.counterItems.filter(id => id !== itemId)
            : [...formData.counterItems, itemId];
        setFormData({ ...formData, counterItems: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMatchup({ ...formData, author: user.id });
            alert("Tạo Kèo Cá Nhân thành công!");
            setFormData(initialForm);
            loadData();
        } catch (error) { alert("Lỗi tạo kèo: " + error.message); }
    };

    const handleDelete = async (matchupId) => {
        if (window.confirm("Bạn muốn xóa Kèo cá nhân này?")) {
            try {
                await deleteMatchup(matchupId);
                loadData();
            } catch (error) { alert("Lỗi xóa kèo!"); }
        }
    }

    const getHeroName = (id) => heroes.find(h => h._id === id)?.name || "Unknown";

    return (
        <div className="manage-container">
            <h2>👤 Bí kíp khắc chế của {user?.username}</h2>
            
            <form className="admin-form" onSubmit={handleSubmit}>
                <div className="matchup-grid">
                    <div>
                        <label className="matchup-label enemy">Tướng Địch (Bị Khắc Chế):</label>
                        <select className="matchup-select" required value={formData.enemyHeroId} onChange={e => setFormData({...formData, enemyHeroId: e.target.value})}>
                            <option value="">-- Chọn tướng địch --</option>
                            {heroes.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="matchup-label ally">Tướng Ta (Khắc chế):</label>
                        <select className="matchup-select" required value={formData.counterHeroId} onChange={e => setFormData({...formData, counterHeroId: e.target.value})}>
                            <option value="">-- Chọn tướng khắc chế --</option>
                            {heroes.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="score-container">
                    <label className="matchup-label">Độ hiệu quả (1 - 5):</label>
                    <input className="score-slider" type="range" min="1" max="5" value={formData.score} onChange={e => setFormData({...formData, score: Number(e.target.value)})}/>
                    <span className="score-display">{formData.score} Điểm</span>
                </div>

                <div className="checkbox-group" style={{ marginTop: '15px' }}>
                    <label className="matchup-label">Khuyên lên trang bị:</label>
                    <div className="item-checkbox-list">
                        {items.map(item => (
                            <label key={item._id} className="item-checkbox-label">
                                <input type="checkbox" checked={formData.counterItems.includes(item._id)} onChange={() => handleItemToggle(item._id)} style={{marginRight: '5px'}}/> 
                                {item.name}
                            </label>
                        ))}
                    </div>
                </div>

                <textarea className="form-textarea" placeholder="Ghi chú chiến thuật của riêng bạn..." required value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                <div className="form-actions"><button type="submit" className="btn-save">Lưu Bí Kíp</button></div>
            </form>

            <hr style={{ margin: '30px 0', border: '1px solid #eee' }} />
            
            <h3>📋 Danh sách Kèo bạn đã tạo ({myMatchups.length})</h3>
            <table className="admin-table">
                <thead>
                    <tr><th>Địch</th><th>Tướng Ta</th><th>Điểm</th><th>Ghi chú</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                    {myMatchups.map(m => (
                        <tr key={m._id}>
                            <td style={{ color: '#dc3545', fontWeight: 'bold' }}>{getHeroName(m.enemyHeroId)}</td>
                            <td style={{ color: '#0d6efd', fontWeight: 'bold' }}>{getHeroName(m.counterHeroId)}</td>
                            <td>{m.score}</td>
                            <td>{m.note}</td>
                            <td><button className="btn-del" onClick={() => handleDelete(m._id)}>Xóa</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserDashboard;