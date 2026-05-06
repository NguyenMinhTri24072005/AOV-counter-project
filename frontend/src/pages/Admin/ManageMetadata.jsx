import React, { useState, useEffect } from 'react';
import { getRoles, getCategories } from '../../services/api';

const ManageMetadata = () => {
    const [roles, setRoles] = useState([]);
    const [categories, setCategories] = useState([]);

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

    return (
        <div className="manage-container">
            <h2>📁 Quản lý Metadata (Thuộc tính chuẩn)</h2>
            
            <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                {/* CỘT 1: VAI TRÒ TƯỚNG */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Vai Trò Tướng (Roles)</h3>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Tên Vai Trò</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            {roles.map(r => (
                                <tr key={r._id}>
                                    <td>{r.name}</td>
                                    <td><button className="btn-del">Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CỘT 2: PHÂN LOẠI TRANG BỊ */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>Phân Loại Trang Bị</h3>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Tên Phân Loại</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c._id}>
                                    <td>{c.name}</td>
                                    <td><button className="btn-del">Xóa</button></td>
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