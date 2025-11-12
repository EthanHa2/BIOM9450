# model.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_curve, auc
from itertools import cycle

# Trains a Random Forest Model on the mutation level data and plots features of importance
# and ROC curves for multiclass classification
def train_random_forest_optimised(data_path: str):
    # -----------------------------
    # 1️⃣ Load dataset
    # -----------------------------
    df = pd.read_csv(data_path)
    df = df[['chromosome_start', 'chromosome_end', 'mutation_type',
                'mutated_from_allele', 'mutated_to_allele',
                'gene_affected', 'Cancer type']].dropna()

    # -----------------------------
    # 2️⃣ Encode categorical columns
    # -----------------------------
    le_from = LabelEncoder()
    le_to = LabelEncoder()
    le_ct = LabelEncoder()
    le_gene = LabelEncoder()
    le_label = LabelEncoder()

    df['mutated_from_allele'] = le_from.fit_transform(df['mutated_from_allele'].astype(str))
    df['mutated_to_allele'] = le_to.fit_transform(df['mutated_to_allele'].astype(str))
    df['mutation_type'] = le_ct.fit_transform(df['mutation_type'].astype(str))
    df['gene_affected'] = le_gene.fit_transform(df['gene_affected'].astype(str))
    df['Cancer type'] = le_label.fit_transform(df['Cancer type'].astype(str))

    # -----------------------------
    # 3️⃣ Prepare features and labels
    # -----------------------------
    X = df[['chromosome_start', 'chromosome_end', 'mutated_from_allele',
            'mutated_to_allele', 'gene_affected']]
    y = df['Cancer type']

    # -----------------------------
    # 4️⃣ Split dataset
    # -----------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # -------------------------------------------------------------
    # 5️⃣ Train Random Forest - with optimised hyperparameters
    # -------------------------------------------------------------
    # Hyperparameters obtained from Bayesian optimisation
    rf = RandomForestClassifier(
        random_state=42,
        class_weight='balanced',
        n_jobs=-1,
        n_estimators=478,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=3,
        max_features='sqrt'
    )
    rf.fit(X_train_scaled, y_train)

    # -----------------------------
    # 6️⃣ Evaluate model
    # -----------------------------
    y_pred = rf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)

    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # -----------------------------
    # 7️⃣ Feature importance plot
    # -----------------------------
    feature_importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
    feature_importances_plot = plt.figure(figsize=(7, 4))
    sns.barplot(x=feature_importances.values, y=feature_importances.index)
    plt.title("Feature Importance (Random Forest)")
    plt.xlabel("Importance Score")
    plt.ylabel("Feature")
    plt.show()
    plt.tight_layout()
    plt.savefig("feature_importance.png", dpi=300)
    plt.close()

    # -----------------------------
    # 8️⃣ ROC–AUC curve (multiclass)
    # -----------------------------
    n_classes = len(np.unique(y))
    y_test_bin = label_binarize(y_test, classes=list(range(n_classes)))
    y_score = rf.predict_proba(X_test_scaled)

    fpr, tpr, roc_auc = {}, {}, {}
    for i in range(n_classes):
        fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_score[:, i])
        roc_auc[i] = auc(fpr[i], tpr[i])

    all_fpr = np.unique(np.concatenate([fpr[i] for i in range(n_classes)]))
    mean_tpr = np.zeros_like(all_fpr)
    for i in range(n_classes):
        mean_tpr += np.interp(all_fpr, fpr[i], tpr[i])
    mean_tpr /= n_classes
    roc_auc_macro = auc(all_fpr, mean_tpr)

    roc_plot = plt.figure(figsize=(8, 6))
    colors = cycle(["red", "green", "blue", "orange", "purple"])
    for i, color in zip(range(min(n_classes, 5)), colors):
        plt.plot(fpr[i], tpr[i], color=color, lw=1.5,
                    label=f"Class {i} (AUC = {roc_auc[i]:.3f})")
    plt.plot([0, 1], [0, 1], "k--", lw=1)
    plt.title(f"Multiclass ROC Curve (Macro AUC = {roc_auc_macro:.3f})")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.legend(loc="lower right")

    # For the ROC plot later
    plt.savefig("roc_curve.png", dpi=300)
    plt.close()

    return {
        "model": rf,
        "scaler": scaler,
        "accuracy": acc,
        "roc_auc_macro": roc_auc_macro,
        "label_encoder": le_label,
        "feature_importances_plot": feature_importances_plot,
        "roc_plot": roc_plot
    }
