import React, { useState, useEffect } from 'react';
import { getRoles, createRole, deleteRole, getCategories, createCategory, deleteCategory } from '../../services/api';
import { toast } from 'react-toastify';

const ManageMetadata = () => {
    const [roles, setRoles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newRole, setNewRole] = useState('');
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resRoles, resCats] = await Promise.all([getRoles(), getCategories()]);
            setRoles(resRoles.data);
            setCategories(resCats.data);
        } catch (error) { console.error("Lỗi tải metadata:", error); }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        try {
            await createRole({ name: newRole });
            setNewRole('');
            loadData();
        } catch (error) { toast.error('Lỗi thêm vai trò'); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory({ name: newCategory });
            setNewCategory('');
            loadData();
        } catch (error) { toast.error('Lỗi thêm phân loại'); }
    };

    const handleDeleteRole = async (id) => {
        if (window.confirm("Xóa vai trò này?")) {
            await deleteRole(id);
            loadData();
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Xóa phân loại này?")) {
            await deleteCategory(id);
            loadData();
        }
    };

    return (
        <div className="manage-container">
            <h2>⚙️ Quản lý Siêu dữ liệu (Vai trò & Phân loại)</h2>

            <div className="metadata-layout">
                {/* CỘT PHÂN LOẠI TRANG BỊ */}
                <div className="metadata-col category-col">
                    <h3>Phân loại Trang bị</h3>
                    <form className="inline-form" onSubmit={handleAddCategory}>
                        <input 
                            type="text" 
                            placeholder="Thêm phân loại mới..." 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)} 
                            required 
                        />
                        <button type="submit" className="btn-add-category">Thêm</button>
                    </form>

                    <ul className="metadata-list">
                        {categories.map(c => (
                            <li key={c._id}>
                                <span className="metadata-name">{c.name}</span>
                                <button className="btn-del btn-metadata-del" onClick={() => handleDeleteCategory(c._id)}>Xóa</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CỘT VAI TRÒ TƯỚNG */}
                <div className="metadata-col role-col">
                    <h3>Vai trò Tướng</h3>
                    <form className="inline-form" onSubmit={handleAddRole}>
                        <input 
                            type="text" 
                            placeholder="Thêm vai trò mới..." 
                            value={newRole} 
                            onChange={e => setNewRole(e.target.value)} 
                            required 
                        />
                        <button type="submit" className="btn-add-role">Thêm</button>
                    </form>

                    <ul className="metadata-list">
                        {roles.map(r => (
                            <li key={r._id}>
                                <span className="metadata-name">{r.name}</span>
                                <button className="btn-del btn-metadata-del" onClick={() => handleDeleteRole(r._id)}>Xóa</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ManageMetadata;