# Analytics Tracking API

Track video campaign performance across all platforms.

## Public Endpoints (No Auth Required)

These endpoints are called by the frontend to track user actions.

### Track Page View
```bash
POST /track/view/:slug?source=<source>
```

**Example:**
```bash
curl -X POST "https://bzbac.onrender.com/track/view/summer-sale?source=facebook"
```

**Response:**
```json
{"success":true,"event":"view","slug":"summer-sale","source":"facebook"}
```

---

### Track Video Play
```bash
POST /track/play/:slug?source=<source>
```

**Example:**
```bash
curl -X POST "https://bzbac.onrender.com/track/play/summer-sale?source=instagram"
```

**Response:**
```json
{"success":true,"event":"play","slug":"summer-sale","source":"instagram"}
```

---

### Track Video Completion
```bash
POST /track/complete/:slug?source=<source>
```

**Example:**
```bash
curl -X POST "https://bzbac.onrender.com/track/complete/summer-sale?source=whatsapp"
```

**Response:**
```json
{"success":true,"event":"complete","slug":"summer-sale","source":"whatsapp"}
```

---

### Track CTA Click
```bash
POST /track/click/:slug?source=<source>
```

**Example:**
```bash
curl -X POST "https://bzbac.onrender.com/track/click/summer-sale?source=twitter"
```

**Response:**
```json
{"success":true,"event":"click","slug":"summer-sale","source":"twitter"}
```

---

## Protected Endpoints (Admin Auth Required)

These endpoints require a valid JWT token in the Authorization header.

### Get All Campaigns Analytics
```bash
GET /track/analytics
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" "https://bzbac.onrender.com/track/analytics"
```

**Response:**
```json
[
  {
    "campaignSlug": "summer-sale",
    "views": 1520,
    "plays": 1140,
    "completes": 890,
    "clicks": 260,
    "conversionRate": 22.81
  },
  {
    "campaignSlug": "winter-promo",
    "views": 800,
    "plays": 600,
    "completes": 450,
    "clicks": 120,
    "conversionRate": 20
  }
]
```

---

### Get Single Campaign Analytics
```bash
GET /track/analytics/:slug
Authorization: Bearer <token>
```

**Query Parameters (optional):**
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

**Example:**
```bash
curl -H "Authorization: Bearer <token>" "https://bzbac.onrender.com/track/analytics/summer-sale"
```

**Response:**
```json
{
  "campaignSlug": "summer-sale",
  "totalViews": 1520,
  "totalPlays": 1140,
  "totalCompletes": 890,
  "totalClicks": 260,
  "conversionRate": 22.81,
  "bySource": {
    "facebook": {"views": 500, "plays": 300, "completes": 200, "clicks": 45},
    "instagram": {"views": 800, "plays": 600, "completes": 500, "clicks": 120},
    "whatsapp": {"views": 200, "plays": 150, "completes": 100, "clicks": 80},
    "twitter": {"views": 20, "plays": 10, "completes": 5, "clicks": 5}
  },
  "byDate": [
    {"date": "2026-01-04", "views": 500, "plays": 400, "completes": 300, "clicks": 100},
    {"date": "2026-01-03", "views": 450, "plays": 350, "completes": 280, "clicks": 80}
  ]
}
```

---

## Sources

Use the `source` query parameter to track where traffic comes from:

| Source | URL Parameter |
|--------|---------------|
| Facebook | `?source=facebook` |
| Instagram | `?source=instagram` |
| WhatsApp | `?source=whatsapp` |
| Twitter/X | `?source=twitter` |
| TikTok | `?source=tiktok` |
| Email | `?source=email` |
| Direct | `?source=direct` (default) |

---

## Frontend Integration

### JavaScript Example
```javascript
// Get source from URL params
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('utm_source') || 'direct';

// Track page view when page loads
fetch(`https://bzbac.onrender.com/track/view/${slug}?source=${source}`, { method: 'POST' });

// Track video play when video starts
videoElement.addEventListener('play', () => {
  fetch(`https://bzbac.onrender.com/track/play/${slug}?source=${source}`, { method: 'POST' });
});

// Track video completion when video ends
videoElement.addEventListener('ended', () => {
  fetch(`https://bzbac.onrender.com/track/complete/${slug}?source=${source}`, { method: 'POST' });
});

// Track CTA click
ctaButton.addEventListener('click', () => {
  fetch(`https://bzbac.onrender.com/track/click/${slug}?source=${source}`, { method: 'POST' });
});
```

### Share Links with Tracking
```
Facebook:   https://assetarleadvideos.name.ng/c/summer-sale?utm_source=facebook
Instagram:  https://assetarleadvideos.name.ng/c/summer-sale?utm_source=instagram
WhatsApp:   https://assetarleadvideos.name.ng/c/summer-sale?utm_source=whatsapp
Twitter:    https://assetarleadvideos.name.ng/c/summer-sale?utm_source=twitter
```
