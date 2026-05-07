import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SoloCounter from './components/SoloCounter';
import DraftMode from './components/DraftMode';
import { getHeroes } from './services/api';
import './App.css';

// --- IMPORT CÁC TRANG QUẢN TRỊ & CÁ NHÂN ---
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import UserDashboard from './pages/User/UserDashboard'; // <-- IMPORT MỚI

const HomeTabs = ({ heroes }) => {
    const [activeTab, setActiveTab] = useState('solo');
    return (
        <div>
            <div className="tabs-container">
                <button className={`tab-button ${activeTab === 'solo' ? 'active' : ''}`} onClick={() => setActiveTab('solo')}>
                    🔍 Solo Counter
                </button>
                <button className={`tab-button ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>
                    ⚔️ Draft Mode (Cấm/Chọn)
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'solo' && <SoloCounter heroes={heroes} />}
                {activeTab === 'draft' && <DraftMode heroes={heroes} />}
            </div>
        </div>
    );
};

function App() {
    const { user, logout } = useContext(AuthContext);
    const [heroes, setHeroes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const response = await getHeroes();
                setHeroes(response.data);
            } catch (error) {
                console.error("Lỗi tải tướng:", error);
            }
        };
        fetchHeroes();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            {/* THANH ĐIỀU HƯỚNG (NAVBAR) */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eee' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 style={{ color: '#333', margin: 0 }}>🛡️ Liên Quân Counter</h1>
                </Link>
                
                <div>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span>Xin chào, <strong>{user.username}</strong> ({user.role === 'admin' ? '👑 Admin' : '👤 User'})</span>
                            
                            {/* NÚT VÀO TRANG CÁ NHÂN (Cho mọi User đã đăng nhập) */}
                            <button 
                                onClick={() => navigate('/profile')}
                                style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                👤 Trang Cá Nhân
                            </button>

                            {/* NÚT VÀO DASHBOARD ADMIN (Chỉ Admin mới thấy) */}
                            {user.role === 'admin' && (
                                <button 
                                    onClick={() => navigate('/admin')}
                                    style={{ padding: '6px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    👑 Quản Trị
                                </button>
                            )}

                            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đăng xuất</button>
                        </div>
                    ) : (
                        <div>
                            <Link to="/login"><button style={{ padding: '6px 12px', marginRight: '10px', cursor: 'pointer' }}>Đăng Nhập</button></Link>
                            <Link to="/register"><button style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đăng Ký</button></Link>
                        </div>
                    )}
                </div>
            </header>

            {/* DANH SÁCH CÁC TRANG (ROUTER) */}
            <Routes>
                <Route path="/" element={<HomeTabs heroes={heroes} />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Route cho User thường (Yêu cầu đăng nhập) */}
                <Route path="/profile" element={
                    user ? <UserDashboard /> : <Navigate to="/login" replace />
                } />

                {/* Route cho Admin (Yêu cầu quyền Admin) */}
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                } />
            </Routes>
        </div>
    );
}

export default App;