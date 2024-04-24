const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const UserR=require('./Routes/UserR')
const Signinroutes=require('./Routes/Signinroutes')
const AddTask=require('./Routes/AddTask')
const TaskGroup=require('./Routes/Tasks')
const TGroupR = require('./Routes/TGroupR')
const ForgetPassword =require('./Routes/Forgotpassword')
const cors = require('cors');
const ResetPassword = require('./Routes/Resetpassword')
const app = express();
const PORT=5000;
app.use(cors());
const path = require('path'); // Import the path module
mongoose.connect('mongodb+srv://Promise:Promise@cluster0.iufeasi.mongodb.net/?retryWrites=true&w=majority')
.then(()=> console.log("connected successfuly"))
.catch(err=> console.error("field connection",err));
app.use(express.json());
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api',UserR);
app.use('/api',Signinroutes);
app.use('/api',AddTask);
app.use('/api',TaskGroup);
app.use('/api',TGroupR);
app.use('/api',ForgetPassword);
app.use('/api',ResetPassword);

app.listen(PORT,()=>{
    console.log(`server is runinng on http://localhost:${PORT}`)
})  
module.exports=app;