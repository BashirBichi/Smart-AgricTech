from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
import os
from werkzeug.utils import secure_filename
from flask_login import current_user, login_required
from flask import Flask, jsonify
from flask import Flask, request, jsonify
# from models import db, ProductName, Product

# Flask app configuration
app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov'}

# Database setup
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    # profile_picture = db.Column(db.String(200), default='https://via.placeholder.com/100')

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    posted_by = db.Column(db.String(100), nullable=False)
    media_file = db.Column(db.String(200))

# Utility function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form['name']
    email = request.form['email']
    role = request.form['role']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    if password != confirm_password:
        flash("Passwords do not match", "danger")
        return redirect(url_for('index'))

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(name=name, email=email, password=hashed_password, role=role)
    try:
        db.session.add(new_user)
        db.session.commit()
        flash("Registration successful! Please login.", "success")
        return redirect(url_for('index'))
    except:
        flash("Email already registered.", "danger")
        return redirect(url_for('index'))
        

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    email = request.form['email']
    password = request.form['password']
    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['user_name'] = user.name
        session['role'] = user.role
        flash(f"Welcome back, {user.name}!", "success")
        return redirect(url_for(f'{user.role}_dashboard'))
    else:
        flash("Invalid email or password.", "danger")
        return redirect(url_for('index'))
        return render_template('login.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for('index'))

@app.route('/farmer_dashboard')
def farmer_dashboard():
    if 'user_name' in session:
        return render_template(
            'farmer_dashboard.html',
            name=session['user_name'],
            profile_picture=session.get('profile_picture', 'https://via.placeholder.com/50')
        )
    else:
        flash("Please log in to access the dashboard.", "warning")
        return redirect(url_for('index'))

@app.route('/processor_dashboard')
def processor_dashboard():
    if 'user_name' in session:
        return render_template(
            'processor_dashboard.html',
            name=session['user_name'],
            profile_picture=session.get('profile_picture', 'https://via.placeholder.com/50')
        )
    else:
        flash("Please log in to access the dashboard.", "warning")
        return redirect(url_for('index'))

@app.route('/consumer_dashboard')
def consumer_dashboard():
    if 'user_name' in session:
        return render_template(
            'consumer_dashboard.html',
            name=session['user_name'],
            profile_picture=session.get('profile_picture', 'https://via.placeholder.com/50')
        )
    else:
        flash("Please log in to access the dashboard.", "warning")
        return redirect(url_for('index'))
@app.route('/marketer_dashboard')
def marketer_dashboard():
    if 'user_name' in session:
        return render_template(
            'marketer_dashboard.html',
            name=session['user_name'],
            profile_picture=session.get('profile_picture', 'https://via.placeholder.com/50')
        )
    else:
        flash("Please log in to access the dashboard.", "warning")
        return redirect(url_for('index'))

@app.route('/admin_login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email, role='admin').first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['role'] = user.role
            flash(f"Welcome Admin {user.name}!", "success")
            return redirect(url_for('admin_dashboard'))
        else:
            flash("Invalid admin credentials.", "danger")
            return redirect(url_for('admin_login'))

    return render_template('admin_login.html')

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user_id' in session and session['role'] == 'admin':
        users = User.query.all()
        return render_template('admin_dashboard.html', name=session['user_name'], users=users)
    else:
        flash("Unauthorized access.", "danger")
        return redirect(url_for('admin_login'))

@app.route('/market_access', methods=['GET', 'POST'])
def market_access():
    if request.method == 'POST':
        name = request.form['name']
        quantity = request.form['quantity']
        price = request.form['price']
        description = request.form['description']
        posted_by = request.form['posted_by']
        file = request.files['media_file']

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
        else:
            filepath = None

        product = Product(
            name=name,
            quantity=quantity,
            price=price,
            description=description,
            posted_by=posted_by,
            media_file=filepath
        )
        db.session.add(product)
        db.session.commit()
        return redirect(url_for('market_access'))

    products = Product.query.all()
    return render_template('market_access.html', products=products)

@app.route('/marketplace')
def marketplace():
    products = Product.query.all()
    return render_template('marketplace.html', products=products)

@app.route('/profile-settings', methods=['GET', 'POST'])
# @login_required
def profile_settings():
    if request.method == 'POST':
        if 'profile_picture' not in request.files:
            flash("No file selected!", "danger")
            return redirect(url_for('profile_settings'))

        file = request.files['profile_picture']
        if file.filename == '':
            flash("No file selected!", "danger")
            return redirect(url_for('profile_settings'))

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            current_user.profile_picture = filepath
            db.session.commit()

            flash("Profile picture updated successfully!", "success")
            return redirect(url_for('profile_settings'))

    profile_picture = current_user.profile_picture
    return render_template('profile_settings.html', profile_picture=profile_picture)

@app.route('/market-trends-data')
def market_trends_data():
    product_name = request.args.get('product', '')
    category = request.args.get('category', '')

    # Query database for product prices
    query = Product.query
    if product_name:
        query = query.filter(Product.name.ilike(f"%{product_name}%"))
    if category:
        query = query.filter(Product.category == category)

    products = query.all()

    # Convert products into trend data
    trends = []
    for product in products:
        trends.append({
            "t": product.created_at.strftime("%Y-%m-%d"),
            "o": product.price * 0.9,  # Simulate open price
            "h": product.price * 1.1,  # Simulate high price
            "l": product.price * 0.8,  # Simulate low price
            "c": product.price        # Closing price (actual price)
        })

    return jsonify(trends)





# Managing Product Names & Market Trends
@app.route('/get-product-names', methods=['GET'])
def get_product_names():
    product_names = ProductName.query.all()
    return jsonify([{"id": p.id, "name": p.name, "category": p.category} for p in product_names])

@app.route('/add-product-name', methods=['POST'])
def add_product_name():
    data = request.json
    new_product = ProductName(name=data['name'], category=data['category'])
    db.session.add(new_product)
    db.session.commit()
    return jsonify({"message": "Product name added successfully!"})

@app.route('/delete-product-name/<int:product_id>', methods=['DELETE'])
def delete_product_name(product_id):
    product = ProductName.query.get(product_id)
    if product:
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Product name removed successfully!"})
    return jsonify({"error": "Product not found"}), 404





if __name__ == '__main__':

    with app.app_context():
        db.create_all()
    app.run(debug=True)
