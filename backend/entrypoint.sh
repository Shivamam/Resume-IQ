#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."
python -c "
import time, sys, os, re
from dotenv import load_dotenv
load_dotenv()

url = os.getenv('DATABASE_URL', '')
m = re.match(r'mysql\+mysqldb://([^:]+):([^@]+)@([^:]+):(\d+)/(\w+)', url)
if not m:
    print('Could not parse DATABASE_URL')
    sys.exit(1)

user, pwd, host, port, db = m.groups()
import MySQLdb

for i in range(40):
    try:
        # Connect WITHOUT database name first — just check MySQL is up
        conn = MySQLdb.connect(host=host, user=user, passwd=pwd, port=int(port))
        cursor = conn.cursor()
        # Create database if it doesn't exist
        cursor.execute(f'CREATE DATABASE IF NOT EXISTS \`{db}\`')
        conn.commit()
        cursor.close()
        conn.close()
        print(f'MySQL is ready and database {db} exists!')
        break
    except Exception as e:
        print(f'Waiting for MySQL... ({i+1}/40): {e}')
        time.sleep(3)
else:
    print('MySQL never became ready')
    sys.exit(1)
"

echo "Creating database tables..."
python -c "
import sys, os
sys.path.insert(0, '/app')
from dotenv import load_dotenv
load_dotenv()
from app.database import Base, engine
from app import models
Base.metadata.create_all(bind=engine)
print('Tables created successfully!')
"

echo "Running seed script..."
python seed.py

echo "Starting: $@"
exec "$@"
