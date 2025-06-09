# English Learning App - Backend

This is the backend service for the English Learning application, built with Python and Flask.

## Setup

1. Create and activate a virtual environment:
   ```bash
   # Create virtual environment
   python -m venv .venv

   # Activate virtual environment
   # On Windows:
   .venv\Scripts\activate
   # On Unix or MacOS:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

You can start the backend server in several ways:

1. From the root directory:
   ```bash
   pnpm backend
   ```

2. From the backend directory:
   ```bash
   python app.py
   ```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/{id}` - Get lesson by ID
- `POST /api/lessons` - Create new lesson
- `PUT /api/lessons/{id}` - Update lesson
- `DELETE /api/lessons/{id}` - Delete lesson

### Progress
- `GET /api/progress` - Get user's learning progress
- `POST /api/progress` - Update learning progress
- `GET /api/progress/statistics` - Get learning statistics

## Development

### Project Structure
```
backend/
├── app.py              # Main application file
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

### Environment Variables
Create a `.env` file in the backend directory with the following variables:
```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

## Testing
```bash
# Run tests
python -m pytest
```

## Error Handling
The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Contributing
1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License
This project is licensed under the MIT License. 