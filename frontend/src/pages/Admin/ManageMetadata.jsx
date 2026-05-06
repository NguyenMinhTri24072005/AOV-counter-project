import React, { useState, useEffect } from 'react';
import { getRoles, getCategories, createRole, createCategory } from '../../services/api';

const ManageMetadata = () => {
    const [roles, setRoles] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [newRoleName, setNewRoleName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [resRoles, resCats] = await Promise.all([getRoles(), getCategories()]);
            setRoles(resRoles.data);
            setCategories(resCats.data);
        } catch (error) {
            console.error("Lỗi tải metadata", error);
        }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        try {
            await createRole({ name: newRoleName });
            setNewRoleName('');
            loadMetadata();
        } catch (err) { alert("Lỗi thêm vai trò!"); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await createCategory({ name: newCategoryName });
            setNewCategoryName('');
            loadMetadata();
        } catch (err) { alert("Lỗi thêm phân loại!"); }
    };

    return (
        <div className="manage-container">
            <h2>📁 Quản lý Metadata (Thuộc tính chuẩn)</h2>
            
            <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                {/* CỘT 1: VAI TRÒ TƯỚNG */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Vai Trò Tướng (Roles)</h3>
                    
                    <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input type="text" placeholder="Tên vai trò mới..." value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required style={{ flex: 1, padding: '8px' }}/>
                        <button type="submit" className="btn-save" style={{ padding: '8px 15px' }}>Thêm</button>
                    </form>

                    <table className="admin-table">
                        <thead><tr><th>Tên Vai Trò</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {roles.map(r => (
                                <tr key={r._id}><td>{r.name}</td><td><button className="btn-del">Xóa</button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CỘT 2: PHÂN LOẠI TRANG BỊ */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>Phân Loại Trang Bị</h3>
                    
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <input type="text" placeholder="Tên phân loại mới..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required style={{ flex: 1, padding: '8px' }}/>
                        <button type="submit" className="btn-save" style={{ padding: '8px 15px', backgroundColor: '#28a745' }}>Thêm</button>
                    </form>

                    <table className="admin-table">
                        <thead><tr><th>Tên Phân Loại</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c._id}><td>{c.name}</td><td><button className="btn-del">Xóa</button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageMetadata;