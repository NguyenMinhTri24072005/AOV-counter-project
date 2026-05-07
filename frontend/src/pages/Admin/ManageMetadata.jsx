import React, { useState, useEffect } from 'react';
import { getRoles, getCategories, createRole, createCategory, deleteRole, deleteCategory } from '../../services/api';

const ManageMetadata = () => {
    const [roles, setRoles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => { loadMetadata(); }, []);

    const loadMetadata = async () => {
        const [resRoles, resCats] = await Promise.all([getRoles(), getCategories()]);
        setRoles(resRoles.data); setCategories(resCats.data);
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        await createRole({ name: newRoleName });
        setNewRoleName(''); loadMetadata();
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        await createCategory({ name: newCategoryName });
        setNewCategoryName(''); loadMetadata();
    };

    const handleDeleteRole = async (id) => {
        if (window.confirm("Xóa Vai trò này?")) { await deleteRole(id); loadMetadata(); }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Xóa Phân loại này?")) { await deleteCategory(id); loadMetadata(); }
    };

    return (
        <div className="manage-container">
            <h2>📁 Quản lý Metadata (Thuộc tính chuẩn)</h2>
            
            <div className="metadata-layout">
                <div className="metadata-col role-col">
                    <h3>Vai Trò Tướng (Roles)</h3>
                    <form className="inline-form" onSubmit={handleAddRole}>
                        <input type="text" placeholder="Tên vai trò mới..." value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required />
                        <button type="submit" className="btn-save">Thêm</button>
                    </form>
                    <table className="admin-table">
                        <thead><tr><th>Tên Vai Trò</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {roles.map(r => (
                                <tr key={r._id}>
                                    <td>{r.name}</td>
                                    <td><button className="btn-del" onClick={() => handleDeleteRole(r._id)}>Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="metadata-col category-col">
                    <h3>Phân Loại Trang Bị</h3>
                    <form className="inline-form" onSubmit={handleAddCategory}>
                        <input type="text" placeholder="Tên phân loại mới..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
                        <button type="submit" className="btn-save btn-add-category">Thêm</button>
                    </form>
                    <table className="admin-table">
                        <thead><tr><th>Tên Phân Loại</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c._id}>
                                    <td>{c.name}</td>
                                    <td><button className="btn-del" onClick={() => handleDeleteCategory(c._id)}>Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageMetadata;