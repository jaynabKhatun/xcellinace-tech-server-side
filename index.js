const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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



        const productCollection = client.db('xcelliance').collection('products');
        const techNewsCollection = client.db('xcelliance').collection('technews');



        //get all products from database
        app.get('/products', async (req, res) => {
            
            console.log('pagination',req.query);
           
            const { search, page, size } = req.query;
            console.log('page',page);
            console.log('size',size);
            
           
           

            // const filter = req.query;
            // // console.log(filter);
            const searchQuery = search ? String(search) : '';

            // const query = {
            //     tags: { $regex: filter.search, $options: 'i' }


            // }
            const query = searchQuery ? {
                tags: { $regex: searchQuery, $options: 'i' }
            } : {};
            console.log('query', query);


            const products = await productCollection.find(query).toArray();
            res.send(products)
        })

        //count
        app.get('/products/count', async (req, res) => {
            const count = await productCollection.estimatedDocumentCount();
            res.send({ count })
        })


        //get single product from database
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product)
        })


        //get all tech news from database
        app.get('/technews', async (req, res) => {
            const technews = await techNewsCollection.find().toArray();
            res.send(technews)
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







