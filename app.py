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


class BusinessProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True, index=True)
    business_name = db.Column(db.String(160), nullable=False, default='')
    phone = db.Column(db.String(40), nullable=False, default='')
    address = db.Column(db.String(240), nullable=False, default='')
    tax_id = db.Column(db.String(80), nullable=False, default='')
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())


class BusinessInvoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    invoice_number = db.Column(db.String(50), nullable=False, index=True)
    customer_name = db.Column(db.String(160), nullable=False)
    customer_email = db.Column(db.String(160), nullable=False, default='')
    item_summary = db.Column(db.String(500), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=0)
    tax_rate = db.Column(db.Float, nullable=False, default=0)
    subtotal = db.Column(db.Float, nullable=False, default=0)
    tax = db.Column(db.Float, nullable=False, default=0)
    total = db.Column(db.Float, nullable=False, default=0)
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='draft')
    notes = db.Column(db.String(1000), nullable=False, default='')
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class BusinessReceipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    receipt_number = db.Column(db.String(50), nullable=False, index=True)
    invoice_number = db.Column(db.String(50), nullable=False, default='')
    customer_name = db.Column(db.String(160), nullable=False)
    amount = db.Column(db.Float, nullable=False, default=0)
    payment_method = db.Column(db.String(40), nullable=False, default='Bank transfer')
    received_on = db.Column(db.Date, nullable=False)
    notes = db.Column(db.String(1000), nullable=False, default='')
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class BusinessPayroll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    employee_name = db.Column(db.String(160), nullable=False)
    role_title = db.Column(db.String(100), nullable=False, default='')
    pay_period = db.Column(db.String(40), nullable=False)
    basic_salary = db.Column(db.Float, nullable=False, default=0)
    allowances = db.Column(db.Float, nullable=False, default=0)
    deductions = db.Column(db.Float, nullable=False, default=0)
    net_pay = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class BusinessWaybill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    waybill_number = db.Column(db.String(50), nullable=False, index=True)
    customer_name = db.Column(db.String(160), nullable=False)
    origin = db.Column(db.String(180), nullable=False)
    destination = db.Column(db.String(180), nullable=False)
    dispatch_date = db.Column(db.Date, nullable=False)
    items_summary = db.Column(db.String(700), nullable=False)
    vehicle = db.Column(db.String(100), nullable=False, default='')
    driver = db.Column(db.String(120), nullable=False, default='')
    status = db.Column(db.String(24), nullable=False, default='pending')
    notes = db.Column(db.String(1000), nullable=False, default='')
    created_at = db.Column(db.DateTime, server_default=db.func.now())


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

@app.route('/api/workspace/analytics')
def workspace_analytics_api():
    """Role-aware operational KPIs; candle values are cumulative activity counts, never market prices."""
    from datetime import datetime, timedelta, timezone
    uid = session.get('user_id')
    role = session.get('role')
    if not uid or role not in ('farmer', 'processor', 'consumer', 'marketer', 'admin'):
        return jsonify(error='Login required'), 401
    own_posts = CommunityPost.query.filter_by(author_id=uid)
    own_messages = CommunityMessage.query.filter_by(author_id=uid)
    own_cart = ShoppingCartItem.query.filter_by(owner_id=uid)
    kpis = [
        dict(label='Community posts', value=own_posts.count(), icon='fa-comments'),
        dict(label='Messages sent', value=own_messages.count(), icon='fa-paper-plane')
    ]
    if role == 'farmer':
        farms = Farm.query.filter_by(owner_id=uid)
        operations = FarmOperation.query.filter_by(owner_id=uid)
        kpis = [
            dict(label='Registered farms', value=farms.count(), icon='fa-seedling'),
            dict(label='Farm activities', value=operations.count(), icon='fa-list-check'),
            dict(label='Completed tasks', value=operations.filter_by(status='completed').count(), icon='fa-circle-check'),
            dict(label='Upcoming plans', value=operations.filter(FarmOperation.scheduled_on >= datetime.now(timezone.utc).date(), FarmOperation.status != 'completed').count(), icon='fa-calendar')
        ]
        events = [(r.created_at, 'activity') for r in operations.all() if r.created_at]
        metric = 'Farm activities recorded'
    else:
        kpis += [dict(label='Cart items', value=sum(x.quantity for x in own_cart.all()), icon='fa-cart-shopping')]
        if role == 'admin':
            kpis += [dict(label='Registered users', value=User.query.count(), icon='fa-users'),
                     dict(label='Product listings', value=Product.query.count(), icon='fa-box')]
        elif role in ('processor', 'marketer'):
            user = db.session.get(User, uid)
            count = Product.query.filter_by(posted_by=user.name).count() if user else 0
            kpis += [dict(label='Listings by name', value=count, icon='fa-store')]
        else:
            kpis += [dict(label='Available listings', value=Product.query.count(), icon='fa-store')]
        events = [(r.created_at, 'post') for r in own_posts.all() if r.created_at]
        metric = 'Community posts published'
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)) for i in range(29, -1, -1)]
    counts = {day: 0 for day in days}
    for timestamp, _ in events:
        day = timestamp.date()
        if day in counts:
            counts[day] += 1
    prior = sum(1 for timestamp, _ in events if timestamp.date() < days[0])
    candles = []
    running = prior
    for day in days:
        opened = running
        running += counts[day]
        candles.append(dict(date=day.isoformat(), open=opened, high=running,
                            low=opened, close=running, count=counts[day]))
    return jsonify(role=role, kpis=kpis, candles=candles, metric=metric,
                   note='Daily cumulative record counts, not financial or commodity price OHLC. No invented trading prices.')

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


@app.route('/api/marketer/products', methods=['GET', 'POST'])
def marketer_products_api():
    owner, user = _business_user()
    if owner is None or user is None:
        return jsonify(error='Marketer login required'), 403

    if request.method == 'POST':
        data = request.form
        name = str(data.get('name', '')).strip()[:100]
        description = str(data.get('description', '')).strip()[:200]
        try:
            price = float(data.get('price', 0))
            quantity = int(data.get('quantity', 0))
        except (TypeError, ValueError, OverflowError):
            return jsonify(error='Invalid price or quantity'), 400

        if not name or not 0 < price <= 1000000000 or not 0 < quantity <= 1000000:
            return jsonify(error='Product name, positive price and quantity are required'), 400

        media_file = request.files.get('image')
        media_path = None
        if media_file and media_file.filename:
            if not allowed_file(media_file.filename):
                return jsonify(error='Unsupported image format'), 400
            import uuid
            filename = uuid.uuid4().hex + '_' + secure_filename(media_file.filename)[:80]
            media_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            media_path = filename

        product = Product(
            name=name,
            quantity=quantity,
            price=price,
            description=description,
            posted_by=user.name,
            media_file=media_path
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(message='Product listed', id=product.id), 201

    rows = Product.query.filter_by(posted_by=user.name).order_by(Product.id.desc()).limit(300).all()
    return jsonify(products=[dict(
        id=x.id,
        name=x.name,
        quantity=x.quantity,
        price=x.price,
        description=x.description or '',
        image_url=url_for('static', filename='uploads/' + os.path.basename(x.media_file)) if x.media_file else ''
    ) for x in rows])


@app.route('/api/marketer/products/<int:product_id>', methods=['DELETE'])
def marketer_product_delete(product_id):
    owner, user = _business_user()
    if owner is None or user is None:
        return jsonify(error='Marketer login required'), 403
    product = Product.query.filter_by(id=product_id, posted_by=user.name).first()
    if not product:
        return jsonify(error='Product not found'), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify(message='Product removed')


def marketer_identity():
    if not session.get('user_id') or session.get('role') != 'marketer':
        return None
    return session['user_id']


def _business_user():
    owner = marketer_identity()
    if owner is None:
        return None, None
    return owner, db.session.get(User, owner)


def _next_business_number(model, owner_id, prefix):
    count = model.query.filter_by(owner_id=owner_id).count() + 1
    return f"{prefix}-{count:05d}"


@app.route('/api/marketer/business/summary')
def marketer_business_summary():
    owner, user = _business_user()
    if owner is None or user is None:
        return jsonify(error='Marketer login required'), 403

    listings = Product.query.filter_by(posted_by=user.name).count()
    invoices = BusinessInvoice.query.filter_by(owner_id=owner).all()
    receipts = BusinessReceipt.query.filter_by(owner_id=owner).all()
    payroll = BusinessPayroll.query.filter_by(owner_id=owner).all()
    waybills = BusinessWaybill.query.filter_by(owner_id=owner).all()

    invoiced = sum(float(x.total or 0) for x in invoices)
    collected = sum(float(x.amount or 0) for x in receipts)
    outstanding = sum(float(x.total or 0) for x in invoices if x.status in ('sent', 'overdue'))
    payroll_due = sum(float(x.net_pay or 0) for x in payroll if x.status in ('pending', 'approved'))
    pending_waybills = sum(1 for x in waybills if x.status in ('pending', 'in_transit'))

    return jsonify(
        listings=listings,
        invoices=len(invoices),
        invoiced=invoiced,
        collected=collected,
        outstanding=outstanding,
        payroll_due=payroll_due,
        employees=len({x.employee_name for x in payroll}),
        waybills=len(waybills),
        pending_waybills=pending_waybills
    )


@app.route('/api/marketer/business/profile', methods=['GET', 'POST'])
def marketer_business_profile():
    owner, user = _business_user()
    if owner is None or user is None:
        return jsonify(error='Marketer login required'), 403

    profile = BusinessProfile.query.filter_by(owner_id=owner).first()
    if request.method == 'GET':
        if not profile:
            return jsonify(business_name='', phone='', address='', tax_id='')
        return jsonify(
            business_name=profile.business_name,
            phone=profile.phone,
            address=profile.address,
            tax_id=profile.tax_id
        )

    data = request.get_json(silent=True) or {}
    business_name = str(data.get('business_name', '')).strip()[:160]
    phone = str(data.get('phone', '')).strip()[:40]
    address = str(data.get('address', '')).strip()[:240]
    tax_id = str(data.get('tax_id', '')).strip()[:80]

    if not business_name:
        return jsonify(error='Business name is required'), 400

    if not profile:
        profile = BusinessProfile(owner_id=owner)
        db.session.add(profile)

    profile.business_name = business_name
    profile.phone = phone
    profile.address = address
    profile.tax_id = tax_id
    db.session.commit()
    return jsonify(message='Business profile saved')


@app.route('/api/marketer/business/invoices', methods=['GET', 'POST'])
def marketer_business_invoices():
    owner, user = _business_user()
    if owner is None:
        return jsonify(error='Marketer login required'), 403

    if request.method == 'POST':
        from datetime import date
        data = request.get_json(silent=True) or {}
        customer = str(data.get('customer_name', '')).strip()[:160]
        item_summary = str(data.get('item_summary', '')).strip()[:500]
        try:
            quantity = float(data.get('quantity', 1))
            unit_price = float(data.get('unit_price', 0))
            tax_rate = float(data.get('tax_rate', 0))
            issue_date = date.fromisoformat(str(data.get('issue_date') or date.today().isoformat()))
            due_date = date.fromisoformat(str(data['due_date'])) if data.get('due_date') else None
        except (TypeError, ValueError, OverflowError):
            return jsonify(error='Enter valid invoice amounts and dates'), 400

        if not customer or not item_summary or not (0 < quantity <= 1000000) or not (0 <= unit_price <= 1000000000) or not (0 <= tax_rate <= 100):
            return jsonify(error='Check customer, item, quantity, price and tax rate'), 400
        if due_date and due_date < issue_date:
            return jsonify(error='Due date cannot be before issue date'), 400

        subtotal = round(quantity * unit_price, 2)
        tax = round(subtotal * tax_rate / 100, 2)
        total = round(subtotal + tax, 2)
        status = str(data.get('status', 'draft')).strip().lower()
        if status not in ('draft', 'sent', 'paid', 'overdue'):
            return jsonify(error='Invalid invoice status'), 400

        invoice = BusinessInvoice(
            owner_id=owner,
            invoice_number=_next_business_number(BusinessInvoice, owner, 'INV'),
            customer_name=customer,
            customer_email=str(data.get('customer_email', '')).strip()[:160],
            item_summary=item_summary,
            quantity=quantity,
            unit_price=unit_price,
            tax_rate=tax_rate,
            subtotal=subtotal,
            tax=tax,
            total=total,
            issue_date=issue_date,
            due_date=due_date,
            status=status,
            notes=str(data.get('notes', '')).strip()[:1000]
        )
        db.session.add(invoice)
        db.session.commit()
        return jsonify(message='Invoice created', id=invoice.id, invoice_number=invoice.invoice_number), 201

    rows = BusinessInvoice.query.filter_by(owner_id=owner).order_by(BusinessInvoice.id.desc()).limit(200).all()
    return jsonify(invoices=[dict(
        id=x.id, invoice_number=x.invoice_number, customer_name=x.customer_name,
        customer_email=x.customer_email, item_summary=x.item_summary, quantity=x.quantity,
        unit_price=x.unit_price, tax_rate=x.tax_rate, subtotal=x.subtotal, tax=x.tax,
        total=x.total, issue_date=x.issue_date.isoformat(), due_date=x.due_date.isoformat() if x.due_date else '',
        status=x.status, notes=x.notes
    ) for x in rows])


@app.route('/api/marketer/business/receipts', methods=['GET', 'POST'])
def marketer_business_receipts():
    owner, user = _business_user()
    if owner is None:
        return jsonify(error='Marketer login required'), 403

    if request.method == 'POST':
        from datetime import date
        data = request.get_json(silent=True) or {}
        customer = str(data.get('customer_name', '')).strip()[:160]
        try:
            amount = float(data.get('amount', 0))
            received_on = date.fromisoformat(str(data.get('received_on') or date.today().isoformat()))
        except (TypeError, ValueError, OverflowError):
            return jsonify(error='Enter a valid receipt amount and date'), 400
        if not customer or not 0 < amount <= 1000000000:
            return jsonify(error='Customer and a positive amount are required'), 400

        receipt = BusinessReceipt(
            owner_id=owner,
            receipt_number=_next_business_number(BusinessReceipt, owner, 'RCT'),
            invoice_number=str(data.get('invoice_number', '')).strip()[:50],
            customer_name=customer,
            amount=amount,
            payment_method=str(data.get('payment_method', 'Bank transfer')).strip()[:40],
            received_on=received_on,
            notes=str(data.get('notes', '')).strip()[:1000]
        )
        db.session.add(receipt)
        db.session.commit()
        return jsonify(message='Receipt recorded', id=receipt.id, receipt_number=receipt.receipt_number), 201

    rows = BusinessReceipt.query.filter_by(owner_id=owner).order_by(BusinessReceipt.id.desc()).limit(200).all()
    return jsonify(receipts=[dict(
        id=x.id, receipt_number=x.receipt_number, invoice_number=x.invoice_number,
        customer_name=x.customer_name, amount=x.amount, payment_method=x.payment_method,
        received_on=x.received_on.isoformat(), notes=x.notes
    ) for x in rows])


@app.route('/api/marketer/business/payroll', methods=['GET', 'POST'])
def marketer_business_payroll():
    owner, user = _business_user()
    if owner is None:
        return jsonify(error='Marketer login required'), 403

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        employee = str(data.get('employee_name', '')).strip()[:160]
        period = str(data.get('pay_period', '')).strip()[:40]
        role_title = str(data.get('role_title', '')).strip()[:100]
        try:
            basic = float(data.get('basic_salary', 0))
            allowances = float(data.get('allowances', 0))
            deductions = float(data.get('deductions', 0))
        except (TypeError, ValueError, OverflowError):
            return jsonify(error='Enter valid payroll amounts'), 400

        net = round(basic + allowances - deductions, 2)
        if not employee or not period or basic < 0 or allowances < 0 or deductions < 0 or net < 0:
            return jsonify(error='Check employee and payroll amounts'), 400

        status = str(data.get('status', 'pending')).strip().lower()
        if status not in ('pending', 'approved', 'paid'):
            return jsonify(error='Invalid payroll status'), 400

        row = BusinessPayroll(
            owner_id=owner,
            employee_name=employee,
            role_title=role_title,
            pay_period=period,
            basic_salary=basic,
            allowances=allowances,
            deductions=deductions,
            net_pay=net,
            status=status
        )
        db.session.add(row)
        db.session.commit()
        return jsonify(message='Payroll entry saved', id=row.id), 201

    rows = BusinessPayroll.query.filter_by(owner_id=owner).order_by(BusinessPayroll.id.desc()).limit(300).all()
    return jsonify(payroll=[dict(
        id=x.id, employee_name=x.employee_name, role_title=x.role_title,
        pay_period=x.pay_period, basic_salary=x.basic_salary, allowances=x.allowances,
        deductions=x.deductions, net_pay=x.net_pay, status=x.status
    ) for x in rows])


@app.route('/api/marketer/business/waybills', methods=['GET', 'POST'])
def marketer_business_waybills():
    owner, user = _business_user()
    if owner is None:
        return jsonify(error='Marketer login required'), 403

    if request.method == 'POST':
        from datetime import date
        data = request.get_json(silent=True) or {}
        customer = str(data.get('customer_name', '')).strip()[:160]
        origin = str(data.get('origin', '')).strip()[:180]
        destination = str(data.get('destination', '')).strip()[:180]
        items = str(data.get('items_summary', '')).strip()[:700]
        try:
            dispatch_date = date.fromisoformat(str(data.get('dispatch_date') or date.today().isoformat()))
        except (TypeError, ValueError, OverflowError):
            return jsonify(error='Enter a valid dispatch date'), 400

        if not customer or not origin or not destination or not items:
            return jsonify(error='Customer, route and shipment items are required'), 400

        status = str(data.get('status', 'pending')).strip().lower()
        if status not in ('pending', 'in_transit', 'delivered', 'cancelled'):
            return jsonify(error='Invalid waybill status'), 400

        row = BusinessWaybill(
            owner_id=owner,
            waybill_number=_next_business_number(BusinessWaybill, owner, 'WB'),
            customer_name=customer,
            origin=origin,
            destination=destination,
            dispatch_date=dispatch_date,
            items_summary=items,
            vehicle=str(data.get('vehicle', '')).strip()[:100],
            driver=str(data.get('driver', '')).strip()[:120],
            status=status,
            notes=str(data.get('notes', '')).strip()[:1000]
        )
        db.session.add(row)
        db.session.commit()
        return jsonify(message='Waybill created', id=row.id, waybill_number=row.waybill_number), 201

    rows = BusinessWaybill.query.filter_by(owner_id=owner).order_by(BusinessWaybill.id.desc()).limit(300).all()
    return jsonify(waybills=[dict(
        id=x.id, waybill_number=x.waybill_number, customer_name=x.customer_name,
        origin=x.origin, destination=x.destination, dispatch_date=x.dispatch_date.isoformat(),
        items_summary=x.items_summary, vehicle=x.vehicle, driver=x.driver, status=x.status,
        notes=x.notes
    ) for x in rows])


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
