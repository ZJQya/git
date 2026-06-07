import React, { useState, useEffect, useRef } from 'react';
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
    getVipStatus, changePassword, createAlipayOrder, queryAlipayOrder,activateVip
} from '../services/api';
import MyDataPanel from './MyDataPanel';
import AnalysisPanel from './AnalysisPanel';
import { QRCodeSVG } from 'qrcode.react';

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

const Dashboard = ({ onLogout, fileList, setFileList, datasetList, setDatasetList }) => {
    const [selectedMenu, setSelectedMenu] = useState('my_data');
    const [username, setUsername] = useState('');
    const [vip, setVip] = useState(false);
    const [vipExpireTime, setVipExpireTime] = useState('');
    const navigate = useNavigate();

    // 支付宝支付相关状态
    const [payModalVisible, setPayModalVisible] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [outTradeNo, setOutTradeNo] = useState('');
    const [payLoading, setPayLoading] = useState(false);
    const pollTimerRef = useRef(null);

    // 修改密码 Modal 状态
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
        return () => {
            // 组件卸载时清除轮询
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, []);

    const fetchVipStatus = async () => {
        try {
            const res = await getVipStatus();
            setVip(res.data.vip);
            setVipExpireTime(res.data.expireTime || '');
        } catch { }
    };

    // 创建支付宝订单并展示二维码
    const handleCreatePay = async () => {
        setPayLoading(true);
        try {
            const res = await createAlipayOrder();
            const { qrCode, outTradeNo } = res.data;
            setQrCodeUrl(qrCode);
            setOutTradeNo(outTradeNo);
            setPayModalVisible(true);
            startPolling(outTradeNo);
        } catch (error) {
            message.error('创建支付订单失败');
        } finally {
            setPayLoading(false);
        }
    };


    const handleTestActivate = async () => {
        try {
            await activateVip();   // 调用 /user/vip/activate
            message.success('VIP 已开通（30天）');
            fetchVipStatus();
        } catch {
            message.error('激活失败');
        }
    };

    // 轮询支付状态
    const startPolling = (tradeNo) => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        const timer = setInterval(async () => {
            try {
                const res = await queryAlipayOrder(tradeNo);
                if (res.data.paid) {
                    clearInterval(timer);
                    pollTimerRef.current = null;
                    setPayModalVisible(false);
                    message.success('支付成功，VIP已激活（30天）');
                    fetchVipStatus();
                }
            } catch { /* 忽略轮询错误 */ }
        }, 3000);
        pollTimerRef.current = timer;
    };

    // 关闭支付弹窗
    const handleClosePay = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        setPayModalVisible(false);
    };

    // 修改密码逻辑
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            message.warning('请填写旧密码和新密码');
            return;
        }
        setConfirmLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            message.success('密码修改成功，请重新登录');
            setChangePwdModalVisible(false);
            onLogout();
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
        { key: 'vip', icon: <CrownOutlined />, label: '开通 VIP', onClick: handleCreatePay },
        { key: 'changePwd', icon: <LockOutlined />, label: '修改密码', onClick: () => setChangePwdModalVisible(true) },
        { key: 'history', icon: <HistoryOutlined />, label: '历史记录', onClick: () => navigate('/history') },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
        { key: 'testVip', icon: <CrownOutlined />, label: '测试激活VIP', onClick: handleTestActivate }
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

            {/* 支付宝扫码支付 Modal */}
            <Modal
                title="支付宝扫码支付"
                open={payModalVisible}
                onCancel={handleClosePay}
                footer={null}
                destroyOnClose
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    {qrCodeUrl ? (
                        <>
                            <QRCodeSVG value={qrCodeUrl} size={200} />
                            <p style={{ marginTop: 16 }}>请使用支付宝扫描二维码支付</p>
                            <p><strong>¥0.01</strong>（沙箱测试）</p>
                        </>
                    ) : (
                        <p>加载中...</p>
                    )}
                </div>
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