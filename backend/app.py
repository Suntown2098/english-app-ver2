from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import sqlite3
import uuid
import jwt
import datetime
import bcrypt
from openai import OpenAI
import os
from dotenv import load_dotenv
import base64
import tempfile
from pydub import AudioSegment
import io

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Configure OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Secret key for JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")

# Database setup
def get_db_connection():
    conn = sqlite3.connect('english_practice.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        userid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    ''')
    
    # Create conversations table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS conversations (
        conversationid TEXT PRIMARY KEY,
        userid TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (userid) REFERENCES users (userid)
    )
    ''')
    
    # Create messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationid TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        audio BLOB,
        create_time TEXT NOT NULL,
        FOREIGN KEY (conversationid) REFERENCES conversations (conversationid)
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Helper functions
def generate_token(user_id):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_token_from_header():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header.split(' ')[1]

# Routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Generate a unique user ID
    user_id = str(uuid.uuid4())
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO users (userid, username, password) VALUES (?, ?, ?)',
                      (user_id, username, hashed_password))
        conn.commit()
        
        # Generate JWT token
        token = generate_token(user_id)
        
        return jsonify({'userid': user_id, 'token': token}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username already exists'}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user = cursor.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    # Generate JWT token
    token = generate_token(user['userid'])
    
    return jsonify({'userid': user['userid'], 'token': token}), 200

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    # Verify token
    token = get_token_from_header()
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid or expired token'}), 401
    
    # Process audio chunks
    audio_chunks = []
    for key, file in request.files.items():
        if key.startswith('chunk_'):
            audio_chunks.append(file.read())
    
    if not audio_chunks:
        return jsonify({'message': 'No audio data provided'}), 400
    
    # Combine audio chunks and convert to WAV
    combined_audio = b''.join(audio_chunks)
    
    # Create a temporary file for the audio
    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
        temp_file.write(combined_audio)
        temp_file_path = temp_file.name
    
    try:
        # Convert to WAV using pydub
        audio = AudioSegment.from_file(temp_file_path)
        wav_io = io.BytesIO()
        audio.export(wav_io, format='wav')
        wav_io.seek(0)
        
        # Transcribe using OpenAI Whisper
        transcript = client.audio.transcribe(
            "whisper-1",
            wav_io,
            language="en"
        )
        
        return jsonify({'text': transcript['text']}), 200
    except Exception as e:
        return jsonify({'message': f'Error transcribing audio: {str(e)}'}), 500
    finally:
        # Clean up temporary file
        os.unlink(temp_file_path)

@app.route('/api/conversation', methods=['POST'])
def process_conversation():
    # Verify token
    token = get_token_from_header()
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid or expired token'}), 401
    
    data = request.json
    conversation_id = data.get('conversationid')
    messages = data.get('messages', [])
    
    if not conversation_id or not messages:
        return jsonify({'message': 'Conversation ID and messages are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if conversation exists
    conversation = cursor.execute('SELECT * FROM conversations WHERE conversationid = ?', 
                                 (conversation_id,)).fetchone()
    
    # If conversation doesn't exist, create it
    if not conversation:
        timestamp = datetime.datetime.utcnow().isoformat()
        cursor.execute('INSERT INTO conversations (conversationid, userid, timestamp) VALUES (?, ?, ?)',
                      (conversation_id, user_id, timestamp))
        conn.commit()
    
    # Save user message to database
    for message in messages:
        cursor.execute('''
        INSERT INTO messages (id, conversationid, role, content, create_time)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            message['id'],
            conversation_id,
            message['role'],
            message['content'],
            message['create_time']
        ))
    
    conn.commit()
    
    # Get conversation history for context
    history = cursor.execute('''
    SELECT role, content FROM messages 
    WHERE conversationid = ? 
    ORDER BY create_time ASC
    LIMIT 10
    ''', (conversation_id,)).fetchall()
    
    conn.close()
    
    # Format messages for OpenAI API
    openai_messages = [{"role": msg['role'], "content": msg['content']} for msg in history]
    
    # Add system message for English tutor context
    openai_messages.insert(0, {
        "role": "system",
        "content": "You are an English language tutor. Help the user practice their English speaking skills. Provide corrections, suggestions, and encouragement. Keep responses concise and focused on improving their English."
    })
    
    # Generate AI response with streaming
    try:
        ai_message_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat()
        
        # Get AI response using new API format
        ai_response = client.chat.completions.create(
            model="gpt-4",
            messages=openai_messages,
            max_tokens=700,
            temperature=0.7,
        )
        
        # Extract the response content
        full_response = ai_response.choices[0].message.content
        
        # Generate audio for the complete response using new API format
        audio_response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=full_response
        )
        
        # Get audio data
        audio_data = audio_response.content
        
        # Save complete AI message to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO messages (id, conversationid, role, content, audio, create_time)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            ai_message_id,
            conversation_id,
            'assistant',
            full_response,
            audio_data,
            timestamp
        ))
        
        conn.commit()
        conn.close()
        
        # Emit final complete message via WebSocket
        socketio.emit('message', {
            'conversationid': conversation_id,
            'messages': [{
                'id': ai_message_id,
                'role': 'assistant',
                'content': full_response,
                'audio': base64.b64encode(audio_data).decode('utf-8'),
                'create_time': timestamp
            }]
        }, namespace='/')
        
        return jsonify({
            'conversationid': conversation_id,
            'message_id': ai_message_id,
            'status': 'streaming'
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error generating AI response: {str(e)}'}), 500

@app.route('/api/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    # Verify token
    token = get_token_from_header()
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid or expired token'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if conversation exists and belongs to user
    conversation = cursor.execute('''
    SELECT * FROM conversations 
    WHERE conversationid = ? AND userid = ?
    ''', (conversation_id, user_id)).fetchone()
    
    if not conversation:
        conn.close()
        return jsonify({'message': 'Conversation not found'}), 404
    
    # Get all messages for the conversation
    messages = cursor.execute('''
    SELECT id, role, content, audio, create_time 
    FROM messages 
    WHERE conversationid = ? 
    ORDER BY create_time ASC
    ''', (conversation_id,)).fetchall()
    
    conn.close()
    
    # Format messages
    formatted_messages = []
    for message in messages:
        msg_data = {
            'id': message['id'],
            'role': message['role'],
            'content': message['content'],
            'create_time': message['create_time']
        }
        
        # Add audio if available
        if message['audio']:
            msg_data['audio'] = base64.b64encode(message['audio']).decode('utf-8')
        
        formatted_messages.append(msg_data)
    
    return jsonify({
        'conversationid': conversation_id,
        'messages': formatted_messages
    }), 200

@app.route('/api/conversation/all', methods=['POST'])
def get_all_conversations():
    # Verify token
    token = get_token_from_header()
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'message': 'Invalid or expired token'}), 401
    
    data = request.json
    request_user_id = data.get('userid')
    
    # Ensure the requested user ID matches the token
    if user_id != request_user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all conversations for the user
    conversations = cursor.execute('''
    SELECT conversationid, timestamp 
    FROM conversations 
    WHERE userid = ? 
    ORDER BY timestamp DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'data': [{
            'conversationid': conv['conversationid'],
            'timestamp': conv['timestamp'],
            'messages': []
        } for conv in conversations]
    }), 200
    
if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
    
    
