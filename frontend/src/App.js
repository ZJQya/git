import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import HistoryPage from './pages/HistoryPage';
import { jwtDecode } from 'jwt-decode';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [datasetList, setDatasetList] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const roles = decoded.role || [];
                if (roles.includes('ROLE_ADMIN')) {
                    setRole('admin');
                } else {
                    setRole('user');
                }
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Token 解析失败', error);
                localStorage.removeItem('token');
            }
        }
    }, []);

    const handleLoginSuccess = () => {
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setRole(null);
        setFileList([]);
        setDatasetList([]);
    };

    if (isAuthenticated && !role) {
        return <div style={{ textAlign: 'center', marginTop: 100 }}>加载中...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated
                        ? (role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)
                        : <Login onLoginSuccess={handleLoginSuccess} />
                } />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                    isAuthenticated && role === 'user'
                        ? <Dashboard
                            onLogout={handleLogout}
                            fileList={fileList}
                            setFileList={setFileList}
                            datasetList={datasetList}
                            setDatasetList={setDatasetList}
                        />
                        : <Navigate to="/login" />
                } />
                <Route path="/admin" element={
                    isAuthenticated && role === 'admin'
                        ? <AdminDashboard onLogout={handleLogout} />
                        : <Navigate to="/login" />
                } />
                <Route path="/history" element={
                    isAuthenticated
                        ? <HistoryPage />
                        : <Navigate to="/login" />
                } />
                <Route path="*" element={
                    isAuthenticated
                        ? (role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />)
                        : <Navigate to="/login" />
                } />
            </Routes>
        </BrowserRouter>
    );
};

export default App;