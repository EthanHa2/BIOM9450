# BIOM9450
BIO9450 Major Project: Patient Management and Diagnostic Reporting System Ethan, Yvonne, Sunny, Sarina, Anish

# Machine Learning Instructions
To get the machine learning model ready, follow the instructions below. First head to the machine_learning directory and create a python virtual environment.

Mac:
```
cd machine_learning
python -m venv venv 
source venv/bin/activate
pip install -r requirements.txt
```

Windows:
```
cd machine_learning
python -m venv venv 
venv\Scripts\activate
pip install -r requirements.txt
```

Then after installing all the required packages, run the following command to create the models:
```
python main.py
```

# Instructions
## Start frontend localhost
```
cd frontend
npm install
npm run dev

```

## Set up backend
1. Copy "patient-system" into htdocs xampp/htdocs
2. **IMPORTANT**: Also copy the "machine_learning" folder into htdocs (Run the ML instructions first)
   - Structure should be:
     - xampp/htdocs/patient-system/
     - xampp/htdocs/machine_learning/
3. Start apache and SQL server
4. Access the admin dashboard and import the database.sql
5. Import mutations from admin dashboard
   1. Convert from excel -> csv
   2. Navigate to the mutation table
   3. Click import and select the csv file
   4. Uncheck "Allow intteruption of import..." under "Partial Import"
   5. Set "Skip this number of queries..." to 1 (skips the column names of csv file)
   6. Paste the following into "Column Names" under "Format-specific Option": icgc_specimen_id, chromosome, chromosome_start, chromosome_end, mutation_type, mutated_from_allele, mutated_to_allele, consequence_type, gene_affected, cancer_type

