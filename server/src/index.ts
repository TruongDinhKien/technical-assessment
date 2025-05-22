
import bodyParser from 'body-parser'
import express from 'express'
import cors from 'cors'
import { Request, Response } from 'express'
import { getFeedbacks } from './database/queries'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { DatabaseContext } from './database/context'
import * as schema from "./database/schema";

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
app.use((_, __, next) => DatabaseContext.run(db, next));


app.use(cors())
app.get('/', (request: Request, response: Response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/feedbacks', (req: Request, res: Response, next) => {
  getFeedbacks(req, res).catch(next)
})

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`)
})
