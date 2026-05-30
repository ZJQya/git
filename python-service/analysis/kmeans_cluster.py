import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json

def perform_kmeans(df, params_str, output_path):
    """K-Means聚类并绘制散点图"""
    params = json.loads(params_str) if params_str else {}
    n_clusters = params.get('n_clusters', 3)
    feature_cols = params.get('feature_cols', df.select_dtypes(include='number').columns.tolist())

    X = df[feature_cols].select_dtypes(include='number')
    if X.shape[1] < 2:
        raise ValueError("Need at least 2 numeric features for scatter plot.")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    plt.figure(figsize=(10, 8))
    x_col = X.columns[0]
    y_col = X.columns[1]
    sns.scatterplot(x=X[x_col], y=X[y_col], hue=clusters, palette='viridis', s=60)
    plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1],
                marker='X', s=200, c='red', label='Centroids')
    plt.title(f'K-Means Clustering (k={n_clusters})')
    plt.xlabel(x_col)
    plt.ylabel(y_col)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
