import React, { useState, useEffect } from 'react';
import { getHeroes, getRoles, createHero, updateHero, deleteHero, uploadImage } from '../../services/api';

const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=No+Image';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
};

const LANE_OPTIONS = ['Top', 'Jungle', 'Mid', 'AD', 'Support'];

const SKILL_LABELS = {
    passive: 'Nội tại',
    skill1: 'Chiêu 1',
    skill2: 'Chiêu 2',
    skill3: 'Chiêu 3',
    skill4: 'Chiêu 4',
};

// ==========================================
// 1. MODAL XEM CHI TIẾT TƯỚNG
// ==========================================
const HeroDetailModal = ({ hero, onClose }) => {
    if (!hero) return null;
    const skills = hero.skills || {};
    return (
        <div className="card-detail-overlay" onClick={onClose}>
            <div className="card-detail-popup hero-detail-popup" onClick={e => e.stopPropagation()}>
                <button className="card-detail-close" onClick={onClose}>×</button>
                <div className="card-detail-header">
                    <img src={getAvatarUrl(hero.avatar)} alt={hero.name} className="card-detail-avatar hero-detail-avatar" />
                    <div className="card-detail-header-info">
                        <div className="card-detail-name">{hero.name}</div>
                        <div className="card-detail-meta">{hero.roles?.map(r => r.name).join(', ')}</div>
                        <div className="card-detail-lane">{hero.lane?.join(' · ') || 'Chưa xếp đường'}</div>
                    </div>
                </div>
                <div className="card-detail-skills">
                    {Object.entries(SKILL_LABELS).map(([key, label]) => (
                        skills[key] ? (
                            <div key={key} className="skill-detail-row">
                                <span className="skill-detail-label">{label}</span>
                                <span className="skill-detail-desc">{skills[key]}</span>
                            </div>
                        ) : null
                    ))}
                    {!Object.values(skills).some(Boolean) && (
                        <div className="card-detail-empty">Chưa có thông tin kỹ năng.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. COMPONENT QUẢN LÝ TƯỚNG (CHÍNH)
// ==========================================
const ManageHeroes = () => {
    const [heroes, setHeroes] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHero, setSelectedHero] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24; 

    // Form Modal states
    const [isFormOpen, setIsFormOpen] = useState(false); // 🌟 Thêm cờ mở Form Modal
    const initialForm = {
        name: '', avatar: '', roles: [], lane: [],
        skills: { passive: '', skill1: '', skill2: '', skill3: '', skill4: '' }
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, laneFilter]);

    const loadData = async () => {
        const [resH, resR] = await Promise.all([getHeroes(), getRoles()]);
        setHeroes(resH.data.data); 
        setRoles(resR.data);
    };

    const filteredHeroes = heroes.filter(hero => {
        const matchName = hero.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter ? hero.roles?.some(r => r._id === roleFilter) : true;
        const matchLane = laneFilter ? hero.lane?.includes(laneFilter) : true;
        return matchName && matchRole && matchLane;
    });

    const totalPages = Math.ceil(filteredHeroes.length / itemsPerPage);
    const currentHeroes = filteredHeroes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRoleChange = (roleId) => {
        const newRoles = formData.roles.includes(roleId)
            ? formData.roles.filter(id => id !== roleId)
            : [...formData.roles, roleId];
        setFormData({ ...formData, roles: newRoles });
    };

    const handleLaneChange = (lane) => {
        const newLanes = formData.lane.includes(lane)
            ? formData.lane.filter(l => l !== lane)
            : [...formData.lane, lane];
        setFormData({ ...formData, lane: newLanes });
    };

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
            let avatarUrl = formData.avatar;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                const res = await uploadImage(uploadData);
                avatarUrl = res.data.url;
            }
            const dataToSave = { ...formData, avatar: avatarUrl };
            if (editingId) {
                await updateHero(editingId, dataToSave);
                alert("Cập nhật tướng thành công!");
            } else {
                await createHero(dataToSave);
                alert("Thêm tướng thành công!");
            }
            closeFormModal();
            loadData();
        } catch (error) { alert("Lỗi: " + error.message); }
        finally { setIsLoading(false); }
    };

    const openAddForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (hero, e) => {
        e.stopPropagation();
        setFormData({
            name: hero.name,
            avatar: hero.avatar || '',
            roles: hero.roles.map(r => r._id || r),
            lane: hero.lane || [],
            skills: hero.skills || initialForm.skills
        });
        setEditingId(hero._id);
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsFormOpen(true);
    };

    const handleDeleteClick = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Xóa Tướng này? Sẽ gây ảnh hưởng nếu đang có kèo khắc chế liên quan.")) {
            await deleteHero(id); loadData();
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
            {/* Tiêu đề & Nút Thêm Mới */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🦸 QUẢN LÝ TƯỚNG</h2>
                <button 
                    onClick={openAddForm} 
                    className="btn-save" 
                    style={{ background: '#38bdf8', padding: '10px 20px', borderRadius: '8px' }}
                >
                    ➕ THÊM TƯỚNG MỚI
                </button>
            </div>

            {/* BỘ LỌC TÌM KIẾM */}
            <div className="filter-bar" style={{ marginTop: '0' }}>
                <input type="text" placeholder="🔍 Tìm tên tướng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả vai trò --</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
                <select value={laneFilter} onChange={e => setLaneFilter(e.target.value)} className="filter-select">
                    <option value="">-- Tất cả đường --</option>
                    {LANE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            {/* DANH SÁCH TƯỚNG */}
            <div className="hero-grid">
                {currentHeroes.length > 0 ? (
                    currentHeroes.map(h => (
                        <div key={h._id} className="hero-card" onClick={() => setSelectedHero(h)} title="Nhấn để xem kỹ năng">
                            <img src={getAvatarUrl(h.avatar)} alt={h.name} className="hero-card-img" />
                            <span className="hero-card-name">{h.name}</span>
                            <div className="hero-card-roles">{h.roles?.map(r => r.name).join(', ')}</div>
                            <div className="hero-card-lane">{h.lane?.join(', ') || 'Chưa xếp đường'}</div>
                            <div className="card-click-hint">Nhấn để xem kỹ năng</div>
                            <div className="hero-card-actions">
                                <button className="btn-edit" onClick={(e) => handleEditClick(h, e)}>Sửa</button>
                                <button className="btn-del" onClick={(e) => handleDeleteClick(h._id, e)}>Xóa</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-filter-msg">Không tìm thấy tướng nào phù hợp với bộ lọc.</div>
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

            {/* ==========================================
                3. MODAL NHẬP LIỆU (THÊM / SỬA TƯỚNG)
            ========================================== */}
            {isFormOpen && (
                <div className="card-detail-overlay" onClick={closeFormModal} style={{ zIndex: 10000 }}>
                    <div 
                        className="cyber-panel" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            background: '#0f172a', width: '90%', maxWidth: '800px', maxHeight: '90vh', 
                            padding: '30px', borderRadius: '12px', overflowY: 'auto', 
                            border: `2px solid ${editingId ? '#f59e0b' : '#38bdf8'}`,
                            position: 'relative'
                        }}
                    >
                        <button className="close-modal-btn" onClick={closeFormModal}>×</button>
                        <h2 style={{ color: editingId ? '#f59e0b' : '#38bdf8', marginBottom: '25px', fontFamily: 'Oswald', textTransform: 'uppercase' }}>
                            {editingId ? `✏️ CẬP NHẬT: ${formData.name}` : '➕ THÊM TƯỚNG MỚI'}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-row align-start">
                                <div className="form-col">
                                    <input type="text" placeholder="Tên tướng" required className="filter-input"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    <div className="form-row">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="filter-input img-upload-input" />
                                        <input type="text" placeholder="Hoặc dán Link URL ảnh..."
                                            value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} className="filter-input" />
                                    </div>
                                </div>
                                <div className="preview-box">
                                    <img src={previewUrl || getAvatarUrl(formData.avatar)} alt="Preview" className="preview-img" style={{ width: '80px', height: '80px' }} />
                                </div>
                            </div>

                            <div className="checkbox-section" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px dashed #334155' }}>
                                <div className="checkbox-group checkbox-col" style={{ border: 'none', padding: 0 }}>
                                    <label>Vai trò (Roles):</label>
                                    <div className="item-checkbox-list">
                                        {roles.map(r => (
                                            <label key={r._id} className="item-checkbox-label">
                                                <input type="checkbox" checked={formData.roles.includes(r._id)} onChange={() => handleRoleChange(r._id)} className="check-mr" />
                                                {r.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="checkbox-group checkbox-col" style={{ border: 'none', padding: 0 }}>
                                    <label>Đường đi (Lane):</label>
                                    <div className="item-checkbox-list">
                                        {LANE_OPTIONS.map(lane => (
                                            <label key={lane} className="item-checkbox-label">
                                                <input type="checkbox" checked={formData.lane.includes(lane)} onChange={() => handleLaneChange(lane)} className="check-mr" />
                                                {lane}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="skills-grid skills-grid-mt" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px dashed #334155' }}>
                                <textarea className="form-textarea txt-no-mt" placeholder="Mô tả Nội tại" value={formData.skills.passive || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, passive: e.target.value } })} />
                                <textarea className="form-textarea txt-no-mt" placeholder="Chiêu 1" value={formData.skills.skill1 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill1: e.target.value } })} />
                                <textarea className="form-textarea txt-no-mt" placeholder="Chiêu 2" value={formData.skills.skill2 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill2: e.target.value } })} />
                                <textarea className="form-textarea txt-no-mt" placeholder="Chiêu 3" value={formData.skills.skill3 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill3: e.target.value } })} />
                                <textarea className="form-textarea txt-no-mt" placeholder="Chiêu 4" value={formData.skills.skill4 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill4: e.target.value } })} />
                            </div>

                            <button type="submit" className="btn-save" style={{ width: '100%', height: '50px', fontSize: '18px', background: editingId ? '#f59e0b' : '#38bdf8' }} disabled={isLoading}>
                                {isLoading ? "ĐANG XỬ LÝ..." : (editingId ? '💾 LƯU CẬP NHẬT' : '➕ XÁC NHẬN THÊM')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT KHI CLICK VÀO CARD (Giữ nguyên) */}
            {selectedHero && <HeroDetailModal hero={selectedHero} onClose={() => setSelectedHero(null)} />}
        </div>
    );
};

export default ManageHeroes;