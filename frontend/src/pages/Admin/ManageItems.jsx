import React, { useState, useEffect } from 'react';
import { getItems, getCategories, createItem, updateItem, deleteItem } from '../../services/api';

const ManageItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);

    const initialForm = { name: '', category: '', tier: 3, price: '', passive: '' };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resItems, resCats] = await Promise.all([getItems(), getCategories()]);
            setItems(resItems.data);
            setCategories(resCats.data);
        } catch (error) { console.error("Lỗi:", error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingId) {
                await updateItem(editingId, formData);
                alert("Cập nhật trang bị thành công!");
            } else {
                await createItem(formData);
                alert("Thêm trang bị thành công!");
            }
            setFormData(initialForm);
            setEditingId(null);
            loadData();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (item) => {
        setFormData({
            name: item.name,
            // Sửa logic ở đây: Nếu là Object thì lấy ._id, nếu là chuỗi thì lấy chính nó
            category: item.category?._id || item.category || '',
            tier: item.tier,
            price: item.price || '',
            passive: item.passive || ''
        });
        setEditingId(item._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa trang bị này?")) {
            await deleteItem(id);
            loadData();
        }
    };

    const cancelEdit = () => { setFormData(initialForm); setEditingId(null); };

    return (
        <div className="manage-container">
            <h2>⚔️ Quản lý danh sách Trang bị</h2>

            <form className={`admin-form ${editingId ? 'editing' : ''}`} onSubmit={handleSubmit}>
                {editingId && <h4 className="edit-badge">Đang chỉnh sửa: {formData.name}</h4>}

                <div className="form-row">
                    <input type="text" placeholder="Tên trang bị" required
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                        <option value="">-- Chọn Phân loại --</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    <select value={formData.tier} onChange={e => setFormData({ ...formData, tier: Number(e.target.value) })}>
                        <option value="3">Cấp 3 (Mạnh nhất)</option>
                        <option value="2">Cấp 2</option>
                        <option value="1">Cấp 1</option>
                    </select>

                    <input type="number" placeholder="Giá tiền" value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : '' })} />
                </div>

                <textarea className="form-textarea" placeholder="Mô tả Nội tại của trang bị..."
                    value={formData.passive} onChange={e => setFormData({ ...formData, passive: e.target.value })} />

                <div className="form-actions">
                    <button type="submit" className={`btn-save ${editingId ? 'btn-update' : ''}`} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : (editingId ? 'Cập Nhật Trang Bị' : 'Lưu Trang Bị')}
                    </button>
                    {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Hủy Sửa</button>}
                </div>
            </form>

            <table className="admin-table">
                <thead><tr><th>Tên Trang bị</th><th>Loại</th><th>Cấp độ</th><th>Nội tại</th><th>Thao tác</th></tr></thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item._id}>
                            <td><strong>{item.name}</strong></td><td>{item.category?.name || '---'}</td>
                            <td>Cấp {item.tier}</td><td>{item.passive}</td>
                            <td>
                                <button className="btn-edit" onClick={() => handleEditClick(item)}>Sửa</button>
                                <button className="btn-del" onClick={() => handleDeleteClick(item._id)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageItems;