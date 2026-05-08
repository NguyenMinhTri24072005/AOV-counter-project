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

const ManageHeroes = () => {
    const [heroes, setHeroes] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedHero, setSelectedHero] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [laneFilter, setLaneFilter] = useState('');

    const initialForm = {
        name: '', avatar: '', roles: [], lane: [],
        skills: { passive: '', skill1: '', skill2: '', skill3: '', skill4: '' }
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [resH, resR] = await Promise.all([getHeroes(), getRoles()]);
        setHeroes(resH.data); setRoles(resR.data);
    };

    const filteredHeroes = heroes.filter(hero => {
        const matchName = hero.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter ? hero.roles?.some(r => r._id === roleFilter) : true;
        const matchLane = laneFilter ? hero.lane?.includes(laneFilter) : true;
        return matchName && matchRole && matchLane;
    });

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
            cancelEdit();
            loadData();
        } catch (error) { alert("Lỗi: " + error.message); }
        finally { setIsLoading(false); }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Xóa Tướng này? Sẽ gây ảnh hưởng nếu đang có kèo khắc chế liên quan.")) {
            await deleteHero(id); loadData();
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
            <h2>🦸 Quản lý danh sách Tướng</h2>

            <form className={`admin-form ${editingId ? 'editing' : ''}`} onSubmit={handleSubmit}>
                {editingId && <h4 className="edit-badge">Đang chỉnh sửa: {formData.name}</h4>}

                <div className="form-row align-start">
                    <div className="form-col">
                        <input type="text" placeholder="Tên tướng" required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <div className="form-row">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="filter-input" style={{ padding: '7px' }} />
                            <input type="text" placeholder="Hoặc dán Link ảnh URL..."
                                value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} className="filter-input" />
                        </div>
                    </div>
                    <div className="preview-box">
                        <span className="preview-label">Xem trước</span>
                        <img src={previewUrl || getAvatarUrl(formData.avatar)} alt="Preview" className="preview-img" />
                    </div>
                </div>

                <div className="checkbox-section">
                    <div className="checkbox-group checkbox-col">
                        <label>Vai trò (Roles):</label>
                        <div className="item-checkbox-list">
                            {roles.map(r => (
                                <label key={r._id} className="item-checkbox-label">
                                    <input type="checkbox" checked={formData.roles.includes(r._id)} onChange={() => handleRoleChange(r._id)} style={{ marginRight: '5px' }} />
                                    {r.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="checkbox-group checkbox-col">
                        <label>Đường đi (Lane):</label>
                        <div className="item-checkbox-list">
                            {LANE_OPTIONS.map(lane => (
                                <label key={lane} className="item-checkbox-label">
                                    <input type="checkbox" checked={formData.lane.includes(lane)} onChange={() => handleLaneChange(lane)} style={{ marginRight: '5px' }} />
                                    {lane}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="skills-grid" style={{ marginTop: '15px' }}>
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Mô tả Nội tại" value={formData.skills.passive || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, passive: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 1" value={formData.skills.skill1 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill1: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 2" value={formData.skills.skill2 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill2: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 3" value={formData.skills.skill3 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill3: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 4" value={formData.skills.skill4 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill4: e.target.value } })} />
                </div>

                <div className="form-actions">
                    <button type="submit" className={`btn-save ${editingId ? 'btn-update' : ''}`} disabled={isLoading}>
                        {isLoading ? "Đang lưu..." : (editingId ? 'Cập Nhật Tướng' : 'Lưu Tướng')}
                    </button>
                    {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Hủy Sửa</button>}
                </div>
            </form>

            <div className="filter-bar">
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

            <div className="hero-grid">
                {filteredHeroes.length > 0 ? (
                    filteredHeroes.map(h => (
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
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#666' }}>
                        Không tìm thấy tướng nào phù hợp với bộ lọc.
                    </div>
                )}
            </div>

            {selectedHero && <HeroDetailModal hero={selectedHero} onClose={() => setSelectedHero(null)} />}
        </div>
    );
};

export default ManageHeroes;