import sqlite3
import os

DB_PATH = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            streak_days INTEGER DEFAULT 0
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS learning_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            topic TEXT NOT NULL,
            time_spent INTEGER, -- in minutes
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS quiz_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            topic TEXT NOT NULL,
            score INTEGER,
            max_score INTEGER,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert a dummy user if not exists
    c.execute("SELECT COUNT(*) FROM users")
    count = c.fetchone()[0]
    if count == 0:
        c.execute("INSERT INTO users (username, streak_days) VALUES ('Demo User', 3)")
        
    conn.commit()
    conn.close()

def log_session(user_id, topic, time_spent):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO learning_sessions (user_id, topic, time_spent)
        VALUES (?, ?, ?)
    ''', (user_id, topic, time_spent))
    conn.commit()
    conn.close()

def log_quiz_score(user_id, topic, score, max_score):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO quiz_scores (user_id, topic, score, max_score)
        VALUES (?, ?, ?, ?)
    ''', (user_id, topic, score, max_score))
    conn.commit()
    conn.close()

def get_dashboard_stats(user_id=1):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get total time
    c.execute("SELECT SUM(time_spent) FROM learning_sessions WHERE user_id = ?", (user_id,))
    total_time = c.fetchone()[0] or 0
    
    # Get average score
    c.execute("SELECT SUM(score), SUM(max_score) FROM quiz_scores WHERE user_id = ?", (user_id,))
    score_data = c.fetchone()
    avg_score = 0
    if score_data[1]:
        avg_score = round((score_data[0] / score_data[1]) * 100)
        
    # Get recent topics
    c.execute("SELECT topic, MAX(date) FROM learning_sessions WHERE user_id = ? GROUP BY topic ORDER BY date DESC LIMIT 5", (user_id,))
    recent_topics = [row[0] for row in c.fetchall()]
    
    # Get weak topics (scores less than 70%)
    c.execute('''
        SELECT topic, (CAST(SUM(score) AS FLOAT) / SUM(max_score)) * 100 as accuracy 
        FROM quiz_scores 
        WHERE user_id = ? 
        GROUP BY topic 
        HAVING accuracy < 70
        ORDER BY accuracy ASC 
        LIMIT 3
    ''', (user_id,))
    weak_topics = [row[0] for row in c.fetchall()]

    # Chart data (last 5 quizzes)
    c.execute('''
        SELECT topic, (CAST(score AS FLOAT) / max_score) * 100 as accuracy 
        FROM quiz_scores 
        WHERE user_id = ? 
        ORDER BY date DESC 
        LIMIT 5
    ''', (user_id,))
    chart_data = [{'topic': r[0], 'accuracy': r[1]} for r in reversed(c.fetchall())]
    
    # Streak
    c.execute("SELECT streak_days FROM users WHERE id = ?", (user_id,))
    streak = c.fetchone()[0]
    
    conn.close()
    
    return {
        "total_time_mins": total_time,
        "avg_accuracy": avg_score,
        "streak_days": streak,
        "recent_topics": recent_topics,
        "weak_topics": weak_topics,
        "chart_data": chart_data
    }
