from model import train_random_forest_optimised

# Run initial model
results = train_random_forest_optimised("Mutation_original.csv")

# Feature Importance Plot
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=300)
plt.close()

# For the ROC plot later
roc_plot.savefig("roc_curve.png", dpi=300)
roc_plot.show(block=True)
