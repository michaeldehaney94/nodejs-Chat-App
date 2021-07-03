//keeping track of users that comes and goes
const users = [] 
//user data will be pushed to this empty array when being used.
//once the user data is not in use the array becomes empty until a user is accesing data or creating data.

//Added user - track new user added
const addUser = ({ id, username, room }) => {
    //clean up the user data 
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate user data
    if (!username || !room) {
        return {
            error: 'Username and chatroom are required!'
        }
    }

    //check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //validate username
    if (existingUser) {
        return {
            error : 'Username is already in use!'
        }
    }
    //Store user data
    const user = { id, username, room }
    users.push(user)
    return { user }
}

// ---------------------------------------
//Remove user - stops tracking
const removeUser = (id) => {
    //removing user by finding the index location of the user
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        //outputs the user that has been removed for confirmation
        //[0] - represents the individual item removed
        return users.splice(index, 1)[0]
    }
}

//-------------------------------------
//Get user - fetch existing user data
const getUser = (id) => {
    return users.find((user) => user.id === id) 
}

//------------------------------------------------------------
//Get users in a room - track the number of users in a chatroom
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room) 
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}