# Node.js Email System

A robust simulation of an email service provider built with Node.js. This application allows users to register, securely sign in, and manage their digital correspondence through a traditional inbox/outbox interface, complete with attachment support.

## 🌟 Key Features

*   **User Authentication:** Secure signup and login processes to protect user data.
*   **Mailbox Management:** distinct views for **Inbox** (received messages) and **Outbox** (sent messages).
*   **Rich Composition:** Interface for composing emails with subject lines and body text.
*   **Attachment Support:** Users can attach and send files (PDFs, Images) using `multer`.
*   **Persistent Storage:** All emails and user data are stored reliably in a **MySQL** database.
*   **Dynamic Rendering:** Server-side rendering using **EJS** templates for a responsive user experience.

## 🛠 Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MySQL (via `mysql2`)
*   **Template Engine:** EJS
*   **Middleware:** Multer (file uploads), Cookie-Parser, Dotenv

## 🚀 Getting Started

### Prerequisites
*   Node.js (v14 or higher)
*   MySQL Server

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/email-system.git
    cd email-system
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Database Setup**
    *   Ensure your MySQL server is running.
    *   Execute the `dbsetup.js` script to initialize the database schema:
    ```bash
    node dbsetup.js
    ```

4.  **Configuration**
    *   Create a `.env` file based on your environment (configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.).

5.  **Run the Application**
    ```bash
    node index.js
    ```
    Visit `http://localhost:3000` in your browser.

## 📄 License
ISC
