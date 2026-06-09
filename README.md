# IVAO Thailand Training Portal

Modern IVAO Thailand Training Department portal built with Next.js, Firebase Firestore, and IVAO OAuth.

Production:
[https://ivaoth-training.vercel.app](https://ivaoth-training.vercel.app)

---

# Overview

IVAO Thailand Training Portal is a centralized training management platform for IVAO Thailand Division.

The platform provides:

* Training session scheduling
* Staff management
* Training calendar
* Training documents
* Session reminders
* Training dashboards
* IVAO OAuth authentication

---

# Stack

## Frontend

* Next.js
* React
* TailwindCSS

## Backend / Database

* Firebase Firestore
* Realtime updates using onSnapshot

## Authentication

* IVAO OAuth

## Hosting

* Vercel

## Development

* VSCode
* GitHub Desktop

---

# Main Features

## Authentication

* IVAO OAuth login
* Protected staff pages
* Guest privacy system
* Session-based access control

---

# Training Sessions

## Session Types

* Theory Training
* Unofficial Practical
* Official Practical
* Theory Exam
* Practical Exam

## Features

* Live Firestore sessions
* Training calendar
* Up Next panel
* Session ownership system
* Legacy session claim system
* Exam badges
* Session reminders
* Real-time updates

---

# Staff Console

## Features

* Create sessions
* Edit/Delete owned sessions
* Claim legacy sessions
* Staff-only management tools
* Training staff directory

---

# Training Docs

## Features

* Firestore-powered docs CMS
* Add/Edit/Delete docs
* YouTube / PDF / Website support
* Auto YouTube thumbnails
* Order-based sorting
* Login-required access
* Training resource hub

---

# Training Staff Directory

## Features

* Staff member cards
* IVAO profile links
* Custom thumbnails
* Manual management system
* Webmaster tools

---

# Firebase Collections

## trainingSessions

Fields:

* date
* time
* program
* type
* topic
* remarks
* position
* traineeName
* traineeVid
* trainerName
* trainerVid
* status
* createdAt
* updatedAt

## trainingDocs

Fields:

* title
* description
* type
* url
* thumbnailUrl
* order
* active
* createdAt
* updatedAt

---

# Environment Variables

## IVAO OAuth

```env
IVAO_CLIENT_ID=
IVAO_CLIENT_SECRET=
SESSION_SECRET=
NEXT_PUBLIC_BASE_URL=
```

`SESSION_SECRET` should be a long random value. If omitted, the app falls back
to `IVAO_CLIENT_SECRET` for signing session cookies.

## Firebase

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Server-side Firestore writes use the official Firestore server SDK. Add these variables to
Vercel for Production, Preview, and Development:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The values come from Firebase Console -> Project settings -> Service accounts
-> Generate new private key. Never commit the downloaded JSON key. As an
alternative, the complete one-line JSON can be stored in
`FIREBASE_SERVICE_ACCOUNT_JSON`.

After the server variables are deployed, publish `firestore.rules`. Public
collections remain readable by the web client for realtime updates, while all
writes go through authenticated Next.js API routes.

---

# Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# Deployment

Auto deployment:

* GitHub
* Vercel

Production:
[https://ivaoth-training.vercel.app](https://ivaoth-training.vercel.app)

---

# Repository

[https://github.com/zporporz/ivaoth-training](https://github.com/zporporz/ivaoth-training)

---

# Release

## v1.0.0

First public release of the IVAO Thailand Training Portal.

Includes:

* IVAO OAuth
* Staff Console
* Training Sessions
* Training Calendar
* Training Docs CMS
* Training Staff Directory
* Session Reminder System
* Firestore Realtime Integration
