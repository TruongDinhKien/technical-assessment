
import bodyParser from 'body-parser'
import express from 'express'
import { Request, Response } from 'express'
import { getFeedbacks } from './database/queries'
const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request: Request, response: Response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/feedbacks', getFeedbacks)

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`)
})
