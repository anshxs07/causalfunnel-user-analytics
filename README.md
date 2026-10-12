# CausalFunnel User Analytics Dashboard

A simple full-stack user analytics application built as part of the Full Stack Engineer assignment. The application tracks user interactions on a webpage and displays session analytics, user journeys, and click activity through a React dashboard.

## Features

### Event Tracking
- Automatically tracks `page_view` and `click` events.
- Generates and persists a unique session ID using `localStorage`.
- Records page URLs, timestamps, and click coordinates.
- Sends tracking events to a Node.js backend API.

### Sessions Dashboard
- Displays total sessions, events, page views, and clicks.
- Lists sessions with event counts and last activity.
- Provides access to individual session journeys.

### User Journey
- Displays events in chronological order.
- Shows event types, page URLs, timestamps, and click coordinates.

### Click Heatmap
- Lists pages with recorded clicks.
- Visualizes click positions using coordinate-based markers.
- Uses recorded viewport dimensions to scale click positions.

## Tech Stack

**Frontend:** React, Vite, CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB, Mongoose  
**Tracking:** Vanilla JavaScript  
**Tools:** Git, GitHub, Netlify

## Project Structure

```text
causalfunnel-user-analytics/
├── client/
│   ├── public/
│   │   ├── demo.html
│   │   └── tracker.js
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── index.html
│   └── package.json
├── server/
│   ├── controllers/
│   │   └── eventController.js
│   ├── middleware/
│   │   └── errorMiddleware.js
│   ├── models/
│   │   └── Event.js
│   ├── routes/
│   │   └── events.js
│   ├── server.js
│   └── package.json
├── tracker/
│   └── tracker.js
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB running locally
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/causalfunnel-user-analytics.git
cd causalfunnel-user-analytics
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/causalfunnel_analytics
CLIENT_URL=http://localhost:5173
```

Ensure MongoDB is running locally.

Start the backend:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

Verify the backend using:

`http://localhost:4000/api/health`

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Configure the tracking script

Ensure `client/public/tracker.js` contains the correct API endpoint:

```javascript
const API_URL = "http://localhost:4000/api/events";
```

The demo page loads the tracker using:

```html
<script src="/tracker.js"></script>
```

Open `http://localhost:5173/demo.html` and interact with the product buttons to generate analytics events.

The dashboard can then retrieve the recorded data from the backend.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend and database status |
| POST | `/api/events` | Record a tracking event |
| GET | `/api/sessions` | Fetch sessions and event counts |
| GET | `/api/sessions/:sessionId/events` | Fetch a session's event history |
| GET | `/api/heatmap/pages` | List pages with recorded clicks |
| GET | `/api/heatmap?url=<page_url>` | Fetch click coordinates for a page |

### Example Event Payload

```json
{
  "session_id": "sess_example123",
  "event_type": "click",
  "page_url": "http://localhost:5173/demo.html",
  "timestamp": "2026-10-12T14:30:00.000Z",
  "click_x": 250,
  "click_y": 180,
  "viewport_width": 1440,
  "viewport_height": 900
}
```

For `page_view` events, click coordinates are not required.

## Database Design

Events are stored as individual MongoDB documents containing:

- `session_id`
- `event_type`
- `page_url`
- `timestamp`
- `click_x`
- `click_y`
- `viewport_width`
- `viewport_height`

Indexes support session event retrieval and page-based click queries.

## Assumptions and Trade-offs

- A session ID persists in `localStorage` and is reused across page reloads. This is a simplified browser-based session model rather than a time-expiring analytics session.
- The tracker currently records page views and clicks only.
- Click coordinates are relative to the browser viewport, so an accurate visual overlay requires matching the original page layout and viewport dimensions.
- The heatmap uses coordinate markers rather than a screenshot-based heatmap.
- The current implementation is intended as an assignment-scale analytics prototype, not a production analytics platform.
- The local setup uses a local MongoDB instance. The frontend alone can be hosted independently, but live event collection requires a publicly accessible backend and database.

## Deployment

The React frontend can be deployed using Netlify. The backend requires a separately hosted Node.js service and a remotely accessible MongoDB database for full production functionality.

Before deploying, update the frontend API URLs, configure CORS with the deployed frontend origin, and set database credentials through environment variables.

Do not commit `.env` files or database credentials to GitHub.

## Future Improvements

- Session expiration and improved session management
- Filtering and pagination for analytics data
- Improved heatmap aggregation and visualization
- Automated tests for API endpoints
- Production deployment with a cloud database
- Privacy-conscious consent and data-retention controls

## Author

Developed as a full-stack user analytics assignment using React, Node.js, Express, and MongoDB.
