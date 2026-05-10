import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserInfo, deleteUser } from '../../services/api';
import { toast } from 'react-toastify';
import './Admin.css';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // STATE CHO MODAL SỬA USER
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ username: '', email: '', role: 'user', password: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getAllUsers();
            setUsers(res.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách User:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("CẢNH BÁO: Bạn sắp xóa vĩnh viễn tài khoản này. Tiếp tục?")) return;
        try {
            await deleteUser(userId);
            toast.success("Đã xóa tài khoản!");
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa");
        }
    };

    // Mở Form Sửa
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            username: user.username,
            email: user.email || '',
            role: user.role,
            password: '' // Bỏ trống, chỉ khi Admin nhập pass mới thì mới đổi
        });
    };

    // Gửi yêu cầu Cập nhật
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                username: editFormData.username,
                email: editFormData.email,
                role: editFormData.role
            };
            
            // Nếu Admin nhập pass mới thì mới gửi đi
            if (editFormData.password.trim() !== '') {
                payload.password = editFormData.password;
            }

            await updateUserInfo(editingUser._id, payload);
            toast.success("Cập nhật thông tin tài khoản thành công!");
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật thông tin");
        }
    };

    if (loading) return <div className="cyber-scanning"><div className="scan-line"></div>ĐANG TRUY XUẤT HỒ SƠ...</div>;

    return (
        <div className="manage-panel animation-fade">
            <h2 className="panel-title">👥 HỆ THỐNG QUẢN TRỊ TÀI KHOẢN ({users.length})</h2>

            <div className="table-responsive">
                <table className="cyber-table">
                    <thead>
                        <tr>
                            <th>Tên Chỉ Huy</th>
                            <th>Email Liên Kết</th>
                            <th>Ngày Gia Nhập</th>
                            <th>Quyền (Role)</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td><strong>{u.username}</strong></td>
                                <td>
                                    {u.email ? u.email : <span className="text-danger italic-text">Chưa cập nhật</span>}
                                </td>
                                <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    {/* Bỏ sự kiện onClick đi, biến Badge thành thẻ hiển thị thông thường */}
                                    <span 
                                        className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}
                                        style={{ cursor: 'default' }}
                                    >
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-edit-mini" onClick={() => handleEditClick(u)} title="Sửa thông tin">✏️</button>
                                        <button className="btn-del-mini" onClick={() => handleDelete(u._id)} title="Xóa tài khoản">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 🌟 MODAL CHỈNH SỬA THÔNG TIN USER 🌟 */}
            {editingUser && (
                <div className="hero-detail-overlay" onClick={() => setEditingUser(null)}>
                    <div className="hero-detail-modal cyber-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', border: '1px solid #f59e0b', padding: '30px' }}>
                        <button className="close-modal-btn" onClick={() => setEditingUser(null)}>×</button>
                        <h2 className="auth-title" style={{ color: '#f59e0b', marginBottom: '20px' }}>CẬP NHẬT TÀI KHOẢN</h2>
                        
                        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label style={{ color: '#fcd34d' }}>Tên đăng nhập:</label>
                                <input type="text" required
                                    value={editFormData.username} 
                                    onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                                    style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', width: '100%' }}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#fcd34d' }}>Địa chỉ Email:</label>
                                <input type="email" required
                                    value={editFormData.email} 
                                    onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                                    style={{ padding: '12px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', width: '100%' }}
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ color: '#38bdf8' }}>Phân Quyền (Role):</label>
                                <select 
                                    value={editFormData.role} 
                                    onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                                    style={{ padding: '12px', background: '#1e293b', border: '1px solid #38bdf8', color: '#fff', borderRadius: '6px', width: '100%', fontWeight: 'bold' }}
                                >
                                    <option value="user">USER (Người dùng thường)</option>
                                    <option value="admin">ADMIN (Quản trị viên)</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                                <label style={{ color: '#ef4444' }}>Reset Mật khẩu (Bỏ trống nếu không đổi):</label>
                                <input type="password" placeholder="Nhập mật khẩu mới..."
                                    value={editFormData.password} 
                                    onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                                    style={{ padding: '12px', background: '#0f172a', border: '1px solid #ef4444', color: '#fff', borderRadius: '6px', width: '100%' }}
                                />
                            </div>

                            <button type="submit" style={{ padding: '15px', background: '#f59e0b', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '10px', cursor: 'pointer', fontSize: '16px' }}>
                                💾 LƯU THAY ĐỔI
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;