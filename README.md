# Between AI 🗺️

An AI-powered campus micro-itinerary planner that generates optimized daily schedules based on your constraints, weather conditions, and real-time data.

![Between AI](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)

## Features

- **AI-Powered Itinerary Generation** - Uses Google's Gemini 2.0 Flash via OpenRouter to create smart, constraint-aware schedules
- **User Authentication** - Secure login with email/password or Google OAuth via Supabase
- **Real-time Weather Integration** - Fetches current weather data from Open-Meteo API
- **Interactive Map View** - Visualize your itinerary on a Leaflet map with route connections
- **Constraint-Based Planning** - Set budget, energy level, walking tolerance, travel mode, and accessibility needs
- **Save & Load Plans** - Store your generated itineraries locally with SQLite
- **Dark Mode UI** - Modern, technical interface with AMD-inspired design

## Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS 4, Framer Motion
- **Backend**: Express.js, Better-SQLite3
- **Auth**: Supabase Auth (Email + Google OAuth)
- **AI**: OpenRouter (Gemini 2.0 Flash)
- **Maps**: Leaflet, React-Leaflet
- **Build**: Vite 6

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/between-ai.git
   cd between-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   # OpenRouter API Key (get from https://openrouter.ai/keys)
   VITE_OPENROUTER_API_KEY="your-openrouter-api-key"
   
   # Supabase Configuration (get from https://supabase.com/dashboard/project/_/settings/api)
   VITE_SUPABASE_URL="your-supabase-project-url"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. **Set up Supabase Authentication**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to Authentication > Providers
   - Enable Email provider (enabled by default)
   - (Optional) Enable Google OAuth:
     - Go to Authentication > Providers > Google
     - Add your Google OAuth credentials
     - Set the redirect URL to `your-supabase-url/auth/v1/callback`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check with TypeScript |

## Project Structure

```
between-ai/
├── src/
│   ├── components/
│   │   └── FlowMap.tsx      # Interactive map component
│   ├── services/
│   │   └── aiService.ts     # OpenRouter AI integration
│   ├── App.tsx              # Main application
│   ├── types.ts             # TypeScript definitions
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── server.ts                # Express backend
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── package.json
```

## Configuration Options

### User Constraints

| Constraint | Description |
|------------|-------------|
| Time Window | Start and end time for your schedule |
| Budget | Maximum spending limit (₹) |
| Energy Level | Low, Medium, or High |
| Walking Tolerance | Maximum walking time (minutes) |
| Travel Mode | Walking, Two-wheeler, or Four-wheeler |
| Indoor Preference | Prioritize indoor locations |
| Accessibility | Wheelchair, No Stairs, Visual Aid, Quiet Zones |

## API Usage

The app uses OpenRouter to access Google's Gemini 2.0 Flash model. The AI generates:

- Optimized activity sequences
- Weather-aware recommendations
- Constraint validation per item
- Travel time and distance estimates
- Location coordinates for mapping

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenRouter](https://openrouter.ai) for AI API access
- [Open-Meteo](https://open-meteo.com) for weather data
- [Leaflet](https://leafletjs.com) for mapping
