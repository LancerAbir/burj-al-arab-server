const express = require('express')

//** ENV file */
require('dotenv').config()


//** Third Party Middleware */
const bodyParser = require('body-parser')
const cors = require('cors')

//** MongoDB Import */
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0evig.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


//** Firebase Admin Setup & Private Key */
const admin = require('firebase-admin');


//** PORT */
const port = 5600


//** Mother App */
const app = express()

//** Middle Ware */
const middleware = [
    express.static('public'),
    express.urlencoded({ extended: true }),
    express.json(),
    bodyParser.json(),
    cors()
]
app.use(middleware)


//** Root Route */
app.get('/', (req, res) => {
    res.send('Hello World!')
})


//** Firebase Admin Setup & Private Key */
const serviceAccount = require("./configs/burj-al-arab-react-app-firebase-adminsdk-g562k-fa82822329.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

//** MongoDB Server */
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const BookingCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);
    // perform actions on the collection object
    console.log("Database Has Successfully Connected");


    //** POST --> post and insert data on database */
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body
        //** FontEnd data insert in BackEnd */
        BookingCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
        console.log(newBooking);
    })


    //** GET --> Show All Data */
    app.get('/allBookingCollection', (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email
                    console.log({ tokenEmail, queryEmail });
                    if (tokenEmail == queryEmail) {
                        BookingCollection.find({ email: queryEmail })
                            .toArray((error, documents) => {
                                res.status(200).send(documents)
                            })
                    } else {
                        res.status(401).send('Un-Authorized Access')
                    }
                }).catch(function (error) {
                    res.status(401).send('Un-Authorized Access', error)
                });
        } else {
            res.status(401).send('Un-Authorized Access')
        }
    })



});



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})