import React, { useState, useEffect } from 'react';
import { getItems, getCategories } from '../../services/api';

const ManageItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    // State tạm để giữ cho form không bị lỗi (Chức năng thêm mới sẽ được nối API sau)
    const [formData, setFormData] = useState({
        name: '', category: '', tier: 3, price: 0, passive: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [resItems, resCats] = await Promise.all([getItems(), getCategories()]);
            setItems(resItems.data);
            setCategories(resCats.data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu trang bị", error);
        }
    };

    return (
        <div className="manage-container">
            <h2>⚔️ Quản lý danh sách Trang bị</h2>
            
            <form className="admin-form" onSubmit={(e) => { e.preventDefault(); alert("Sẽ kết nối API Create Item sau!"); }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <input type="text" placeholder="Tên trang bị" required 
                        onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <select required onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="">-- Chọn Phân loại --</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    <select onChange={e => setFormData({...formData, tier: Number(e.target.value)})}>
                        <option value="3">Cấp 3 (Mạnh nhất)</option>
                        <option value="2">Cấp 2</option>
                        <option value="1">Cấp 1</option>
                    </select>
                    
                    <input type="number" placeholder="Giá tiền" 
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>

                <textarea 
                    placeholder="Mô tả Nội tại của trang bị..." 
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '10px', minHeight: '60px' }}
                    onChange={e => setFormData({...formData, passive: e.target.value})} 
                />

                <button type="submit" className="btn-save" style={{ marginTop: '15px' }}>Lưu Trang Bị</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr><th>Tên Trang bị</th><th>Loại</th><th>Cấp độ</th><th>Nội tại</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item._id}>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.category?.name || 'Chưa phân loại'}</td>
                            <td>Cấp {item.tier}</td>
                            <td>{item.passive}</td>
                            <td>
                                <button className="btn-edit">Sửa</button> 
                                <button className="btn-del">Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageItems;