const view = {
    login: document.querySelector("[data-view='login']"),
    chat: document.querySelector("[data-view='chat']"),
    sidebar: document.querySelector("[data-view='sidebar']")
}
const buttons = document.querySelectorAll("[data-button]")
const users = document.querySelector('[data-users]')

const modeOptions = document.querySelectorAll("[data-mode]")

const urlUsers = 'https://mock-api.driven.com.br/api/v6/uol/participants'
const urlStatus = 'https://mock-api.driven.com.br/api/v6/uol/status'
const urlMessages = 'https://mock-api.driven.com.br/api/v6/uol/messages'

const sendingOptions = {
    user: {
        value: "Todos",
        element: null
    },
    mode: {
        value: "message",
        element: null
    }
}

let username

//======================================================================

view.sidebar.addEventListener('click', e => {
    const clickedArea = e.target
    const validation = clickedArea.getAttribute('data-view') === "sidebar"
    if (validation) {
        clickedArea.classList.toggle('hidden')
    }
})

buttons.forEach(button => {
    button.addEventListener('click', e => {
        clickedButton = e.currentTarget
        const buttonAttribute = clickedButton.getAttribute('data-button')

        if (buttonAttribute === "login") {
            getUsername()
            updateUsername(username)
        } else if (buttonAttribute === 'options') {
            view.sidebar.classList.toggle('hidden')
            updateActiveUsers()
        } else {
            sendMessageFromInput()
        }
    })
})

modeOptions.forEach(mode => {
    mode.addEventListener('click', e => {
        const selectedMode = e.currentTarget
        addOptionClickEvent(selectedMode, 'mode')
    })
})

function addOptionClickEvent(target,type) {
    const attribute = target.getAttribute(`data-${type}`)
    if (sendingOptions[type].element === null) {
        updateOption(type, attribute, target)
        toggleOptionCheck(target)
    } else {
        toggleOptionCheck(sendingOptions[type].element)
        updateOption(type, attribute, target)
        toggleOptionCheck(target)
    }
}

function updateOption(option, value, element) {
    sendingOptions[option].element = element
    sendingOptions[option].value = value
    console.log(`Opção ${option} mudada para ${value}`)
    updateInputInfo()
}

function toggleOptionCheck(opt) {
    const img = opt.querySelector('img')
    img.classList.toggle('hidden')
}

//======================================================================

function updateUsername(username) {
    const data = {
        name: username
    }

    axios.post(urlUsers, data)
    .then(() => {

        updateInputInfo()
        updateChat()

        view.login.classList.toggle('hidden')

        setInterval(() => {
            axios.post(urlStatus, data)
            //console.log('Status atualizado')
        }, 5000)

        setInterval(() => {
            updateChat()
            //console.log('Chat atualizado')
        }, 3000)
    })
    .catch(() => {
        username = ''
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
        const messages = response.data.filter(msg => {
            return msg.type !== "private_message" || msg.from === username || msg.to === username
        })
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

//======================================================================

function updateActiveUsers() {

    users.innerHTML = `<li data-user="Todos">
                            <button>
                                <ion-icon name="people"></ion-icon>
                                <div>
                                    <span>Todos</span>
                                    <img class="hidden" src="./assets/check.svg" alt="check">
                                </div>
                            </button>
                        </li>`

    axios.get(urlUsers).then(response => {
        const usersObj = response.data
        
        usersObj.forEach(user => {
            createUser(user, users)
        })

        const userOptions = document.querySelectorAll('[data-user]')

        userOptions.forEach(option => {
            const optionValue = option.querySelector('span').innerHTML
            if (sendingOptions.user.value === optionValue) {
                updateOption('user', optionValue, option)
                toggleOptionCheck(option)
            }
            option.addEventListener('click', e => {
                const selectedUser = e.currentTarget
                addOptionClickEvent(selectedUser, 'user')
                console.log('a')
            })
        })
    })    
}

function createUser(element, parent) {
    const name = element.name
    const html = `<button>
                        <ion-icon name="person-circle"></ion-icon>
                        <div>
                            <span>${name}</span>
                            <img class="hidden" src="./assets/check.svg" alt="check">
                        </div>
                    </button>`
    const user = createHtmlElement('li', [], html)
    user.setAttribute("data-user", name)
    parent.appendChild(user)
}


//======================================================================

function sendMessageFromInput() {
    const input = document.querySelector('[data-input="message"]')
    const msg = input.value

    if(msg !== '') {
        sendMessage(
            username,
            sendingOptions.user.value,
            msg,
            sendingOptions.mode.value
            )
    } else {
        alert('Digite alguma mensagem!')
    }
}

function updateInputInfo() {
    const input = document.querySelector('[data-input="info"]')
    const mode = sendingOptions.mode.value
    const user = sendingOptions.user.value
    let info

    switch (mode) {
        case 'message':
            info = `Enviando para ${user}`
            break
        case 'private_message':
            info = `Enviando para ${user} (reservadamente)`
            break
    }

    input.innerHTML = info
}