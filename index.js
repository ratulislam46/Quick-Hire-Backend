const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    const jobCollection = client.db("quickHireDB").collection("jobs");

    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });

    app.get('/jobs', async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    console.log("Successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});