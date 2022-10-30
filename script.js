const view = {
    login: document.querySelector("[data-view='login']"),
    chat: document.querySelector("[data-view='chat']"),
    sidebar: document.querySelector("[data-view='sidebar']")
}
const buttons = document.querySelectorAll("[data-button]")

const urlUsers = 'https://mock-api.driven.com.br/api/v6/uol/participants'
const urlStatus = 'https://mock-api.driven.com.br/api/v6/uol/status'
const urlMessages = 'https://mock-api.driven.com.br/api/v6/uol/messages'

let username

//======================================================================

buttons.forEach(button => {
    button.addEventListener('click', e => {
        clickedButton = e.currentTarget
        const buttonAttribute = clickedButton.getAttribute('data-button')

        if (buttonAttribute === "login") {
            getUsername()
            updateUsername(username)
        }
    })
})

//======================================================================

function updateUsername(username) {
    const data = {
        name: username
    }

    axios.post(urlUsers, data)
    .then(() => {
        view.login.classList.toggle('hidden')

        setInterval(() => {
            axios.post(urlStatus, data)
            console.log('Status atualizado')
        }, 5000)

        sendMessage(username, "Todos", "entra na sala...", "status")
    })
    .catch(() => {
        alert(`"${username}" já está em uso, por favor insira um novo nome!`)
    })

    
}

function getUsername() {
    const input = document.querySelector("[data-input='username']")
    username = input.value
    input.value = ''
}

//======================================================================

function sendMessage(from, to, text, type) {
    const data = {
        from: from,
        to: to,
        text: text,
        type: type
    }

    console.log(data)

    axios.post(urlMessages, data)
    .then(() => {
        updateChat()
        console.log('Mensagem enviada!')
    })
    .catch(error => {
        updateChat()
    })
}

//======================================================================

function updateChat() {
    axios.get(urlMessages).then((response => {
        view.chat.innerHTML = ''
        const messages = response.data
        messages.forEach(message => {
            createMessage(message)
        })

        const chatMessages = Array.from(document.querySelectorAll('.chat-message'))
        const lastMessage = chatMessages.at(-1)

        lastMessage.scrollIntoView()
    }))
}

function createMessage(msg) {
    const type = msg.type
    let info

    switch (type) {
        case "status":
            info = `<strong>${msg.from}</strong>`
            break
        case "message":
            info = `<strong>${msg.from}</strong> para <strong>${msg.to}</strong>:`
            break
        case "private_message":
            info = `<strong>${msg.from}</strong> reservadamente para <strong>${msg.to}</strong>:`
            break
    }

    const message = createHtmlElement('div', ['chat-message', type], '')

    const messageElements = [
        createHtmlElement('span', ['chat-message__time'], `(${msg.time})`),
        createHtmlElement('span', ['chat-message__info'], info),
        createHtmlElement('span', ['chat-message__text'], msg.text)
    ]
    
    messageElements.forEach(element => {
        message.appendChild(element)
    })

    view.chat.append(message)
}

function createHtmlElement(tag, classes, content) {
    const element = document.createElement(tag)
    classes.forEach(htmlClass => {
        element.classList.add(htmlClass)
    })
    element.innerHTML = content
    return element
}