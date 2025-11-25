from base_model import train_random_forest_base_model
from optimisation import bayesian_optimisation

# Run initial model
results = train_random_forest_base_model("Mutation_original.csv")

# Run Bayesian optimisation (20 iterations)
best_params, best_acc = bayesian_optimisation("Mutation_original.csv")