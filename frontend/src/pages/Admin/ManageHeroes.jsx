import React, { useState, useEffect } from 'react';
import { getHeroes, getRoles, createHero, updateHero, deleteHero } from '../../services/api';

const ManageHeroes = () => {
    const [heroes, setHeroes] = useState([]);
    const [roles, setRoles] = useState([]);

    const initialForm = {
        name: '', roles: [], lane: [],
        skills: { passive: '', skill1: '', skill2: '', skill3: '', skill4: '' }
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [resH, resR] = await Promise.all([getHeroes(), getRoles()]);
        setHeroes(resH.data); setRoles(resR.data);
    };

    const handleRoleChange = (roleId) => {
        const newRoles = formData.roles.includes(roleId)
            ? formData.roles.filter(id => id !== roleId)
            : [...formData.roles, roleId];
        setFormData({ ...formData, roles: newRoles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateHero(editingId, formData);
                alert("Cập nhật tướng thành công!");
            } else {
                await createHero(formData);
                alert("Thêm tướng thành công!");
            }
            setFormData(initialForm); setEditingId(null); loadData();
        } catch (error) { alert("Lỗi: " + error.message); }
    };

    const handleEditClick = (hero) => {
        setFormData({
            name: hero.name,
            // Chuyển mảng Roles thành mảng ID để khớp với Form Checkbox
            roles: hero.roles ? hero.roles.map(r => r._id || r) : [],
            lane: hero.lane || [],
            skills: hero.skills || initialForm.skills
        });
        setEditingId(hero._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Xóa Tướng này? Sẽ gây ảnh hưởng nếu đang có kèo khắc chế liên quan.")) {
            await deleteHero(id); loadData();
        }
    };

    const cancelEdit = () => { setFormData(initialForm); setEditingId(null); };

    return (
        <div className="manage-container">
            <h2>🦸 Quản lý danh sách Tướng</h2>

            <form className={`admin-form ${editingId ? 'editing' : ''}`} onSubmit={handleSubmit}>
                {editingId && <h4 className="edit-badge">Đang chỉnh sửa: {formData.name}</h4>}

                <input type="text" placeholder="Tên tướng" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />

                <div className="checkbox-group" style={{ marginTop: '15px' }}>
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

                <div className="skills-grid" style={{ marginTop: '15px' }}>
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Mô tả Nội tại" value={formData.skills.passive || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, passive: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 1" value={formData.skills.skill1 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill1: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu 2" value={formData.skills.skill2 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill2: e.target.value } })} />
                    <textarea className="form-textarea" style={{ marginTop: 0 }} placeholder="Chiêu cuối" value={formData.skills.skill3 || ''} onChange={e => setFormData({ ...formData, skills: { ...formData.skills, skill3: e.target.value } })} />
                </div>

                <div className="form-actions">
                    <button type="submit" className={`btn-save ${editingId ? 'btn-update' : ''}`}>
                        {editingId ? 'Cập Nhật Tướng' : 'Lưu Tướng'}
                    </button>
                    {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Hủy Sửa</button>}
                </div>
            </form>

            <table className="admin-table">
                <thead><tr><th>Tên</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                <tbody>
                    {heroes.map(h => (
                        <tr key={h._id}>
                            <td>{h.name}</td><td>{h.roles?.map(r => r.name).join(', ')}</td>
                            <td>
                                <button className="btn-edit" onClick={() => handleEditClick(h)}>Sửa</button>
                                <button className="btn-del" onClick={() => handleDeleteClick(h._id)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageHeroes;