const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const directoryPath = path.join(__dirname, '../public')

app.use(express.static(directoryPath)); //middleware

//creating server events
io.on('connection', (socket) => { 
    console.log('New websocket connection')

    //join event to allow a user to join the chatroom
    //options contains 'username', 'room'
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        //if user fails to join chatroom
        if (error) {
            return callback(error) //acknowledgement, if there's an error.
        }

        socket.join(user.room)

        //io.to.emit - emits an event to everybody in a specific room, rather than every room.
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        //broadcast.to(room).emit - broadcast join message to the specific room your joining.
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        //shows list of users in room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    
    //event to receive message data from client
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        //filters bad word or language
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        //sends back data to every clients connected
        io.to(user.room).emit('message', generateMessage(user.username, message))
        
        callback() //sends out acknowledgement confirmation
    })

    //gets the location data sent back from the client-side to 
    //show other connected clients
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `http://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()//acknowledgement for send location
    })

    //when a user leaves or gets disconnected from chatroom
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        //displays message when user leaves chatroom.
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left the chatroom!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log(`Server started on port ${port}!`)
});