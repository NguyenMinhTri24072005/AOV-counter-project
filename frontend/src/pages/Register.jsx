import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerUser({ 
                username: formData.username, 
                email: formData.email, 
                password: formData.password, 
                role: 'user' 
            });
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi đăng ký!');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card cyber-panel">
                <h2 className="auth-title">ĐĂNG KÝ CHỈ HUY MỚI</h2>
                {error && <p className="error-msg">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Tên đăng nhập</label>
                        <input type="text" placeholder="Nhập tên tài khoản..." required 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Địa chỉ Email</label>
                        <input type="email" placeholder="Nhập Email để lấy lại mật khẩu sau này..." required 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        />
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input type="password" placeholder="Nhập mật khẩu an toàn..." required 
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                    </div>

                    <button type="submit" className="btn-auth btn-register">GHI DANH VÀO HỆ THỐNG</button>
                </form>

                <p className="auth-switch">
                    Đã có thẻ chỉ huy? <Link to="/login">Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;