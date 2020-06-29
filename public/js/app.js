const socket = io()
const $formElement = document.querySelector('#form')
const $messageInput = $formElement.querySelector('input')
const $messageSendElement = document.querySelector('#sendMessage')
const $locationSendElement = document.querySelector('#sendLocation')
const $messagesElement = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const usersListTemplate = document.querySelector('#users-list-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messagesElement.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messagesElement.offsetHeight

    // Height of messages container
    const containerHeight = $messagesElement.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messagesElement.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messagesElement.scrollTop = $messagesElement.scrollHeight
    }
}

socket.emit('join',{ username, room },(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})

$formElement.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageSendElement.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        $messageSendElement.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()
        
        if (error) {
            return alert(error)
        }
        console.log('Message delivered!')
    })
})

$locationSendElement.addEventListener('click',()=>{
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $locationSendElement.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $locationSendElement.removeAttribute('disabled')
        })
    })

})

socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.message,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messagesElement.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('location',(message)=>{
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messagesElement.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(usersListTemplate, {
        room,users
    })
    document.querySelector('#allusers').innerHTML = html
})