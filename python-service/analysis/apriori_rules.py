import pandas as pd
import matplotlib.pyplot as plt
from mlxtend.frequent_patterns import apriori, association_rules
import json

def perform_apriori(df, params_str, output_path):
    """关联规则分析并以表格图片展示"""
    params = json.loads(params_str) if params_str else {}
    min_support = params.get('min_support', 0.2)
    min_threshold = params.get('min_threshold', 0.6)

    # 尝试自动进行独热编码
    df_encoded = pd.get_dummies(df, prefix_sep='=')
    frequent_itemsets = apriori(df_encoded, min_support=min_support, use_colnames=True)
    if frequent_itemsets.empty:
        plt.figure(figsize=(8, 6))
        plt.text(0.5, 0.5, 'No frequent itemsets found', horizontalalignment='center', verticalalignment='center')
        plt.savefig(output_path)
        plt.close()
        return

    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_threshold)
    if rules.empty:
        plt.figure(figsize=(8, 6))
        plt.text(0.5, 0.5, 'No association rules generated', horizontalalignment='center', verticalalignment='center')
        plt.savefig(output_path)
        plt.close()
        return

    fig, ax = plt.subplots(figsize=(12, max(len(rules) * 0.5 + 2, 4)))
    ax.axis('tight')
    ax.axis('off')
    table_data = rules[['antecedents', 'consequents', 'support', 'confidence', 'lift']].head(10).values.tolist()
    col_labels = ['Antecedents', 'Consequents', 'Support', 'Confidence', 'Lift']
    table = ax.table(cellText=table_data, colLabels=col_labels, cellLoc='center', loc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    plt.title('Association Rules (Top 10)')
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
