const express = require('express');
const cors = require('cors');
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://AAPKA-VERCEL-URL.vercel.app',
    'http://localhost:3000'
  ]
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Team Task Manager API running!' }));

db.initialize().then(() => {
  const authRoutes = require('./routes/auth');
  const projectRoutes = require('./routes/projects');
  const taskRoutes = require('./routes/tasks');
  const userRoutes = require('./routes/users');

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
