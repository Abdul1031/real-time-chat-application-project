# Real-Time Chat Application

## Project Overview  
The **Real-Time Chat Application** is a full-stack **MERN** application that enables seamless real-time messaging using **Socket.IO**.  
It provides:  
- Secure authentication with JWT  
- File upload capabilities with Cloudinary  
- Real-time communication  
- A modern and responsive user experience built with **React 18** and **TypeScript**

---

## Technology Stack  

### Backend  
- Framework: Express.js  
- Database: MongoDB with Mongoose ODM  
- Authentication: JWT (JSON Web Tokens)  
- Real-time: Socket.IO  
- File Upload: Cloudinary  
- Security: bcryptjs, CORS  

### Frontend  
- Framework: React 18 with TypeScript  
- Build Tool: Vite  
- State Management: Zustand  
- Styling: TailwindCSS + DaisyUI  
- HTTP Client: Axios  
- Real-time: Socket.IO Client  
- Routing: React Router DOM  
- Notifications: React Hot Toast  

---

## API Endpoints  

### Authentication  
- Sign Up → `POST /api/auth/signup`  
- Login → `POST /api/auth/login`  
- Logout → `POST /api/auth/logout`  
- Update Profile → `PUT /api/auth/update-profile`  
- Check Authentication → `GET /api/auth/check`  

### Messaging  
- Get Users for Sidebar → `GET /api/messages/users`  
- Get Messages → `GET /api/messages/:id`  
- Send Message → `POST /api/messages/send/:id`  

---

## GitHub Repository  
You can find the complete source code here:  
[Real-Time Chat Application Repository](https://github.com/Abdul1031/real-time-chat-application-project.git)
