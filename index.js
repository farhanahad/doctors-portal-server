const express = require('express')
const app = express()
const cors=require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port =process.env.PORT||5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET)


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0kwkb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(uri);

async function run(){
     try{
        await client.connect();
        const database=client.db('doctors_portal');
        const appointmentsCollection=database.collection('appointments');
        const usersCollection=database.collection('users');

        app.get('/appointments',async(req,res)=>{
          const email=req.query.email;
          const date=new Date(req.query.date).toLocaleDateString();
          console.log(date);
          const query={email:email,date:date};
          console.log(query);
          const cursor=appointmentsCollection.find(query);
          const appointments= await cursor.toArray();
          res.json(appointments);
        })
        app.post('/appointments',async(req,res)=>{
          const appointment=req.body;
          const result=await appointmentsCollection.insertOne(appointment);
          //console.log(result);
          res.json(result)
        })

        app.get('/users/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email: email };
          const user = await usersCollection.findOne(query);
          let isAdmin = false;
          if (user?.role === 'admin') {
              isAdmin = true;
          }
          res.json({ admin: isAdmin });
      })

      app.get('/appointments/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await appointmentsCollection.findOne(query);
        res.json(result);
    })
      
    app.put('/appointments/:id', async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
          $set: {
              payment: payment
          }
      };
      const result = await appointmentsCollection.updateOne(filter, updateDoc);
      res.json(result);
  })

        app.post('/users',async(req,res)=>{
          const user=req.body;
          const result=await usersCollection.insertOne(user);
          console.log(result);
          res.json(result);
        })

        app.put('/users',async(req,res)=>{
          const user=req.body;
          const filter={email:user.email};
          const options={upsert:true};
          const updateDoc={$set:user};
          const result=await usersCollection.updateOne(filter,updateDoc,options);
          res.json(result);
        })

        app.put('/users/admin', async (req, res) => {
          const user = req.body;
          console.log('put',user); 
          const filter={email:user.email};
          const updateDoc={$set:{role:'admin'}};
          const result=await usersCollection.updateOne(filter,updateDoc);
          res.json(result);
      });

      app.post('/create-payment-intent', async (req, res) => {
        const paymentInfo = req.body;
        const amount = paymentInfo.price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amount,
            payment_method_types: ['card']
        });
        res.json({ clientSecret: paymentIntent.client_secret })
    })
      

     }
     finally{
          
     }
}

run().catch(console.dir); 

app.get('/', (req, res) => {
  res.send('Hello doctors portal')
})

app.listen(port, () => {
  console.log(`listening at ${port}`)
})