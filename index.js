const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId, Timestamp } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken');
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
        const usersCollection = client.db('xcelliance').collection('users');
        const reportedProductCollection = client.db('xcelliance').collection('reportedProducts');


        //jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token: token })

        })

        //verify token
        const verifyToken = async (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized!!!' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized!!!' })
                }
                req.user = decode;
                next();
            })

        }


        //verify admin middleware
        const verifyAdmin = async (req, res, next) => {
            console.log('hello from verify admin middleware')
            const user = req.user;
            const query = { email: user?.email };
            const result = await usersCollection.findOne(query);
            if (!result || result.role !== 'admin') {
                return res.status(401).send({ message: 'Unauthorized access!!!' })
            }
            next();


        }

        //verify moderator middleware

        const verifyModerator = async (req, res, next) => {
            const user = req.user;
            const query = { email: user?.email };
            const result = await usersCollection.findOne(query);
            if (!result || result.role !== 'moderator') {
                return res.status(401).send({ message: 'Unauthorized moderator access!!!' })
            }
            next();

        }




        //save a user data to database
        app.put('/user', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    ...user,
                    Timestamp: Date.now()
                }
            }

            const userExists = await usersCollection.findOne(query);
            if (userExists) {
                return res.send({ message: 'User already exists', insertedId: null })
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result)
        })

        //get all users from database
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

        //update user role from database
        app.patch('/users/update/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email };
            const updatedDoc = {
                $set: {
                    ...user,
                    Timestamp: Date.now(),
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc);
            res.send(result)

        })



        //get user information from database
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result)


        })


        //get all products from database
        app.get('/products', async (req, res) => {

            const { search } = req.query;
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);




            const searchQuery = search ? String(search) : '';

            const query = searchQuery ? {
                tags: { $regex: searchQuery, $options: 'i' }
            } : {};



            const products = await productCollection.find(query)

                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(products)
        })

        //post item to database
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.json(result)
        })

        //delete product from database
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result)
        })

        app.get('/productsUp/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const product = await productCollection.findOne(query);
            // const result = await productCollection.updateOne(query, { $set: { upvotes: product.upvotes + 1 } });
            res.send(product)


        })

        app.patch('/productsUp/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    name: item.name,
                    description: item.description,
                    tags: item.tags,
                    image: item.image,
                    link: item.link,
                    category: item.category,
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc);
            res.send(result)


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



        //get email specifiq data
        app.get('/product', async (req, res) => {
            console.log(req.query.userEmail);
            let query = {};
            if (req.query?.email) {
                console.log('User Email:', req.query.userEmail);
                query = { email: req.query.email };
            }
            console.log('Query:', query);

            const result = await productCollection.find(query).toArray();
            res.send(result)


        })



        //get all tech news from database
        app.get('/technews', async (req, res) => {
            const technews = await techNewsCollection.find().toArray();
            res.send(technews)
        })


        //post report to database
        app.post('/report', async (req, res) => {
            const report = req.body;
            const result = await reportedProductCollection.insertOne(report);
            res.send(result)
        })

        //get all reported products from database
        app.get('/report', async (req, res) => {
            const reports = await reportedProductCollection.find().toArray();
            res.send(reports)
        })

        //delete report from database
        app.delete('/reportedProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await reportedProductCollection.deleteOne(query);
            res.send(result)
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







