# optimisation.py
from skopt import gp_minimize
from skopt.space import Integer, Categorical, Real
from skopt.utils import use_named_args
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import make_scorer, f1_score
import pandas as pd
import numpy as np

# Bayesian Hyperparameter Optimisation for Random Forest Classifier
def bayesian_optimisation(data_path: str, n_calls: int = 10):
    # -----------------------------
    # Load and preprocess data
    # -----------------------------
    df = pd.read_csv(data_path)
    df = df[['chromosome_start', 'chromosome_end', 'mutation_type',
                'mutated_from_allele', 'mutated_to_allele',
                'gene_affected', 'Cancer type']].dropna()

    le_from, le_to, le_ct, le_gene, le_label = LabelEncoder(), LabelEncoder(), LabelEncoder(), LabelEncoder(), LabelEncoder()
    df['mutated_from_allele'] = le_from.fit_transform(df['mutated_from_allele'].astype(str))
    df['mutated_to_allele'] = le_to.fit_transform(df['mutated_to_allele'].astype(str))
    df['mutation_type'] = le_ct.fit_transform(df['mutation_type'].astype(str))
    df['gene_affected'] = le_gene.fit_transform(df['gene_affected'].astype(str))
    df['Cancer type'] = le_label.fit_transform(df['Cancer type'].astype(str))

    X = df[['chromosome_start', 'chromosome_end', 'mutated_from_allele',
            'mutated_to_allele', 'gene_affected']]
    y = df['Cancer type']

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # -----------------------------
    # Define search space
    # -----------------------------
    space = [
        Integer(100, 600, name="n_estimators"),
        Integer(6, 25, name="max_depth"),
        Integer(2, 10, name="min_samples_split"),
        Integer(1, 5, name="min_samples_leaf"),
        Categorical(['sqrt', 'log2'], name="max_features"),
    ]

    scorer = make_scorer(f1_score, average='macro')

    # Defining the objective
    @use_named_args(space)
    def objective(**params):
        model = RandomForestClassifier(
            n_jobs=-1,
            class_weight='balanced',
            random_state=42,
            **params
        )
        score = cross_val_score(model, X_scaled, y, cv=3, scoring=scorer).mean()
        # gp_minimize tries to MINIMIZE → return negative score
        return -score

    # -----------------------------
    # Run Bayesian optimisation
    # -----------------------------
    result = gp_minimize(
        func=objective,
        dimensions=space,
        n_calls=n_calls,
        random_state=42,
        verbose=True
    )

    #  Get the best parameters
    best_params = {
        "n_estimators": result.x[0],
        "max_depth": result.x[1],
        "min_samples_split": result.x[2],
        "min_samples_leaf": result.x[3],
        "max_features": result.x[4]
    }

    best_score = -result.fun  # Convert back to positive score

    print("\nBest Parameters:", best_params)
    print(f"Best Cross-Validation F1-macro: {best_score:.4f}")

    return best_params, best_score