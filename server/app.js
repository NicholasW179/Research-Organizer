const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db')
const Project = require('./models/Project')
const Paper = require('./models/Paper')
const arxiv = require('arxiv')


const app = express()

app.use(bodyParser.json())

app.use(express.static('public'))

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

app.get('/api/paper/:projectId', function(req,res){
  Project.findById(req.params.projectId)
  .then(project =>{
    let arrIds = project.paperIds.split(',')
    arrIds = arrIds.slice(0, arrIds.length-1)

    Paper.findAll({
      where:{
        id: arrIds
      }
    })
    .then(papers =>{
      res.json({
        message:'These are the papera associated with this project',
        info: papers
      })
    })
  })
})

app.post('/api/paper', function(req,res){
  Paper.create(req.body)
  .then(function(newPaper){
    Project.findById(req.body.projectId)
      .then(project =>{
        project.paperIds += newPaper.id.toString() + ','     
        project.save()
          .catch(error =>{
            console.log(error)
          })
    })
    
    res.json({
      message: "newPaper created successfully",
      info: newPaper 
    })
  })
})

app.put('/api/project/:projectId', function(req,res){
  Project.findById(req.params.projectId)
    .then(project =>{
      project.note = req.body.note;
      project.save()
        .then(result =>{
          res.json({project:project, message:'project updated'})
        })
          }).catch(error =>{
          console.log(error)
          })
})

app.put('/api/paper/:paperId', function(req,res){
  Paper.findById(req.params.paperId)
    .then(paper =>{
      paper.note = req.body.note;
      paper.save()
        .then(result =>{
          res.json({paper:paper, message:'paper updated'})
        })
          }).catch(error =>{
            console.log(error)
          })
})

app.put('/api/project/remove/:projectId', function(req,res){
  Project.findById(req.params.projectId)
    .then(project =>{
      let removal = req.body.paperId
      console.log(removal, 'removal')
      let arrIds = project.paperIds.split(',')
      console.log(arrIds.splice(arrIds.indexOf(removal), 1), 'spliced')
      arrIds = arrIds.filter(function(value){return value !== ''})
      console.log(arrIds, 'arr ids')
      project.paperIds = arrIds.join()
      console.log(project.paperIds, 'after processing')
      project.save()
        .then(result =>{
            res.json({project:project, message:'project updated'})
        })
    })
})




let search_query = {
  title: '',
  author: ''
};

function partitionData(items){
  let result = items.reduce((rows, key, index) => (index % 10 === 0 ? rows.push([key]) 
  : rows[rows.length-1].push(key)) && rows, []);
  return result
}



app.post('/api/search', function(req,res){
  search_query['title'] = req.body.title
  search_query['author'] = req.body.author
  
  arxiv.search(search_query, function(err, results) {
    if(!results.items.length) res.json({message:'Sorry, no results were found. Try changing your query'})
    else {
      results.items = partitionData(results.items)
      res.json(results)
    }
  });
})

app.listen(3000, function () {
  console.log('listening on port 3000!')
})
