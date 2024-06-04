const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000






const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',

    ],
    credentials: true,
    optionSuccessStatus: 200,
}

//middleware
app.use(cors(corsOptions));
app.use(express.json());



//MONGODB CONNECTION


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uo3rphs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get('/', (req, res) => {
    res.send('Xcelliance Server is running')
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const productCollection = client.db('xcelliance').collection('products');

        //get all products from database
        app.get('/products', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products)
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







