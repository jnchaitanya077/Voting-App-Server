const express = require('express');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const cors = require('cors')
require('dotenv').config()


const port = process.env.PORT || 9000;

const app = express();
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const DB_HOST = process.env.DB_HOST
const KEY = process.env.DB_KEY

const url = `${DB_HOST}/Voting?`
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log("Successfully connected to DB"))
    .catch(e => console.log(e))

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    isVoted: Boolean,
})

const candidatesSchema = new mongoose.Schema({
    name: String,
    image: String,
    votes: Number,

}, { collection: 'candidates' });



const User = mongoose.model("user", userSchema);
const Candidate = mongoose.model("candidate", candidatesSchema);



app.get("/", (req, res) => {
    res.send("Server is up and running");
})


app.post("/login", (req, res) => {
    const username = req.body.email;
    const password = req.body.password;
    // console.log(username, password);
    User.findOne({ email: username }, (err, foundUser) => {
        if (!err) {
            if (foundUser.password === password) {
                const isVoted = foundUser.isVoted
                res.send({ status: "200", msg: "Login Success", email: username, isVoted: isVoted })

            } else {
                console.log("fail")
                res.send({ status: "400", msg: "invaild password" })
            }
        } else {
            console.log(err)
        }
    })
})

app.post("/register", (req, res) => {
    console.log(req.body)
    const username = req.body.email
    const password = req.body.password

    User.findOne({ email: username }, (err, foundUser) => {
        // Check if user already exists
        if (foundUser) {
            res.send({ status: '200', msg: 'User Already Exists!' })
        }
        else {
            // Creating a new user
            const user = new User({
                email: username,
                password: password,
                isVoted: false
            })
            // saving to DB
            user.save(user, (err) => {
                if (!err) {
                    res.send({ status: "200", msg: "Registered Successfully!! Please Login. " })
                } else {
                    console.log(err)
                    res.send({ status: "400", msg: "Registration failed, Please register again." })
                }
            })
        }
    })
})

app.get("/fetchCandidates", (req, res) => {
    console.log("fetch")
    Candidate.find({}, (err, data) => {
        console.log(data)
        if (!err) {

            res.send(data);
        } else {
            console.log(err);
        }
    })
})

app.post("/vote", (req, res) => {
    // console.log(req.body)
    const id = req.body.id;
    const userEmail = req.body.email;
    console.log(userEmail)
    let votes = 0;

    Candidate.findOne({ _id: id }, (err, response) => {
        if (!err) {
            votes = response.votes;
            console.log(votes)
            Candidate.updateOne({ _id: id }, { votes: votes + 1 }, (err, response) => {
                if (!err) {
                    console.log(response)
                    User.updateOne({ email: userEmail }, { isVoted: true }, (err, updateResponse) => {
                        if (!err) {
                            res.send({ status: '200', msg: "Successfully Voted!!" })
                        } else {
                            res.send({ status: '400', msg: "Something Wrong, Please Vote Again!" })
                        }
                    })
                }
            })
        }
        else {
            console.log(err);
        }
    })



})







app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
