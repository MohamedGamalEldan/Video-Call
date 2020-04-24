const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 4000
let activeSockets = [];

app.use(express.static(__dirname + "/public"))

app.get("/", (req, res) => {
    res.render("index.html");
});

io.on("connection", socket => {

    const existingSocket = activeSockets.find(
        existingSocket => existingSocket === socket.id
    );

    if (!existingSocket) {
        activeSockets.push(socket.id);

        socket.emit("update-user-list", {
        users: activeSockets.filter(
            existingSocket => existingSocket !== socket.id
        )
        });

        socket.broadcast.emit("update-user-list", {
        users: [socket.id]
        });
    }

    socket.on("call-user", (data) => {
        socket.to(data.to).emit("start-call", {
            offer: data.callOffer,
            socket: socket.id
        });
    });

    socket.on("update-calling", (data) => {
        socket.to(data.to).emit("update-call", {
            offer: data.callOffer,
            socket: socket.id
        });
    });

    socket.on("make-answer", data => {
        socket.to(data.to).emit("answer-made", {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on("reject-call", data => {
        socket.to(data.from).emit("call-rejected", {
            socket: socket.id
        });
    });

    socket.on("disconnect", () => {
    activeSockets = activeSockets.filter(
        existingSocket => existingSocket !== socket.id
    );
    
    socket.broadcast.emit("remove-user", {
        socketId: socket.id
    });
    });

});


http.listen(port, () => console.log(`Server is listening on http://localhost:${port}`));