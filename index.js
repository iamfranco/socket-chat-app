const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

let visitorCount = 0
const colorList = ["#f44336", "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#009688", "#33691e", "#ff9800"]
io.on("connection", socket => {
  visitorCount++
  socket.request.user = {
    name: undefined,
    color: undefined
  }

  socket.on("welcome", data => {
    socket.request.user.name = data.username || `Guest ${visitorCount}`
    socket.request.user.color = data.color || colorList[Math.floor(Math.random() * colorList.length)]
    io.emit(
      "announce",
      `<strong style="color: ${socket.request.user.color}">[${socket.request.user.name}]</strong> 
      has joined chat<br> type <strong>!commands</strong> to see chat commands`
    )
  })

  socket.on("disconnect", () => {
    io.emit(
      "announce",
      `<strong style="color: ${socket.request.user.color}">[${socket.request.user.name}]</strong> 
      has left`
    )
  })

  socket.on("chat message", msg => {
    io.emit("chat message", {
      name: socket.request.user.name,
      msg: msg,
      color: socket.request.user.color
    })
  })

  socket.on("!setname", newName => {
    const oldName = socket.request.user.name
    socket.request.user.name = newName
    io.emit(
      "announce",
      `user 
      <strong style="color: ${socket.request.user.color}">[${oldName}]</strong> 
      has changed name to 
      <strong style="color: ${socket.request.user.color}">[${newName}]</strong>`
    )
  })

  socket.on("!setcolor", newColor => {
    socket.request.user.color = newColor
    io.emit(
      "announce",
      `user 
      <strong style="color: ${newColor}">[${socket.request.user.name}]</strong> 
      has changed color to 
      <strong style="color: ${newColor}">[${newColor}]</strong>`
    )
  })

  socket.on("!commands", () => {
    const msg = `
      Here's a list of chat commands: <br><br>
      <strong>!setname <em>[new name]</em></strong> : change username to <em>[new name]</em> <br>
      <strong>!link <em>[URL]</em></strong> : send clickable link to <em>[URL]</em> <br>
      <strong>!setcolor <em>[color]</em></strong> : change username color to <em>[color]</em>. For example, <em>[color]</em> can <em>red</em> or <em>#ff0000</em>
    `
    io.emit("announce", msg)
  })

  socket.on("!link", data => {
    const msg = `
      <a href="${data.url}" target="_blank">${data.linkName}</a>
    `
    io.emit("announce", msg)
  })
})

const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Listening on *: ${port}`)
})
