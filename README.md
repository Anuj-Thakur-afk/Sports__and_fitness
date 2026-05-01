# FitLife – Sports & Fitness Management System

FitLife is a comprehensive sports and fitness management platform designed to help users track their health goals, manage workouts, and receive AI-powered coaching. With a sleek dark-themed interface and real-time interaction, FitLife provides a premium experience for fitness enthusiasts.

## 🌟 Features

- **AI-Powered Fitness Coach**: Integration with Google Gemini API to provide personalized workout and diet plans.
- **Dynamic Dashboard**: Monitor your progress, upcoming goals, and daily statistics at a glance.
- **Interactive Goal Tracking**: Set, track, and achieve your fitness milestones.
- **Real-time Chat**: Connect with trainers or other users using Socket.io integration.
- **Fitness Calculators**: Built-in BMI and calorie calculators to help you stay on track.
- **Secure Authentication**: User registration and login powered by Supabase and JWT.
- **Responsive Design**: A modern, mobile-friendly UI built with pure HTML, CSS, and JavaScript.

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Custom styles with a focus on modern aesthetics (dark mode, glassmorphism).
- **Vanilla JavaScript**: Interactive logic and API integration.
- **Socket.io Client**: For real-time messaging.

### Backend
- **Node.js & Express**: Robust server-side framework.
- **Google Gemini AI**: Powering the AI Coach features.
- **Supabase**: Used for database management and authentication.
- **Mongoose/MongoDB**: Data persistence for fitness records.
- **Socket.io**: Real-time server communication.
- **JWT & Bcrypt**: Secure session management and password hashing.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Supabase account and project
- A Google AI (Gemini) API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fitlife.git
   cd fitlife
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   ```

4. **Set up the Database**:
   Run the provided `supabase_schema.sql` in your Supabase SQL Editor to initialize the required tables.

### Running the Application

1. **Start the server**:
   ```bash
   npm run dev
   ```
2. **Access the app**:
   Open `http://localhost:3000` in your browser. (Note: Ensure your server is serving the static files from the `frontend` directory).

## 📂 Project Structure

```text
FitLife/
├── backend/          # Express server and API routes
├── frontend/         # HTML, CSS, and JS assets
├── node_modules/     # Dependencies
├── .env              # Configuration variables
├── package.json      # Project metadata and scripts
└── README.md         # Project documentation
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions or find bugs, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
