const express = require('express');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configure MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'wpr',
  password: 'fit2024',
  database: 'wpr2201040185'
});

db.connect(err => {
  if (err) throw err;
});

// Custom how Date displays
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isSameYear = date.getFullYear() === now.getFullYear();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isSameYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

// Default route
app.get('/', (req, res) => {
  const userId = req.cookies.userId;
  if (userId) {
    return res.redirect('/inbox');
  }
  res.render('signin', { error: null });
});

// Sign-in page
app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).send('Internal Server Error');
      }
      if (results.length > 0) {
        res.cookie('userId', results[0].id, { httpOnly: true, maxAge: 3600000 });
        res.cookie('userName', results[0].full_name, { httpOnly: true, maxAge: 3600000 });
        res.redirect('/inbox');
      } else {
        res.render('signin', { error: 'Invalid username or password!' });
      }
    });
  } else {
    res.render('signin', { error: 'Please enter username and password!' });
  }
});

// Sign-up page
app.get('/signup', (req, res) => {
  res.render('signup', { error: null, success: null });
});

app.post('/signup', (req, res) => {
  const { full_name, email, password, re_password } = req.body;
  if (!full_name || !email || !password || !re_password) {
    return res.render('signup', { error: 'All fields are required!', success: null });
  }
  if (password !== re_password) {
    return res.render('signup', { error: 'Passwords do not match!', success: null });
  }
  if (password.length < 6) {
    return res.render('signup', { error: 'Password must be at least 6 characters long!', success: null });
  }
  db.query('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)', [full_name, email, password], (err, result) => {
    if (err) {
      // If there's duplicate info in the database
      if (err.code === 'ER_DUP_ENTRY') {
        return res.render('signup', { error: 'Email is already registered!', success: null });
      }
      throw err;
    }
    res.render('signup', { error: null, success: 'Account created successfully!' });
  });
});

// Inbox page
app.get('/inbox', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(403).send('Access denied');
  }

  // Pagination handling
  const currentNum = parseInt(req.query.page) || 1;
  const mailsPerPage = 5;
  const mailsSkipped = (currentNum - 1) * mailsPerPage;

  // Display on the page: sender, undeleted emails, limit the number of emails per page
  db.query('SELECT emails.*, users.full_name AS sender_name FROM emails JOIN users ON emails.sender_id = users.id WHERE recipient_id = ? AND deleted_by_recipient = FALSE ORDER BY timestamp DESC LIMIT ? OFFSET ?', [userId, mailsPerPage, mailsSkipped], (err, emails) => {
    if (err) throw err;

    db.query('SELECT COUNT(*) AS total FROM emails WHERE recipient_id = ? AND deleted_by_recipient = FALSE', [userId], (err, countResult) => {
      if (err) throw err;
      const totalEmails = countResult[0].total;
      const totalPages = Math.ceil(totalEmails / mailsPerPage);

      if (currentNum > totalPages && totalPages > 0) {
        return res.redirect(`/inbox?page=${totalPages}`);
      }

      const pagination = {
        currentPage: currentNum,
        totalPages: totalPages,
        pages: []
      };

      // Only display 5 pages in one time in Pagination
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pagination.pages.push(i);
        }
      } else {
        pagination.pages.push(1);
        if (currentNum > 2 && currentNum < totalPages - 1) {
          pagination.pages.push(currentNum - 1);
          pagination.pages.push(currentNum);
          pagination.pages.push(currentNum + 1);
        } else if (currentNum === 2) {
          pagination.pages.push(2);
          pagination.pages.push(3);
        } else if (currentNum === totalPages - 1) {
          pagination.pages.push(totalPages - 2);
          pagination.pages.push(totalPages - 1);
        }
        pagination.pages.push(totalPages);
      }

      res.render('inbox', {
        emails,
        userName: req.cookies.userName,
        currentPage: 'inbox',
        pagination,
        showPagination: true,
        formatDate
      });
    });
  });
});

// Sign-out
app.get('/signout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('userName');
  res.redirect('/');
});

// Outbox page - Similar to Inbox page but change recipient_id to sender_id
app.get('/outbox', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(403).send('Access denied');
  }

  const currentNum = parseInt(req.query.page) || 1;
  const mailsPerPage = 5;
  const mailsSkipped = (currentNum - 1) * mailsPerPage;

  db.query('SELECT emails.*, users.full_name AS recipient_name FROM emails JOIN users ON emails.recipient_id = users.id WHERE sender_id = ? AND deleted_by_sender = FALSE ORDER BY timestamp DESC LIMIT ? OFFSET ?', [userId, mailsPerPage, mailsSkipped], (err, emails) => {
    if (err) throw err;

    db.query('SELECT COUNT(*) AS total FROM emails WHERE sender_id = ? AND deleted_by_sender = FALSE', [userId], (err, countResult) => {
      if (err) throw err;
      const totalEmails = countResult[0].total;
      const totalPages = Math.ceil(totalEmails / mailsPerPage);

      if (currentNum > totalPages && totalPages > 0) {
        return res.redirect(`/outbox?page=${totalPages}`);
      }

      const pagination = {
        currentPage: currentNum,
        totalPages: totalPages,
        pages: []
      };

      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          pagination.pages.push(i);
        }
      } else {
        pagination.pages.push(1);
        if (currentNum > 2 && currentNum < totalPages - 1) {
          pagination.pages.push(currentNum - 1);
          pagination.pages.push(currentNum);
          pagination.pages.push(currentNum + 1);
        } else if (currentNum === 2) {
          pagination.pages.push(2);
          pagination.pages.push(3);
        } else if (currentNum === totalPages - 1) {
          pagination.pages.push(totalPages - 2);
          pagination.pages.push(totalPages - 1);
        }
        pagination.pages.push(totalPages);
      }

      res.render('outbox', {
        emails,
        userName: req.cookies.userName,
        currentPage: 'outbox',
        pagination,
        showPagination: true,
        formatDate
      });
    });
  });
});

// Email detail page
app.get('/email/:id', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(403).send('Access denied');
  }

  db.query('SELECT emails.*, sender.email AS sender_email, recipient.email AS recipient_email FROM emails JOIN users AS sender ON emails.sender_id = sender.id JOIN users AS recipient ON emails.recipient_id = recipient.id WHERE emails.id = ?', [req.params.id], (err, emails) => {
    if (err) throw err;
    if (emails.length > 0) {
      const email = emails[0];
      const currentPage = req.query.from === 'outbox' ? 'outbox' : 'inbox';
      res.render('detail', { email, userName: req.cookies.userName, currentPage });
    } else {
      res.status(404).send('Email not found');
    }
  });
});

// Delete emails
app.post('/delete-emails', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(403).send('Access denied');
  }

  const { emailIds } = req.body;
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).send('No emails selected');
  }

  const deleteEmailsQuery = `
    UPDATE emails 
    SET deleted_by_recipient = CASE WHEN recipient_id = ? THEN TRUE ELSE deleted_by_recipient END,
        deleted_by_sender = CASE WHEN sender_id = ? THEN TRUE ELSE deleted_by_sender END
    WHERE id IN (?) AND (recipient_id = ? OR sender_id = ?)
  `;

  db.query(deleteEmailsQuery, [userId, userId, emailIds, userId, userId], (err, result) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

// Compose page
app.get('/compose', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(403).send('Access denied');
  }
  db.query('SELECT id, full_name FROM users WHERE id != ?', [userId], (err, users) => {
    if (err) throw err;
    res.render('compose', { users, error: null, success: null, userName: req.cookies.userName, currentPage: 'compose' });
  });
});

app.post('/compose', upload.single('attachment'), (req, res) => {
  const { recipient_id, subject, body } = req.body;
  const attachment_path = req.file ? req.file.filename : null;

  const userId = req.cookies.userId;

  if (!recipient_id) {
    return res.render('compose', { error: 'Recipient is required', success: null, users: [], userName: req.cookies.userName, currentPage: 'compose' });
  }

  db.query('INSERT INTO emails (sender_id, recipient_id, subject, body, attachment_path) VALUES (?, ?, ?, ?, ?)',
    [userId, recipient_id, subject || '(no subject)', body, attachment_path],
    (err, result) => {
      if (err) throw err;

      const emailId = result.insertId;
      res.render('compose', { 
        users: [],
        error: null, 
        success: 'Email sent successfully!', 
        emailId: emailId,
        userName: req.cookies.userName, 
        currentPage: 'compose' 
      });
    }
  );
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});