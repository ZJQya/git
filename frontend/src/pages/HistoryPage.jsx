import React, { useEffect, useState } from 'react';
import { Table, Card, message } from 'antd';
import { getUserHistory, getResultImageUrl } from '../services/api';

const HistoryPage = () => {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        getUserHistory()
            .then(res => setRecords(res.data))
            .catch(() => message.error('获取历史记录失败'));
    }, []);

    const columns = [
        { title: '任务ID', dataIndex: 'id' },
        { title: '分析类型', dataIndex: 'taskType' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime' },
        {
            title: '结果',
            render: (_, record) => (
                <a href={getResultImageUrl(record.id)} target="_blank" rel="noreferrer">查看图片</a>
            )
        }
    ];

    return (
        <Card title="分析历史记录" style={{ margin: 24 }}>
            <Table dataSource={records} columns={columns} rowKey="id" />
        </Card>
    );
};

export default HistoryPage;