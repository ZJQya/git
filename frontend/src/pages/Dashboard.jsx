import React, { useState, useEffect } from 'react';
import {
    Layout, Menu, Dropdown, Avatar, Space, Typography, Tag, message,
    Modal, Form, Input, Button
} from 'antd';
import {
    UserOutlined, FolderOpenOutlined, BarChartOutlined,
    LogoutOutlined, CrownOutlined, HistoryOutlined, LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
    getVipStatus, activateVip, changePassword   // 需要在 api.js 中添加 changePassword
} from '../services/api';
import MyDataPanel from './MyDataPanel';
import AnalysisPanel from './AnalysisPanel';

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

const Dashboard = ({ onLogout, fileList, setFileList, datasetList, setDatasetList }) => {
    const [selectedMenu, setSelectedMenu] = useState('my_data');
    const [username, setUsername] = useState('');
    const [vip, setVip] = useState(false);
    const [vipExpireTime, setVipExpireTime] = useState('');
    const navigate = useNavigate();

    // 模拟支付 Modal
    const [payModalVisible, setPayModalVisible] = useState(false);
    // 修改密码 Modal
    const [changePwdModalVisible, setChangePwdModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.sub || '用户');
            } catch { }
        }
        fetchVipStatus();
    }, []);

    const fetchVipStatus = async () => {
        try {
            const res = await getVipStatus();
            setVip(res.data.vip);
            setVipExpireTime(res.data.expireTime || '');   // 后端返回 expireTime
        } catch { }
    };

    // 打开支付 Modal 代替直接激活
    const handleOpenPayModal = () => {
        setPayModalVisible(true);
    };

    // 确认支付（模拟）
    const handlePayConfirm = async () => {
        setConfirmLoading(true);
        try {
            await activateVip();               // 现有激活接口即为支付成功
            message.success('支付成功，VIP 已开通（30天）');
            fetchVipStatus();
            setPayModalVisible(false);
        } catch {
            message.error('支付失败，请重试');
        } finally {
            setConfirmLoading(false);
        }
    };

    // 修改密码逻辑
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            message.warning('请填写旧密码和新密码');
            return;
        }
        setConfirmLoading(true);
        try {
            await changePassword(oldPassword, newPassword);   // 需要在 api.js 中添加
            message.success('密码修改成功，请重新登录');
            setChangePwdModalVisible(false);
            onLogout();   // 修改密码后强制重新登录
        } catch (error) {
            const errMsg = error.response?.data?.error || '修改失败';
            message.error(errMsg);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleLogout = () => onLogout();

    // 数据集上传回调
    const handleDatasetUploaded = (fileObj) => {
        setDatasetList(prev => [...prev, { id: fileObj.id, name: fileObj.name }]);
        setFileList(prev => [...prev, fileObj]);
    };

    // 删除回调
    const handleDatasetDeleted = (id) => {
        setFileList(prev => prev.filter(item => item.id !== id));
        setDatasetList(prev => prev.filter(item => item.id !== id));
    };

    // 用户菜单项
    const userMenuItems = [
        {
            key: 'info',
            label: (
                <div>
                    <Text strong>{username}</Text>
                    <br />
                    VIP：{vip ? <Tag color="gold">已开通</Tag> : <Tag color="default">未开通</Tag>}
                    {vip && vipExpireTime && (
                        <div style={{ fontSize: 12 }}>到期：{vipExpireTime}</div>
                    )}
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        { key: 'vip', icon: <CrownOutlined />, label: '开通 VIP', onClick: handleOpenPayModal },
        { key: 'changePwd', icon: <LockOutlined />, label: '修改密码', onClick: () => setChangePwdModalVisible(true) },
        { key: 'history', icon: <HistoryOutlined />, label: '历史记录', onClick: () => navigate('/history') },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ];

    // 内容渲染
    const renderContent = () => {
        if (selectedMenu === 'my_data') {
            return (
                <MyDataPanel
                    datasetList={datasetList}
                    fileList={fileList}
                    onDatasetUploaded={handleDatasetUploaded}
                    onDatasetDeleted={handleDatasetDeleted}
                />
            );
        }
        const taskTypeMap = {
            'decision_tree': 'decision_tree',
            'kmeans': 'kmeans',
            'apriori': 'apriori',
        };
        return <AnalysisPanel datasetList={datasetList} taskType={taskTypeMap[selectedMenu] || 'decision_tree'} />;
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 顶部用户栏 */}
            <Header style={{
                background: '#fff', padding: '0 24px', display: 'flex',
                justifyContent: 'flex-end', alignItems: 'center',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                    <Space style={{ cursor: 'pointer' }}>
                        <Avatar icon={<UserOutlined />} />
                        <span>{username}</span>
                    </Space>
                </Dropdown>
            </Header>

            <Layout>
                <Sider width={250} theme="light">
                    <div style={{ padding: 16, fontWeight: 'bold', fontSize: 18 }}>数据挖掘工具</div>
                    <Menu mode="inline" selectedKeys={[selectedMenu]} onClick={({ key }) => setSelectedMenu(key)}>
                        <Menu.Item key="my_data" icon={<FolderOpenOutlined />}>我的数据</Menu.Item>
                        <Menu.SubMenu key="analysis" icon={<BarChartOutlined />} title="数据分析">
                            <Menu.Item key="decision_tree">决策树</Menu.Item>
                            <Menu.Item key="kmeans">K-Means 聚类</Menu.Item>
                            <Menu.Item key="apriori">关联规则</Menu.Item>
                        </Menu.SubMenu>
                    </Menu>
                </Sider>
                <Content style={{ padding: 24, background: '#fff' }}>
                    {renderContent()}
                </Content>
            </Layout>

            {/* 模拟支付 Modal */}
            <Modal
                title="开通 VIP（模拟支付）"
                open={payModalVisible}
                onOk={handlePayConfirm}
                onCancel={() => setPayModalVisible(false)}
                confirmLoading={confirmLoading}
            >
                <p>支付金额：<strong>¥0.01</strong>（演示）</p>
                <p>支付方式：模拟支付宝 / 微信支付</p>
                <p>VIP有效期：30天</p>
            </Modal>

            {/* 修改密码 Modal */}
            <Modal
                title="修改密码"
                open={changePwdModalVisible}
                onOk={handleChangePassword}
                onCancel={() => {
                    setChangePwdModalVisible(false);
                    setOldPassword('');
                    setNewPassword('');
                }}
                confirmLoading={confirmLoading}
            >
                <Form layout="vertical">
                    <Form.Item label="旧密码">
                        <Input.Password value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="新密码">
                        <Input.Password value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default Dashboard;