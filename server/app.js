const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db')
const Project = require('./models/Project')
const Paper = require('./models/Paper')


const app = express()

app.use(bodyParser.json())

//a debugging feature
app.use(function(req, res, next){ 
  console.log(req.path) 
  next()
});


app.get("/", function(req, res) {
   res.sendfile('index.html')
});

app.get('/destination', function(req,res){
  res.sendfile('./build/bundle.js')
})

app.get('/api/project', function(req,res){
  let package = Project.findAll()
  package
  .then(function(content){
    res.json({
      message: 'here are your projects',
      info: content 
    });
  })
  
});

app.post('/', function(req,res){
  Project.create(req.body)
  .then(function (created) {
    res.json({
      message: 'Created successfully',
      info: created
    });
    created.save()
  })
})

// what is this app.post even doing at this point???

app.post('/api/project', function(req,res){
  let package = req.body
  res.send(package)
})

app.get('/api/paper', function(req,res){
  let package = req.body;
  res.send(package)
})

app.post('/api/paper', function(req,res){
  Paper.create(req.body)
  .then(function(newPaper){
    console.log(newPaper)
    Project.findById(req.body.projectId)
    .then(project =>{
      console.log(project, 'inner project')
      project.paperIds.push(newPaper.id)
    }).save()
    
    res.json({
      message: "newPaper created successfully",
      info: newPaper 
    })
  })
})

app.put('/api/project/:project_id', function(req,res){
  Project.findById(req.params.project_id, function(err, project) {
    if (err) res.send(err);

      project.notes = req.body.notes; 
      
      project.save(function(err) {
         if (err) res.send(err);
        res.json({ message: 'Project updated!' });
      
      });
  });
})


// Project.findById(123).then(project => {
//   // project will be an instance of Project and stores the content of the table entry
//   // with id 123. if such an entry is not defined you will get null
// })



app.listen(3000, function () {
  console.log('listening on port 3000!')
})
