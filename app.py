from flask import Flask, render_template, request, redirect, url_for, session
import csv, os, datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = "smartwater2025"
app.permanent_session_lifetime = datetime.timedelta(minutes=30)

# File paths
DATA_FOLDER = "data"
USERS_FILE = os.path.join(DATA_FOLDER, "users.csv")

# Ensure data folder exists
os.makedirs(DATA_FOLDER, exist_ok=True)


# ---------- Utility Functions ----------

def read_users():
    """Load all users from users.csv file."""
    users = {}
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, newline='') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) == 2:
                    users[row[0]] = row[1]
    return users


def save_user(username, password):
    """Save a new user permanently."""
    with open(USERS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([username, password])


def analyze_water(ph, tds):
    """Determine water quality."""
    if 6.5 <= ph <= 8.5 and tds < 500:
        return "Excellent - Safe for Drinking", "Water meets WHO standards."
    elif tds < 1000:
        return "Moderate - Suitable for Domestic Use", "Safe for domestic use but not ideal for drinking."
    else:
        return "Poor - Unsafe", "High dissolved solids detected; purification required."


def estimate_minerals(tds, region):
    """Estimate mineral composition based on TDS and region type."""
    regions = {
        "groundwater": (0.25, 0.08, 0.12, 0.03, 0.20, 0.15),
        "urban": (0.20, 0.06, 0.18, 0.02, 0.22, 0.20),
        "industrial": (0.15, 0.05, 0.25, 0.03, 0.25, 0.22),
        "coastal": (0.10, 0.05, 0.30, 0.02, 0.20, 0.25)
    }
    f = regions.get(region, (0.20, 0.07, 0.15, 0.03, 0.22, 0.18))
    ca, mg, na, k, so4, cl = [round(tds * x, 2) for x in f]
    return ca, mg, na, k, so4, cl


def login_required(func):
    """Decorator to protect routes that need login."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    return wrapper


# ---------- Routes ----------

@app.route('/')
def home():
    return render_template('home.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    users = read_users()
    if request.method == 'POST':
        u, p = request.form['username'], request.form['password']
        if users.get(u) == p:
            session['user'] = u
            session.permanent = True
            return redirect(url_for('analyze'))
        else:
            return render_template('login.html', error="Invalid username or password.")
    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    users = read_users()
    if request.method == 'POST':
        u, p = request.form['username'], request.form['password']
        if u in users:
            return render_template('signup.html', error="User already exists.")
        save_user(u, p)
        return redirect(url_for('login'))
    return render_template('signup.html')


@app.route('/analyze', methods=['GET', 'POST'])
@login_required
def analyze():
    user = session['user']
    user_file = os.path.join(DATA_FOLDER, f"{user}_records.csv")

    if request.method == 'POST':
        ph = float(request.form['ph'])
        tds = float(request.form['tds'])
        region = request.form['region']

        ca, mg, na, k, so4, cl = estimate_minerals(tds, region)
        result, message = analyze_water(ph, tds)

        record = [datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ph, tds, ca, mg, k, na, so4, cl, result]
        file_exists = os.path.isfile(user_file)
        with open(user_file, 'a', newline='') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["DateTime","pH","TDS","Calcium","Magnesium","Potassium","Sodium","Sulphate","Chloride","Result"])
            writer.writerow(record)

        data = {"ph": ph, "tds": tds, "region": region, "ca": ca, "mg": mg, "na": na, "k": k, "so4": so4, "cl": cl}
        return render_template('result.html', data=data, result=result, message=message)

    return render_template('analyze.html')


@app.route('/history')
@login_required
def history():
    user = session['user']
    user_file = os.path.join(DATA_FOLDER, f"{user}_records.csv")
    if not os.path.exists(user_file):
        return render_template('history.html', records=[])
    with open(user_file) as f:
        recs = list(csv.reader(f))
    return render_template('history.html', records=recs[-20:])


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

