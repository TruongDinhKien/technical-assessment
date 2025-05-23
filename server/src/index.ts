
import bodyParser from 'body-parser'
import express, { Request, Response, NextFunction } from 'express' 
import cors from 'cors'
import { getFeedbacks } from './controllers/feedbacksController'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { DatabaseContext } from './database/context'
import * as schema from "./database/schema";
import { uploadFeedbacksCsv, uploadMiddleware } from './controllers/uploadController'
import { DEFAULT_PORT } from './constant'

const app = express()
const port = process.env.PORT || DEFAULT_PORT

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
app.use(cors())
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const client = postgres(process.env.DATABASE_URL);
console.log('DATABASE_URL: ',process.env.DATABASE_URL);
const db = drizzle(client, { schema });
app.use((_, __, next) => DatabaseContext.run(db, next));


app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/feedbacks', (req, res, next) => {
  getFeedbacks(req, res).catch(next)
})

app.post('/feedbacks/upload-csv', uploadMiddleware, (req, res, next) => {
  uploadFeedbacksCsv(req, res, db).catch(next);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    // details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});


app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`)
})

export default app