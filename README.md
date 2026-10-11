# TypingStreak

TypingStreak is an original, local-first typing practice website for laptop and desktop browsers. It uses plain HTML, CSS, and JavaScript, with no package installation or framework.

## Run it

Open this folder in your code editor and open `index.html` in a browser. If that browser blocks JavaScript modules from a `file://` page, open Terminal in this folder and run:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Features

- Dashboard with best speed, daily practice time, daily goal, streak, XP, and recent sessions.
- Normal, informal, coding, and punctuation focused text.
- Timed, word-count, quote, and custom passage tests, with adjustable timer presets and custom time.
- Live WPM, accuracy, remaining time, and error count; backspace corrections are supported.
- Beginner, intermediate, and advanced original lessons.
- Three quick game formats, personalized focus-key drills, session history, weekly practice chart, personal records, and achievements.
- Exportable JSON backup and local settings.

## File map

- `index.html` is the browser page and navigation shell.
- `src/styles.css` contains the base visual system.
- `src/features.css` contains the extra layouts for lessons, games, charts, and progress screens.
- `src/app.js` connects screens, buttons, local data, and the typing engine.
- `src/typing-engine.js` calculates timing and typing scores without handling page layout.
- `src/passages.js` contains original exercises, quotes, word pools, and the course curriculum.

## Data and platform notes

Progress is stored in this browser on this device. There are no accounts, cloud sync, or real multiplayer leaderboard yet; the leaderboard area shows personal records. The site can be added to a home screen through the browser where supported. A native operating-system widget requires a separate native companion and is outside what a plain website can provide.
