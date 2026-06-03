from flask import Flask, request, jsonify
import pandas as pd
import os
import uuid
from analysis.decision_tree import perform_decision_tree
from analysis.kmeans_cluster import perform_kmeans
from analysis.apriori_rules import perform_apriori

app = Flask(__name__)

# 结果图片存放目录
RESULT_IMAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "results")
os.makedirs(RESULT_IMAGE_DIR, exist_ok=True)

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    接收Java后端传来的分析请求
    参数: file_path, task_type, params, task_id
    返回: image_path
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    file_path = data.get('file_path')
    task_type = data.get('task_type')
    params = data.get('params', '{}')
    task_id = data.get('task_id', 'unknown')

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": f"File not found: {file_path}"}), 404

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 400

    output_filename = f"{task_id}_{uuid.uuid4().hex}.png"
    output_path = os.path.join(RESULT_IMAGE_DIR, output_filename)

    try:
        if task_type == 'decision_tree':
            perform_decision_tree(df, params, output_path)
        elif task_type == 'kmeans':
            perform_kmeans(df, params, output_path)
        elif task_type == 'apriori':
            perform_apriori(df, params, output_path)
        else:
            return jsonify({"error": f"Unsupported task type: {task_type}"}), 400

        # 返回图片的绝对路径，Java后端可直接访问（需共享存储或同主机）
        return jsonify({"image_path": output_path}), 200
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
# 同时左侧边功能栏要优化，包括数据集管理和数据分析功能，数据集管理界面可以上传数据和显示上传的数据集，并且可以打开数据集查看里面的内容，数据集格式可以为csv；数据分析功能，可以选择上传的数据集，在数据分析按钮下面可以有决策树、聚类和规则分析三个功能