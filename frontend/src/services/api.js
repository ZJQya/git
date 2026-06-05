// import axios from 'axios';
//
// const instance = axios.create({
//     baseURL: 'http://localhost:8080/api',
//     timeout: 30000,
// });
//
// instance.interceptors.request.use(config => {
//     const token = localStorage.getItem('token');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });
//
// export const login = (username, password) =>
//     instance.post('/auth/login', { username, password });
// //xinzeng
// export const register = (username, password, email) =>
//     instance.post('/auth/register', { username, password, email });
//
// export const uploadDataset = (file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return instance.post('/dataset/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//     });
// };
//
// export const submitAnalysis = (datasetId, taskType, params = '{}') =>
//     instance.post('/analysis/submit', { datasetId, taskType, params });
//
// export const getTaskStatus = (taskId) =>
//     instance.get(`/analysis/status/${taskId}`);
//
// export const getResultImageUrl = (taskId) =>
//     `${instance.defaults.baseURL}/result/image/${taskId}`;
// //xinzeng
// export const getUserHistory = () => instance.get('/user/history');
// export const activateVip = () => instance.post('/user/vip/activate');
// //AdminDashboard
// export const getUsers = () => instance.get('/admin/users');
// export const deleteUser = (id) => instance.delete(`/admin/users/${id}`);
// export const getAllAnalysis = () => instance.get('/admin/analysis');
//
// export const getUserHistory = () => instance.get('/user/history');
//
// export const activateVip = () => instance.post('/user/vip/activate');
//
//
//
// export default instance;


import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 30000,
});

instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 认证相关
export const login = (username, password, captchaToken, captchaCode) =>
    instance.post('/auth/login', {
        username,
        password,
        captchaToken,
        captchaCode
    });

export const register = (username, password, email, captchaToken, captchaCode) =>
    instance.post('/auth/register', { username, password, email, captchaToken, captchaCode });

// 数据集上传
export const uploadDataset = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return instance.post('/dataset/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// 分析任务
export const submitAnalysis = (datasetId, taskType, params = '{}') =>
    instance.post('/analysis/submit', { datasetId, taskType, params });

export const getTaskStatus = (taskId) =>
    instance.get(`/analysis/status/${taskId}`);

export const getResultImageUrl = (taskId) =>
    `${instance.defaults.baseURL}/result/image/${taskId}`;

// 用户相关
export const getUserHistory = () => instance.get('/user/history');
export const activateVip = () => instance.post('/user/vip/activate');
export const getVipStatus = () => instance.get('/user/vip/status');

// 管理员相关
export const getUsers = () => instance.get('/admin/users');
export const deleteUser = (id) => instance.delete(`/admin/users/${id}`);
export const getAllAnalysis = () => instance.get('/admin/analysis');
//删除数据集
export const deleteDataset = (id) => instance.delete(`/dataset/${id}`);
//修改密码
export const changePassword = (oldPassword, newPassword) =>
    instance.post('/user/change-password', { oldPassword, newPassword });
export default instance;