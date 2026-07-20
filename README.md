# AI CodeGen

An advanced AI-powered code generation chatbot that assists developers in writing, debugging, and optimizing code.

## Features

- **Multi-Language Support**: Generates and analyzes code in multiple programming languages.
- **Contextual Chat**: Maintains conversation history to understand context.
- **Streaming Responses**: Receives code suggestions in real-time as they are generated.
- **Code Optimization**: Analyzes code for efficiency and suggests improvements.
- **Bug Detection**: Identifies and fixes errors in code snippets.

## Tech Stack

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: Hugging Face Inference API (via OpenAI Router)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI_CodeGen
```

### 2. Install Dependencies

You can install all dependencies for both client and server at once:

```bash
npm run install-all
```

Alternatively, install dependencies for each service separately:

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory and add your Hugging Face token:

```bash
# server/.env
PORT=3001
HU

# client/.env (Optional, for overriding API URL)
VITE_API_URL=http://localhost:3001/api/chat
```

## Usage

Start the development server:

```bash
npm run dev
```

This will start both the frontend and backend simultaneously.

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Development

### Running the Backend

```bash
cd server
npm run dev
```

The server will automatically restart when code changes are detected (requires `nodemon` to be installed as a dev dependency).

### Running the Frontend

```bash
cd client
npm run dev
```

The frontend will automatically reload when code changes are detected.

## License

[MIT](LICENSE)

## Contact

For support or inquiries, please contact [Your Name/Team] or open an issue in the repository.
