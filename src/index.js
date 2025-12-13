import express from "express"
import dotenv from "dotenv"
import routes from "./routes.js"

dotenv.config()

const app = express()
app.use(express.json())
app.use(routes)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`SSI OID4VCI service running on port ${port}`)
})
