import React, { useState, useEffect } from 'react';
import { getHeroes, getRoles, createHero, updateHero, deleteHero, uploadImage } from '../../services/api';

// Hàm hỗ trợ hiển thị ảnh đúng đường dẫn (trên localhost)
const getAvatarUrl = (url) => {
    if (!url) return 'https://placehold.co/80x80?text=No+Image'; // Dùng placehold.co ổn định hơn
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
};

const ManageHeroes = () => {
    const [heroes, setHeroes] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const initialForm = {
        name: '', avatar: '', roles: [], lane: [], 
        skills: { passive: '', skill1: '', skill2: '', skill3: '', skill4: '' }
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); // Lưu trữ file ảnh được chọn
    const [previewUrl, setPreviewUrl] = useState(null); // Hiển thị ảnh xem trước

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Tạo link ảo để xem trước
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let avatarUrl = formData.avatar; // Lấy URL cũ mặc định

            // Nếu Admin có tải file mới lên, gọi API upload trước
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                const res = await uploadImage(uploadData);
                avatarUrl = res.data.url; // Lấy URL mới từ Backend trả về
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

    const handleEditClick = (hero) => {
        setFormData({
            name: hero.name, avatar: hero.avatar || '',
            roles: hero.roles.map(r => r._id || r),
            lane: hero.lane || [], skills: hero.skills || initialForm.skills
        });
        setEditingId(hero._id);
        setSelectedFile(null);
        setPreviewUrl(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Xóa Tướng này?")) {
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
                
                <div className="form-row" style={{ alignItems: 'center' }}>
                    <input type="text" placeholder="Tên tướng" required 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    {/* Ô TẢI ẢNH LÊN */}
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ flex: 1 }} />

                    <div style={{ width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img 
                            // Nếu có preview mới thì hiện, không thì hiện ảnh cũ/mặc định
                            src={previewUrl || getAvatarUrl(formData.avatar)} 
                            alt="Preview" 
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #007bff' }}
                        />
                    </div>
                </div>
                
                <div className="checkbox-group" style={{marginTop: '15px'}}>
                    <label>Vai trò (Roles):</label>
                    <div className="item-checkbox-list">
                        {roles.map(r => (
                            <label key={r._id} className="item-checkbox-label">
                                <input type="checkbox" checked={formData.roles.includes(r._id)} onChange={() => handleRoleChange(r._id)} style={{marginRight: '5px'}}/> 
                                {r.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className={`btn-save ${editingId ? 'btn-update' : ''}`} disabled={isLoading}>
                        {isLoading ? "Đang lưu..." : (editingId ? 'Cập Nhật Tướng' : 'Lưu Tướng')}
                    </button>
                    {editingId && <button type="button" className="btn-cancel" onClick={cancelEdit}>Hủy Sửa</button>}
                </div>
            </form>

            <table className="admin-table">
                <thead><tr><th>Avatar</th><th>Tên</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                <tbody>
                    {heroes.map(h => (
                        <tr key={h._id}>
                            <td>
                                <img src={getAvatarUrl(h.avatar)} alt={h.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            </td>
                            <td><strong>{h.name}</strong></td>
                            <td>{h.roles?.map(r => r.name).join(', ')}</td>
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