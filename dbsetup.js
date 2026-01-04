const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'wpr',
  password: 'fit2024',
  multipleStatements: true
});

const setupDB = `
CREATE DATABASE IF NOT EXISTS wpr2201040185;
USE wpr2201040185;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT,
  recipient_id INT,
  subject VARCHAR(255),
  body TEXT,
  attachment_path VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_recipient BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

INSERT IGNORE INTO users (full_name, email, password) VALUES
('Alice A', 'a@a.com', '123'),
('Dam Thi B', 'bdam@b.com', '123456'),
('Dinh Van C', 'cdinh@c.com', '1@3456'),
('Hoang Thi D', 'dhoang@d.com', '12@456'),
('Tran Van E', 'etran@e.com', '123@56');

INSERT IGNORE INTO emails (sender_id, recipient_id, subject, body, timestamp) VALUES
(2, 1, 'Check in', 'Hi A, I hope this message finds you well! I just wanted to touch base regarding... Let me know if you have any updates or if theres anything you need from me. Looking forward to hearing from you! Best, B', '2024-03-15 10:00:00'),
(3, 1, 'Hello', 'Hope you are doing well', '2024-05-19 11:48:00'),
(1, 2, 'Re: Hello', 'Thanks for the welcome!', '2023-06-15 08:07:00'),
(1, 3, 'Assignment', 'I will not turn in this assignment', '2024-03-03 13:07:00'),
(2, 3, 'Meeting', 'Can we meet at 2 PM?', '2022-10-09 11:07:00'),
(3, 2, 'Re: Meeting Tomorrow', 'Yes, that works for me', '2024-02-12 10:15:30'),
(4, 5, 'Introduction', 'Hi, nice to meet you!', '2023-11-01 09:45:12'),
(5, 4, 'Re: Introduction', 'Nice to meet you too, Hoang!', '2023-12-05 14:30:25'),
(4, 1, 'The project', 'Can you provide more details about the project?', '2024-01-20 11:22:34'),
(1, 4, 'Re: The project', 'Sure, here are the details...', '2024-03-03 12:05:47'),
(5, 2, 'Meeting Schedule', 'Can we schedule a meeting for next week?', '2024-04-15 13:55:08'),
(2, 5, 'Re: Meeting Schedule', 'No wayyyyyyyyyyyyyy. I will not attend', '2024-04-16 14:12:19'),
(3, 4, 'Invite to collaborate', 'Would you like to collaborate on the new project?', '2024-05-10 15:20:34'),
(4, 3, 'Re: Invite to collaborate', 'Yes, I would love to collaborate.', '2024-05-11 16:10:01'),
(1, 2, 'AAAA', 'Just wanted to follow up on the project status.', '2024-06-15 09:50:11'),
(1, 3, 'BBBB', 'Here are the notes from our last meeting.', '2024-07-22 10:12:45'),
(1, 4, 'New Ideas', 'I have some new ideas for the project.', '2024-08-30 11:05:33'),
(1, 5, 'Weekly Update', 'Here is the weekly update on the project.', '2024-09-10 12:18:29'),
(1, 2, 'Client Feedback', 'We received some feedback from the client.', '2024-10-05 13:42:10'),
(1, 3, 'Budget Review', 'We need to review the project budget.', '2024-11-05 14:24:00'),
(1, 4, 'Team Meeting', 'We have a team meeting scheduled for next week.', '2024-10-20 15:00:00'),
(1, 5, 'Meeting Schedule', 'Can we schedule a meeting for next week?', '2024-08-01 16:33:47'),
(1, 2, 'Re: Client Feedback', 'Thanks for the feedback!', '2023-08-06 17:15:58'),
(1, 3, 'Re: Budget Review', 'I agree with the budget review.', '2024-11-03 18:05:00');
`;

connection.connect(err => {
  if (err) throw err;

  connection.query(setupDB, (err, results) => {
    if (err) throw err;
    console.log('Database initialized.');
    connection.end();
  });
});