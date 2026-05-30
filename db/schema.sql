-- 用户表
CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 数据集信息表
CREATE TABLE dataset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 分析任务表
CREATE TABLE analysis_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dataset_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    parameters TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    result_path VARCHAR(500),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES dataset(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
-- 修改 user 表，增加角色和 VIP 字段
ALTER TABLE user ADD COLUMN role VARCHAR(20) DEFAULT 'USER';  -- USER, ADMIN
ALTER TABLE user ADD COLUMN vip TINYINT(1) DEFAULT 0;         -- 0:普通, 1:VIP
ALTER TABLE user ADD COLUMN vip_expire_time DATETIME NULL;     -- VIP 过期时间

-- 分析历史记录可复用 analysis_task 表，已经包含 user_id 和状态。