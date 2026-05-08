import React, { useState, useEffect } from 'react';
import { getItems, getCategories, createItem, updateItem, deleteItem, uploadImage } from '../../services/api';

const getItemIconUrl = (url) => {
    if (!url) return 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const ItemDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="card-detail-overlay" onClick={onClose}>
            <div className="card-detail-popup item-detail-popup" onClick={e => e.stopPropagation()}>
                <button className="card-detail-close" onClick={onClose}>×</button>
                <div className="card-detail-header">
                    <img src={getItemIconUrl(item.icon)} alt={item.name} className="card-detail-avatar item-detail-icon" />
                    <div className="card-detail-header-info">
                        <div className="card-detail-name">{item.name}</div>
                        <div className="card-detail-meta item-category-badge">
                            {item.category?.name || 'Chưa phân loại'} — Cấp {item.tier}
                        </div>
                        <div className="card-detail-price">💰 {item.price || 0} Vàng</div>
                    </div>
                </div>
                <div className="card-detail-passive">
                    <div className="passive-label">⚡ Nội tại</div>
                    <div className="passive-text">{item.passive || 'Trang bị này không có nội tại.'}</div>
                </div>
            </div>
        </div>
    );
};

const ManageItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');

    const initialForm = { name: '', icon: '', category: '', tier: 3, price: '', passive: '' };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resItems, resCats] = await Promise.all([getItems(), getCategories()]);
            setItems(resItems.data);
            setCategories(resCats.data);
        } catch (error) { console.error("Lỗi:", error); }
    };

    const filteredItems = items.filter(item => {
        const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter ? (item.category?._id === categoryFilter || item.category === categoryFilter) : true;
        const matchTier = tierFilter ? item.tier === Number(tierFilter) : true;
        return matchName && matchCategory && matchTier;
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let iconUrl = formData.icon;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                const res = await uploadImage(uploadData);
                iconUrl = res.data.url;
            }
            const dataToSave = { ...formData, icon: iconUrl };
            if (editingId) {
                await updateItem(editingId, dataToSave);
                alert("Cập nhật trang bị thành công!");
            } else {
                await createItem(dataToSave);
                alert("Thêm trang bị thành công!");
            }
            cancelEdit();
            loadData();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (item, e) => {
        e.stopPropagation();
        setFormData({
            name: item.name,
            icon: item.icon || '',
            category: item.category?._id || item.category || '',
            tier: item.tier,
            price: item.price || '',
            passive: item.passive || ''
        });
        setEditingId(item._id);
        setSelectedFile(null);
        setPreviewUrl(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa trang bị này?")) {
            try {
                await deleteItem(id);
                loadData();
            } catch (error) { alert("Lỗi khi xóa!"); }
        }
    };

    const cancelEdit = () => {
        setFormData(initialForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

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
                    <input type="number" placeholder="Giá tiền"
                        value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : '' })} />
                </div>

                <div className="form-row align-start" style={{ marginTop: '15px' }}>
                    <div className="form-col">
                        <div className="form-row">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="filter-input" style={{ padding: '7px' }} />
                            <input type="text" placeholder="Hoặc dán Link ảnh URL..."
                                value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="filter-input" />
                        </div>
                        <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Mô tả Nội tại của trang bị..."
                            value={formData.passive} onChange={e => setFormData({ ...formData, passive: e.target.value })} />
                    </div>
                    <div className="preview-box">
                        <span className="preview-label">Xem trước</span>
                        <img src={previewUrl || getItemIconUrl(formData.icon)} alt="Preview" className="preview-img item-preview" />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className={`btn-save ${editingId ? 'btn-update' : ''}`} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : (editingId ? 'Cập Nhật Trang Bị' : 'Lưu Trang Bị')}
                    </button>
                    {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Hủy Sửa</button>}
                </div>
            </form>

            <div className="filter-bar">
                <input type="text" placeholder="🔍 Tìm tên trang bị..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả phân loại --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả cấp độ --</option>
                    <option value="3">Cấp 3</option>
                    <option value="2">Cấp 2</option>
                    <option value="1">Cấp 1</option>
                </select>
            </div>

            <div className="item-grid">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div key={item._id} className="item-card" onClick={() => setSelectedItem(item)} title="Nhấn để xem chi tiết">
                            <img src={getItemIconUrl(item.icon)} alt={item.name} className="item-card-img" />
                            <strong className="item-card-name">{item.name}</strong>
                            <div className="item-card-category">
                                {item.category?.name || 'Chưa phân loại'} - Cấp {item.tier}
                            </div>
                            <div className="item-card-price">💰 {item.price || 0} Vàng</div>
                            <div className="card-click-hint">Nhấn để xem nội tại</div>
                            <div className="item-card-actions">
                                <button className="btn-edit" onClick={(e) => handleEditClick(item, e)}>Sửa</button>
                                <button className="btn-del" onClick={(e) => handleDeleteClick(item._id, e)}>Xóa</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#666' }}>
                        Không tìm thấy trang bị nào phù hợp với bộ lọc.
                    </div>
                )}
            </div>

            {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};

export default ManageItems;