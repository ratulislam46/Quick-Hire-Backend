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

        const userCollection = client.db("quickHireDB").collection("users");
        const jobCollection = client.db("quickHireDB").collection("jobs");


        app.post('/register', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User already exists', insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.patch('/login', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = {
                $set: {
                    lastLoggedAt: user.lastLoggedAt
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        //  Get all jobs with Filter (Admin & Users)
        app.get('/jobs', async (req, res) => {
            const { title, category } = req.query;
            let query = {};
            if (title) {
                query.title = { $regex: title, $options: 'i' };
            }
            if (category && category !== 'All') {
                query.category = category;
            }
            const result = await jobCollection.find(query).sort({ created_at: -1 }).toArray();
            res.send(result);
        });

        //  Add New Job
        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        });

        //  Delete Job
        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollection.deleteOne(query);
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