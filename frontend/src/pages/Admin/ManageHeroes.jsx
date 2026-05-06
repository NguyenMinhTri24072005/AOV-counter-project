import React, { useState, useEffect } from 'react';
import { getHeroes, getRoles, createHero } from '../../services/api';

const ManageHeroes = () => {
    const [heroes, setHeroes] = useState([]);
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        name: '', roles: [], lane: [], skills: { passive: '', skill1: '', skill2: '', skill3: '', skill4: '' }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [resH, resR] = await Promise.all([getHeroes(), getRoles()]);
        setHeroes(resH.data);
        setRoles(resR.data);
    };

    const handleRoleChange = (roleId) => {
        const newRoles = formData.roles.includes(roleId)
            ? formData.roles.filter(id => id !== roleId)
            : [...formData.roles, roleId];
        setFormData({ ...formData, roles: newRoles });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createHero(formData);
        alert("Thêm tướng thành công!");
        loadData();
    };

    return (
        <div className="manage-container">
            <h2>🦸 Quản lý danh sách Tướng</h2>
            <form className="admin-form" onSubmit={handleSubmit}>
                <input type="text" placeholder="Tên tướng" required 
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="checkbox-group">
                    <label>Vai trò (Roles):</label>
                    {roles.map(r => (
                        <label key={r._id}>
                            <input type="checkbox" onChange={() => handleRoleChange(r._id)} /> {r.name}
                        </label>
                    ))}
                </div>

                <div className="skills-grid">
                    <textarea placeholder="Mô tả Nội tại" onChange={e => setFormData({...formData, skills: {...formData.skills, passive: e.target.value}})} />
                    <textarea placeholder="Chiêu 1" onChange={e => setFormData({...formData, skills: {...formData.skills, skill1: e.target.value}})} />
                    <textarea placeholder="Chiêu 2" onChange={e => setFormData({...formData, skills: {...formData.skills, skill2: e.target.value}})} />
                    <textarea placeholder="Chiêu 3" onChange={e => setFormData({...formData, skills: {...formData.skills, skill3: e.target.value}})} />
                </div>

                <button type="submit" className="btn-save">Lưu Tướng</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr><th>Tên</th><th>Vai trò</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                    {heroes.map(h => (
                        <tr key={h._id}>
                            <td>{h.name}</td>
                            <td>{h.roles?.map(r => r.name).join(', ')}</td>
                            <td><button className="btn-edit">Sửa</button> <button className="btn-del">Xóa</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageHeroes;