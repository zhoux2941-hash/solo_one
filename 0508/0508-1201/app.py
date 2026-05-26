import os
import random
import uuid
from datetime import datetime, date
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from models import get_db, init_db, seed_data

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = 'gacha-simulator-secret-key-2024'
CORS(app)

DAILY_FREE_DRAWS = 10


def check_free_draws_reset(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT last_free_reset, free_draws FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if user:
        today = date.today().isoformat()
        if user['last_free_reset'] != today:
            cursor.execute(
                "UPDATE users SET free_draws = ?, last_free_reset = ? WHERE id = ?",
                (DAILY_FREE_DRAWS, today, user_id)
            )
            conn.commit()
    conn.close()


def get_or_create_user():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())

    user_id = session['user_id']
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM users WHERE username = ?", (f'user_{user_id[:8]}',))
    user = cursor.fetchone()

    if not user:
        today = date.today().isoformat()
        cursor.execute(
            "INSERT INTO users (username, free_draws, last_free_reset, created_at) VALUES (?, ?, ?, ?)",
            (f'user_{user_id[:8]}', DAILY_FREE_DRAWS, today, datetime.now().isoformat())
        )
        conn.commit()
        cursor.execute("SELECT id, username FROM users WHERE username = ?", (f'user_{user_id[:8]}',))
        user = cursor.fetchone()

    check_free_draws_reset(user['id'])
    conn.close()
    return user['id']


@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')


@app.route('/admin')
def admin():
    return send_from_directory('templates', 'admin.html')


@app.route('/api/user/info')
def get_user_info():
    user_id = get_or_create_user()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, free_draws FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(user)})


@app.route('/api/pools')
def get_pools():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pools WHERE is_active = 1 ORDER BY created_at DESC")
    pools = cursor.fetchall()
    result = []
    for pool in pools:
        pool_dict = dict(pool)
        cursor.execute("SELECT * FROM cards WHERE pool_id = ?", (pool['id'],))
        cards = cursor.fetchall()
        pool_dict['cards'] = [dict(card) for card in cards]
        result.append(pool_dict)
    conn.close()
    return jsonify({'success': True, 'data': result})


@app.route('/api/pools/versions/<pool_name>')
def get_pool_versions(pool_name):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT DISTINCT id, name, version, description, pity_threshold, is_active FROM pools WHERE name = ? ORDER BY version DESC",
        (pool_name,)
    )
    versions = cursor.fetchall()
    result = []
    for v in versions:
        v_dict = dict(v)
        cursor.execute("SELECT * FROM cards WHERE pool_id = ?", (v['id'],))
        cards = cursor.fetchall()
        v_dict['cards'] = [dict(card) for card in cards]
        result.append(v_dict)
    conn.close()
    return jsonify({'success': True, 'data': result})


def draw_card(pool_id, user_id, conn=None, cursor=None):
    results, error = draw_cards(pool_id, user_id, 1, conn, cursor)
    if error:
        return None, error
    return results[0] if results else None, None


def draw_cards(pool_id, user_id, times, conn=None, cursor=None):
    close_conn = False
    if conn is None:
        conn = get_db()
        cursor = conn.cursor()
        close_conn = True

    cursor.execute("SELECT * FROM pools WHERE id = ?", (pool_id,))
    pool = cursor.fetchone()
    if not pool:
        if close_conn:
            conn.close()
        return None, '卡池不存在'

    cursor.execute("SELECT * FROM cards WHERE pool_id = ?", (pool_id,))
    cards = cursor.fetchall()
    if not cards:
        if close_conn:
            conn.close()
        return None, '卡池中没有卡牌'

    cursor.execute(
        "SELECT counter FROM pity_counters WHERE user_id = ? AND pool_id = ?",
        (user_id, pool_id)
    )
    pity = cursor.fetchone()
    pity_counter = pity['counter'] if pity else 0

    soft_pity_start = 60
    soft_pity_bonus_per_draw = 0.01

    ssr_cards = [c for c in cards if c['rarity'] == 'SSR']
    base_ssr_prob = sum(c['probability'] for c in ssr_cards)
    now = datetime.now().isoformat()

    results = []
    draw_records_data = []

    for i in range(times):
        current_draw = pity_counter + 1
        is_soft_pity = False
        is_pity = False

        if current_draw >= soft_pity_start and current_draw < pool['pity_threshold']:
            extra_prob = (current_draw - soft_pity_start + 1) * soft_pity_bonus_per_draw
            total_ssr_prob = min(base_ssr_prob + extra_prob, 1.0)
            is_soft_pity = total_ssr_prob > base_ssr_prob
        else:
            total_ssr_prob = base_ssr_prob

        if current_draw >= pool['pity_threshold']:
            if ssr_cards:
                selected = random.choice(ssr_cards)
                is_pity = True
                pity_counter = 0
            else:
                selected = random.choice(cards)
                pity_counter = 0
        else:
            if is_soft_pity and ssr_cards:
                non_ssr_cards = [c for c in cards if c['rarity'] != 'SSR']
                base_non_ssr_prob = sum(c['probability'] for c in non_ssr_cards)

                ssr_ratio = total_ssr_prob / base_ssr_prob if base_ssr_prob > 0 else 0
                non_ssr_ratio = (1 - total_ssr_prob) / base_non_ssr_prob if base_non_ssr_prob > 0 else 0

                adjusted_cards = []
                for card in cards:
                    if card['rarity'] == 'SSR':
                        adjusted_prob = card['probability'] * ssr_ratio
                    else:
                        adjusted_prob = card['probability'] * non_ssr_ratio
                    adjusted_cards.append((card, adjusted_prob))
            else:
                adjusted_cards = [(card, card['probability']) for card in cards]

            rand = random.random()
            cumulative = 0
            selected = None
            for card, prob in adjusted_cards:
                cumulative += prob
                if rand <= cumulative:
                    selected = card
                    break
            if selected is None:
                selected = adjusted_cards[-1][0]

            if selected['rarity'] == 'SSR':
                pity_counter = 0
            else:
                pity_counter += 1

        result_card = dict(selected)
        result_card['is_pity'] = is_pity
        result_card['is_soft_pity'] = is_soft_pity and not is_pity
        result_card['pity_counter'] = pity_counter
        result_card['current_draw'] = current_draw
        if is_soft_pity:
            result_card['soft_pity_bonus'] = round((total_ssr_prob - base_ssr_prob) * 100, 1)
        results.append(result_card)

        draw_records_data.append((
            user_id, pool_id, selected['id'],
            1 if is_pity else 0,
            1 if (is_soft_pity and not is_pity) else 0,
            now
        ))

    cursor.executemany(
        "INSERT INTO draw_records (user_id, pool_id, card_id, is_pity, is_soft_pity, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        draw_records_data
    )

    if pity:
        cursor.execute(
            "UPDATE pity_counters SET counter = ?, last_updated = ? WHERE user_id = ? AND pool_id = ?",
            (pity_counter, now, user_id, pool_id)
        )
    else:
        cursor.execute(
            "INSERT INTO pity_counters (user_id, pool_id, counter, last_updated) VALUES (?, ?, ?, ?)",
            (user_id, pool_id, pity_counter, now)
        )

    conn.commit()

    if close_conn:
        conn.close()

    return results, None


@app.route('/api/draw', methods=['POST'])
def draw():
    user_id = get_or_create_user()
    data = request.json
    pool_id = data.get('pool_id')
    times = data.get('times', 1)

    if not pool_id:
        return jsonify({'success': False, 'message': '请选择卡池'}), 400

    if times not in [1, 10]:
        return jsonify({'success': False, 'message': '只能抽1发或10连'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT free_draws FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user or user['free_draws'] < times:
        conn.close()
        return jsonify({'success': False, 'message': '抽卡次数不足，明天再来！'}), 400

    results, error = draw_cards(pool_id, user_id, times, conn, cursor)
    if error:
        conn.close()
        return jsonify({'success': False, 'message': error}), 400

    cursor.execute(
        "UPDATE users SET free_draws = free_draws - ? WHERE id = ?",
        (times, user_id)
    )
    conn.commit()
    cursor.execute("SELECT free_draws FROM users WHERE id = ?", (user_id,))
    remaining = cursor.fetchone()['free_draws']
    conn.close()

    return jsonify({
        'success': True,
        'data': {
            'results': results,
            'remaining_free_draws': remaining
        }
    })


@app.route('/api/history')
def get_history():
    user_id = get_or_create_user()
    pool_id = request.args.get('pool_id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    conn = get_db()
    cursor = conn.cursor()

    count_query = "SELECT COUNT(*) as total FROM draw_records dr WHERE dr.user_id = ?"
    params = [user_id]
    if pool_id:
        count_query += " AND dr.pool_id = ?"
        params.append(pool_id)

    cursor.execute(count_query, params)
    total = cursor.fetchone()['total']

    query = """
        SELECT dr.*, c.name as card_name, c.rarity, c.image_url, c.probability,
               p.name as pool_name, p.version
        FROM draw_records dr
        JOIN cards c ON dr.card_id = c.id
        JOIN pools p ON dr.pool_id = p.id
        WHERE dr.user_id = ?
    """
    params = [user_id]
    if pool_id:
        query += " AND dr.pool_id = ?"
        params.append(pool_id)

    query += " ORDER BY dr.created_at DESC LIMIT ? OFFSET ?"
    params.extend([per_page, offset])

    cursor.execute(query, params)
    records = cursor.fetchall()

    conn.close()

    return jsonify({
        'success': True,
        'data': {
            'records': [dict(r) for r in records],
            'total': total,
            'page': page,
            'per_page': per_page
        }
    })


@app.route('/api/stats')
def get_stats():
    user_id = get_or_create_user()
    pool_id = request.args.get('pool_id')

    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT
            COUNT(*) as total_draws,
            SUM(CASE WHEN c.rarity = 'SSR' THEN 1 ELSE 0 END) as ssr_count,
            SUM(CASE WHEN c.rarity = 'SR' THEN 1 ELSE 0 END) as sr_count,
            SUM(CASE WHEN c.rarity = 'R' THEN 1 ELSE 0 END) as r_count,
            SUM(CASE WHEN c.rarity = 'N' THEN 1 ELSE 0 END) as n_count
        FROM draw_records dr
        JOIN cards c ON dr.card_id = c.id
        WHERE dr.user_id = ?
    """
    params = [user_id]
    if pool_id:
        query += " AND dr.pool_id = ?"
        params.append(pool_id)

    cursor.execute(query, params)
    stats = cursor.fetchone()

    query2 = """
        SELECT p.id, p.name, p.version,
               COUNT(*) as pool_draws,
               SUM(CASE WHEN c.rarity = 'SSR' THEN 1 ELSE 0 END) as pool_ssr
        FROM draw_records dr
        JOIN cards c ON dr.card_id = c.id
        JOIN pools p ON dr.pool_id = p.id
        WHERE dr.user_id = ?
    """
    params2 = [user_id]
    if pool_id:
        query2 += " AND dr.pool_id = ?"
        params2.append(pool_id)
    query2 += " GROUP BY p.id, p.name, p.version"

    cursor.execute(query2, params2)
    pool_stats = cursor.fetchall()

    cursor.execute("SELECT free_draws FROM users WHERE id = ?", (user_id,))
    free_draws = cursor.fetchone()['free_draws']

    cursor.execute(
        "SELECT pool_id, counter FROM pity_counters WHERE user_id = ?",
        (user_id,)
    )
    pity_counters = cursor.fetchall()

    conn.close()

    total = stats['total_draws'] if stats else 0
    ssr = stats['ssr_count'] if stats else 0
    sr = stats['sr_count'] if stats else 0
    r = stats['r_count'] if stats else 0
    n = stats['n_count'] if stats else 0

    return jsonify({
        'success': True,
        'data': {
            'total_draws': total,
            'ssr_count': ssr,
            'sr_count': sr,
            'r_count': r,
            'n_count': n,
            'ssr_rate': round(ssr / total * 100, 2) if total > 0 else 0,
            'free_draws': free_draws,
            'pool_stats': [dict(ps) for ps in pool_stats],
            'pity_counters': [dict(pc) for pc in pity_counters]
        }
    })


@app.route('/api/admin/pools', methods=['GET'])
def admin_get_pools():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pools ORDER BY created_at DESC")
    pools = cursor.fetchall()
    result = []
    for pool in pools:
        pool_dict = dict(pool)
        cursor.execute("SELECT * FROM cards WHERE pool_id = ?", (pool['id'],))
        cards = cursor.fetchall()
        pool_dict['cards'] = [dict(card) for card in cards]
        result.append(pool_dict)
    conn.close()
    return jsonify({'success': True, 'data': result})


@app.route('/api/admin/pools', methods=['POST'])
def admin_create_pool():
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    pity_threshold = data.get('pity_threshold', 90)
    version = data.get('version', 'v1.0')

    if not name:
        return jsonify({'success': False, 'message': '卡池名称必填'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO pools (name, description, pity_threshold, is_active, version, created_at) VALUES (?, ?, ?, 1, ?, ?)",
            (name, description, pity_threshold, version, datetime.now().isoformat())
        )
        conn.commit()
        pool_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'data': {'id': pool_id}})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 400


@app.route('/api/admin/pools/<int:pool_id>', methods=['PUT'])
def admin_update_pool(pool_id):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()

    updates = []
    params = []
    if 'name' in data:
        updates.append("name = ?")
        params.append(data['name'])
    if 'description' in data:
        updates.append("description = ?")
        params.append(data['description'])
    if 'pity_threshold' in data:
        updates.append("pity_threshold = ?")
        params.append(data['pity_threshold'])
    if 'is_active' in data:
        updates.append("is_active = ?")
        params.append(data['is_active'])
    if 'version' in data:
        updates.append("version = ?")
        params.append(data['version'])

    if updates:
        params.append(pool_id)
        cursor.execute(f"UPDATE pools SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/pools/<int:pool_id>', methods=['DELETE'])
def admin_delete_pool(pool_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pools WHERE id = ?", (pool_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/cards', methods=['POST'])
def admin_create_card():
    data = request.json
    pool_id = data.get('pool_id')
    name = data.get('name')
    rarity = data.get('rarity', 'N')
    probability = data.get('probability', 0.1)
    image_url = data.get('image_url', '')

    if not pool_id or not name:
        return jsonify({'success': False, 'message': '卡池ID和卡牌名称必填'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cards (pool_id, name, rarity, probability, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (pool_id, name, rarity, probability, image_url, datetime.now().isoformat())
    )
    conn.commit()
    card_id = cursor.lastrowid
    conn.close()
    return jsonify({'success': True, 'data': {'id': card_id}})


@app.route('/api/admin/cards/<int:card_id>', methods=['PUT'])
def admin_update_card(card_id):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()

    updates = []
    params = []
    for field in ['name', 'rarity', 'probability', 'image_url']:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])

    if updates:
        params.append(card_id)
        cursor.execute(f"UPDATE cards SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/cards/<int:card_id>', methods=['DELETE'])
def admin_delete_card(card_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/admin/normalize-probabilities/<int:pool_id>', methods=['POST'])
def admin_normalize_probabilities(pool_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, probability FROM cards WHERE pool_id = ?", (pool_id,))
    cards = cursor.fetchall()

    total = sum(c['probability'] for c in cards)
    if total > 0:
        for card in cards:
            new_prob = card['probability'] / total
            cursor.execute("UPDATE cards SET probability = ? WHERE id = ?", (new_prob, card['id']))
        conn.commit()

    conn.close()
    return jsonify({'success': True})


if __name__ == '__main__':
    if not os.path.exists('gacha.db'):
        init_db()
        seed_data()
    else:
        init_db()

    app.run(debug=True, port=5000)
