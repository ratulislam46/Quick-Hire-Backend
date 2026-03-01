const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // ফিক্সড: ObjectId যোগ করা হয়েছে
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

        const userCollection = client.db("quickHireDB").collection("users");
        const jobCollection = client.db("quickHireDB").collection("jobs");
        const applicationCollection = client.db("quickHireDB").collection("applications");

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
            const updateDoc = { $set: { lastLoggedAt: user.lastLoggedAt } };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.get('/users/email/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const result = await userCollection.findOne({ email: email });
                if (!result) return res.status(404).send({ message: "User not found" });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error" });
            }
        });

        app.get('/jobs', async (req, res) => {
            const { title, category } = req.query;
            let query = {};
            if (title) query.title = { $regex: title, $options: 'i' };
            if (category && category !== 'All') query.category = category;

            const result = await jobCollection.find(query).sort({ created_at: -1 }).toArray();
            res.send(result);
        });

        app.get('/jobs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ message: "Invalid ID format" });
                }
                const query = { _id: new ObjectId(id) };
                const result = await jobCollection.findOne(query);
                if (!result) return res.status(404).send({ message: "Job not found" });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Server error", error: error.message });
            }
        });

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        });

        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/job-applications', async (req, res) => {
            try {
                const application = req.body;

                const alreadyApplied = await applicationCollection.findOne({
                    applicant_email: application.applicant_email,
                    job_id: application.job_id
                });

                if (alreadyApplied) {
                    return res.status(400).send({ message: "You have already applied for this job." });
                }

                const result = await applicationCollection.insertOne(application);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Failed to submit application" });
            }
        });

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