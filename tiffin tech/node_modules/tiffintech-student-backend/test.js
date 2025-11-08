import express from 'express';
const app = express();
const PORT = 5000;

app.use('/api/students', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Direct test - Students route working!' 
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});