## 🛠️ Local Development Setup

This guide will help you get started with running the app locally and connecting it to Google Calendar using OAuth2.

---

### ✅ 1. Clone the Repository

```bash
git clone https://github.com/yourusername/TimelyMeet.git
cd TimelyMeet
```

## 📦 2. Install Dependencies

```bash
npm install
```

## 🔐 3. Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable the **Google Calendar API**:
   - Go to **APIs & Services → Library**
   - Search for **Google Calendar API** and enable it.
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth client ID**
6. Choose the following:
   - **Application type**: `Desktop app`
   - **Name**: e.g., `ElectronMeetingApp`
7. Click **Create**
8. Download the credentials as a JSON file and save it as: `credentials.json`
9. Place `credentials.json` in the root directory of the project (or wherever your code expects it — default is `./credentials.json`).

## 🧪 4. Run the App in Development Mode

```bash
npm start
```
