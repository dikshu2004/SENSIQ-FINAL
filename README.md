# SensiQ

SensiQ is an accessible e-learning platform focused on supporting learners with sensory disabilities through inclusive design, guided onboarding, and assistive learning pathways.

## Tech stack

- Node.js
- Express
- EJS + EJS Mate
- MongoDB + Mongoose
- Passport Local authentication

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create your environment file from the example:

```bash
copy .env.example .env
```

3. Start MongoDB locally and then run:

```bash
npm run dev
```

4. Open `http://localhost:8080/home`

## Environment variables

- `PORT`: Express server port
- `MONGO_URL`: MongoDB connection string
- `SESSION_SECRET`: Session secret for authentication

## Current features

- Accessible landing page with guided assistive narration
- User signup, login, and logout
- About and contact pages
- Shared layout, flash messages, and responsive styling
