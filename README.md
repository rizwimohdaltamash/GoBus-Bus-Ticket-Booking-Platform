# 🚌 GoBus — Bus Ticket Booking Platform

A full-featured, modern bus ticket booking web application built with **Angular 21**, **Firebase**, **Tailwind CSS**, and **Razorpay** payment integration. GoBus supports two user roles — **Passengers** and **Bus Admins** — with dedicated dashboards, real-time seat selection, booking management, and downloadable PDF tickets.

### 🛠️ Built With

![Angular](https://img.shields.io/badge/Angular-21-grey?style=for-the-badge&logo=angular&logoColor=white&labelColor=DD0031)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-grey?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-grey?style=for-the-badge&logo=tailwindcss&logoColor=white&labelColor=06B6D4)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-grey?style=for-the-badge&logo=firebase&logoColor=black&labelColor=FFCA28)
![Angular Material](https://img.shields.io/badge/Angular_Material-21-grey?style=for-the-badge&logo=angular&logoColor=white&labelColor=757575)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-grey?style=for-the-badge&logo=razorpay&logoColor=white&labelColor=0C2451)
![jsPDF](https://img.shields.io/badge/jsPDF-PDF_Tickets-grey?style=for-the-badge&logo=adobeacrobatreader&logoColor=white&labelColor=F40F02)

---

## ✨ Features

### 🧑‍💼 Passenger (User)
- **Sign Up / Login** with Firebase Authentication
- **Search Buses** with live city autocomplete and instant filtering
- **Browse Available Buses** with route, timing, and pricing details
- **Interactive Seat Selection** — lower & upper deck with real-time seat availability
- **Razorpay Payment Gateway** — secure online payment before booking confirmation
- **Booking Confirmation** — unique Booking ID & PNR generation
- **Download PDF Ticket** via jsPDF with complete journey details
- **My Bookings** — view all bookings with status badges (Confirmed / Cancelled)
- **Cancel Booking** — self-service cancellation with freed seat availability
- **Profile Page** — name, email, total bookings, member since date

### 🛡️ Bus Admin
- **Register New Buses** — name, vehicle type, bus type, route, timings, price, seats, stops
- **My Buses Dashboard** — view, edit, and delete registered buses
- **User Bookings Management** — view all bookings on your buses with filter tabs
- **Cancel User Bookings** — admin cancellation with reason tracking
- **Admin Profile** — name, email, total buses registered, member since date

### 🎨 UI / UX
- Clean **white/light theme** with green accent
- Fully **responsive** — optimized for mobile, tablet, and desktop
- **Tailwind CSS** utility-first styling with glassmorphism cards
- **Angular Material** icons throughout
- Smooth transitions and animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 21 (Standalone Components) |
| **Styling** | Tailwind CSS 3.4 + Angular Material 21 |
| **Authentication** | Firebase Auth (Email/Password) |
| **Database** | Cloud Firestore |
| **Payments** | Razorpay Checkout |
| **PDF Generation** | jsPDF |
| **Build Tool** | Angular CLI with esbuild |
| **Language** | TypeScript 5.9 |

---

## 📁 Project Structure

```
src/
├── index.html                    # App shell + Razorpay script
├── main.ts                       # Bootstrap
├── styles.css                    # Global styles + Tailwind directives
├── material-theme.scss           # Angular Material theme
│
├── app/
│   ├── app.ts                    # Root component
│   ├── app.routes.ts             # Route definitions with guards
│   ├── app.config.ts             # App configuration
│   ├── firebase.ts               # Firebase config & initialization
│   │
│   ├── components/
│   │   ├── navbar/               # Navigation bar (role-aware)
│   │   └── footer/               # Footer component
│   │
│   ├── guards/                   # Route guards (auth, busAdmin)
│   │
│   ├── services/
│   │   └── auth.ts               # Auth + Firestore data service
│   │
│   └── pages/
│       ├── home/                 # Landing page
│       ├── login/                # User login
│       ├── signup/               # User registration (role selection)
│       ├── search-bus/           # Search with city autocomplete
│       ├── booking/              # Browse available buses
│       ├── seat-selection/       # Interactive seat map + Razorpay
│       ├── booking-confirmation/ # Success page + PDF download
│       ├── my-bookings/          # User's booking history
│       ├── bus-admin/            # Register new bus (admin)
│       ├── my-buses/             # Admin's bus fleet management
│       ├── admin-bookings/       # Admin booking management
│       └── profile/              # Role-aware user profile
```

---

## 🔐 Firebase Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles — `uid`, `name`, `email`, `role` (user/busAdmin), `createdAt` |
| `buses` | Registered buses — route, timings, price, seats, type, admin info |
| `bookings` | All bookings — bus details, seats, PNR, status, user info, timestamps |

### Booking Statuses
- `confirmed` — Active booking
- `cancelled_by_user` — Cancelled by the passenger
- `cancelled_by_admin` — Cancelled by the bus admin

---

## 💳 Payment Flow

1. User selects seats on the seat selection page
2. Clicks **"Pay ₹{amount} & Book"**
3. Razorpay checkout modal opens with pre-filled user details
4. On **successful payment** → navigates to booking confirmation, saves to Firestore
5. On **cancellation/failure** → shows error message, user can retry

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- A **Firebase** project with Auth and Firestore enabled
- A **Razorpay** account (test mode works)

### Installation

```bash
# Clone the repository
git clone https://github.com/rizwimohdaltamash/MedSync77.git
cd bus-booking-app

# Install dependencies
npm install

# Start development server
ng serve
```

The app will be available at `http://localhost:4200`

### Build for Production

```bash
ng build
```

Output will be in `dist/bus-booking-app/browser/`

---

## ☁️ Deployment (Vercel)

The project includes a `vercel.json` for one-click Vercel deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/bus-booking-app/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

1. Push code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel auto-detects the config and deploys

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server on `localhost:4200` |
| `npm run build` | Production build |
| `npm run watch` | Build in watch mode (development) |
| `npm test` | Run unit tests |

---

## 📱 App Flow

### User Flow
**Home** → Search / Browse Buses → Select Seats → Pay via Razorpay → Booking Confirmed → Download PDF Ticket → My Bookings

### Admin Flow
**Register Bus** → My Buses (Edit/Delete) → View User Bookings → Cancel Bookings

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built using Angular, Firebase & Tailwind CSS
</p>
