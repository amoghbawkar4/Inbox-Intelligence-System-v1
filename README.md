# Smart Newsletter Summarizer

A full-stack MERN application where each user signs in with Google, grants Gmail read/send access, gets recent newsletter emails summarized with OpenAI, and can send a daily digest from their own Gmail account to themselves.

## Project Structure

```text
smart-newsletter-summarizer/
  package.json
  README.md
  client/
    package.json
    index.html
    vite.config.js
    src/
      App.jsx
      api.js
      main.jsx
      styles.css
  server/
    .env
    .env.example
    package.json
    src/
      config/db.js
      jobs/dailyDigestJob.js
      middleware/auth.js
      models/Email.js
      models/Summary.js
      models/User.js
      routes/authRoutes.js
      routes/digestRoutes.js
      routes/emailRoutes.js
      routes/summaryRoutes.js
      services/contentCleaner.js
      services/digestService.js
      services/gmailService.js
      services/googleOAuth.js
      services/openaiService.js
      services/summaryService.js
      utils/gmail.js
      utils/jwt.js
      server.js
```

## Environment Variables

The backend reads all secrets from [server/.env](server/.env). Do not hardcode credentials.

```env
OPENAI_API_KEY=
MONGO_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
PORT=5000
CRON_SCHEDULE=0 8 * * *
OPENAI_MODEL=gpt-4o-mini
OPENAI_FALLBACK_ON_ERROR=true
```

`JWT_SECRET` should be a long random value. `GOOGLE_REDIRECT_URI` should be:

```text
http://localhost:5000/api/auth/google/callback
```

`OPENAI_FALLBACK_ON_ERROR=true` lets local development keep working if the OpenAI key is missing, rate limited, or out of quota. Set it to `false` in production if you want failed OpenAI calls to fail the request instead of using the local fallback summarizer.

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Enable the Gmail API.
4. Configure the OAuth consent screen.
5. Create OAuth 2.0 credentials for a Web application.
6. Add this authorized redirect URI:

```text
http://localhost:5000/api/auth/google/callback
```

7. Put the client ID and client secret in [server/.env](server/.env).

The app requests these scopes:

```text
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

For production, use HTTPS URLs for both the frontend and backend, add the production callback URL to Google Cloud Console, and set `CLIENT_URL` to the production frontend origin.

## Install and Run

Install all dependencies:

```bash
npm install
npm run install:all
```

Start MongoDB locally or set `MONGO_URI` to a hosted MongoDB connection string.

Run both apps:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend runs at:

```text
http://localhost:5000
```

## How It Works

1. The frontend sends users to `/api/auth/google`.
2. Google returns an authorization code to `/api/auth/google/callback`.
3. The backend exchanges the code for an access token and refresh token.
4. The backend stores tokens on the matching user document in MongoDB.
5. The browser receives only an httpOnly app session cookie.
6. Protected routes load the user from the JWT cookie and never expose Gmail tokens to React.
7. Gmail fetches use that user's access token only.
8. Expired access tokens are refreshed with that user's refresh token and saved back to MongoDB.
9. New, useful emails are cleaned, filtered, summarized, stored, and marked processed.
10. Digest emails are sent with Gmail API `users.messages.send` from the logged-in user's own Gmail account to themselves.

## Main API Routes

```text
GET  /api/auth/google
GET  /api/auth/google/callback
GET  /api/auth/me
POST /api/auth/logout
POST /api/emails/fetch
POST /api/emails/process
POST /api/emails/sync
GET  /api/summaries
POST /api/digest/send
```

## Daily Cron

The backend starts a cron job using `CRON_SCHEDULE`, defaulting to `0 8 * * *`.

For each user, the job:

1. Refreshes the Gmail access token if needed.
2. Fetches recent inbox emails.
3. Skips duplicates, short emails, and promotional emails.
4. Summarizes unprocessed useful emails.
5. Sends a digest from that user's Gmail account to their own email address.

## Security Notes

- No passwords are stored.
- Gmail tokens are stored server-side only.
- Each query is scoped by `userId`.
- Gmail access tokens are refreshed per user with that user's refresh token.
- Use HTTPS in production.
- Consider encrypting stored OAuth tokens at rest before deploying to production.
