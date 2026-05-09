import React, { useState, useEffect } from 'react';
import { getItems, getCategories, createItem, updateItem, deleteItem, uploadImage } from '../../services/api';

const getItemIconUrl = (url) => {
    if (!url) return 'https://placehold.co/60x60?text=Item';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

// ==========================================
// 1. MODAL XEM CHI TIẾT TRANG BỊ
// ==========================================
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

// ==========================================
// 2. COMPONENT QUẢN LÝ TRANG BỊ (CHÍNH)
// ==========================================
const ManageItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25; // 🌟 Phân trang: 24 trang bị / trang

    // Form Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const initialForm = { name: '', icon: '', category: '', tier: 3, price: '', passive: '' };
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => { loadData(); }, []);

    // Reset về trang 1 khi thay đổi bộ lọc
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, tierFilter]);

    const loadData = async () => {
        try {
            const [resItems, resCats] = await Promise.all([getItems(), getCategories()]);
            // Tương thích cả trường hợp Backend có hoặc chưa có phân trang
            const fetchedItems = resItems.data.data ? resItems.data.data : resItems.data;
            setItems(fetchedItems);
            setCategories(resCats.data);
        } catch (error) { console.error("Lỗi:", error); }
    };

    const filteredItems = items.filter(item => {
        const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter ? (item.category?._id === categoryFilter || item.category === categoryFilter) : true;
        const matchTier = tierFilter ? item.tier === Number(tierFilter) : true;
        return matchName && matchCategory && matchTier;
    });

    // 🌟 Logic Phân Trang
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            closeFormModal();
            loadData();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const openAddForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsFormOpen(true);
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
        setIsFormOpen(true);
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

    const closeFormModal = () => {
        setIsFormOpen(false);
        setFormData(initialForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    return (
        <div className="manage-container">
            {/* TIÊU ĐỀ VÀ NÚT THÊM MỚI */}
            <div className="flex-row-gap" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>⚔️ QUẢN LÝ TRANG BỊ</h2>
                <button 
                    onClick={openAddForm} 
                    className="btn-save" 
                    style={{ background: '#10b981', padding: '10px 20px', borderRadius: '8px' }}
                >
                    ➕ THÊM TRANG BỊ MỚI
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM */}
            <div className="filter-bar" style={{ marginTop: '0' }}>
                <input type="text" placeholder="🔍 Tìm tên trang bị..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả phân loại --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả cấp độ --</option>
                    <option value="3">Cấp 3 (Mạnh nhất)</option>
                    <option value="2">Cấp 2</option>
                    <option value="1">Cấp 1</option>
                </select>
            </div>

            {/* DANH SÁCH TRANG BỊ */}
            <div className="item-grid">
                {currentItems.length > 0 ? (
                    currentItems.map(item => (
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
                    <div className="empty-filter-msg">
                        Không tìm thấy trang bị nào phù hợp với bộ lọc.
                    </div>
                )}
            </div>

            {/* THANH PHÂN TRANG */}
            {totalPages > 1 && (
                <div className="pagination-bar">
                    <button className="btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                        ◀ TRƯỚC
                    </button>
                    <span className="page-info">
                        TRANG {currentPage} / {totalPages}
                    </span>
                    <button className="btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                        SAU ▶
                    </button>
                </div>
            )}

            {/* MODAL CHI TIẾT KHI CLICK VÀO THẺ TRANG BỊ */}
            {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

            {/* ==========================================
                3. MODAL NHẬP LIỆU (THÊM / SỬA TRANG BỊ)
            ========================================== */}
            {isFormOpen && (
                <div className="card-detail-overlay" onClick={closeFormModal} style={{ zIndex: 10000 }}>
                    <div 
                        className="cyber-panel" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            background: '#0f172a', width: '90%', maxWidth: '700px', maxHeight: '90vh', 
                            padding: '30px', borderRadius: '12px', overflowY: 'auto', 
                            border: `2px solid ${editingId ? '#f59e0b' : '#10b981'}`,
                            position: 'relative'
                        }}
                    >
                        <button className="close-modal-btn" onClick={closeFormModal}>×</button>
                        <h2 style={{ color: editingId ? '#f59e0b' : '#10b981', marginBottom: '25px', fontFamily: 'Oswald', textTransform: 'uppercase' }}>
                            {editingId ? `✏️ CẬP NHẬT: ${formData.name}` : '➕ THÊM TRANG BỊ MỚI'}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Hàng 1: Tên, Phân loại, Cấp độ, Giá */}
                            <div className="form-row">
                                <input type="text" placeholder="Tên trang bị" required className="filter-input"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <select required className="filter-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="">-- Phân loại --</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <select className="filter-select" value={formData.tier} onChange={e => setFormData({ ...formData, tier: Number(e.target.value) })}>
                                    <option value="3">Cấp 3</option>
                                    <option value="2">Cấp 2</option>
                                    <option value="1">Cấp 1</option>
                                </select>
                                <input type="number" placeholder="Giá tiền" className="filter-input"
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : '' })} />
                            </div>

                            {/* Hàng 2: Up ảnh và Nội tại */}
                            <div className="form-row align-start mt-20">
                                <div className="form-col">
                                    <div className="form-row">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="filter-input img-upload-input" />
                                        <input type="text" placeholder="Hoặc dán Link URL ảnh..."
                                            value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="filter-input" />
                                    </div>
                                    <textarea className="form-textarea txt-no-mt" placeholder="Mô tả Nội tại của trang bị (Hiệu ứng đặc biệt)..."
                                        value={formData.passive} onChange={e => setFormData({ ...formData, passive: e.target.value })} />
                                </div>
                                <div className="preview-box">
                                    <span className="preview-label">Xem trước</span>
                                    <img src={previewUrl || getItemIconUrl(formData.icon)} alt="Preview" className="preview-img item-preview" />
                                </div>
                            </div>

                            <button type="submit" className="btn-save" style={{ width: '100%', height: '50px', fontSize: '18px', background: editingId ? '#f59e0b' : '#10b981' }} disabled={isLoading}>
                                {isLoading ? "ĐANG XỬ LÝ..." : (editingId ? '💾 LƯU CẬP NHẬT TRANG BỊ' : '➕ XÁC NHẬN THÊM')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageItems;