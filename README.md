# Md. Wahidur Rahman — Academic Portfolio Website

A GitHub-ready academic portfolio website built with pure HTML, CSS, and vanilla JavaScript.

## Features

- Modern academic design with deep navy, white, and gold accents
- Responsive layout for mobile, tablet, and desktop
- Dark/light mode toggle
- Sticky navigation with smooth scrolling
- Scroll fade-in animations
- Publications tabs: Journal Articles, Conference Proceedings, Book Chapters
- Preloaded CV data: 30 journals, 9 conferences, 3 book chapters
- Admin mode for local editing
- Add/Edit/Delete publications, awards, and experience entries
- LocalStorage persistence
- Export custom-added publications as JSON

## Admin Mode

Click the lock icon in the top navigation bar and enter:

```text
wahid2024
```

When admin mode is active, Edit/Delete buttons will appear on publication, award, and experience cards.

## Project Structure

```text
wahid-academic-portfolio-cv/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── data/
│   └── content.js
├── assets/
│   ├── docs/
│   │   └── Md_Wahidur_Rahman_CV.pdf
│   └── images/
└── README.md
```

## How to Run Locally

Open `index.html` directly in a browser, or use VS Code Live Server.

## How to Upload to GitHub Pages

1. Create a new GitHub repository.
2. Upload all files and folders from this project.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select branch `main` and folder `/root`.
5. Save and wait for GitHub Pages to publish.

## Customization

- Edit personal, education, publication, award, experience, and skill data in `data/content.js`.
- Edit layout and colors in `css/styles.css`.
- Replace the photo placeholder by adding a profile image under `assets/images/` and updating the hero section in `index.html`.

