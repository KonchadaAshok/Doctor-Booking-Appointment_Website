🩺 Doctor Booking Appointment Website (MERN Stack)


📌 Overview

This is a Doctor Booking Appointment Website built using the MERN Stack.
The project allows users to browse doctors, check availability, book appointments, and manage profiles, while doctors and admins can manage schedules and bookings.

This project was developed as part of learning and internship practice, focusing on real-world full-stack application development.

⚙️ Tech Stack
Frontend

React JS

React Router DOM

Axios

Context API

Tailwind CSS

Vite

Backend

Node.js

Express.js

MongoDB

Mongoose

JWT Authentication

Cloudinary (Image Uploads)

🚀 Features
👤 User Features

✅ User registration & login
✅ Browse doctors by speciality
✅ View doctor profiles
✅ Check doctor availability
✅ Book appointments
✅ View booked appointments
✅ Secure authentication using JWT

🧑‍⚕️ Doctor Features

✅ Doctor login
✅ View appointments
✅ Update availability status
✅ Manage profile

🛠️ Admin Features

✅ Add doctors
✅ Manage doctor details
✅ Control doctor availability

📂 Project Structure
Doctor-Booking-Appointment_Website
│
├── frontend      # User-facing React app
├── admin         # Admin panel (React)
├── backend       # Node + Express API
└── README.md

🧾 How to Run the Project Locally:

1️⃣ Clone the repository
git clone https://github.com/KonchadaAshok/Doctor-Booking-Appointment_Website.git

2️⃣ Go to backend folder
cd Doctor-Booking-Appointment_Website/backend

3️⃣ Install backend dependencies
npm install

4️⃣ Start backend server
npm run server

5️⃣ Start Frontend
cd ../frontend
npm install
npm run dev


Frontend runs at:

http://localhost:5173

6️⃣ Start Admin Panel
cd ../admin
npm install
npm run dev


Admin panel runs at:

http://localhost:5174

🔐 Environment Variables

Create a .env file inside backend folder:

PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret

🧠 Learning Outcomes

MERN Stack architecture

JWT authentication & authorization

Context API for global state

RESTful APIs

Role-based access (User / Doctor / Admin)

Real-world Git & GitHub workflow

|   👨‍💻Developer Name	  |       Role          |
|-----------------------|---------------------|   
| Konchada Ashok Kumar	| Full Stack Developer|


📎 Repository Link:
🔗 https://github.com/KonchadaAshok/Doctor-Booking-Appointment_Website
