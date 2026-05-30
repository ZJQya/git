import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, plot_tree
import json

def perform_decision_tree(df, params_str, output_path):
    """决策树分类可视化"""
    params = json.loads(params_str) if params_str else {}
    target_col = params.get('target_col', df.columns[-1])
    feature_cols = params.get('feature_cols', df.columns[:-1].tolist())
    test_size = params.get('test_size', 0.2)
    max_depth = params.get('max_depth', None)

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
    clf = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
    clf.fit(X_train, y_train)

    plt.figure(figsize=(20, 10))
    plot_tree(clf, filled=True, feature_names=feature_cols,
              class_names=[str(c) for c in clf.classes_], rounded=True)
    plt.title("Decision Tree Visualization")
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
