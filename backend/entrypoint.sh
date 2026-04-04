#!/bin/bash
set -e

echo "Waiting for database..."
python -c "
import time, sys, os, MySQLdb
from dotenv import load_dotenv
load_dotenv()
url = os.getenv('DATABASE_URL', '')
import re
m = re.match(r'mysql\+mysqldb://(\w+):(\w+)@(\w+):(\d+)/(\w+)', url)
if m:
    user, pwd, host, port, db = m.groups()
    for i in range(30):
        try:
            MySQLdb.connect(host=host, user=user, passwd=pwd, db=db, port=int(port))
            print('Database ready!')
            break
        except:
            print(f'Waiting for DB... ({i+1}/30)')
            time.sleep(2)
"

echo "Running seed script..."
python seed.py

echo "Starting application..."
exec "$@"