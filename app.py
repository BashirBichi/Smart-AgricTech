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
app = Flask(__name__, template_folder='Templates', static_folder='Static')
app.secret_key = os.environ['SECRET_KEY']
database_url = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
if database_url.startswith('postgres://'):
    database_url = 'postgresql://' + database_url[len('postgres://'):]
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads')
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

# Farm Management: records are scoped to the authenticated farmer.
class CommunityPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    body = db.Column(db.String(2000), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class CommunityMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    body = db.Column(db.String(2000), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class Farm(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(180), nullable=False, default='')
    farm_type = db.Column(db.String(30), nullable=False, default='mixed')

class FarmOperation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    farm_id = db.Column(db.Integer, db.ForeignKey('farm.id'), nullable=False, index=True)
    category = db.Column(db.String(24), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    details = db.Column(db.String(500), nullable=False, default='')
    quantity = db.Column(db.Float, nullable=False, default=0)
    unit = db.Column(db.String(30), nullable=False, default='')
    scheduled_on = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='planned')
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class PoultryBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farm_id = db.Column(db.Integer, db.ForeignKey('farm.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    bird_type = db.Column(db.String(40), nullable=False)
    breed = db.Column(db.String(100), nullable=False, default='')
    initial_count = db.Column(db.Integer, nullable=False)
    acquired_on = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class PoultryDailyRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('poultry_batch.id'), nullable=False, index=True)
    recorded_on = db.Column(db.Date, nullable=False)
    deaths = db.Column(db.Integer, nullable=False, default=0)
    eggs = db.Column(db.Integer, nullable=False, default=0)
    feed_kg = db.Column(db.Float, nullable=False, default=0)
    notes = db.Column(db.String(500), nullable=False, default='')

class ShoppingCartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    product_key = db.Column(db.String(250), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500), nullable=False, default='')
    image = db.Column(db.String(500), nullable=False, default='')
    price = db.Column(db.Float, nullable=False, default=0)
    quantity = db.Column(db.Integer, nullable=False, default=1)

@app.route('/api/cart', methods=['GET', 'PUT'])
def account_cart_api():
    owner = session.get('user_id')
    if not owner:
        return jsonify(error='Login required'), 401
    if request.method == 'GET':
        rows = ShoppingCartItem.query.filter_by(owner_id=owner).order_by(ShoppingCartItem.id).all()
        return jsonify(items=[dict(name=x.name, description=x.description, image=x.image,
                                   price=x.price, quantity=x.quantity, product_key=x.product_key) for x in rows])
    payload = request.get_json(silent=True) or {}
    items = payload.get('items')
    if not isinstance(items, list) or len(items) > 150:
        return jsonify(error='Invalid cart'), 400
    cleaned = []
    for item in items:
        if not isinstance(item, dict):
            return jsonify(error='Invalid cart item'), 400
        try:
            price = float(item.get('price', 0))
            quantity = int(item.get('quantity', 0))
        except (ValueError, TypeError):
            return jsonify(error='Invalid price or quantity'), 400
        if not (0 <= price <= 1000000000 and 1 <= quantity <= 10000):
            return jsonify(error='Invalid price or quantity'), 400
        name = str(item.get('name', '')).strip()[:200]
        if not name:
            return jsonify(error='Product name required'), 400
        cleaned.append(ShoppingCartItem(owner_id=owner, product_key=str(item.get('product_key') or name)[:250],
                                        name=name, description=str(item.get('description') or '')[:500],
                                        image=str(item.get('image') or '')[:500], price=price, quantity=quantity))
    ShoppingCartItem.query.filter_by(owner_id=owner).delete()
    db.session.add_all(cleaned)
    db.session.commit()
    return jsonify(message='Cart saved', count=sum(x.quantity for x in cleaned))

def farmer_identity():
    if not session.get('user_id') or session.get('role') != 'farmer':
        return None
    return session['user_id']

@app.route('/api/community/posts', methods=['GET', 'POST'])
def community_posts_api():
    uid = session.get('user_id')
    if not uid:
        return jsonify(error='Login required'), 401
    if request.method == 'POST':
        body = str((request.get_json(silent=True) or {}).get('body', '')).strip()
        if not 1 <= len(body) <= 2000:
            return jsonify(error='Post must be 1–2000 characters'), 400
        db.session.add(CommunityPost(author_id=uid, body=body))
        db.session.commit()
        return jsonify(message='Post published'), 201
    rows = (db.session.query(CommunityPost, User).join(User, User.id == CommunityPost.author_id)
            .order_by(CommunityPost.id.desc()).limit(80).all())
    return jsonify(posts=[dict(id=p.id, body=p.body, author=u.name, role=u.role,
        created_at=p.created_at.isoformat() if p.created_at else '') for p,u in rows])

@app.route('/api/community/members')
def community_members_api():
    uid = session.get('user_id')
    if not uid:
        return jsonify(error='Login required'), 401
    members = User.query.filter(User.id != uid).order_by(User.name).limit(200).all()
    return jsonify(members=[dict(id=u.id, name=u.name, role=u.role) for u in members])

@app.route('/api/community/messages', methods=['GET', 'POST'])
def community_messages_api():
    uid = session.get('user_id')
    if not uid:
        return jsonify(error='Login required'), 401
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            recipient = int(data.get('recipient_id'))
        except (ValueError, TypeError):
            return jsonify(error='Choose a member'), 400
        body = str(data.get('body', '')).strip()
        if not 1 <= len(body) <= 2000 or recipient == uid or not db.session.get(User, recipient):
            return jsonify(error='Invalid recipient or message'), 400
        db.session.add(CommunityMessage(author_id=uid, recipient_id=recipient, body=body))
        db.session.commit()
        return jsonify(message='Message sent'), 201
    try:
        other = int(request.args.get('member_id', ''))
    except (ValueError, TypeError):
        return jsonify(error='Choose a member'), 400
    rows = (CommunityMessage.query.filter(
        db.or_(db.and_(CommunityMessage.author_id == uid, CommunityMessage.recipient_id == other),
               db.and_(CommunityMessage.author_id == other, CommunityMessage.recipient_id == uid)))
        .order_by(CommunityMessage.id.desc()).limit(100).all())
    names = {u.id:u.name for u in User.query.filter(User.id.in_([uid,other])).all()}
    return jsonify(messages=[dict(id=m.id, body=m.body, author=names.get(m.author_id,'Member'),
        mine=m.author_id==uid, created_at=m.created_at.isoformat() if m.created_at else '') for m in reversed(rows)])

@app.route('/api/farm/operations', methods=['GET', 'POST'])
def farm_operations_api():
    from datetime import date
    owner = farmer_identity()
    if owner is None:
        return jsonify(error='Farmer login required'), 403
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            farm_id = int(data.get('farm_id'))
            quantity = float(data.get('quantity') or 0)
            day = date.fromisoformat(str(data['scheduled_on'])) if data.get('scheduled_on') else None
        except (ValueError, TypeError, OverflowError):
            return jsonify(error='Invalid farm, quantity or date'), 400
        farm = Farm.query.filter_by(id=farm_id, owner_id=owner).first()
        category = str(data.get('category', '')).strip()
        title = str(data.get('title', '')).strip()[:120]
        if not farm or category not in ('cultivation', 'livestock', 'task', 'warehouse', 'supply') or not title or not 0 <= quantity <= 1000000000:
            return jsonify(error='Check farm and operation details'), 400
        record = FarmOperation(owner_id=owner, farm_id=farm.id, category=category, title=title,
            details=str(data.get('details', '')).strip()[:500], quantity=quantity,
            unit=str(data.get('unit', '')).strip()[:30], scheduled_on=day)
        db.session.add(record)
        db.session.commit()
        return jsonify(id=record.id, message='Farm operation saved'), 201
    rows = FarmOperation.query.filter_by(owner_id=owner).order_by(FarmOperation.id.desc()).limit(300).all()
    return jsonify(operations=[dict(id=o.id, farm_id=o.farm_id, category=o.category, title=o.title,
        details=o.details, quantity=o.quantity, unit=o.unit, scheduled_on=o.scheduled_on.isoformat() if o.scheduled_on else None,
        status=o.status) for o in rows])

@app.route('/api/farm/operations/<int:operation_id>', methods=['PATCH', 'DELETE'])
def farm_operation_update_api(operation_id):
    owner = farmer_identity()
    if owner is None:
        return jsonify(error='Farmer login required'), 403
    record = FarmOperation.query.filter_by(id=operation_id, owner_id=owner).first()
    if not record:
        return jsonify(error='Operation not found'), 404
    if request.method == 'DELETE':
        db.session.delete(record)
        db.session.commit()
        return jsonify(message='Operation deleted')
    status = str((request.get_json(silent=True) or {}).get('status', ''))
    if status not in ('planned', 'in_progress', 'completed'):
        return jsonify(error='Invalid status'), 400
    record.status = status
    db.session.commit()
    return jsonify(message='Status updated')

@app.route('/api/farms', methods=['GET', 'POST'])
def farms_api():
    owner = farmer_identity()
    if owner is None:
        return jsonify(error='Farmer login required'), 403
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        name = str(data.get('name', '')).strip()[:120]
        kind = str(data.get('farm_type', 'mixed'))
        if not name or kind not in ('mixed', 'poultry', 'livestock', 'crops'):
            return jsonify(error='Enter a farm name and valid farm type'), 400
        farm = Farm(owner_id=owner, name=name, location=str(data.get('location', '')).strip()[:180], farm_type=kind)
        db.session.add(farm)
        db.session.commit()
        return jsonify(id=farm.id, message='Farm created'), 201
    rows = Farm.query.filter_by(owner_id=owner).order_by(Farm.id.desc()).all()
    return jsonify(farms=[dict(id=f.id, name=f.name, location=f.location, farm_type=f.farm_type) for f in rows])

@app.route('/api/poultry/batches', methods=['GET', 'POST'])
def poultry_batches_api():
    from datetime import date
    owner = farmer_identity()
    if owner is None:
        return jsonify(error='Farmer login required'), 403
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            farm_id = int(data.get('farm_id'))
            count = int(data.get('initial_count'))
            acquired = date.fromisoformat(str(data.get('acquired_on', '')))
        except (ValueError, TypeError):
            return jsonify(error='Provide valid farm, bird count and acquisition date'), 400
        farm = Farm.query.filter_by(id=farm_id, owner_id=owner).first()
        name = str(data.get('name', '')).strip()[:120]
        bird_type = str(data.get('bird_type', '')).strip()[:40]
        if not farm or not name or not bird_type or count <= 0 or count > 100000000:
            return jsonify(error='Invalid farm or poultry batch details'), 400
        batch = PoultryBatch(farm_id=farm.id, name=name, bird_type=bird_type, breed=str(data.get('breed', '')).strip()[:100], initial_count=count, acquired_on=acquired)
        db.session.add(batch)
        db.session.commit()
        return jsonify(id=batch.id, message='Batch created'), 201
    batches = (db.session.query(PoultryBatch).join(Farm, Farm.id == PoultryBatch.farm_id)
               .filter(Farm.owner_id == owner).order_by(PoultryBatch.id.desc()).all())
    results = []
    for b in batches:
        records = PoultryDailyRecord.query.filter_by(batch_id=b.id).all()
        deaths = sum(r.deaths for r in records)
        results.append(dict(id=b.id, farm_id=b.farm_id, name=b.name, bird_type=b.bird_type,
                            breed=b.breed, initial_count=b.initial_count, current_count=b.initial_count-deaths,
                            deaths=deaths, eggs=sum(r.eggs for r in records),
                            feed_kg=round(sum(r.feed_kg for r in records), 2),
                            acquired_on=b.acquired_on.isoformat()))
    return jsonify(batches=results)

@app.route('/api/poultry/records', methods=['GET', 'POST'])
def poultry_records_api():
    from datetime import date
    owner = farmer_identity()
    if owner is None:
        return jsonify(error='Farmer login required'), 403
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            batch_id = int(data.get('batch_id'))
            deaths = int(data.get('deaths', 0))
            eggs = int(data.get('eggs', 0))
            feed = float(data.get('feed_kg', 0))
            recorded = date.fromisoformat(str(data.get('recorded_on', '')))
        except (ValueError, TypeError):
            return jsonify(error='Enter valid daily record values'), 400
        batch = (db.session.query(PoultryBatch).join(Farm, Farm.id == PoultryBatch.farm_id)
                 .filter(PoultryBatch.id == batch_id, Farm.owner_id == owner).first())
        if not batch or min(deaths, eggs, feed) < 0 or not (feed < 100000000):
            return jsonify(error='Invalid batch or quantities'), 400
        previous = db.session.query(db.func.coalesce(db.func.sum(PoultryDailyRecord.deaths), 0)).filter_by(batch_id=batch_id).scalar()
        if deaths > batch.initial_count - previous:
            return jsonify(error='Deaths exceed remaining birds'), 400
        record = PoultryDailyRecord(batch_id=batch_id, recorded_on=recorded, deaths=deaths,
                                    eggs=eggs, feed_kg=feed, notes=str(data.get('notes', '')).strip()[:500])
        db.session.add(record)
        db.session.commit()
        return jsonify(id=record.id, message='Daily record saved'), 201
    records = (db.session.query(PoultryDailyRecord, PoultryBatch.name)
               .join(PoultryBatch, PoultryBatch.id == PoultryDailyRecord.batch_id)
               .join(Farm, Farm.id == PoultryBatch.farm_id)
               .filter(Farm.owner_id == owner)
               .order_by(PoultryDailyRecord.recorded_on.desc(), PoultryDailyRecord.id.desc()).limit(100).all())
    return jsonify(records=[dict(id=r.id, batch_id=r.batch_id, batch_name=name,
                    recorded_on=r.recorded_on.isoformat(), deaths=r.deaths, eggs=r.eggs,
                    feed_kg=r.feed_kg, notes=r.notes) for r, name in records])

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
    if session.get('user_id') and session.get('role') == 'farmer':
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
    if session.get('user_id') and session.get('role') == 'processor':
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
    if session.get('user_id') and session.get('role') == 'consumer':
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
    if session.get('user_id') and session.get('role') == 'marketer':
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

@app.route('/api/marketplace/products', methods=['GET', 'POST'])
def marketplace_products_api():
    if request.method == 'GET':
        products = Product.query.filter(Product.owner_id.isnot(None)).order_by(Product.id.desc()).all()
        return jsonify(products=[dict(id=p.id, name=p.name, description=p.description or '',
            price=p.price, quantity=p.quantity, seller=p.posted_by,
            image_url=url_for('static', filename='uploads/' + os.path.basename(p.media_file)) if p.media_file else '')
            for p in products])
    owner = session.get('user_id')
    if not owner:
        return jsonify(error='Login required to post products'), 401
    data = request.form
    name = data.get('name', '').strip()[:100]
    description = data.get('description', '').strip()[:200]
    try:
        price = float(data.get('price', 0))
        quantity = int(data.get('quantity', 1))
    except (ValueError, TypeError):
        return jsonify(error='Invalid price or quantity'), 400
    if not name or not 0 < price <= 1000000000 or not 0 < quantity <= 1000000:
        return jsonify(error='Valid product name, price and quantity required'), 400
    media_file = request.files.get('image')
    media_path = None
    if media_file and media_file.filename:
        if not allowed_file(media_file.filename):
            return jsonify(error='Unsupported image format'), 400
        import uuid
        filename = uuid.uuid4().hex + '_' + secure_filename(media_file.filename)[:80]
        media_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        media_path = filename
    product = Product(name=name, description=description, price=price, quantity=quantity,
                      posted_by=session.get('user_name', ''), owner_id=owner, media_file=media_path)
    db.session.add(product)
    db.session.commit()
    return jsonify(id=product.id, message='Product published'), 201

@app.route('/api/marketplace/products/<int:product_id>', methods=['DELETE'])
def delete_marketplace_product(product_id):
    owner = session.get('user_id')
    if not owner:
        return jsonify(error='Login required'), 401
    product = Product.query.filter_by(id=product_id, owner_id=owner).first()
    if not product:
        return jsonify(error='Product not found or not owned by you'), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify(message='Product removed')

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





with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=False)
