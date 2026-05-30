import pandas as pd
import os

# --- 1. 配置区域 ---
# 数据来源：https://www.kaggle.com/datasets/heeraldedhia/groceries-dataset
# 或者使用下方的 GitHub 原始数据链接（更直接）
GROCERIES_URL = "https://raw.githubusercontent.com/stedy/Machine-Learning-with-R-datasets/master/groceries.csv"
OUTPUT_FILENAME = "Groceries_encoded.csv"  # 生成的最终文件名
# -----------------

print("正在加载 groceries 数据集...")
try:
    # 尝试直接读取 CSV 文件
    df = pd.read_csv(GROCERIES_URL, header=None)
    print("从网络加载成功。")
except Exception as e:
    print(f"网络加载失败: {e}")
    # 这里可以添加备用的本地加载逻辑，但为演示，我们假设网络加载成功
    exit()

# --- 2. 数据预处理 ---
transactions = df[0].apply(lambda x: x.split(','))
# 将事务列表转换为适合 pandas get_dummies 的格式
# 创建一个列表，每个元素是一个事务的 DataFrame
transactions_list = []
for i, items in transactions.items():
    transactions_list.append(pd.DataFrame([1]*len(items), index=items).T)
# 将所有事务拼接成一个大的稀疏 DataFrame，并用 0 填充缺失值
df_encoded = pd.concat(transactions_list, ignore_index=True).fillna(0).astype(int)

print(f"数据转换完成。生成的文件包含 {df_encoded.shape[0]} 行 (事务), {df_encoded.shape[1]} 列 (商品).")

# --- 3. 保存为 CSV 文件 ---
df_encoded.to_csv(OUTPUT_FILENAME, index=False)
print(f"成功！已生成可直接上传的 CSV 文件: {os.path.abspath(OUTPUT_FILENAME)}")