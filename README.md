# BIOM9450
BIO9450 Major Project: Patient Management and Diagnostic Reporting System Ethan, Yvonne, Sunny, Sarina, Anish

After cloning this respository, run `cd BIOM9450`

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
## Start frontend localhost for development
```
cd frontend
npm install
npm run dev

```

## Start frontend localhost for production build
```
cd frontend
npm install
npm run build
npm run start

```

## Set up backend
1. Copy "patient-system" into htdocs xampp/htdocs
2. **IMPORTANT**: Also copy the "machine_learning" folder into htdocs (Run the ML instructions first) AND db_config.php into htdocs
   - Structure should be:
     - xampp/htdocs/patient-system/
     - xampp/htdocs/machine_learning/
     - xampp/htdocs/db_config.php
3. Start apache and SQL server
4. Import database and csv data
   1. Update csv file path on database.sql `LOAD DATA LOCAL INFILE 'C:/Users/sunny/Desktop/Uni/BIOM9450/BIOM9450/Mutation_original.csv'`
   2. Run the following command on cmd `cmd /c "C:\xampp\mysql\bin\mysql.exe --local-infile=1 -u root patient_management < database/database.sql"`

## Run php server to set up backend API
Start backend php server: `php -S 127.0.0.1:8000 patient-system/api/api.php`.
