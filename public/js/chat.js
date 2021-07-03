//client-side sends back data to the server.
const socket = io()

//elements - form, input,button
const messageForm = document.querySelector('#message-form')
const messageFormInput = document.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML //render inside another element
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML //render location inside another element
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options, form for JOIN
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

//Auto Scrolling Messages Down
const autoScroll = () => {
    //New message element that will be fetched
    const newMessage = messages.lastElementChild

    //get the height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = messages.offsetHeight
    //Height of messages container
    const containerHeight = messages.scrollHeight
    //How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    //condition for new message to auto scroll to the bottom
    if (containerHeight - newMessageHeight <= scrollOffset) {
        //Push us to the bottom as new messages come in
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        //loads index.js message event object on client-side
        username: message.username,
        message: message.text, 
        createdAt: moment(message.createdAt).format('hh:mm a, MMMM DD, YYYY')
    })
    //inserts messages within the DIV element
    //beforeend adds new messages at the bottom
    messages.insertAdjacentHTML('beforeend', html) 

    autoScroll()  
})

//locationMessage socket event that sends a location link
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a, MMMM DD, YYYY')

    })
    messages.insertAdjacentHTML('beforeend', html) //inserts messages within the DIV element
    
    autoScroll()
})

//Users in chatroom socket event
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    })
    document.querySelector('#sidebar').innerHTML = html
})


messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value 

    //add a 3rd argument that sends an acknowledgement
    socket.emit('sendMessage', message, (error) => {
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = '' //clears input after message is sent
        messageFormInput.focus() //move the cursor back to starting point

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

sendLocationButton.addEventListener('click', () => {
    //checks if your browser is compatible with API
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    //disable
    sendLocationButton.setAttribute('disabled', 'disabled')
    
    //position will contain the information on the location
    navigator.geolocation.getCurrentPosition((position) => {
        //send location to server to share with other clients connected
        socket.emit('sendLocation', {
            //coordinates 
            latitude: position.coords.latitude,
            longitude: position.coords.longitude

        }, () => {
            sendLocationButton.removeAttribute('disabled')
           console.log('Location shared!') 
        })
    })
})

//join socket event to send back to the server that a 
//client is joining a chatroom.
//the server will have a listener for join
socket.emit('join', { username, room }, (error) => {
    //acknowledgement
    //redirect user to JOIN page if login failed
    if (error) {
        alert(error)
        location.href = '/'
    }
})