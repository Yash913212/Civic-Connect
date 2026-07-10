import itertools
import sqlalchemy
from sqlalchemy import create_engine, text

# Base template
# postgresql://neondb_owner:npg_{password}@ep-flat-king-a4z78uz1-pooler.c-a.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-flat-king-a4z78uz1

chars = {
    1: ['t', 'f', 'F'],
    8: ['E', 'e'],
    9: ['F', 'f'],
    11: ['I', 'i', '1']
}

base_pw = list("vX3Yba8SXX5X")

combinations = itertools.product(chars[1], chars[8], chars[9], chars[11])

success = False
for c1, c8, c9, c11 in combinations:
    pw = f"v{c1}3Yba8S{c8}{c9}5{c11}"
    url = f"postgresql://neondb_owner:npg_{pw}@ep-flat-king-a4z78uz1-pooler.c-a.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-flat-king-a4z78uz1"
    
    engine = create_engine(url, connect_args={"connect_timeout": 3})
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"SUCCESS! Password is: npg_{pw}")
        success = True
        
        # Write to .env
        with open(".env", "r") as f:
            content = f.read()
        import re
        content = re.sub(r'DATABASE_URL=".*?"', f'DATABASE_URL="{url}"', content)
        with open(".env", "w") as f:
            f.write(content)
        break
    except Exception as e:
        pass

if not success:
    print("FAILED TO GUESS")
